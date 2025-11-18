/**
 * Transformation Cascade Component (4-Layer System)
 *
 * Displays the 4-layer value proposition cascade:
 * - Layer 1: Surface (Features - what they sell)
 * - Layer 2: Functional (Capabilities - what it does)
 * - Layer 3: Emotional (Feelings - how it feels)
 * - Layer 4: Identity (Transformation - who they become)
 *
 * Waterfall cascade animation with expandable layers
 *
 * Created: 2025-11-18
 * Rewritten: 2025-11-18 for 4-layer VP system
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Zap,
  Heart,
  Crown,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { ConfidenceMeter, type ConfidenceScore } from './ConfidenceMeter';

export interface ValuePropositionLayer {
  level: number; // 1-4
  title: string;
  description: string;
  items: string[];
  gradient: string;
  icon: React.ReactNode;
}

export interface Transformation {
  id: string;
  painPoint: string;
  pleasureGoal: string;
  mechanism: string; // How the transformation happens
  clarity: number; // 0-100
  confidence: ConfidenceScore;
}

interface TransformationCascadeProps {
  layers?: ValuePropositionLayer[];
  currentLayer?: number;
  onLayerClick?: (layer: number) => void;
  animated?: boolean;
  className?: string;
}

/**
 * Default 4-layer structure
 */
const DEFAULT_LAYERS: ValuePropositionLayer[] = [
  {
    level: 1,
    title: 'Surface Level',
    description: 'Features - What they literally sell',
    items: ['Products', 'Services', 'Features'],
    gradient: 'from-blue-500 to-cyan-500',
    icon: <Package className="w-5 h-5" />,
  },
  {
    level: 2,
    title: 'Functional',
    description: 'Capabilities - What it actually does',
    items: ['Outcomes', 'Results', 'Performance'],
    gradient: 'from-cyan-500 to-teal-500',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    level: 3,
    title: 'Emotional',
    description: 'Feelings - How it makes them feel',
    items: ['Confidence', 'Relief', 'Pride'],
    gradient: 'from-purple-500 to-pink-500',
    icon: <Heart className="w-5 h-5" />,
  },
  {
    level: 4,
    title: 'Identity',
    description: 'Transformation - Who they become',
    items: ['Status', 'Belonging', 'Self-image'],
    gradient: 'from-violet-500 to-purple-600',
    icon: <Crown className="w-5 h-5" />,
  },
];

