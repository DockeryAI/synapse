/**
 * EdginessSlider Component (Stub)
 * TODO: Implement edginess control
 */

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface EdginessSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function EdginessSlider({ value, onChange, disabled }: EdginessSliderProps) {
  return (
    <div className="space-y-2">
      <Label>Edginess Level: {Math.round(value * 100)}%</Label>
      <Slider
        value={[value * 100]}
        onValueChange={(values) => onChange(values[0] / 100)}
        min={0}
        max={100}
        step={10}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground">
        Higher values create more bold and attention-grabbing content
      </p>
    </div>
  );
}
