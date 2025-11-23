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
import { OpportunityRadarDetail } from './OpportunityRadarDetail';

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
  const [detailBreakthrough, setDetailBreakthrough] = useState<Breakthrough | null>(null);

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

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        renderRadar();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakthroughs]);

  const renderRadar = () => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = svgRef.current.clientWidth;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const isMobile = width < 640;
    const maxRadius = isMobile
      ? Math.min(width, height) / 2 - 20
      : Math.min(width, height) / 2 - 40;

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
        setDetailBreakthrough(d.breakthrough);
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

    // Add blip labels (show on hover)
    blipGroups.append('text')
      .attr('y', d => -Math.max(d.size / 2, 5) - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#1f2937')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0)
      .text(d => d.breakthrough.title.substring(0, 30) + '...');

    // Hover effects
    blipGroups.on('mouseenter', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', Math.max(d.size / 2, 5) * 1.3);

      d3.select(this).select('text')
        .transition()
        .duration(200)
        .attr('opacity', 1);
    }).on('mouseleave', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', Math.max(d.size / 2, 5));

      d3.select(this).select('text')
        .transition()
        .duration(200)
        .attr('opacity', 0);
    });
  };

  // Loading state
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

      {/* Detail Modal */}
      <OpportunityRadarDetail
        breakthrough={detailBreakthrough}
        onClose={() => setDetailBreakthrough(null)}
      />
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
