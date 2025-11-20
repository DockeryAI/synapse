/**
 * Floating Action Buttons Component
 *
 * Reusable floating buttons for Campaign, Content, and Calendar
 * Appears in the top-right corner of pages
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, FileText, Calendar } from 'lucide-react';

export function FloatingActionButtons() {
  const navigate = useNavigate();

  return (
    <div className="fixed top-4 right-6 flex items-center gap-2 z-50">
      {/* Campaign Button */}
      <div className="relative group">
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/campaign/new')}
          className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          aria-label="Create campaign"
        >
          <TrendingUp className="w-5 h-5" />
        </motion.button>
        {/* Tooltip */}
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
            Create Campaign
          </div>
        </div>
      </div>

      {/* Content Button */}
      <div className="relative group">
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/synapse')}
          className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          aria-label="Create content"
        >
          <FileText className="w-5 h-5" />
        </motion.button>
        {/* Tooltip */}
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
            Generate Content
          </div>
        </div>
      </div>

      {/* Calendar Button */}
      <div className="relative group">
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/content-calendar')}
          className="p-3 bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          aria-label="Open calendar"
        >
          <Calendar className="w-5 h-5" />
        </motion.button>
        {/* Tooltip */}
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
            Content Calendar
          </div>
        </div>
      </div>
    </div>
  );
}