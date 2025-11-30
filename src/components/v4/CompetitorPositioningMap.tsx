/**
 * CompetitorPositioningMap Component
 *
 * Phase 3 - Gap Tab 2.0
 * Interactive 2x2 scatter plot showing competitive landscape positioning.
 * Features segment-aware axes, interactive tooltips, and your brand highlighting.
 *
 * Created: 2025-11-28
 */

import React, { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Label
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import type { PositioningMapData, PositioningDataPoint } from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

interface CompetitorPositioningMapProps {
  data: PositioningMapData;
  onCompetitorClick?: (competitorId: string) => void;
  onCompetitorHover?: (competitorId: string | null) => void;
  selectedCompetitorId?: string | null;
  height?: number;
  showQuadrantLabels?: boolean;
  showYourBrand?: boolean;
  className?: string;
}

interface TooltipPayload {
  payload: PositioningDataPoint;
}

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipPayload[];
}> = ({ active, payload }) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl max-w-xs"
    >
      <div className="flex items-center gap-2 mb-2">
        {data.logoUrl ? (
          <img
            src={data.logoUrl}
            alt={data.name}
            className="w-6 h-6 rounded object-cover"
          />
        ) : (
          <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
            data.isYourBrand ? 'bg-blue-500' : 'bg-zinc-700'
          }`}>
            {data.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className={`font-semibold ${data.isYourBrand ? 'text-blue-400' : 'text-white'}`}>
          {data.name}
          {data.isYourBrand && <span className="ml-1 text-xs">(You)</span>}
        </span>
      </div>

      {data.positioningSummary && (
        <p className="text-xs text-zinc-400 mb-2 line-clamp-2">
          {data.positioningSummary}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-zinc-500">Price Tier:</span>
          <span className="ml-1 text-zinc-300 capitalize">{data.priceTier}</span>
        </div>
        <div>
          <span className="text-zinc-500">Complexity:</span>
          <span className="ml-1 text-zinc-300 capitalize">{data.complexityLevel}</span>
        </div>
      </div>

      {!data.isYourBrand && data.gapCount > 0 && (
        <div className="mt-2 pt-2 border-t border-zinc-700">
          <span className="text-amber-400 text-xs font-medium">
            {data.gapCount} gap{data.gapCount !== 1 ? 's' : ''} identified
          </span>
        </div>
      )}

      {data.keyDifferentiators && data.keyDifferentiators.length > 0 && (
        <div className="mt-2 pt-2 border-t border-zinc-700">
          <span className="text-zinc-500 text-xs block mb-1">Key Claims:</span>
          <ul className="text-xs text-zinc-400 list-disc list-inside">
            {data.keyDifferentiators.slice(0, 3).map((diff, i) => (
              <li key={i} className="truncate">{diff}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
        <span>Confidence:</span>
        <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${data.confidence * 100}%` }}
          />
        </div>
        <span>{Math.round(data.confidence * 100)}%</span>
      </div>
    </motion.div>
  );
};

// ============================================================================
// CUSTOM DOT COMPONENT
// ============================================================================

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: PositioningDataPoint;
  isSelected?: boolean;
  onClick?: (id: string) => void;
  onHover?: (id: string | null) => void;
}

