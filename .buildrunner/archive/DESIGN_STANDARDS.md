# Synapse Design System & UI Standards

**CRITICAL:** All new features MUST follow these design standards to maintain a cohesive app experience.

---

## Core Design Language

### Color Palette
Based on existing Synapse app:

**Primary Colors:**
- Purple/Blue Gradient: `from-purple-600 to-blue-600`, `from-purple-500 to-blue-500`
- Purple variants: `purple-50`, `purple-100`, `purple-300`, `purple-600`, `purple-900`
- Blue variants: `blue-50`, `blue-100`, `blue-300`, `blue-600`, `blue-900`

**Dark Mode:**
- Background: `dark:bg-slate-950`, `dark:bg-slate-900`, `dark:bg-slate-800`
- Text: `dark:text-white`, `dark:text-gray-300`, `dark:text-gray-400`
- Borders: `dark:border-slate-700`, `dark:border-purple-700`
- Accents: `dark:text-purple-400`, `dark:text-blue-400`

**Light Mode:**
- Background: `bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50`
- Cards: `bg-white`, `bg-gray-50`
- Text: `text-gray-900`, `text-gray-600`, `text-gray-500`
- Borders: `border-gray-200`, `border-purple-300`

**Semantic Colors:**
- Success: `text-green-600`, `bg-green-50`, `dark:text-green-400`
- Warning: `text-orange-600`, `bg-orange-50`, `dark:text-orange-400`
- Error: `text-red-600`, `bg-red-50`, `dark:text-red-400`
- Info: `text-blue-600`, `bg-blue-50`, `dark:text-blue-400`

---

## Typography

### Font Family
- Primary: System font stack (default Tailwind)
- Monospace: For code/technical content only

### Font Sizes
- Hero/H1: `text-3xl` or `text-4xl` with `font-bold`
- H2: `text-2xl` with `font-bold`
- H3: `text-xl` with `font-semibold`
- H4: `text-lg` with `font-semibold`
- Body: `text-base` (default)
- Small: `text-sm`
- Tiny: `text-xs`

### Font Weights
- Bold: `font-bold` (headers, emphasis)
- Semibold: `font-semibold` (subheaders)
- Medium: `font-medium` (labels, buttons)
- Normal: `font-normal` (body text)

---

## Component Patterns

### Cards
```tsx
<Card className="p-6 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-all">
  {/* Card content */}
</Card>
```

**Key Attributes:**
- Padding: `p-6` or `p-8`
- Border: `border-2` with appropriate colors
- Rounded: `rounded-xl`
- Shadow: `shadow-lg` with `hover:shadow-xl`
- Transition: `transition-all`

### Buttons

**Primary Button:**
```tsx
<Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all">
  Primary Action
</Button>
```

**Secondary Button:**
```tsx
<Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/20">
  Secondary Action
</Button>
```

**Destructive Button:**
```tsx
<Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
  Delete
</Button>
```

### Input Fields
```tsx
<Input className="border-2 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/30 transition-all" />
```

### Badge/Tags
```tsx
<Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-medium">
  AI-Generated
</Badge>
```

### Icons
- Use Lucide React icons consistently
- Icon size: `size={20}` or `size={24}` for primary actions
- Icon color should match text color
- Always provide semantic meaning with icons

---

## Layout Standards

### Page Structure
```tsx
<div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
  {/* Header */}
  <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700">
    {/* Header content */}
  </header>

  {/* Main Content */}
  <main className="container mx-auto px-4 py-8 max-w-7xl">
    {/* Page content */}
  </main>
</div>
```

### Container Widths
- Default: `max-w-7xl`
- Narrow: `max-w-4xl` (for focused content like wizards)
- Wide: `max-w-full` (for dashboards)
- Always use `mx-auto` for centering

### Spacing
- Section spacing: `space-y-6` or `space-y-8`
- Element spacing: `gap-4` for grids, `space-x-3` for horizontal
- Padding: `p-4`, `p-6`, `p-8` (consistent multiples of 4)
- Margin: `mb-4`, `mb-6`, `mb-8`

---

## Animation & Motion

### Framer Motion Patterns
```tsx
import { motion, AnimatePresence } from 'framer-motion';

// Fade in
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>

// Slide in
<motion.div
  initial={{ x: -20, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ delay: 0.1 }}
>

// Scale on hover
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
```

### Transitions
- Default: `transition-all duration-300`
- Fast: `transition-all duration-150`
- Slow: `transition-all duration-500`

---

## Dark Mode Requirements

**EVERY component MUST support dark mode:**
- Background: `bg-white dark:bg-slate-800`
- Text: `text-gray-900 dark:text-white`
- Borders: `border-gray-200 dark:border-slate-700`
- Hover states: Different colors for light/dark
- Icons: Adjust colors for visibility

**Testing:**
- Always test in both light and dark mode
- Ensure text is readable in both modes
- Check hover states work in both modes

---

## Accessibility

### ARIA Labels
```tsx
<button aria-label="Generate campaign">
  <Sparkles size={20} />
</button>
```

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Focus states: `focus:ring-2 focus:ring-purple-500 focus:outline-none`
- Tab order should be logical

