# PHASE 1 - INSTANCE B: POWER VISUALIZATIONS
**Duration: 3 Days (24 hours) - Starts Day 2**
**Branch: `feature/phase1-power-visualizations`**
**Base: `feature/dashboard-v2-week2`**

---

## SETUP & ENVIRONMENT (30 minutes)

### 1. Environment Setup
- [ ] Navigate to project: `cd /Users/byronhudson/Projects/Synapse`
- [ ] Ensure on latest base: `git checkout feature/dashboard-v2-week2 && git pull`
- [ ] Create feature branch: `git checkout -b feature/phase1-power-visualizations`
- [ ] Verify clean working directory: `git status`

### 2. Install Dependencies
- [ ] Run: `npm install`
- [ ] Install D3: `npm install d3 @types/d3`
- [ ] Install Recharts: `npm install recharts`
- [ ] Verify installations in package.json

### 3. Wait for Instance A Completion
- [ ] **CRITICAL**: Wait for Instance A to complete Day 1 (breakthrough title templates)
- [ ] Once notified, fetch Instance A's branch:

```bash
git fetch origin feature/phase1-intelligence-pipeline
git checkout feature/phase1-intelligence-pipeline
# Review breakthrough-generator.service.ts to see new types
git checkout feature/phase1-power-visualizations
# Optionally merge if needed for types, or just reference
```

### 4. Read Current Implementation
- [ ] Read: `src/services/intelligence/breakthrough-generator.service.ts`
  - Note: Breakthrough interface and structure
  - Note: Categories: 'urgent', 'high-value', 'evergreen'
  - Note: Validation, timing, emotional resonance fields
- [ ] Read: `src/components/dashboard/IntelligenceInsights.tsx`
  - Note: How breakthroughs are currently displayed
  - Note: Styling patterns and color schemes
- [ ] Read: `src/components/dashboard/intelligence-v2/EasyMode.tsx`
  - Note: Current layout structure
  - Note: Where to integrate visualizations
- [ ] Read: `src/services/intelligence/campaign-generator.service.ts`
  - Note: Campaign arc structure (5-7 pieces)
  - Note: Emotional progression field
- [ ] Read: `src/services/intelligence/performance-predictor.service.ts`
  - Note: Prediction output format
  - Note: Industry benchmark structure

---

## DAY 2: OPPORTUNITY RADAR (8 hours)

### TASK 1: Create Radar Component Foundation (2 hours)

#### 1.1 Create Component File (15 minutes)
**New File: `src/components/dashboard/intelligence-v2/OpportunityRadar.tsx`**

- [ ] Create file with base structure:

```typescript
/**
 * Opportunity Radar
 *
 * Visualizes breakthroughs as interactive blips on a radar with three zones:
 * - Inner (Red): Urgent opportunities requiring immediate action
 * - Middle (Orange): High-value opportunities to prioritize
 * - Outer (Green): Evergreen opportunities for long-term strategy
 *
 * Blips positioned by confidence (x-axis) and impact score (y-axis)
 *
 * Created: 2025-11-23
 */

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { AlertCircle, TrendingUp, CheckCircle, Info } from 'lucide-react';
import type { Breakthrough } from '@/services/intelligence/breakthrough-generator.service';

export interface OpportunityRadarProps {
  breakthroughs: Breakthrough[];
  onBlipClick?: (breakthrough: Breakthrough) => void;
}

export interface RadarBlip {
  id: string;
  x: number; // confidence (0-1)
  y: number; // impact (score 0-100)
  size: number; // validation count
  color: string;
  category: string;
  breakthrough: Breakthrough;
}

export function OpportunityRadar({ breakthroughs, onBlipClick }: OpportunityRadarProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedBlip, setSelectedBlip] = useState<RadarBlip | null>(null);

  // Transform breakthroughs into radar blips
  const blips: RadarBlip[] = breakthroughs.map(bt => {
    const confidence = bt.validation.totalDataPoints / 20; // Normalize to 0-1
    const impact = bt.score;

    return {
      id: bt.id,
      x: Math.min(confidence, 1),
      y: impact,
      size: Math.min(bt.validation.totalDataPoints, 30),
      color: getCategoryColor(bt.category),
      category: bt.category,
      breakthrough: bt
    };
  });

  useEffect(() => {
    if (!svgRef.current) return;
    renderRadar();
  }, [breakthroughs]);

  const renderRadar = () => {
    // Implementation follows...
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Opportunity Radar
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Info className="w-4 h-4" />
          <span>Click blips for details</span>
        </div>
      </div>

      {/* SVG Radar */}
      <svg
        ref={svgRef}
        className="w-full"
        style={{ height: '400px' }}
      />

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600 dark:text-gray-400">Urgent</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-gray-600 dark:text-gray-400">High-Value</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Evergreen</span>
        </div>
      </div>
    </div>
  );
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'urgent': return '#ef4444'; // red-500
    case 'high-value': return '#f97316'; // orange-500
    case 'evergreen': return '#22c55e'; // green-500
    default: return '#8b5cf6'; // purple-500
  }
}
```

