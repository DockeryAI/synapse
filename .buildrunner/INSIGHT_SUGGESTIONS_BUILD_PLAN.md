# Smart Insight Suggestions Feature - Build Plan

**Status**: ✅ COMPLETE
**Implemented**: 2025-11-30

## Overview
When a user selects an insight in Power Mode, Claude Opus 4.5 analyzes it against all available insights and suggests 2-3 complementary pairings that would create stronger marketing content when combined.

## User Experience Flow

```
1. User clicks insight card → insight added to "Your Mix"
2. System sends selection to Opus 4.5 → analyzes pairing potential
3. Suggestions appear in Your Mix panel with AI reasoning
4. User can:
   - Click "+" to accept suggestion → adds to selected insights
   - Click "x" to dismiss → hides that suggestion
   - Ignore completely → suggestions cleared on Generate
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        V4PowerModePanel                          │
├─────────────────────────────────────────────────────────────────┤
│  selectedInsights[] ──────┐                                      │
│                           ▼                                      │
│            ┌──────────────────────────┐                         │
│            │  useEffect (debounced)   │                         │
│            │  - watches selection     │                         │
│            │  - calls AI service      │                         │
│            └──────────┬───────────────┘                         │
│                       ▼                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │         insight-suggestion.service.ts                    │    │
│  │  - Calls ai-proxy with Opus 4.5                         │    │
│  │  - Caches results per insight ID                        │    │
│  │  - Returns { suggestions: [{id, reason}] }              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                       ▼                                          │
│            suggestedInsights[] ───────┐                         │
│            dismissedSuggestions Set   │                         │
│                                       ▼                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              YourMixPreview Component                    │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │  Selected Insights (existing)                   │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │  💡 Suggested Pairings (NEW)                    │    │    │
│  │  │  ┌───────────────────────────────────────────┐  │    │    │
│  │  │  │ [+] Market trend insight...           [x] │  │    │    │
│  │  │  │     "Adds timeliness to your proof"       │  │    │    │
│  │  │  └───────────────────────────────────────────┘  │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Create AI Suggestion Service
**File:** `src/services/intelligence/insight-suggestion.service.ts`

```typescript
interface SuggestionResult {
  id: string;
  reason: string;
}

interface InsightSuggestionResponse {
  suggestions: SuggestionResult[];
}

class InsightSuggestionService {
  private cache: Map<string, SuggestionResult[]> = new Map();

  async getSuggestions(
    selectedInsight: InsightCard,
    allInsights: InsightCard[],
    alreadySelected: string[]
  ): Promise<SuggestionResult[]>
}
```

**AI Prompt Structure:**
```
You are an expert content strategist. Given a selected marketing insight and a pool of available insights, identify 2-3 insights that would pair exceptionally well together for creating compelling content.

SELECTED INSIGHT:
{selectedInsight as JSON}

AVAILABLE INSIGHTS (choose from these):
{availableInsights as JSON array with ids}

Consider these pairing principles:
- Proof + Claim: Pair evidence with assertions
- Emotion + Logic: Balance heart and mind appeals
- Problem + Solution: Connect pain points with differentiators
- Trend + Action: Link market timing with opportunity
- Customer + Product: Align audience with offering

Return ONLY valid JSON (no markdown):
{
  "suggestions": [
    { "id": "insight-id-here", "reason": "Brief explanation of why this pairs well" }
  ]
}
```

**Key Features:**
- Uses `anthropic/claude-opus-4.5` via ai-proxy
- Caches by selected insight ID (avoid repeat calls)
- Filters out already-selected insights before sending
- Max 3 suggestions returned

### Step 2: Add State to V4PowerModePanel
**File:** `src/components/v4/V4PowerModePanel.tsx`

```typescript
// New state variables
const [suggestedInsights, setSuggestedInsights] = useState<{
  insight: InsightCard;
  reason: string;
}[]>([]);
const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

