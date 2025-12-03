/**
 * Industry Selector Component
 * Allows users to select their industry for content generation
 * Task 14 - Production Ready Implementation
 */

import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import { brandApiService } from '@/services/api/brand.service';

export interface IndustrySelectorProps {
  brandId: string;
  value?: string;
  onChange: (industry: string) => void;
  autoSave?: boolean;
}

const INDUSTRIES = [
  { id: 'restaurant', name: 'Restaurant / Food Service', emoji: '🍽️' },
  { id: 'cpa', name: 'CPA / Accounting', emoji: '📊' },
  { id: 'realtor', name: 'Real Estate', emoji: '🏠' },
  { id: 'dentist', name: 'Dental / Healthcare', emoji: '🦷' },
  { id: 'consultant', name: 'Consulting / Professional Services', emoji: '💼' },
  { id: 'attorney', name: 'Legal Services / Attorney', emoji: '⚖️' },
  { id: 'contractor', name: 'Contractor / Construction', emoji: '🔨' },
  { id: 'salon', name: 'Beauty Salon / Spa', emoji: '💇' },
  { id: 'fitness', name: 'Gym / Fitness Center', emoji: '💪' },
  { id: 'retail', name: 'Retail Store', emoji: '🛍️' },
  { id: 'plumber', name: 'Plumbing Services', emoji: '🚰' },
  { id: 'electrician', name: 'Electrical Services', emoji: '⚡' },
  { id: 'hvac', name: 'HVAC Services', emoji: '❄️' },
  { id: 'auto', name: 'Auto Repair / Mechanic', emoji: '🔧' },
  { id: 'cleaning', name: 'Cleaning Services', emoji: '🧹' },
];

export function IndustrySelector({
  brandId,
  value,
  onChange,
  autoSave = false,
}: IndustrySelectorProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>(value || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (value) {
      setSelectedIndustry(value);
    }
  }, [value]);

  const handleChange = async (industry: string) => {
    setSelectedIndustry(industry);
    onChange(industry);

    // Auto-save to database if enabled
    if (autoSave && brandId) {
      setIsSaving(true);
      try {
        await brandApiService.updateBrand(brandId, {
          industry
        });
      } catch (error) {
        console.error('Error saving industry:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Industry</Label>
      <Select value={selectedIndustry} onValueChange={handleChange} disabled={isSaving}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select your industry" />
        </SelectTrigger>
        <SelectContent>
          {INDUSTRIES.map((industry) => (
            <SelectItem key={industry.id} value={industry.id}>
              <span className="flex items-center gap-2">
                <span>{industry.emoji}</span>
                <span>{industry.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isSaving && <p className="text-xs text-muted-foreground">Saving...</p>}
    </div>
  );
}

/**
 * Industry Selector Card - Full card variant for onboarding/settings
 */
export function IndustrySelectorCard({
  brandId,
  value,
  onChange,
  autoSave = false,
}: IndustrySelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Select Your Industry
        </CardTitle>
        <CardDescription>
          This helps us create content that's perfect for your business type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <IndustrySelector
          brandId={brandId}
          value={value}
          onChange={onChange}
          autoSave={autoSave}
        />
      </CardContent>
    </Card>
  );
}
