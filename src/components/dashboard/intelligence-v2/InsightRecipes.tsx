/**
 * Insight Recipes - Pre-configured insight combinations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Heart, Lightbulb, Flame, MapPin } from 'lucide-react';
import type { InsightCard, InsightRecipe } from './types';

export interface InsightRecipesProps {
  allInsights: InsightCard[];
  onSelectRecipe: (insightIds: string[]) => void;
}

const RECIPES: InsightRecipe[] = [
  {
    id: 'authority',
    name: 'Authority',
    description: 'Build credibility and expertise',
    icon: 'target',
    emoji: '🎯',
    insightTypes: ['market', 'competition', 'opportunity'],
    minInsights: 4,
    maxInsights: 6,
  },
  {
    id: 'trust',
    name: 'Trust',
    description: 'Build customer confidence',
    icon: 'heart',
    emoji: '🤝',
    insightTypes: ['customer', 'opportunity'],
    minInsights: 4,
    maxInsights: 5,
  },
  {
    id: 'problem-solver',
    name: 'Problem-Solver',
    description: 'Address pain points directly',
    icon: 'lightbulb',
    emoji: '💡',
    insightTypes: ['customer', 'competition', 'opportunity'],
    minInsights: 4,
    maxInsights: 6,
  },
  {
    id: 'viral',
    name: 'Viral',
    description: 'Trending and shareable',
    icon: 'flame',
    emoji: '🚀',
    insightTypes: ['market', 'opportunity'],
    minInsights: 3,
    maxInsights: 5,
  },
  {
    id: 'local',
    name: 'Local',
    description: 'Community-focused content',
    icon: 'map-pin',
    emoji: '📍',
    insightTypes: ['local', 'customer', 'opportunity'],
    minInsights: 3,
    maxInsights: 5,
  },
];

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'target':
      return Target;
    case 'heart':
      return Heart;
    case 'lightbulb':
      return Lightbulb;
    case 'flame':
      return Flame;
    case 'map-pin':
      return MapPin;
    default:
      return Target;
  }
};

export function InsightRecipes({ allInsights, onSelectRecipe }: InsightRecipesProps) {
  const handleRecipeClick = (recipe: InsightRecipe) => {
    // Filter insights that match the recipe types
    const matchingInsights = allInsights.filter(insight =>
      recipe.insightTypes.includes(insight.type)
    );

    // Sort by confidence and take the top N
    const sortedByConfidence = matchingInsights.sort((a, b) => b.confidence - a.confidence);
    const selectedInsights = sortedByConfidence.slice(0, recipe.maxInsights);

    onSelectRecipe(selectedInsights.map(i => i.id));
  };

  return (
    <div className="h-full bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
        Insight Recipes
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
        Pre-built combinations
      </p>

      <div className="space-y-2">
        {RECIPES.map((recipe, idx) => {
          const Icon = getIcon(recipe.icon);
          return (
            <motion.button
              key={recipe.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRecipeClick(recipe)}
              className="w-full text-left p-3 bg-gray-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 rounded-lg transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      {recipe.name}
                    </span>
                    <span className="text-xs">{recipe.emoji}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {recipe.description}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