// Track last selected insight for targeted suggestions
const lastSelectedRef = useRef<string | null>(null);
```

### Step 3: Add Suggestion Trigger Effect
**File:** `src/components/v4/V4PowerModePanel.tsx`

```typescript
// Debounced effect to fetch suggestions when selection changes
useEffect(() => {
  if (selectedInsights.length === 0) {
    setSuggestedInsights([]);
    return;
  }

  // Get the most recently selected insight
  const latestId = selectedInsights[selectedInsights.length - 1];
  if (latestId === lastSelectedRef.current) return;
  lastSelectedRef.current = latestId;

  const latestInsight = allInsights.find(i => i.id === latestId);
  if (!latestInsight) return;

  const timeoutId = setTimeout(async () => {
    setIsLoadingSuggestions(true);
    try {
      const results = await insightSuggestionService.getSuggestions(
        latestInsight,
        allInsights,
        selectedInsights
      );

      // Map IDs to full insight objects, filter dismissed
      const suggestions = results
        .filter(r => !dismissedSuggestions.has(r.id))
        .map(r => ({
          insight: allInsights.find(i => i.id === r.id)!,
          reason: r.reason
        }))
        .filter(s => s.insight);

      setSuggestedInsights(suggestions);
    } catch (err) {
      console.error('[InsightSuggestions] Failed:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, 500); // 500ms debounce

  return () => clearTimeout(timeoutId);
}, [selectedInsights, allInsights, dismissedSuggestions]);
```

### Step 4: Add Handler Functions
**File:** `src/components/v4/V4PowerModePanel.tsx`

```typescript
// Accept a suggestion - add to selected insights
const handleAcceptSuggestion = useCallback((insightId: string) => {
  setSelectedInsights(prev => [...prev, insightId]);
  setSuggestedInsights(prev => prev.filter(s => s.insight.id !== insightId));
}, []);

// Dismiss a suggestion - hide it
const handleDismissSuggestion = useCallback((insightId: string) => {
  setDismissedSuggestions(prev => new Set([...prev, insightId]));
  setSuggestedInsights(prev => prev.filter(s => s.insight.id !== insightId));
}, []);

// Clear suggestions on generate (existing handleGenerate)
const handleGenerate = useCallback(async () => {
  setSuggestedInsights([]); // Clear suggestions
  // ... existing generate logic
}, [...]);
```

### Step 5: Update YourMixPreview Component
**File:** `src/components/v4/V4PowerModePanel.tsx`

**New Props:**
```typescript
interface YourMixPreviewProps {
  // ... existing props
  suggestedInsights: { insight: InsightCard; reason: string }[];
  isLoadingSuggestions: boolean;
  onAcceptSuggestion: (id: string) => void;
  onDismissSuggestion: (id: string) => void;
}
```

**New UI Section (after selected insights, before generate button):**
```tsx
{/* Suggested Pairings Section */}
{(suggestedInsights.length > 0 || isLoadingSuggestions) && (
  <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-slate-700">
    <div className="flex items-center gap-2 mb-3">
      <Lightbulb className="w-4 h-4 text-amber-500" />
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
        Suggested Pairings
      </span>
    </div>

    {isLoadingSuggestions ? (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    ) : (
      <div className="space-y-2">
        {suggestedInsights.map(({ insight, reason }) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-dashed border-amber-200 dark:border-amber-800 rounded-lg"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {insight.title}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {reason}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onAcceptSuggestion(insight.id)}
                  className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-green-600"
                  title="Add to mix"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDismissSuggestion(insight.id)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-600"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
)}
```

### Step 6: Wire Up Component Props
**File:** `src/components/v4/V4PowerModePanel.tsx`

Update the YourMixPreview usage:
```tsx
<YourMixPreview
  selectedInsights={selectedInsightObjects}
  generatedContent={generatedContent}
  isGenerating={isGenerating}
  framework={activeFramework}
  onRemove={handleToggleInsight}
  onClear={() => setSelectedInsights([])}
  onGenerate={handleGenerate}
  onSave={onSaveToCalendar ? handleSave : undefined}
  // NEW props
  suggestedInsights={suggestedInsights}
  isLoadingSuggestions={isLoadingSuggestions}
  onAcceptSuggestion={handleAcceptSuggestion}
  onDismissSuggestion={handleDismissSuggestion}
/>
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/services/intelligence/insight-suggestion.service.ts` | CREATE | AI-powered suggestion service |
| `src/components/v4/V4PowerModePanel.tsx` | MODIFY | State, effects, handlers, UI |

## Testing Checklist

- [x] Select single insight → suggestions appear after 500ms
- [x] Select additional insight → new suggestions load
- [x] Click "+" on suggestion → moves to selected insights
- [x] Click "x" on suggestion → disappears, doesn't return
- [x] Click Generate → suggestions clear
- [x] Rapid selections → only final selection triggers API call
- [x] Already-selected insights don't appear in suggestions
- [x] Loading skeleton shows while fetching
- [x] Dark mode styling correct

## Estimated Time

| Task | Time |
|------|------|
| AI suggestion service with caching | 45 min |
| State + debounced effect logic | 30 min |
| UI updates to YourMixPreview | 45 min |
| Testing/polish | 30 min |
| **Total** | **~2.5 hours** |

## Future Enhancements

- Batch suggestions for multiple selected insights
- Learn from user accept/dismiss patterns
- Show suggestion confidence scores
- Allow "regenerate suggestions" button