### Screen Readers
- Use semantic HTML (`<header>`, `<main>`, `<nav>`, `<button>`)
- Provide alt text for images
- Use `aria-describedby` for additional context

---

## Loading States

### Spinner
```tsx
<div className="flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 dark:border-slate-700 dark:border-t-purple-400"></div>
</div>
```

### Skeleton Loaders
```tsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
</div>
```

### Progress Indicators
```tsx
<div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
  <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300" style={{width: `${progress}%`}}></div>
</div>
```

---

## Error States

### Error Messages
```tsx
<Alert variant="destructive" className="border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong. Please try again.</AlertDescription>
</Alert>
```

### Form Validation
```tsx
<Input
  className={cn(
    "border-2",
    error
      ? "border-red-500 focus:border-red-500"
      : "border-gray-300 focus:border-purple-500"
  )}
/>
{error && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>}
```

---

## Data Visualization

### Charts & Graphs
- Use consistent purple/blue gradient color scheme
- Support dark mode
- Add tooltips for clarity
- Ensure mobile responsiveness

### Progress Rings/Circles
```tsx
<div className="relative w-32 h-32">
  <svg className="transform -rotate-90">
    <circle className="text-gray-200 dark:text-slate-700" stroke="currentColor" />
    <circle className="text-purple-600 dark:text-purple-400" stroke="currentColor" />
  </svg>
  <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
    {percentage}%
  </span>
</div>
```

---

## Modal/Dialog Patterns

```tsx
<Dialog>
  <DialogContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 max-w-2xl">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
        Dialog Title
      </DialogTitle>
      <DialogDescription className="text-gray-600 dark:text-gray-400">
        Description text
      </DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Campaign-Specific UI Patterns

### Campaign Type Cards
```tsx
<motion.div
  whileHover={{ scale: 1.02 }}
  className="p-6 border-2 border-purple-300 dark:border-purple-700 rounded-xl bg-white dark:bg-slate-800 cursor-pointer hover:shadow-lg transition-all"
>
  <div className="flex items-center gap-3 mb-4">
    <Sparkles className="text-purple-600 dark:text-purple-400" size={24} />
    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Campaign Type</h3>
  </div>
  <Badge className="mb-3">AI Recommended</Badge>
  <p className="text-gray-600 dark:text-gray-300">Description...</p>
</motion.div>
```

### Insight Cards (Content Mixer)
```tsx
<div className="p-4 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all cursor-pointer">
  <div className="flex items-start gap-3">
    <span className="text-2xl">📊</span>
    <div className="flex-1">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Insight Title</h4>
      <p className="text-sm text-gray-600 dark:text-gray-300">Insight content...</p>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Source</span>
        <span>•</span>
        <span>95% confidence</span>
      </div>
    </div>
  </div>
</div>
```

### Platform Tabs
```tsx
<div className="flex gap-2 border-b border-gray-200 dark:border-slate-700">
  {platforms.map(platform => (
    <button
      key={platform}
      className={cn(
        "px-4 py-2 font-medium transition-colors",
        active === platform
          ? "border-b-2 border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      )}
    >
      {platform}
    </button>
  ))}
</div>
```

---

## Responsive Design

### Breakpoints (Tailwind)
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up
- `2xl:` - 1536px and up

### Mobile-First Patterns
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>

<div className="flex flex-col md:flex-row gap-4">
  {/* Stack on mobile, row on desktop */}
</div>
```

---

## File Organization

### Component Structure
```
src/components/
  campaign/
    CampaignBuilder.tsx          # Main component
    CampaignTypeSelector.tsx     # Sub-components
    preview/
      CampaignPreview.tsx
      PlatformTabs.tsx
```

### Naming Conventions
- Components: PascalCase (`CampaignBuilder.tsx`)
- Services: camelCase with .service suffix (`campaign.service.ts`)
- Types: PascalCase in `.types.ts` files
- Utils: camelCase in `.utils.ts` files

---

## Code Quality Standards

### TypeScript
- Always use strict types (no `any` unless absolutely necessary)
- Export interfaces/types for reusability
- Use type inference where appropriate

### React Patterns
- Functional components only (no class components)
- Use hooks for state management
- Extract complex logic to custom hooks
- Keep components under 300 lines (split if larger)

### Performance
- Use React.memo for expensive components
- Lazy load heavy components
- Optimize images (use WebP where possible)
- Debounce expensive operations

---

## Testing New Features

Before marking a feature complete:
1. ✅ Test in light mode
2. ✅ Test in dark mode
3. ✅ Test on mobile viewport
4. ✅ Test keyboard navigation
5. ✅ Test with screen reader (basic)
6. ✅ Test error states
7. ✅ Test loading states
8. ✅ Verify consistent spacing/styling with existing app

---

## Reference Components

**Existing examples to follow:**
- Campaign Type Selector: `src/components/campaign/CampaignTypeSelector.tsx`
- Content Mixer: `src/components/campaign/content-mixer/ContentMixer.tsx`
- Campaign Preview: `src/components/campaign/preview/CampaignPreview.tsx`

**When in doubt:**
Look at existing Synapse components for patterns and copy their styling approach.

---

**CRITICAL REMINDER:**
Every new component must feel like it was built as part of the original Synapse app. Consistency > Creativity when it comes to UI/UX patterns.