const CustomDot: React.FC<CustomDotProps> = ({
  cx = 0,
  cy = 0,
  payload,
  isSelected,
  onClick,
  onHover
}) => {
  if (!payload) return null;

  const baseSize = payload.isYourBrand ? 14 : 10;
  const selectedSize = baseSize + 4;
  const size = isSelected ? selectedSize : baseSize;

  const getColor = () => {
    if (payload.isYourBrand) return '#3b82f6'; // Blue for your brand
    if (payload.gapCount >= 5) return '#ef4444'; // Red for many gaps
    if (payload.gapCount >= 3) return '#f59e0b'; // Amber for some gaps
    if (payload.gapCount >= 1) return '#eab308'; // Yellow for few gaps
    return '#6b7280'; // Gray for no gaps
  };

  return (
    <g
      transform={`translate(${cx},${cy})`}
      style={{ cursor: 'pointer' }}
      onClick={() => onClick?.(payload.id)}
      onMouseEnter={() => onHover?.(payload.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Glow effect for selected or your brand */}
      {(isSelected || payload.isYourBrand) && (
        <circle
          r={size + 4}
          fill={getColor()}
          opacity={0.2}
        />
      )}
      {/* Main circle */}
      <circle
        r={size}
        fill={getColor()}
        stroke={payload.isYourBrand ? '#1d4ed8' : 'transparent'}
        strokeWidth={payload.isYourBrand ? 3 : 0}
      />
      {/* Logo or initial */}
      {payload.logoUrl ? (
        <clipPath id={`clip-${payload.id}`}>
          <circle r={size - 2} />
        </clipPath>
      ) : (
        <text
          textAnchor="middle"
          dy=".3em"
          fontSize={size * 0.8}
          fill="white"
          fontWeight="bold"
        >
          {payload.name.charAt(0).toUpperCase()}
        </text>
      )}
      {/* Gap count badge */}
      {!payload.isYourBrand && payload.gapCount > 0 && (
        <g transform={`translate(${size * 0.7}, ${-size * 0.7})`}>
          <circle r={6} fill="#ef4444" />
          <text
            textAnchor="middle"
            dy=".35em"
            fontSize={8}
            fill="white"
            fontWeight="bold"
          >
            {payload.gapCount}
          </text>
        </g>
      )}
    </g>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CompetitorPositioningMap: React.FC<CompetitorPositioningMapProps> = ({
  data,
  onCompetitorClick,
  onCompetitorHover,
  selectedCompetitorId,
  height = 400,
  showQuadrantLabels = true,
  showYourBrand = true,
  className = ''
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Combine data points with your brand if showing
  const chartData = useMemo(() => {
    const points = [...data.dataPoints];
    if (showYourBrand && data.yourBrand) {
      points.push(data.yourBrand);
    }
    return points.map(p => ({
      ...p,
      x: p.xValue,
      y: p.yValue
    }));
  }, [data.dataPoints, data.yourBrand, showYourBrand]);

  const handleHover = (id: string | null) => {
    setHoveredId(id);
    onCompetitorHover?.(id);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">Competitive Positioning Map</h3>
          <p className="text-xs text-zinc-500">
            {data.axes.xAxis.label} vs {data.axes.yAxis.label}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-zinc-400">You</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-zinc-400">5+ gaps</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-zinc-400">3-4 gaps</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span className="text-zinc-400">0-2 gaps</span>
          </div>
        </div>
      </div>

      {/* Quadrant labels */}
      {showQuadrantLabels && (
        <div className="absolute inset-0 pointer-events-none" style={{ top: 60 }}>
          <div className="absolute top-4 left-4 text-xs text-zinc-600 font-medium">
            {data.quadrantLabels.topLeft}
          </div>
          <div className="absolute top-4 right-4 text-xs text-zinc-600 font-medium text-right">
            {data.quadrantLabels.topRight}
          </div>
          <div className="absolute bottom-12 left-4 text-xs text-zinc-600 font-medium">
            {data.quadrantLabels.bottomLeft}
          </div>
          <div className="absolute bottom-12 right-4 text-xs text-zinc-600 font-medium text-right">
            {data.quadrantLabels.bottomRight}
          </div>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#27272a"
            strokeOpacity={0.5}
          />

          {/* Center reference lines to create quadrants */}
          <ReferenceLine
            x={50}
            stroke="#3f3f46"
            strokeWidth={1}
            strokeDasharray="5 5"
          />
          <ReferenceLine
            y={50}
            stroke="#3f3f46"
            strokeWidth={1}
            strokeDasharray="5 5"
          />

          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 100]}
            tick={{ fill: '#71717a', fontSize: 10 }}
            tickLine={{ stroke: '#3f3f46' }}
            axisLine={{ stroke: '#3f3f46' }}
          >
            <Label
              value={data.axes.xAxis.label}
              position="bottom"
              offset={10}
              style={{ fill: '#a1a1aa', fontSize: 12 }}
            />
          </XAxis>

          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 100]}
            tick={{ fill: '#71717a', fontSize: 10 }}
            tickLine={{ stroke: '#3f3f46' }}
            axisLine={{ stroke: '#3f3f46' }}
          >
            <Label
              value={data.axes.yAxis.label}
              angle={-90}
              position="left"
              offset={10}
              style={{ fill: '#a1a1aa', fontSize: 12 }}
            />
          </YAxis>

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ strokeDasharray: '3 3', stroke: '#52525b' }}
          />

          <Scatter
            data={chartData}
            shape={(props) => (
              <CustomDot
                {...props}
                isSelected={
                  props.payload?.id === selectedCompetitorId ||
                  props.payload?.id === hoveredId
                }
                onClick={onCompetitorClick}
                onHover={handleHover}
              />
            )}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Axis labels at corners */}
      <div className="flex justify-between text-xs text-zinc-500 mt-1 px-10">
        <span>{data.axes.xAxis.lowLabel}</span>
        <span>{data.axes.xAxis.highLabel}</span>
      </div>
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 flex flex-col justify-between h-[calc(100%-120px)] text-xs text-zinc-500">
        <span className="transform -rotate-90 origin-center whitespace-nowrap">
          {data.axes.yAxis.highLabel}
        </span>
        <span className="transform -rotate-90 origin-center whitespace-nowrap">
          {data.axes.yAxis.lowLabel}
        </span>
      </div>

      {/* Empty state */}
      {chartData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
          <div className="text-center">
            <p className="text-zinc-400 mb-2">No positioning data available</p>
            <p className="text-zinc-500 text-sm">
              Run competitor discovery to populate the map
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MINI VERSION FOR SIDEBAR
// ============================================================================

interface MiniPositioningMapProps {
  data: PositioningMapData;
  onClick?: () => void;
  className?: string;
}

export const MiniPositioningMap: React.FC<MiniPositioningMapProps> = ({
  data,
  onClick,
  className = ''
}) => {
  const chartData = useMemo(() => {
    const points = [...data.dataPoints];
    if (data.yourBrand) {
      points.push(data.yourBrand);
    }
    return points;
  }, [data.dataPoints, data.yourBrand]);

  return (
    <div
      className={`bg-zinc-900 rounded-lg p-3 cursor-pointer hover:bg-zinc-800 transition-colors ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-white">Positioning</span>
        <span className="text-xs text-zinc-500">{chartData.length} plotted</span>
      </div>

      <div className="relative w-full h-24 bg-zinc-800 rounded border border-zinc-700">
        {/* Quadrant lines */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-700" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-zinc-700" />

        {/* Data points */}
        {chartData.map((point, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full transform -translate-x-1 -translate-y-1 ${
              point.isYourBrand ? 'bg-blue-500' : 'bg-amber-500'
            }`}
            style={{
              left: `${point.xValue}%`,
              bottom: `${point.yValue}%`
            }}
          />
        ))}
      </div>

      <div className="flex justify-between mt-1 text-[10px] text-zinc-600">
        <span>{data.axes.xAxis.lowLabel}</span>
        <span>{data.axes.xAxis.highLabel}</span>
      </div>
    </div>
  );
};

export default CompetitorPositioningMap;
