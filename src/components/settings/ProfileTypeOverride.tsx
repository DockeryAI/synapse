/**
 * ProfileTypeOverride Component
 *
 * Dropdown to manually override the auto-detected business profile type.
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import type { BusinessProfileType } from '@/services/triggers';

interface ProfileTypeOverrideProps {
  value: BusinessProfileType;
  onChange: (value: BusinessProfileType) => void;
  isAutoDetected: boolean;
  onReset?: () => void;
  disabled?: boolean;
  className?: string;
}

const PROFILE_OPTIONS: { value: BusinessProfileType; label: string; description: string }[] = [
  {
    value: 'local-service-b2b',
    label: 'Local B2B Service',
    description: 'Commercial HVAC, IT services, local consulting',
  },
  {
    value: 'local-service-b2c',
    label: 'Local B2C Service',
    description: 'Dental, salon, restaurant, local retail',
  },
  {
    value: 'regional-b2b-agency',
    label: 'Regional B2B Agency',
    description: 'Marketing agency, accounting firm, consulting',
  },
  {
    value: 'regional-retail-b2c',
    label: 'Regional Retail',
    description: 'Multi-location retail, franchise',
  },
  {
    value: 'national-saas-b2b',
    label: 'National SaaS B2B',
    description: 'US-focused software, enterprise tools',
  },
  {
    value: 'national-product-b2c',
    label: 'National Product B2C',
    description: 'Consumer brand, e-commerce, manufacturer',
  },
  {
    value: 'global-saas-b2b',
    label: 'Global SaaS B2B',
    description: 'International software, multi-region enterprise',
  },
];

export function ProfileTypeOverride({
  value,
  onChange,
  isAutoDetected,
  onReset,
  disabled = false,
  className,
}: ProfileTypeOverrideProps) {
  const selectedOption = PROFILE_OPTIONS.find((opt) => opt.value === value);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="flex-1">
            <SelectValue>
              {selectedOption && (
                <span>{selectedOption.label}</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PROFILE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!isAutoDetected && onReset && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={disabled}
            title="Reset to auto-detected"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isAutoDetected ? (
          <Badge variant="secondary" className="text-xs">
            Auto-detected
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
            Manual override
          </Badge>
        )}
        {selectedOption && (
          <span className="text-xs text-gray-500">{selectedOption.description}</span>
        )}
      </div>
    </div>
  );
}

export default ProfileTypeOverride;
