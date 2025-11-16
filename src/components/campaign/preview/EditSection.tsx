/**
 * EDIT SECTION COMPONENT
 *
 * Inline editor for campaign content sections with:
 * - Auto-resizing textarea
 * - Character count display
 * - "Regenerate" button per section
 * - Multiple regeneration alternatives
 * - Save/Cancel buttons
 * - Real-time character validation
 *
 * Props:
 * - section: Which section is being edited (headline|hook|body|cta|hashtags)
 * - value: Current value
 * - limit: Character limit (optional)
 * - onChange: Callback when value changes
 * - onSave: Callback when user saves changes
 * - onCancel: Callback when user cancels editing
 * - onRegenerate: Callback when user requests regeneration
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  type ContentSection,
  type RegenerationOptions,
  type RegenerationResult
} from '@/types/campaign-preview.types';

// ============================================================================
// AUTO-RESIZE TEXTAREA
// ============================================================================

interface AutoResizeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  maxLength
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize on value change
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      maxLength={maxLength}
      rows={3}
    />
  );
};

// ============================================================================
// HASHTAG EDITOR
// ============================================================================

interface HashtagEditorProps {
  hashtags: string[];
  onChange: (hashtags: string[]) => void;
  maxHashtags?: number;
}

const HashtagEditor: React.FC<HashtagEditorProps> = ({
  hashtags,
  onChange,
  maxHashtags
}) => {
  const [inputValue, setInputValue] = useState('');

  const addHashtag = () => {
    const cleaned = inputValue.trim().replace(/^#/, '');
    if (cleaned && !hashtags.includes(cleaned)) {
      if (!maxHashtags || hashtags.length < maxHashtags) {
        onChange([...hashtags, cleaned]);
        setInputValue('');
      }
    }
  };

  const removeHashtag = (index: number) => {
    onChange(hashtags.filter((_, idx) => idx !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addHashtag();
    }
  };

  return (
    <div className="space-y-2">
      {/* Existing Hashtags */}
      <div className="flex flex-wrap gap-2">
        {hashtags.map((tag, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full"
          >
            <span className="text-sm font-medium">#{tag}</span>
            <button
              onClick={() => removeHashtag(idx)}
              className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add New Hashtag */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add hashtag..."
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addHashtag}
          disabled={!inputValue.trim() || (maxHashtags !== undefined && hashtags.length >= maxHashtags)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>

      {maxHashtags && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {hashtags.length} / {maxHashtags} hashtags
        </p>
      )}
    </div>
  );
};

// ============================================================================
// REGENERATION ALTERNATIVES
// ============================================================================

interface RegenerationAlternativesProps {
  alternatives: RegenerationResult['alternatives'];
  onSelect: (index: number) => void;
  onClose: () => void;
}

const RegenerationAlternatives: React.FC<RegenerationAlternativesProps> = ({
  alternatives,
  onSelect,
  onClose
}) => {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
          ✨ AI-Generated Alternatives
        </h4>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ×
        </button>
      </div>

      {alternatives.map((alt, idx) => (
        <div
          key={idx}
          className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
        >
          <div className="space-y-2">
            {/* Alternative Content */}
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {Array.isArray(alt.value) ? alt.value.join(', ') : alt.value}
            </p>

            {/* Reasoning */}
            <p className="text-xs text-gray-600 dark:text-gray-400 italic">
              💡 {alt.reasoning}
            </p>

            {/* Character Count */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {alt.characterCount} characters
              </span>
              <button
                onClick={() => onSelect(idx)}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Use This
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// EDIT SECTION COMPONENT (Main)
// ============================================================================

interface EditSectionProps {
  section: ContentSection;
  value: string | string[];
  limit?: number;
  onChange: (value: string | string[]) => void;
  onSave: () => void;
  onCancel: () => void;
  onRegenerate?: (options?: RegenerationOptions) => Promise<RegenerationResult>;
}

export const EditSection: React.FC<EditSectionProps> = ({
  section,
  value,
  limit,
  onChange,
  onSave,
  onCancel,
  onRegenerate
}) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationResult, setRegenerationResult] = useState<RegenerationResult | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const sectionLabels: Record<ContentSection, string> = {
    headline: 'Headline',
    hook: 'Hook',
    body: 'Body',
    cta: 'Call to Action',
    hashtags: 'Hashtags'
  };

  const placeholders: Record<ContentSection, string> = {
    headline: 'Enter a compelling headline...',
    hook: 'Write an attention-grabbing opening...',
    body: 'Craft your main message...',
    cta: 'Add a clear call to action...',
    hashtags: 'Add relevant hashtags...'
  };

  const characterCount = Array.isArray(value)
    ? value.length
    : (value as string).length;

  const isOverLimit = limit ? characterCount > limit : false;

  const handleRegenerate = async (options?: RegenerationOptions) => {
    if (!onRegenerate) return;

    setIsRegenerating(true);
    try {
      const result = await onRegenerate(options);
      setRegenerationResult(result);
    } catch (error) {
      console.error('Regeneration failed:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSelectAlternative = (index: number) => {
    if (regenerationResult && regenerationResult.alternatives[index]) {
      onChange(regenerationResult.alternatives[index].value);
      setRegenerationResult(null);
    }
  };

  return (
    <div className="w-full space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-500">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          ✏️ Editing: {sectionLabels[section]}
        </h3>
        <div className="flex items-center gap-2">
          <span className={`
            text-sm font-medium
            ${isOverLimit ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}
          `}>
            {characterCount}{limit ? ` / ${limit}` : ''}
          </span>
          {isOverLimit && (
            <span className="text-red-500">⚠️</span>
          )}
        </div>
      </div>

      {/* Editor */}
      {section === 'hashtags' ? (
        <HashtagEditor
          hashtags={value as string[]}
          onChange={onChange as (hashtags: string[]) => void}
          maxHashtags={limit}
        />
      ) : (
        <AutoResizeTextarea
          value={value as string}
          onChange={onChange as (value: string) => void}
          placeholder={placeholders[section]}
          maxLength={limit}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      )}

      {/* Regeneration Button & Options */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleRegenerate()}
          disabled={isRegenerating || !onRegenerate}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {isRegenerating ? (
            <>
              <span className="animate-spin">⚙️</span>
              <span>Regenerating...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>Regenerate with AI</span>
            </>
          )}
        </button>

        {onRegenerate && (
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {showOptions ? '▼' : '▶'} Options
          </button>
        )}
      </div>

      {/* Regeneration Options (TODO: Add tone, length, focus controls) */}
      {showOptions && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            🚧 Advanced regeneration options coming soon (tone, length, focus)
          </p>
        </div>
      )}

      {/* Regeneration Alternatives */}
      {regenerationResult && (
        <RegenerationAlternatives
          alternatives={regenerationResult.alternatives}
          onSelect={handleSelectAlternative}
          onClose={() => setRegenerationResult(null)}
        />
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={isOverLimit}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          💾 Save Changes
        </button>
      </div>
    </div>
  );
};
