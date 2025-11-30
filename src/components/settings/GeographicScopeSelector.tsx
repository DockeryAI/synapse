/**
 * GeographicScopeSelector Component
 *
 * Dropdown to select geographic scope (local, regional, national, global).
 *
 * Created: 2025-11-28
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Building, Globe, Globe2 } from 'lucide-react';

export type GeographicScope = 'local' | 'regional' | 'national' | 'global';

interface GeographicScopeSelectorProps {
  value: GeographicScope;
  onChange: (value: GeographicScope) => void;
  disabled?: boolean;
  className?: string;
}

const SCOPE_OPTIONS: { value: GeographicScope; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'local',
    label: 'Local',
    description: 'Single city or metro area',
    icon: <MapPin className="w-4 h-4" />,
  },
  {
    value: 'regional',
    label: 'Regional',
    description: 'Multiple cities or states',
    icon: <Building className="w-4 h-4" />,
  },
  {
    value: 'national',
    label: 'National',
    description: 'Entire country',
    icon: <Globe className="w-4 h-4" />,
  },
  {
    value: 'global',
    label: 'Global',
    description: 'Multiple countries or worldwide',
    icon: <Globe2 className="w-4 h-4" />,
  },
];

export function GeographicScopeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: GeographicScopeSelectorProps) {
  const selectedOption = SCOPE_OPTIONS.find((opt) => opt.value === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue>
          {selectedOption && (
            <div className="flex items-center gap-2">
              {selectedOption.icon}
              <span>{selectedOption.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SCOPE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.icon}
              <div>
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-500">{option.description}</div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default GeographicScopeSelector;
