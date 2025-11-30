/**
 * RegionMultiSelect Component
 *
 * Multi-select chips for primary regions (UK, US, EMEA, APAC, LATAM, etc.).
 *
 * Created: 2025-11-28
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RegionMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  className?: string;
}

const AVAILABLE_REGIONS = [
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'EMEA', label: 'Europe, Middle East & Africa' },
  { value: 'APAC', label: 'Asia Pacific' },
  { value: 'LATAM', label: 'Latin America' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Global', label: 'Global / Worldwide' },
];

export function RegionMultiSelect({
  value,
  onChange,
  disabled = false,
  className,
}: RegionMultiSelectProps) {
  const selectedRegions = new Set(value);
  const availableToAdd = AVAILABLE_REGIONS.filter((r) => !selectedRegions.has(r.value));

  const handleAdd = (region: string) => {
    if (!disabled) {
      onChange([...value, region]);
    }
  };

  const handleRemove = (region: string) => {
    if (!disabled) {
      onChange(value.filter((r) => r !== region));
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Selected Regions */}
      <div className="flex flex-wrap gap-2">
        {value.length === 0 ? (
          <span className="text-sm text-gray-500 italic">No regions selected</span>
        ) : (
          value.map((region) => {
            const regionInfo = AVAILABLE_REGIONS.find((r) => r.value === region);
            return (
              <Badge
                key={region}
                variant="secondary"
                className={cn(
                  'flex items-center gap-1 pr-1',
                  disabled && 'opacity-50'
                )}
              >
                {regionInfo?.label || region}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(region)}
                    className="ml-1 p-0.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            );
          })
        )}
      </div>

      {/* Available Regions to Add */}
      {!disabled && availableToAdd.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {availableToAdd.map((region) => (
            <button
              key={region.value}
              type="button"
              onClick={() => handleAdd(region.value)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs rounded-md',
                'border border-dashed border-gray-300 dark:border-gray-600',
                'text-gray-500 dark:text-gray-400',
                'hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400',
                'transition-colors'
              )}
            >
              <Plus className="w-3 h-3" />
              {region.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default RegionMultiSelect;
