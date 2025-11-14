/**
 * CharacterCountBadge Component (Stub)
 * TODO: Implement character count validation
 */

import React from 'react';

interface CharacterCountBadgeProps {
  validation: {
    isValid: boolean;
    count: number;
    maxCount?: number;
    platform?: string;
  };
}

export function CharacterCountBadge({ validation }: CharacterCountBadgeProps) {
  const { isValid, count, maxCount, platform } = validation;

  return (
    <div className={`text-xs px-2 py-1 rounded ${isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {count}{maxCount ? ` / ${maxCount}` : ''} characters
      {platform && ` (${platform})`}
    </div>
  );
}
