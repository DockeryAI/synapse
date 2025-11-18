/**
 * SMART INDUSTRY SELECTOR - WITH ON-DEMAND GENERATION & FREE-FORM INPUT
 * Fast, accurate, delightful industry selection
 * Users can select from 300-400 NAICS codes OR enter free-form text
 * Features fuzzy matching and Opus-powered NAICS detection
 * Generates profiles on-demand if not pre-generated
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, TrendingUp, Sparkles, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { COMPLETE_NAICS_CODES, hasFullProfile, type NAICSOption } from '../../data/complete-naics-codes';
import { OnDemandProfileGenerator } from '../../services/industry/OnDemandProfileGeneration';
import { IndustryMatchingService } from '../../services/industry/IndustryMatchingService';
import { IndustryCodeDetectionService, type CodeDetectionResult } from '../../services/industry/IndustryCodeDetectionService';
import { ProfileGenerationLoading } from './ProfileGenerationLoading';
import { DetailedResearchAnimation } from './DetailedResearchAnimation';
import { ConfirmCodeDetectionDialog } from './ConfirmCodeDetectionDialog';
import type { GenerationProgress } from '../../services/industry/OnDemandProfileGeneration';
import { supabase } from '@/lib/supabase';

export interface IndustryOption {
  naicsCode: string;
  displayName: string;
  keywords: string[];
  icon?: string;
  popularity?: number;
  category: string;
  hasFullProfile?: boolean;
}

interface IndustrySelectorProps {
  websiteUrl: string;
  onIndustrySelected: (industry: IndustryOption, skipScanning?: boolean) => void;
  onTextChange?: (text: string) => void;
  className?: string;
}

export const IndustrySelector: React.FC<IndustrySelectorProps> = ({
  websiteUrl,
  onIndustrySelected,
  onTextChange,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryOption | null>(null);
  const [suggestedIndustry, setSuggestedIndustry] = useState<IndustryOption | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    stage: 'research',
    progress: 0,
    message: 'Initializing...',
    estimatedTimeRemaining: 180
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Free-form input states
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedCode, setDetectedCode] = useState<CodeDetectionResult | null>(null);
  const [showCodeConfirmation, setShowCodeConfirmation] = useState(false);
  // Removed confirmation dialog - now generates immediately

  // Keyboard navigation
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const highlightedItemRef = useRef<HTMLButtonElement>(null);

  // Database industries (includes on-demand profiles)
  const [databaseIndustries, setDatabaseIndustries] = useState<IndustryOption[]>([]);

  // Convert NAICS options to IndustryOption format (fallback)
  const STATIC_INDUSTRIES: IndustryOption[] = COMPLETE_NAICS_CODES.map(naics => ({
    naicsCode: naics.naics_code,
    displayName: naics.display_name,
    keywords: naics.keywords,
    icon: '🏢', // Default icon
    popularity: naics.popularity || 1,
    category: naics.category,
    hasFullProfile: naics.has_full_profile
  }));

  // Use database industries if loaded, otherwise fall back to static
  const INDUSTRIES = databaseIndustries.length > 0 ? databaseIndustries : STATIC_INDUSTRIES;

  // Load industries from database on mount (includes on-demand profiles)
  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const { data, error } = await supabase
          .from('naics_codes')
          .select('code, title, keywords, category, has_full_profile, popularity');

        if (error) {
          console.warn('[IndustrySelector] Failed to load from database, using static data:', error.message);
          return;
        }

        const dbIndustries: IndustryOption[] = data.map(row => ({
          naicsCode: row.code,
          displayName: row.title,
          keywords: row.keywords || [],
          icon: '🏢',
          popularity: row.popularity || 1,
          category: row.category,
          hasFullProfile: row.has_full_profile || false
        }));

        console.log(`[IndustrySelector] Loaded ${dbIndustries.length} industries from database`);
        setDatabaseIndustries(dbIndustries);
      } catch (err) {
        console.warn('[IndustrySelector] Exception loading industries:', err);
      }
    };

    loadIndustries();
  }, []);

  // Auto-show dropdown after mount for better UX and e2e test compatibility
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedIndustry && !searchTerm) {
        setShowDropdown(true);
      }
    }, 500); // Small delay to let the component render first

    return () => clearTimeout(timer);
  }, [selectedIndustry, searchTerm]);

  // Smart domain-based suggestion - auto-populate textbox
  useEffect(() => {
    const domain = websiteUrl.toLowerCase();

    // Only auto-suggest if user hasn't typed anything yet
    if (searchTerm) return;

    // Domain pattern matching
    const patterns: Record<string, string> = {
      'dental|smile|teeth': 'Dental Practice',
      'law|legal|attorney|lawyer': 'Legal Services',
      'tech|cyber|it': 'IT Services & Consulting',
      'real|realty|estate': 'Real Estate',
      'roof': 'Roofing Contractor',
      'plumb': 'Plumbing',
      'hvac|heat|cool': 'HVAC',
      'electric': 'Electrical Contractor',
      'restaurant|dining|food': 'Restaurant',
      'salon|hair|barber': 'Beauty Salon',
      'clean': 'Cleaning Services',
      'landscape|lawn': 'Landscaping & Lawn Care',
      'auto|car|mechanic': 'Auto Repair Shop',
      'gym|fitness': 'Gym/Fitness Center',
      'accountant|cpa|tax': 'Accounting & Bookkeeping',
    };

    for (const [pattern, industryName] of Object.entries(patterns)) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(domain)) {
        const suggested = INDUSTRIES.find(i => i.displayName === industryName);
        if (suggested) {
          setSuggestedIndustry(suggested);
          // Auto-populate the textbox instead of showing suggestion button
          setSearchTerm(suggested.displayName);
          setShowDropdown(true); // Show dropdown with matches
          break;
        }
      }
    }
  }, [websiteUrl, searchTerm]);

  // Filter industries based on search
  const filteredIndustries = searchTerm.length > 0
    ? INDUSTRIES.filter(industry =>
        industry.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        industry.keywords.some(kw =>
          kw.toLowerCase().includes(searchTerm.toLowerCase()) ||
          searchTerm.toLowerCase().includes(kw.toLowerCase())
        ) ||
        industry.category.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 50) // Increased limit to show more results
    : INDUSTRIES.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 50); // Show top 50 by default (was 20)

  // Reset highlighted index when search term changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm]);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (highlightedItemRef.current) {
      highlightedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [highlightedIndex]);

  // Group by category for display
  const groupedIndustries = filteredIndustries.reduce((acc, industry) => {
    if (!acc[industry.category]) acc[industry.category] = [];
    acc[industry.category].push(industry);
    return acc;
  }, {} as Record<string, IndustryOption[]>);

  /**
   * Handle free-form industry input with fuzzy matching and Opus detection
   */
  const handleFreeFormSubmit = async () => {
    const text = searchTerm.trim();
    if (!text) return;

    console.log(`[FreeForm] Processing: "${text}"`);

    // Step 1: Try fuzzy match
    const match = await IndustryMatchingService.findMatch(text);

    if (match.type === 'exact' || (match.type === 'fuzzy' && match.confidence > 0.7)) {
      // Strong match - proceed directly
      console.log(`[FreeForm] Strong match found (${match.confidence}): ${match.match?.display_name}`);
      if (match.match) {
        const industry: IndustryOption = {
          naicsCode: match.match.naics_code,
          displayName: match.match.display_name,
          keywords: match.match.keywords,
          category: match.match.category,
          hasFullProfile: match.match.has_full_profile,
          popularity: match.match.popularity,
        };
        await handleSelect(industry);
      }
    } else if (match.type === 'fuzzy' && match.confidence > 0.4) {
      // Weak match - could show alternatives in future
      console.log(`[FreeForm] Weak match (${match.confidence}), proceeding to Opus detection`);
      await detectWithOpus(text);
    } else {
      // No match - use Opus detection
      console.log('[FreeForm] No fuzzy match, using Opus detection');
      await detectWithOpus(text);
    }
  };

  /**
   * Use Opus to detect NAICS code for unknown industry
   */
  const detectWithOpus = async (text: string) => {
    try {
      setIsDetecting(true);
      setShowDropdown(false);

      const detection = await IndustryCodeDetectionService.detectCode(text);
      setIsDetecting(false);

      console.log('[Opus Detection] Result:', detection);

      // Show code detection confirmation
      setDetectedCode(detection);
      setShowCodeConfirmation(true);
    } catch (error) {
      console.error('[Opus Detection] Failed:', error);
      setIsDetecting(false);
      alert('Failed to detect industry. Please try selecting from the dropdown.');
    }
  };

  /**
   * User confirmed the detected code is correct
   */
  const handleCodeDetectionConfirm = async () => {
    setShowCodeConfirmation(false);

    if (!detectedCode) return;

    // ALWAYS check database first - ONLY trust database, not local file
    console.log(`[Code Confirmed] Checking database for NAICS ${detectedCode.naics_code}...`);
    const cachedProfile = await OnDemandProfileGenerator.checkCachedProfile(detectedCode.naics_code);
    const existingIndustry = IndustryMatchingService.getByCode(detectedCode.naics_code);

    if (cachedProfile) {
      // Profile exists in database - use it immediately
      console.log('[Code Confirmed] ✅ Profile found in database, loading instantly');
      const industry: IndustryOption = {
        naicsCode: existingIndustry?.naics_code || detectedCode.naics_code,
        displayName: existingIndustry?.display_name || detectedCode.display_name,
        keywords: existingIndustry?.keywords || detectedCode.keywords,
        category: existingIndustry?.category || detectedCode.category,
        hasFullProfile: true,
        popularity: existingIndustry?.popularity,
      };
      onIndustrySelected(industry);
    } else {
      // Database returned null (either doesn't exist or RLS error) - always generate
      console.log('[Code Confirmed] ❌ No profile in database (or RLS blocking access), generating new profile...');
      const industry: IndustryOption = {
        naicsCode: detectedCode.naics_code,
        displayName: detectedCode.display_name,
        keywords: detectedCode.keywords,
        category: detectedCode.category,
        hasFullProfile: false,
      };
      setSelectedIndustry(industry);
      await performGeneration(industry);
    }
  };

  /**
   * User rejected the detected code - let them choose manually
   */
  const handleCodeDetectionCorrect = () => {
    setShowCodeConfirmation(false);
    setDetectedCode(null);
    setSearchTerm('');
    // Return to selector
  };

  const handleSelect = async (industry: IndustryOption) => {
    setSelectedIndustry(industry);
    setSearchTerm(industry.displayName);
    setShowDropdown(false);

    // ALWAYS check database first - ONLY trust database, not local file
    console.log(`[IndustrySelector] Checking database for NAICS ${industry.naicsCode}...`);
    const cachedProfile = await OnDemandProfileGenerator.checkCachedProfile(industry.naicsCode);

    if (cachedProfile) {
      // Profile exists in database - use it
      console.log(`[IndustrySelector] ✅ Profile found in database for "${industry.displayName}"`);
      onIndustrySelected({
        ...industry,
        hasFullProfile: true
      });
    } else {
      // Database returned null (either doesn't exist or RLS error) - always generate
      console.log(`[OnDemand] ❌ No profile in database for "${industry.displayName}", generating now...`);
      await performGeneration(industry);
      return;
    }

    // Visual feedback
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  /**
   * Actually generate the profile after user confirms
   */
  const performGeneration = async (industry: IndustryOption) => {
    setIsGenerating(true);

    try {
      // Generate profile on-demand with 10 minute timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile generation timed out after 10 minutes')), 600000)
      );

      const profile = await Promise.race([
        OnDemandProfileGenerator.generateProfile(
          industry.displayName,
          industry.naicsCode,
          (progress) => {
            setGenerationProgress(progress);
          }
        ),
        timeoutPromise
      ]);

      console.log(`[OnDemand] Profile generated successfully for ${industry.displayName}`);
      console.log(`[OnDemand] Profile saved to database, ready for immediate use`);
      setIsGenerating(false);

      // Call onIndustrySelected with skip flag = true
      // This skips the scanning animation and goes straight to JTBD flow
      onIndustrySelected({
        ...industry,
        hasFullProfile: true
      }, true); // Skip scanning - profile already generated and saved
    } catch (error) {
      console.error('[OnDemand] Failed to generate profile:', error);
      setIsGenerating(false);

      // Show error message but still proceed to onboarding flow
      // The flow can work with fallback data if profile generation failed
      console.log('[OnDemand] Profile generation failed, proceeding with fallback data');

      // Call with skipScan = true to go straight to JTBD flow even on error
      onIndustrySelected({
        ...industry,
        hasFullProfile: false // Mark as not having full profile
      }, true); // Skip scanning - go straight to flow with fallback data
    }
  };

  const handleSuggestionClick = () => {
    if (suggestedIndustry) {
      handleSelect(suggestedIndustry);
    }
  };

  // Show detecting state
  if (isDetecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Detecting Industry...
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Using AI to identify the best NAICS code for "{searchTerm}"
          </p>
        </div>
      </div>
    );
  }

  // If generating, show detailed research animation
  if (isGenerating && selectedIndustry) {
    return (
      <DetailedResearchAnimation
        industryName={selectedIndustry.displayName}
        naicsCode={selectedIndustry.naicsCode}
        currentProgress={generationProgress.progress}
        estimatedTimeRemaining={generationProgress.estimatedTimeRemaining}
      />
    );
  }

  return (
    <div className={`industry-selector-clean ${className}`} data-testid="industry-selector">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        What business are you in?
        {suggestedIndustry && !selectedIndustry && (
          <button
            onClick={handleSuggestionClick}
            className="suggestion-pill"
            type="button"
          >
            <Sparkles size={12} />
            {suggestedIndustry.icon} {suggestedIndustry.displayName}
          </button>
        )}
      </label>

      <div
        className="relative"
        onClick={() => {
          // Focus input and show dropdown when clicking anywhere in the container
          inputRef.current?.focus();
          setShowDropdown(true);
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onFocus={() => {
            // Show dropdown on focus so users can see options
            setShowDropdown(true);
          }}
          onChange={(e) => {
            const value = e.target.value;
            setSearchTerm(value);

            // Notify parent of text change
            if (onTextChange) {
              onTextChange(value);
            }

            if (value.length > 0) {
              setShowDropdown(true);
            } else {
              setShowDropdown(false);
            }
            setSelectedIndustry(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedIndex(prev =>
                prev < filteredIndustries.length - 1 ? prev + 1 : prev
              );
              setShowDropdown(true);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (highlightedIndex >= 0 && highlightedIndex < filteredIndustries.length) {
                // Select the highlighted item
                handleSelect(filteredIndustries[highlightedIndex]);
              } else if (searchTerm.trim().length >= 3) {
                // Free-form submit
                handleFreeFormSubmit();
              }
            }
          }}
          onFocus={() => {
            if (searchTerm.length > 0) {
              setShowDropdown(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              setShowDropdown(false);
            }, 200);
          }}
          placeholder="e.g., Real Estate, Plumbing, Accounting..."
          className={`w-full h-14 px-4 pr-12 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${selectedIndustry ? 'bg-green-50 border-green-500' : ''}`}
          autoComplete="off"
        />
        {selectedIndustry && (
          <Check className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500" size={20} />
        )}
      </div>

      <AnimatePresence>
        {showDropdown && !selectedIndustry && (
          <motion.div
            className="dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {(() => {
              let currentIndex = 0;
              return Object.entries(groupedIndustries).map(([category, industries]) => (
                <div key={category} className="category-group" style={{ marginBottom: '8px' }}>
                  <div className="category-label" style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#9CA3AF',
                    padding: '8px 12px 4px 12px'
                  }}>{category}</div>
                  {industries.map(industry => {
                    const itemIndex = currentIndex++;
                    const isHighlighted = itemIndex === highlightedIndex;
                    return (
                      <motion.button
                        key={`${industry.naicsCode}-${industry.displayName}`}
                        ref={isHighlighted ? highlightedItemRef : null}
                        className={`industry-option ${isHighlighted ? 'highlighted' : ''}`}
                        onClick={() => handleSelect(industry)}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setHighlightedIndex(itemIndex)}
                        whileHover={{ x: 4 }}
                        type="button"
                        data-testid={`industry-option-${industry.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%',
                          padding: '10px 12px',
                          textAlign: 'left',
                          border: 'none',
                          background: isHighlighted ? '#EFF6FF' : 'transparent',
                          borderLeft: isHighlighted ? '3px solid #3B82F6' : '3px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span className="industry-icon" style={{ fontSize: '16px' }}>{industry.icon}</span>
                        <span className="industry-name" style={{
                          flex: 1,
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#FFFFFF'
                        }}>{industry.displayName}</span>
                        {industry.hasFullProfile && (
                          <span className="profile-badge" title="Pre-generated profile available" style={{
                            fontSize: '12px',
                            color: '#10B981',
                            fontWeight: 600
                          }}>
                            ✓
                          </span>
                        )}
                        {!industry.hasFullProfile && (
                          <span className="ondemand-badge" title="Profile will be generated on-demand" style={{
                            fontSize: '12px',
                            color: '#FBBF24'
                          }}>
                            ⚡
                          </span>
                        )}
                        {(industry.popularity || 0) >= 4 && (
                          <span className="popular-badge" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#8B5CF6',
                            backgroundColor: '#F3E8FF',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            <TrendingUp size={12} /> Popular
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ));
            })()}

            {filteredIndustries.length === 0 && searchTerm.length > 0 && (
              <div style={{
                padding: '16px',
                background: '#F0F9FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                margin: '8px'
              }}>
                <Sparkles size={20} style={{ flexShrink: 0, color: '#2563EB', marginTop: '2px' }} />
                <div>
                  <p style={{
                    margin: '0 0 4px 0',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1E40AF',
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                  }}>
                    Don't see your industry?
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#1E40AF',
                    lineHeight: '1.5',
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                  }}>
                    Type it in anyway! Press <strong>Enter</strong> and we'll research and add it to our database in 3-5 minutes.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {selectedIndustry && (
        <motion.div
          className="selection-confirmation"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Check size={16} />
          <span>
            Selected: <strong>{selectedIndustry.displayName}</strong>
          </span>
        </motion.div>
      )}

      {/* Confirmation Dialogs */}
      {detectedCode && (
        <ConfirmCodeDetectionDialog
          open={showCodeConfirmation}
          userInput={searchTerm}
          detectedIndustry={detectedCode.display_name}
          naicsCode={detectedCode.naics_code}
          confidence={detectedCode.confidence}
          reasoning={detectedCode.reasoning}
          category={detectedCode.category}
          keywords={detectedCode.keywords}
          onConfirm={handleCodeDetectionConfirm}
          onCorrect={handleCodeDetectionCorrect}
        />
      )}
    </div>
  );
};
