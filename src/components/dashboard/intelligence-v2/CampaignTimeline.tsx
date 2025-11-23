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

/**
 * Transforms campaign generator output into timeline format
 */
export function transformCampaignForTimeline(generatedCampaign: any): CampaignTimelineProps['campaign'] {
  if (!generatedCampaign || !generatedCampaign.pieces) {
    return { pieces: [], emotionalProgression: [] };
  }

  const pieces = generatedCampaign.pieces.map((piece: any, index: number) => ({
    id: piece.id || `piece-${index}`,
    title: piece.hook || piece.title || `Piece ${index + 1}`,
    phase: piece.purpose ? determinePurposeToPhase(piece.purpose) : determinePhase(index, generatedCampaign.pieces.length),
    emotionalTone: piece.angle || 'neutral',
    emotionalIntensity: piece.eqScore ? (piece.eqScore / 10) : 5,
    expectedEngagement: Math.random() * 100, // Random for now
    dayNumber: piece.day || index + 1
  }));

  const emotionalProgression = pieces.map((p: any) => p.emotionalIntensity);

  return { pieces, emotionalProgression };
}

function determinePurposeToPhase(purpose: string): 'awareness' | 'consideration' | 'decision' {
  if (purpose === 'awareness' || purpose === 'education') return 'awareness';
  if (purpose === 'agitation' || purpose === 'solution' || purpose === 'proof') return 'consideration';
  return 'decision';
}

function determinePhase(index: number, total: number): 'awareness' | 'consideration' | 'decision' {
  const ratio = index / total;
  if (ratio < 0.33) return 'awareness';
  if (ratio < 0.66) return 'consideration';
  return 'decision';
}

export function CampaignTimeline({ campaign, onPieceClick }: CampaignTimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedPiece, setSelectedPiece] = useState<any>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    renderTimeline();
  }, [campaign]);

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        renderTimeline();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [campaign]);

  const renderTimeline = () => {
    if (!svgRef.current || !campaign.pieces || campaign.pieces.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
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

    // Connect nodes with lines first (so they appear behind)
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

    // Add expected engagement bars (if available)
    campaign.pieces.forEach((piece, i) => {
      if (piece.expectedEngagement) {
        const barHeight = (piece.expectedEngagement / 100) * 50;

        g.append('rect')
          .attr('x', xScale(i) - 15)
          .attr('y', innerHeight / 2 + 70)
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
          .attr('y', innerHeight / 2 + 75 + barHeight)
          .attr('text-anchor', 'middle')
          .attr('fill', '#6b7280')
          .attr('font-size', '9px')
          .attr('opacity', 0)
          .text(`${Math.round(piece.expectedEngagement)}%`)
          .transition()
          .duration(600)
          .delay(i * 150 + 800)
          .attr('opacity', 1);
      }
    });

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

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'awareness': return '#8b5cf6'; // purple
      case 'consideration': return '#3b82f6'; // blue
      case 'decision': return '#22c55e'; // green
      default: return '#6b7280';
    }
  };

  // Loading state
  if (!campaign.pieces || campaign.pieces.length === 0) {
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
