/**
 * Quick Actions Panel
 *
 * Right sidebar with quick access to common actions
 * Mix content, schedule, view calendar, analytics
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shuffle, Calendar, BarChart3, Settings, Plus } from 'lucide-react';

export interface QuickActionsPanelProps {
  selectedCount?: number;
  onMixContent?: () => void;
}

export function QuickActionsPanel({ selectedCount = 0, onMixContent }: QuickActionsPanelProps) {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Shuffle,
      label: 'Mix Content',
      description: 'Combine insights into unique content',
      color: 'from-purple-500 to-pink-500',
      onClick: onMixContent || (() => navigate('/synapse')),
      badge: selectedCount > 0 ? `${selectedCount} selected` : undefined,
    },
    {
      icon: Calendar,
      label: 'View Calendar',
      description: 'See scheduled content',
      color: 'from-blue-500 to-cyan-500',
      onClick: () => navigate('/content-calendar'),
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      description: 'View performance metrics',
      color: 'from-green-500 to-emerald-500',
      onClick: () => {}, // TODO: Navigate to analytics
    },
    {
      icon: Settings,
      label: 'Settings',
      description: 'Configure preferences',
      color: 'from-gray-500 to-slate-500',
      onClick: () => {}, // TODO: Navigate to settings
    },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Quick Actions
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          One-click tools
        </p>
      </div>

      {/* Actions */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {actions.map((action, idx) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={action.onClick}
            className="w-full group"
          >
            <div className={`relative p-4 bg-gradient-to-br ${action.color} rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden`}>
              {/* Background decoration */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

              {/* Content */}
              <div className="relative">
                <div className="flex items-start justify-between mb-2">
                  <action.icon className="w-6 h-6 text-white" />
                  {action.badge && (
                    <span className="text-xs font-bold bg-white/30 text-white px-2 py-0.5 rounded-full">
                      {action.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  {action.label}
                </h3>
                <p className="text-xs text-white/90">
                  {action.description}
                </p>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Create New Section */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700 space-y-2">
        <button
          onClick={() => navigate('/campaign/new')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Campaign
        </button>
        <button
          onClick={() => navigate('/synapse')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Content
        </button>
      </div>
    </div>
  );
}