export function TransformationCascade({
  layers = DEFAULT_LAYERS,
  currentLayer,
  onLayerClick,
  animated = true,
  className = '',
}: TransformationCascadeProps) {
  const [expandedLayer, setExpandedLayer] = useState<number | null>(currentLayer || null);

  const handleLayerClick = (level: number) => {
    setExpandedLayer(expandedLayer === level ? null : level);
    onLayerClick?.(level);
  };

  return (
    <div className={`space-y-0.5 ${className}`}>
      {/* Educational Header */}
      <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            4-Layer Value Proposition
          </h3>
          <InfoTooltip
            title="4-Layer Framework"
            content="Most businesses only communicate surface features. Deep value propositions connect at all 4 levels: what you sell → what it does → how it feels → who they become."
          />
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Click each layer to explore deeper levels of value. The deeper you go, the stronger
          the emotional connection.
        </p>
      </div>

      {/* Cascade Layers */}
      <div className="relative">
        {layers.map((layer, index) => {
          const isExpanded = expandedLayer === layer.level;
          const isCurrent = currentLayer === layer.level;

          return (
            <motion.div
              key={layer.level}
              initial={animated ? { opacity: 0, x: -20 } : undefined}
              animate={animated ? { opacity: 1, x: 0 } : undefined}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="relative"
              style={{
                zIndex: 10 - index, // Stack layers properly
              }}
            >
              {/* Layer Card */}
              <motion.button
                onClick={() => handleLayerClick(layer.level)}
                className={`
                  w-full text-left overflow-hidden
                  transition-all duration-300
                  ${isExpanded ? 'mb-4' : 'mb-0.5'}
                  ${isCurrent ? 'ring-2 ring-purple-500 dark:ring-purple-400' : ''}
                `}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {/* Layer Header - Always Visible */}
                <div
                  className={`
                    bg-gradient-to-r ${layer.gradient}
                    p-4 rounded-lg
                    cursor-pointer
                    ${isExpanded ? 'rounded-b-none' : ''}
                  `}
                >
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <motion.div
                        className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"
                        animate={{
                          rotate: isExpanded ? 360 : 0,
                        }}
                        transition={{ duration: 0.4 }}
                      >
                        {layer.icon}
                      </motion.div>

                      {/* Title & Description */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm">
                            Layer {layer.level}: {layer.title}
                          </h4>
                        </div>
                        <p className="text-xs text-white/80 mt-0.5">{layer.description}</p>
                      </div>
                    </div>

                    {/* Expand/Collapse Icon */}
                    <motion.div
                      animate={{
                        rotate: isExpanded ? 90 : 0,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </motion.div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white dark:bg-slate-800 border-2 border-t-0 border-gray-200 dark:border-slate-600 rounded-b-lg p-4">
                        <ul className="space-y-2">
                          {layer.items.map((item, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                            >
                              <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${layer.gradient} mt-1.5 flex-shrink-0`} />
                              <span>{item}</span>
                            </motion.li>
                          ))}
                        </ul>

                        {/* Layer Explanation */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                          <LayerExplanation level={layer.level} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Waterfall Connection Line */}
              {index < layers.length - 1 && !isExpanded && (
                <div className="relative h-0.5 w-full">
                  <motion.div
                    className={`absolute left-8 w-0.5 h-4 bg-gradient-to-b ${layer.gradient}`}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: (index + 1) * 0.1 + 0.2 }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer Tip */}
      <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/10 dark:to-transparent rounded-lg border-l-4 border-purple-500">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-purple-700 dark:text-purple-400">Pro Tip:</span>{' '}
          Most competitors stop at Layer 1. Messaging that reaches Layer 3-4 creates emotional
          loyalty and premium pricing power.
        </p>
      </div>
    </div>
  );
}

/**
 * Layer-specific explanations
 */
function LayerExplanation({ level }: { level: number }) {
  const explanations = {
    1: {
      title: 'Surface Level: The Commodity Zone',
      content:
        "This is where most marketing lives. It's easy to copy and doesn't create loyalty. Customers compare on price here.",
      example: '"We sell premium coffee beans"',
    },
    2: {
      title: 'Functional: The Differentiator',
      content:
        'Tangible outcomes customers can measure. This builds credibility and justifies pricing.',
      example: '"Get cafe-quality espresso at home every morning"',
    },
    3: {
      title: 'Emotional: The Connection',
      content:
        'How customers feel is more powerful than what they get. Emotions drive decisions, logic justifies them.',
      example: '"Start your day feeling like a barista, not just a caffeine addict"',
    },
    4: {
      title: 'Identity: The Transformation',
      content:
        'Who they become or what tribe they join. This creates the strongest loyalty and highest lifetime value.',
      example: '"Join the community of artisan coffee enthusiasts who refuse to settle for mediocre"',
    },
  };

  const exp = explanations[level as keyof typeof explanations];

  return (
    <div className="space-y-2">
      <h5 className="text-xs font-semibold text-gray-900 dark:text-white">{exp.title}</h5>
      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{exp.content}</p>
      {exp.example && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-slate-700/50 rounded border-l-2 border-purple-500">
          <p className="text-xs italic text-gray-700 dark:text-gray-300">{exp.example}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact 4-Layer View - For dashboard/preview
 */
export function CompactCascade({ layers = DEFAULT_LAYERS }: { layers?: ValuePropositionLayer[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {layers.map((layer) => (
        <div
          key={layer.level}
          className={`p-3 rounded-lg bg-gradient-to-br ${layer.gradient} text-white`}
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">{layer.icon}</div>
            <div>
              <div className="text-xs font-bold">{layer.title}</div>
              <div className="text-[10px] opacity-80 mt-0.5">Layer {layer.level}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Single Layer Card - Standalone display
 */
export function LayerCard({ layer }: { layer: ValuePropositionLayer }) {
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${layer.gradient} text-white shadow-lg`}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">{layer.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-sm">{layer.title}</h4>
            <span className="text-xs opacity-60">L{layer.level}</span>
          </div>
          <p className="text-xs opacity-90 mb-3">{layer.description}</p>
          <ul className="space-y-1">
            {layer.items.slice(0, 3).map((item, idx) => (
              <li key={idx} className="text-xs flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-white/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Transformation Card - Pain → Pleasure Journey
 */
export function TransformationCard({ transformation }: { transformation: Transformation }) {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white shadow-lg">
      <div className="space-y-4">
        {/* Pain Point */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">Pain Point</h4>
            <p className="text-xs opacity-90">{transformation.painPoint}</p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <ArrowRight className="w-6 h-6" />
        </div>

        {/* Pleasure Goal */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Crown className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">Desired Outcome</h4>
            <p className="text-xs opacity-90">{transformation.pleasureGoal}</p>
          </div>
        </div>

        {/* Mechanism */}
        {transformation.mechanism && (
          <div className="pt-3 border-t border-white/20">
            <p className="text-xs opacity-80">
              <span className="font-semibold">How:</span> {transformation.mechanism}
            </p>
          </div>
        )}

        {/* Confidence Meter */}
        <div className="pt-3 border-t border-white/20">
          <ConfidenceMeter score={transformation.confidence} compact />
        </div>
      </div>
    </div>
  );
}
