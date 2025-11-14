/**
 * Content Enhancements Component
 *
 * Provides UI for:
 * - Character count validation
 * - Section regeneration
 * - A/B variant generation
 * - Contrarian angle detection
 *
 * Created: 2025-11-11
 */

import React, { useState } from 'react';
import { RefreshCw, Sparkles, TrendingUp, Copy } from 'lucide-react';
import { CharacterCountBadge } from './CharacterCountBadge';
import { SynapseContentGenerator } from '@/services/synapse/generation/SynapseContentGenerator';
import type {
  SynapseContent,
  BusinessProfile,
  ContentSection,
  RegenerationResult,
  ABTestGroup
} from '@/types/synapseContent.types';
import type { BreakthroughInsight } from '@/types/breakthrough.types';

interface ContentEnhancementsProps {
  content: SynapseContent;
  business: BusinessProfile;
  insight: BreakthroughInsight;
  onContentUpdate: (updated: SynapseContent) => void;
}

export function ContentEnhancements({
  content,
  business,
  insight,
  onContentUpdate
}: ContentEnhancementsProps) {
  const [regenerating, setRegenerating] = useState<ContentSection | null>(null);
  const [regenerationResults, setRegenerationResults] = useState<Record<ContentSection, RegenerationResult>>({} as any);
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [variants, setVariants] = useState<ABTestGroup | null>(null);

  const generator = new SynapseContentGenerator();

  // Validate character counts
  const validation = generator.validateContent(content, ['LinkedIn', 'Twitter']);
  const charCounts = generator.getCharacterSummary(content);

  // Handle section regeneration
  const handleRegenerate = async (section: ContentSection) => {
    setRegenerating(section);
    try {
      const result = await generator.regenerateSection(content, section, business, insight);
      setRegenerationResults(prev => ({ ...prev, [section]: result }));
    } catch (error) {
      console.error('Regeneration error:', error);
      alert('Failed to regenerate section');
    } finally {
      setRegenerating(null);
    }
  };

  // Apply regenerated section
  const applyRegeneration = (section: ContentSection, optionIndex: number) => {
    const result = regenerationResults[section];
    if (!result) return;

    const updated = generator.applyRegeneration(content, result, optionIndex);
    onContentUpdate(updated);

    // Clear the regeneration results for this section
    setRegenerationResults(prev => {
      const next = { ...prev };
      delete next[section];
      return next;
    });
  };

  // Generate A/B variants
  const handleGenerateVariants = async () => {
    setGeneratingVariants(true);
    try {
      const result = await generator.generateVariants(content, business);
      setVariants(result);
    } catch (error) {
      console.error('Variant generation error:', error);
      alert('Failed to generate variants');
    } finally {
      setGeneratingVariants(false);
    }
  };

  // Copy content to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      {/* Character Count Summary */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
        <div className="text-sm font-medium text-gray-700 dark:text-slate-300">
          Character Counts
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-slate-400">
            Total: {charCounts.total}
          </span>
          {validation.overallStatus !== 'valid' && (
            <span className={`text-xs font-medium ${
              validation.overallStatus === 'error'
                ? 'text-red-600 dark:text-red-400'
                : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {validation.overallStatus === 'error' ? '⚠️ Has Errors' : '⚠️ Has Warnings'}
            </span>
          )}
        </div>
      </div>

      {/* Section Regeneration */}
      <div className="space-y-3">
        {(['headline', 'hook', 'body', 'cta'] as ContentSection[]).map((section) => {
          const result = regenerationResults[section];
          const sectionValidation = validation.validations.find(v => v.section === section && v.platform === 'LinkedIn');

          return (
            <div key={section} className="border border-gray-200 dark:border-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 capitalize">
                    {section}
                  </span>
                  {sectionValidation && (
                    <CharacterCountBadge validation={sectionValidation} compact />
                  )}
                </div>
                <button
                  onClick={() => handleRegenerate(section)}
                  disabled={regenerating === section}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${regenerating === section ? 'animate-spin' : ''}`} />
                  {regenerating === section ? 'Regenerating...' : 'Regenerate'}
                </button>
              </div>

              {/* Regeneration Options */}
              {result && (
                <div className="mt-3 space-y-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">
                    Choose a variation:
                  </div>
                  {result.regenerated.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-white dark:bg-slate-800 rounded border border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 cursor-pointer transition-colors"
                      onClick={() => applyRegeneration(section, index)}
                    >
                      <span className="flex-shrink-0 text-xs font-bold text-purple-600 dark:text-purple-400">
                        {index + 1}.
                      </span>
                      <span className="text-xs text-gray-700 dark:text-slate-300 flex-1">
                        {option.length > 150 ? option.substring(0, 150) + '...' : option}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(option);
                        }}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* A/B Variant Generation */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
        <button
          onClick={handleGenerateVariants}
          disabled={generatingVariants}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white font-semibold rounded-lg transition-all disabled:opacity-50 shadow-lg"
          style={{
            background: generatingVariants
              ? 'linear-gradient(to right, #2563eb, #9333ea)'
              : 'linear-gradient(to right, #3b82f6, #a855f7)',
            minHeight: '48px'
          }}
        >
          {generatingVariants ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating Variants...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Generate A/B Test Variants
            </>
          )}
        </button>

        {/* Variant Display */}
        {variants && (
          <div className="mt-4 space-y-3">
            <div className="text-sm font-semibold text-gray-700 dark:text-slate-300">
              A/B Test Variants ({variants.variants.length})
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              💡 {variants.recommendedTest}
            </div>
            {variants.variants.map((variant) => (
              <div
                key={variant.id}
                className="p-3 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                    Variant {variant.variantLetter} - {variant.strategy.toUpperCase()}
                  </span>
                  <button
                    onClick={() => onContentUpdate(variant.content)}
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
                <div className="text-xs text-gray-600 dark:text-slate-400 space-y-1">
                  {variant.differenceFromOriginal.map((diff, idx) => (
                    <div key={idx}>• {diff}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