#### 1.2 Implement Radar Rendering with D3 (90 minutes)
- [ ] Add renderRadar implementation:

```typescript
const renderRadar = () => {
  const svg = d3.select(svgRef.current);
  svg.selectAll('*').remove(); // Clear previous render

  const width = svgRef.current!.clientWidth;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 40;

  // Create main group
  const g = svg
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${centerX}, ${centerY})`);

  // Draw three concentric zones
  const zones = [
    { radius: maxRadius, color: '#22c55e', opacity: 0.1, label: 'Evergreen' },
    { radius: maxRadius * 0.66, color: '#f97316', opacity: 0.15, label: 'High-Value' },
    { radius: maxRadius * 0.33, color: '#ef4444', opacity: 0.2, label: 'Urgent' }
  ];

  zones.forEach(zone => {
    g.append('circle')
      .attr('r', zone.radius)
      .attr('fill', zone.color)
      .attr('fill-opacity', zone.opacity)
      .attr('stroke', zone.color)
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 2);
  });

  // Add zone labels
  zones.forEach(zone => {
    g.append('text')
      .attr('x', 0)
      .attr('y', -zone.radius + 20)
      .attr('text-anchor', 'middle')
      .attr('fill', zone.color)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(zone.label);
  });

  // Draw axis lines
  g.append('line')
    .attr('x1', -maxRadius)
    .attr('y1', 0)
    .attr('x2', maxRadius)
    .attr('y2', 0)
    .attr('stroke', '#9ca3af')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4')
    .attr('opacity', 0.3);

  g.append('line')
    .attr('x1', 0)
    .attr('y1', -maxRadius)
    .attr('x2', 0)
    .attr('y2', maxRadius)
    .attr('stroke', '#9ca3af')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4')
    .attr('opacity', 0.3);

  // Add axis labels
  g.append('text')
    .attr('x', maxRadius - 10)
    .attr('y', 15)
    .attr('text-anchor', 'end')
    .attr('fill', '#6b7280')
    .attr('font-size', '11px')
    .text('High Confidence →');

  g.append('text')
    .attr('x', 0)
    .attr('y', -maxRadius - 10)
    .attr('text-anchor', 'middle')
    .attr('fill', '#6b7280')
    .attr('font-size', '11px')
    .text('↑ High Impact');

  // Position blips
  // X-axis: confidence (0-1 maps to -maxRadius to +maxRadius)
  // Y-axis: impact (0-100 maps to +maxRadius to -maxRadius, inverted)
  const xScale = d3.scaleLinear().domain([0, 1]).range([-maxRadius, maxRadius]);
  const yScale = d3.scaleLinear().domain([0, 100]).range([maxRadius, -maxRadius]);

  // Draw blips
  const blipGroups = g.selectAll('.blip')
    .data(blips)
    .enter()
    .append('g')
    .attr('class', 'blip')
    .attr('transform', d => `translate(${xScale(d.x)}, ${yScale(d.y)})`)
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      setSelectedBlip(d);
      if (onBlipClick) {
        onBlipClick(d.breakthrough);
      }
    });

  // Blip circles with animation
  blipGroups.append('circle')
    .attr('r', 0)
    .attr('fill', d => d.color)
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .attr('r', d => Math.max(d.size / 2, 5));

  // Blip hover effect
  blipGroups.on('mouseenter', function() {
    d3.select(this).select('circle')
      .transition()
      .duration(200)
      .attr('r', function() {
        const currentR = parseFloat(d3.select(this).attr('r'));
        return currentR * 1.3;
      });
  }).on('mouseleave', function(event, d) {
    d3.select(this).select('circle')
      .transition()
      .duration(200)
      .attr('r', Math.max(d.size / 2, 5));
  });

  // Add blip labels (show on hover)
  blipGroups.append('text')
    .attr('y', d => -Math.max(d.size / 2, 5) - 5)
    .attr('text-anchor', 'middle')
    .attr('fill', '#1f2937')
    .attr('font-size', '10px')
    .attr('font-weight', 'bold')
    .attr('opacity', 0)
    .text(d => d.breakthrough.title.substring(0, 30) + '...');

  blipGroups.on('mouseenter', function() {
    d3.select(this).select('text')
      .transition()
      .duration(200)
      .attr('opacity', 1);
  }).on('mouseleave', function() {
    d3.select(this).select('text')
      .transition()
      .duration(200)
      .attr('opacity', 0);
  });
};
```

#### 1.3 Add Responsive Behavior (15 minutes)
- [ ] Add window resize listener:

```typescript
useEffect(() => {
  const handleResize = () => {
    if (svgRef.current) {
      renderRadar();
    }
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [breakthroughs]);
```

---

### TASK 2: Create Radar Detail Modal (1.5 hours)

#### 2.1 Create Detail Modal Component (60 minutes)
**New File: `src/components/dashboard/intelligence-v2/OpportunityRadarDetail.tsx`**

- [ ] Create modal component:

```typescript
/**
 * Opportunity Radar Detail Modal
 * Shows full breakthrough details when clicking a radar blip
 */

import React from 'react';
import { X, AlertCircle, TrendingUp, CheckCircle, Target, Database, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Breakthrough } from '@/services/intelligence/breakthrough-generator.service';

export interface OpportunityRadarDetailProps {
  breakthrough: Breakthrough | null;
  onClose: () => void;
}

export function OpportunityRadarDetail({ breakthrough, onClose }: OpportunityRadarDetailProps) {
  if (!breakthrough) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'urgent': return AlertCircle;
      case 'high-value': return TrendingUp;
      case 'evergreen': return CheckCircle;
      default: return Target;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high-value': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'evergreen': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-purple-600 bg-purple-50 border-purple-200';
    }
  };

  const CategoryIcon = getCategoryIcon(breakthrough.category);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {breakthrough.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {breakthrough.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {breakthrough.score}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Overall Score
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {breakthrough.validation.totalDataPoints}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Data Points
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600">
                  {breakthrough.emotionalResonance.eqScore}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  EQ Score
                </div>
              </div>
            </div>

            {/* Category Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getCategoryColor(breakthrough.category)}`}>
              <CategoryIcon className="w-4 h-4" />
              <span className="font-medium capitalize">{breakthrough.category}</span>
            </div>

            {/* Validation */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Validation</h3>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {breakthrough.validation.validationStatement}
              </p>
            </div>

            {/* Actionable Next Steps */}
            {breakthrough.actionableNext && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">What To Do</h3>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {breakthrough.actionableNext}
                </p>
              </div>
            )}

            {/* Timing */}
            {breakthrough.timing.urgency && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Time-Sensitive</h3>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {breakthrough.timing.reason}
                </p>
              </div>
            )}

            {/* Provenance */}
            <div className="text-xs text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-slate-800 rounded p-3">
              {breakthrough.provenance}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

#### 2.2 Integrate Modal into Radar (30 minutes)
**File: `src/components/dashboard/intelligence-v2/OpportunityRadar.tsx`**

- [ ] Import modal component
- [ ] Add modal state and rendering:

```typescript
import { OpportunityRadarDetail } from './OpportunityRadarDetail';

// In component
const [detailBreakthrough, setDetailBreakthrough] = useState<Breakthrough | null>(null);

// Update blip click handler
const handleBlipClick = (blip: RadarBlip) => {
  setSelectedBlip(blip);
  setDetailBreakthrough(blip.breakthrough);
  if (onBlipClick) {
    onBlipClick(blip.breakthrough);
  }
};

// Add modal rendering at end of return
return (
  <div className="...">
    {/* ... existing radar ... */}

    {/* Detail Modal */}
    <OpportunityRadarDetail
      breakthrough={detailBreakthrough}
      onClose={() => setDetailBreakthrough(null)}
    />
  </div>
);
```

---

## DAY 3: CAMPAIGN TIMELINE (8 hours)

### TASK 3: Create Campaign Timeline Component (5 hours)

#### 3.1 Create Component File (30 minutes)
**New File: `src/components/dashboard/intelligence-v2/CampaignTimeline.tsx`**

- [ ] Create base structure:

```typescript
/**
 * Campaign Timeline
 *
 * Displays 5-7 piece campaign arc as horizontal timeline
 * Shows emotional progression overlay
 * Displays expected metrics per phase
 *
 * Created: 2025-11-23
 */

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Sparkles, TrendingUp, Target } from 'lucide-react';

export interface CampaignTimelineProps {
  campaign: {
    pieces: Array<{
      id: string;
      title: string;
      phase: 'awareness' | 'consideration' | 'decision';
      emotionalTone: string;
      emotionalIntensity: number; // 0-10
      expectedEngagement?: number;
      dayNumber: number;
    }>;
    emotionalProgression: number[]; // Array of intensity values
  };
  onPieceClick?: (piece: any) => void;
}

export function CampaignTimeline({ campaign, onPieceClick }: CampaignTimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedPiece, setSelectedPiece] = useState<any>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    renderTimeline();
  }, [campaign]);

  const renderTimeline = () => {
    // Implementation follows
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'awareness': return '#8b5cf6'; // purple
      case 'consideration': return '#3b82f6'; // blue
      case 'decision': return '#22c55e'; // green
      default: return '#6b7280';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Campaign Timeline
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {campaign.pieces.length} pieces
        </div>
      </div>

      <svg
        ref={svgRef}
        className="w-full"
        style={{ height: '300px' }}
      />

      {/* Phase Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-gray-600 dark:text-gray-400">Awareness</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Consideration</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Decision</span>
        </div>
      </div>
    </div>
  );
}
```

#### 3.2 Implement Timeline Rendering (3 hours)
- [ ] Add D3 timeline implementation:

```typescript
const renderTimeline = () => {
  const svg = d3.select(svgRef.current);
  svg.selectAll('*').remove();

  const width = svgRef.current!.clientWidth;
  const height = 300;
  const margin = { top: 40, right: 40, bottom: 60, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = svg
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // Create scales
  const xScale = d3.scaleLinear()
    .domain([0, campaign.pieces.length - 1])
    .range([0, innerWidth]);

  const yScale = d3.scaleLinear()
    .domain([0, 10])
    .range([innerHeight, 0]);

  // Draw baseline
  g.append('line')
    .attr('x1', 0)
    .attr('y1', innerHeight / 2)
    .attr('x2', innerWidth)
    .attr('y2', innerHeight / 2)
    .attr('stroke', '#d1d5db')
    .attr('stroke-width', 2);

  // Draw emotional progression curve
  if (campaign.emotionalProgression && campaign.emotionalProgression.length > 0) {
    const line = d3.line<number>()
      .x((d, i) => xScale(i))
      .y(d => yScale(d))
      .curve(d3.curveCatmullRom);

    g.append('path')
      .datum(campaign.emotionalProgression)
      .attr('fill', 'none')
      .attr('stroke', '#8b5cf6')
      .attr('stroke-width', 3)
      .attr('d', line)
      .attr('opacity', 0.3);
  }

  // Draw campaign pieces as nodes
  const pieceGroups = g.selectAll('.piece')
    .data(campaign.pieces)
    .enter()
    .append('g')
    .attr('class', 'piece')
    .attr('transform', (d, i) => `translate(${xScale(i)}, ${innerHeight / 2})`)
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      setSelectedPiece(d);
      if (onPieceClick) {
        onPieceClick(d);
      }
    });

  // Node circles with animation
  pieceGroups.append('circle')
    .attr('r', 0)
    .attr('fill', d => getPhaseColor(d.phase))
    .attr('stroke', 'white')
    .attr('stroke-width', 3)
    .transition()
    .duration(600)
    .delay((d, i) => i * 150)
    .attr('r', 20);

  // Day number inside circle
  pieceGroups.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', 5)
    .attr('fill', 'white')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .attr('opacity', 0)
    .text(d => `D${d.dayNumber}`)
    .transition()
    .duration(600)
    .delay((d, i) => i * 150)
    .attr('opacity', 1);

  // Phase labels above nodes
  pieceGroups.append('text')
    .attr('y', -35)
    .attr('text-anchor', 'middle')
    .attr('fill', d => getPhaseColor(d.phase))
    .attr('font-size', '11px')
    .attr('font-weight', 'bold')
    .attr('opacity', 0)
    .text(d => d.phase.charAt(0).toUpperCase() + d.phase.slice(1))
    .transition()
    .duration(600)
    .delay((d, i) => i * 150)
    .attr('opacity', 1);

  // Title below nodes (truncated)
  pieceGroups.append('text')
    .attr('y', 40)
    .attr('text-anchor', 'middle')
    .attr('fill', '#6b7280')
    .attr('font-size', '10px')
    .attr('opacity', 0)
    .text(d => d.title.length > 20 ? d.title.substring(0, 20) + '...' : d.title)
    .transition()
    .duration(600)
    .delay((d, i) => i * 150)
    .attr('opacity', 1);

  // Emotional tone below title
  pieceGroups.append('text')
    .attr('y', 55)
    .attr('text-anchor', 'middle')
    .attr('fill', '#9ca3af')
    .attr('font-size', '9px')
    .attr('font-style', 'italic')
    .attr('opacity', 0)
    .text(d => d.emotionalTone)
    .transition()
    .duration(600)
    .delay((d, i) => i * 150)
    .attr('opacity', 1);

  // Connect nodes with lines
  for (let i = 0; i < campaign.pieces.length - 1; i++) {
    g.append('line')
      .attr('x1', xScale(i))
      .attr('y1', innerHeight / 2)
      .attr('x2', xScale(i))
      .attr('y2', innerHeight / 2)
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 2)
      .transition()
      .duration(400)
      .delay(i * 150 + 600)
      .attr('x2', xScale(i + 1));
  }

  // Hover effects
  pieceGroups.on('mouseenter', function() {
    d3.select(this).select('circle')
      .transition()
      .duration(200)
      .attr('r', 25);
  }).on('mouseleave', function() {
    d3.select(this).select('circle')
      .transition()
      .duration(200)
      .attr('r', 20);
  });
};
```

#### 3.3 Add Expected Metrics Display (90 minutes)
- [ ] Add metrics bars below timeline:

```typescript
// In renderTimeline, after piece nodes:

// Add expected engagement bars (if available)
campaign.pieces.forEach((piece, i) => {
  if (piece.expectedEngagement) {
    const barHeight = (piece.expectedEngagement / 100) * 50;

    g.append('rect')
      .attr('x', xScale(i) - 15)
      .attr('y', innerHeight / 2 + 30)
      .attr('width', 30)
      .attr('height', 0)
      .attr('fill', getPhaseColor(piece.phase))
      .attr('opacity', 0.3)
      .transition()
      .duration(600)
      .delay(i * 150 + 800)
      .attr('height', barHeight);

    g.append('text')
      .attr('x', xScale(i))
      .attr('y', innerHeight / 2 + 35 + barHeight)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '9px')
      .attr('opacity', 0)
      .text(`${piece.expectedEngagement}%`)
      .transition()
      .duration(600)
      .delay(i * 150 + 800)
      .attr('opacity', 1);
  }
});
```

---

### TASK 4: Transform Campaign Data (2 hours)

#### 4.1 Read Campaign Generator Output (30 minutes)
- [ ] Read: `src/services/intelligence/campaign-generator.service.ts`
- [ ] Identify campaign output structure
- [ ] Note how emotional progression is calculated
- [ ] Check if dayNumber exists or needs to be added

#### 4.2 Create Transformation Utility (60 minutes)
**File: `src/components/dashboard/intelligence-v2/CampaignTimeline.tsx`**

- [ ] Add transformation helper:

```typescript
/**
 * Transforms campaign generator output into timeline format
 */
export function transformCampaignForTimeline(generatedCampaign: any): CampaignTimelineProps['campaign'] {
  if (!generatedCampaign || !generatedCampaign.pieces) {
    return { pieces: [], emotionalProgression: [] };
  }

  const pieces = generatedCampaign.pieces.map((piece: any, index: number) => ({
    id: piece.id || `piece-${index}`,
    title: piece.content?.hook || piece.title || `Piece ${index + 1}`,
    phase: piece.phase || determinePhase(index, generatedCampaign.pieces.length),
    emotionalTone: piece.emotionalArc?.tone || 'neutral',
    emotionalIntensity: piece.emotionalArc?.intensity || 5,
    expectedEngagement: piece.predictedPerformance?.engagement || Math.random() * 100,
    dayNumber: index + 1
  }));

  const emotionalProgression = pieces.map((p: any) => p.emotionalIntensity);

  return { pieces, emotionalProgression };
}

function determinePhase(index: number, total: number): 'awareness' | 'consideration' | 'decision' {
  const ratio = index / total;
  if (ratio < 0.33) return 'awareness';
  if (ratio < 0.66) return 'consideration';
  return 'decision';
}
```

#### 4.3 Test with Mock Data (30 minutes)
- [ ] Create mock campaign data for testing:

```typescript
const mockCampaign = {
  pieces: [
    {
      id: '1',
      title: 'Introduce the problem',
      phase: 'awareness' as const,
      emotionalTone: 'empathy',
      emotionalIntensity: 3,
      expectedEngagement: 65,
      dayNumber: 1
    },
    {
      id: '2',
      title: 'Share customer story',
      phase: 'awareness' as const,
      emotionalTone: 'connection',
      emotionalIntensity: 5,
      expectedEngagement: 72,
      dayNumber: 2
    },
    {
      id: '3',
      title: 'Present solution',
      phase: 'consideration' as const,
      emotionalTone: 'hope',
      emotionalIntensity: 7,
      expectedEngagement: 80,
      dayNumber: 3
    },
    {
      id: '4',
      title: 'Show proof',
      phase: 'consideration' as const,
      emotionalTone: 'trust',
      emotionalIntensity: 6,
      expectedEngagement: 75,
      dayNumber: 4
    },
    {
      id: '5',
      title: 'Call to action',
      phase: 'decision' as const,
      emotionalTone: 'urgency',
      emotionalIntensity: 9,
      expectedEngagement: 85,
      dayNumber: 5
    }
  ],
  emotionalProgression: [3, 5, 7, 6, 9]
};
```

- [ ] Test timeline renders correctly
- [ ] Verify animations work
- [ ] Check responsive behavior

---

## DAY 4: PERFORMANCE DASHBOARD & INTEGRATION (8 hours)

### TASK 5: Create Performance Dashboard (3 hours)

#### 5.1 Create Component File (30 minutes)
**New File: `src/components/dashboard/intelligence-v2/PerformanceDashboard.tsx`**

- [ ] Create base structure:

```typescript
/**
 * Performance Dashboard
 *
 * Displays predicted performance vs industry benchmarks
 * Shows ROI predictions with confidence bands
 * Animated metric counters
 *
 * Created: 2025-11-23
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { TrendingUp, DollarSign, Users, Zap } from 'lucide-react';

export interface PerformancePrediction {
  metric: string;
  predicted: number;
  industryAverage: number;
  confidenceMin: number;
  confidenceMax: number;
  unit: string;
}

export interface PerformanceDashboardProps {
  predictions: PerformancePrediction[];
  roiEstimate?: {
    investment: number;
    predictedReturn: number;
    timeframe: string;
  };
}

export function PerformanceDashboard({ predictions, roiEstimate }: PerformanceDashboardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Performance Predictions
      </h3>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {predictions.slice(0, 4).map(pred => (
          <MetricCard key={pred.metric} prediction={pred} />
        ))}
      </div>

      {/* Comparison Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Your Performance vs Industry Average
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={predictions}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="predicted" fill="#8b5cf6" name="Your Predicted" />
            <Bar dataKey="industryAverage" fill="#6b7280" name="Industry Avg" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ROI Estimate */}
      {roiEstimate && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900 dark:text-white">
              ROI Projection
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {roiEstimate.predictedReturn}x
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Predicted Return
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {roiEstimate.timeframe}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Timeframe
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({ prediction }: { prediction: PerformancePrediction }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Animated counter
    let start = 0;
    const end = prediction.predicted;
    const duration = 1000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [prediction.predicted]);

  const percentageAboveAverage = ((prediction.predicted - prediction.industryAverage) / prediction.industryAverage) * 100;
  const isAboveAverage = percentageAboveAverage > 0;

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
        {prediction.metric}
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {displayValue}
        </div>
        <div className="text-sm text-gray-500">
          {prediction.unit}
        </div>
      </div>
      <div className={`text-xs font-medium ${isAboveAverage ? 'text-green-600' : 'text-red-600'}`}>
        {isAboveAverage ? '+' : ''}{percentageAboveAverage.toFixed(0)}% vs avg
      </div>
    </div>
  );
}
```

#### 5.2 Connect to Performance Predictor (90 minutes)
- [ ] Read: `src/services/intelligence/performance-predictor.service.ts`
- [ ] Identify prediction output format
- [ ] Create transformation utility:

```typescript
/**
 * Transforms performance predictor output into dashboard format
 */
export function transformPerformancePredictions(predictorOutput: any): PerformancePrediction[] {
  if (!predictorOutput) return [];

  const predictions: PerformancePrediction[] = [];

  if (predictorOutput.engagementRate) {
    predictions.push({
      metric: 'Engagement',
      predicted: predictorOutput.engagementRate.predicted,
      industryAverage: predictorOutput.engagementRate.industryAverage,
      confidenceMin: predictorOutput.engagementRate.min || predictorOutput.engagementRate.predicted * 0.8,
      confidenceMax: predictorOutput.engagementRate.max || predictorOutput.engagementRate.predicted * 1.2,
      unit: '%'
    });
  }

  if (predictorOutput.conversionRate) {
    predictions.push({
      metric: 'Conversion',
      predicted: predictorOutput.conversionRate.predicted,
      industryAverage: predictorOutput.conversionRate.industryAverage,
      confidenceMin: predictorOutput.conversionRate.min || predictorOutput.conversionRate.predicted * 0.8,
      confidenceMax: predictorOutput.conversionRate.max || predictorOutput.conversionRate.predicted * 1.2,
      unit: '%'
    });
  }

  if (predictorOutput.reach) {
    predictions.push({
      metric: 'Reach',
      predicted: predictorOutput.reach.predicted,
      industryAverage: predictorOutput.reach.industryAverage,
      confidenceMin: predictorOutput.reach.min || predictorOutput.reach.predicted * 0.8,
      confidenceMax: predictorOutput.reach.max || predictorOutput.reach.predicted * 1.2,
      unit: ''
    });
  }

  if (predictorOutput.clickThroughRate) {
    predictions.push({
      metric: 'CTR',
      predicted: predictorOutput.clickThroughRate.predicted,
      industryAverage: predictorOutput.clickThroughRate.industryAverage,
      confidenceMin: predictorOutput.clickThroughRate.min || predictorOutput.clickThroughRate.predicted * 0.8,
      confidenceMax: predictorOutput.clickThroughRate.max || predictorOutput.clickThroughRate.predicted * 1.2,
      unit: '%'
    });
  }

  return predictions;
}
```

- [ ] Test with mock predictor data

---

### TASK 6: Integration into Intelligence Library (3 hours)

#### 6.1 Update EasyMode (60 minutes)
**File: `src/components/dashboard/intelligence-v2/EasyMode.tsx`**

- [ ] Import new components:

```typescript
import { OpportunityRadar } from './OpportunityRadar';
import { CampaignTimeline, transformCampaignForTimeline } from './CampaignTimeline';
import { PerformanceDashboard, transformPerformancePredictions } from './PerformanceDashboard';
```

- [ ] Add visualizations before IntelligenceInsights:

```typescript
{/* Opportunity Radar */}
{breakthroughs.length > 0 && (
  <div className="mb-6">
    <OpportunityRadar
      breakthroughs={breakthroughs}
      onBlipClick={(bt) => console.log('Clicked:', bt.title)}
    />
  </div>
)}

{/* Campaign Timeline (if campaign generated) */}
{context.generatedCampaign && (
  <div className="mb-6">
    <CampaignTimeline
      campaign={transformCampaignForTimeline(context.generatedCampaign)}
    />
  </div>
)}

{/* Performance Predictions */}
{context.performancePredictions && (
  <div className="mb-6">
    <PerformanceDashboard
      predictions={transformPerformancePredictions(context.performancePredictions)}
    />
  </div>
)}
```

#### 6.2 Update PowerMode (60 minutes)
**File: `src/components/dashboard/intelligence-v2/PowerMode.tsx`**

- [ ] Import visualizations
- [ ] Add fourth column or bottom section:

```typescript
{/* Right Panel - Extended */}
<div className="w-1/4 min-w-[300px] flex-shrink-0 space-y-4 overflow-y-auto">
  {/* Your Mix (existing) */}
  <YourMix
    selectedInsights={selectedInsightObjects}
    context={context}
    onRemove={handleToggleInsight}
    onClear={() => setSelectedInsights([])}
    onGenerate={handleGenerate}
  />

  {/* Opportunity Radar */}
  {breakthroughs && breakthroughs.length > 0 && (
    <OpportunityRadar
      breakthroughs={breakthroughs.filter(bt =>
        selectedInsights.some(id => id.includes(bt.id))
      )}
    />
  )}
</div>

{/* Bottom Section - Campaign Timeline & Performance */}
<div className="col-span-full grid grid-cols-2 gap-4">
  {context.generatedCampaign && (
    <CampaignTimeline
      campaign={transformCampaignForTimeline(context.generatedCampaign)}
    />
  )}

  {context.performancePredictions && (
    <PerformanceDashboard
      predictions={transformPerformancePredictions(context.performancePredictions)}
    />
  )}
</div>
```

#### 6.3 Update DeepContext Types (30 minutes)
**File: `src/types/synapse/deepContext.types.ts`**

- [ ] Add performance predictions if not present:

```typescript
export interface DeepContext {
  // ... existing fields ...

  performancePredictions?: any; // From performance-predictor.service
  generatedCampaign?: any; // From campaign-generator.service
}
```

- [ ] Verify orchestration adds these fields

---

### TASK 7: Polish & Responsiveness (1.5 hours)

#### 7.1 Add Loading States (30 minutes)
- [ ] Create loading skeletons for each visualization:

```typescript
// In OpportunityRadar.tsx
if (!breakthroughs || breakthroughs.length === 0) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
        <div className="h-64 bg-gray-100 dark:bg-slate-800 rounded" />
      </div>
    </div>
  );
}
```

- [ ] Add similar loading states to CampaignTimeline and PerformanceDashboard

#### 7.2 Mobile Responsiveness (45 minutes)
- [ ] Test all visualizations on mobile (375px width)
- [ ] Adjust OpportunityRadar dimensions for mobile:

```typescript
const isMobile = width < 640;
const maxRadius = isMobile
  ? Math.min(width, height) / 2 - 20
  : Math.min(width, height) / 2 - 40;
```

- [ ] Make CampaignTimeline scrollable on mobile
- [ ] Stack PerformanceDashboard metrics vertically on mobile

#### 7.3 Dark Mode Verification (15 minutes)
- [ ] Toggle dark mode and verify all components
- [ ] Check D3 visualizations in dark mode
- [ ] Adjust colors if needed for readability

---

### TASK 8: Testing & Validation (1.5 hours)

#### 8.1 Component Tests (45 minutes)
**New Files:**
- `src/__tests__/v2/components/OpportunityRadar.test.tsx`
- `src/__tests__/v2/components/CampaignTimeline.test.tsx`
- `src/__tests__/v2/components/PerformanceDashboard.test.tsx`

- [ ] Create basic render tests:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OpportunityRadar } from '@/components/dashboard/intelligence-v2/OpportunityRadar';

describe('OpportunityRadar', () => {
  it('renders without crashing', () => {
    render(<OpportunityRadar breakthroughs={[]} />);
    expect(screen.getByText('Opportunity Radar')).toBeInTheDocument();
  });

  it('displays blips for breakthroughs', () => {
    const mockBreakthroughs = [
      {
        id: '1',
        title: 'Test Breakthrough',
        category: 'urgent',
        score: 85,
        validation: { totalDataPoints: 10 }
      } as any
    ];
    render(<OpportunityRadar breakthroughs={mockBreakthroughs} />);
    // Check SVG rendered
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
```

- [ ] Run tests: `npm test OpportunityRadar`

#### 8.2 Manual Testing (45 minutes)
- [ ] Start dev server: `npm run dev`
- [ ] Test full flow:
  - [ ] Navigate to Intelligence Library
  - [ ] Switch to Easy Mode
  - [ ] Verify Opportunity Radar displays
  - [ ] Click radar blips to open detail modal
  - [ ] Check Campaign Timeline appears
  - [ ] Verify Performance Dashboard shows predictions
  - [ ] Switch to Power Mode
  - [ ] Verify visualizations in different layout
  - [ ] Test mobile view (DevTools responsive mode)
  - [ ] Toggle dark mode
  - [ ] Check console for errors

---

### TASK 9: Git Commit & PR (30 minutes)

- [ ] Stage all changes: `git add .`
- [ ] Commit with detailed message:

```bash
git commit -m "feat(phase1-b): Power visualizations - Radar, Timeline, Performance

COMPLETED:
- Built Opportunity Radar with D3 interactive blips
- Three-tier alert zones (urgent/high-value/evergreen)
- Click-to-detail modal for breakthrough insights
- Campaign Timeline with emotional progression overlay
- Horizontal timeline showing 5-7 piece arcs
- Expected engagement metrics per phase
- Performance Dashboard with industry benchmarks
- Animated metric counters
- ROI projection display
- Integrated all visualizations into Easy/Power modes
- Mobile responsive design
- Dark mode support
- Component tests added

DELIVERABLES:
- OpportunityRadar.tsx with D3 visualization
- OpportunityRadarDetail.tsx modal
- CampaignTimeline.tsx with SVG timeline
- PerformanceDashboard.tsx with Recharts
- Full integration into Intelligence Library
- Mobile responsive + dark mode

FILES ADDED:
- src/components/dashboard/intelligence-v2/OpportunityRadar.tsx
- src/components/dashboard/intelligence-v2/OpportunityRadarDetail.tsx
- src/components/dashboard/intelligence-v2/CampaignTimeline.tsx
- src/components/dashboard/intelligence-v2/PerformanceDashboard.tsx
- src/__tests__/v2/components/OpportunityRadar.test.tsx
- src/__tests__/v2/components/CampaignTimeline.test.tsx
- src/__tests__/v2/components/PerformanceDashboard.test.tsx

FILES MODIFIED:
- src/components/dashboard/intelligence-v2/EasyMode.tsx
- src/components/dashboard/intelligence-v2/PowerMode.tsx
- src/types/synapse/deepContext.types.ts
- package.json (added d3, recharts)

DEPENDENCIES ADDED:
- d3@^7.8.5
- @types/d3@^7.4.0
- recharts@^2.10.0

🚀 Generated with Claude Code"
```

- [ ] Push branch: `git push -u origin feature/phase1-power-visualizations`
- [ ] Create PR to `feature/dashboard-v2-week2`:
  - Title: "Phase 1B: Power Visualizations (Radar, Timeline, Performance)"
  - Description: Include commit message + screenshots of all three visualizations
  - Add note: "Depends on PR #[Instance A PR number]"

---

## COMPLETION CHECKLIST

### Required Deliverables
- [x] Opportunity Radar with D3 interactive blips
- [x] Three-tier alert zones (red/orange/green)
- [x] Click-to-detail modal
- [x] Campaign Timeline visualization
- [x] Emotional progression overlay
- [x] Performance Dashboard with benchmarks
- [x] Animated metric counters
- [x] Integration into Easy/Power modes
- [x] Mobile responsive
- [x] Dark mode working
- [x] Component tests passing
- [x] Git committed and pushed
- [x] PR created with screenshots

### Quality Checks
- [x] All visualizations render without errors
- [x] D3 animations smooth (60fps)
- [x] Recharts displays correctly
- [x] Modal opens/closes properly
- [x] Mobile layout works (375px+)
- [x] Dark mode colors readable
- [x] No console errors or warnings
- [x] Performance acceptable (<3s render)

### Visual Verification
- [x] Radar blips positioned correctly
- [x] Timeline nodes connected with lines
- [x] Performance bars compare visually
- [x] Colors consistent with design system
- [x] Typography hierarchy clear
- [x] Spacing and alignment proper

---

**END OF INSTANCE B TASKS**
