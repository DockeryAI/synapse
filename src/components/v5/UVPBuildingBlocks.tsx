/**
 * UVP Building Blocks Component - V5 Standalone Version
 *
 * Displays UVP data in V4's nested collapsible design pattern.
 * Self-contained with no external V4 dependencies.
 *
 * Nesting Structure (matching V4):
 * - Customer Profiles
 *   - Role Category Groups (C-Suite, Operations, Technology, etc.)
 *     - Individual Customer Profile Cards
 *       - Emotional Drivers (expandable)
 *       - Functional Drivers (expandable)
 * - Products & Services
 *   - Product Cards (expandable with description, category, source)
 * - Differentiators
 *   - Differentiator Cards (expandable with evidence, strength)
 * - Key Benefits
 *   - Benefit Cards (expandable with details)
 * - Keywords
 *   - Tag chips
 *
 * Created: 2025-12-01
 */

import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Users,
  Package,
  Sparkles,
  Target,
  Tag,
  Heart,
  CheckCircle2,
  Crown,
  Settings,
  Cpu,
  Megaphone,
  Shield,
  Quote
} from 'lucide-react';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { BuyerPersona } from '@/types/buyer-persona.types';

// ============================================================================
// TYPES
// ============================================================================

interface UVPBuildingBlocksProps {
  uvp: CompleteUVP;
  deepContext?: any | null;
  onSelectItem?: (item: { type: string; text: string }) => void;
  brandId?: string;
  /** Optional: Pre-loaded buyer personas from database (10 detailed profiles) */
  buyerPersonas?: BuyerPersona[];
}

interface SidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultExpanded?: boolean;
  badgeCount?: number;
  children: React.ReactNode;
}

// Role type categories for grouping profiles
type RoleCategory = 'C-Suite' | 'Operations' | 'Technology' | 'Sales & Marketing' | 'Other';

interface ParsedCustomerProfile {
  title: string;
  description: string;
  roleCategory: RoleCategory;
  emotionalDrivers?: string[];
  functionalDrivers?: string[];
}

// ============================================================================
// SIDEBAR SECTION - Top-level collapsible section with animation
// ============================================================================

const SidebarSection = memo(function SidebarSection({
  title,
  icon,
  defaultExpanded = false,
  badgeCount,
  children
}: SidebarSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-gray-200 dark:border-slate-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-purple-500">{icon}</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{title}</span>
          {badgeCount !== undefined && badgeCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              {badgeCount}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-2 pt-0 space-y-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// ROLE CLASSIFICATION - Classify customer profiles by role type
// ============================================================================

function classifyRole(title: string): RoleCategory {
  const lowerTitle = title.toLowerCase();

  // C-Suite roles
  if (/\b(ceo|cfo|cto|cmo|coo|cio|cpo|chief|president|founder|owner|principal|partner)\b/i.test(lowerTitle)) {
    return 'C-Suite';
  }

  // Operations roles
  if (/\b(operations|ops|process|supply chain|logistics|procurement|quality|compliance|risk)\b/i.test(lowerTitle)) {
    return 'Operations';
  }

  // Technology roles
  if (/\b(technology|tech|it|digital|data|software|engineer|developer|architect|transformation)\b/i.test(lowerTitle)) {
    return 'Technology';
  }

  // Sales & Marketing roles
  if (/\b(sales|marketing|growth|revenue|customer success|account|business development|brand)\b/i.test(lowerTitle)) {
    return 'Sales & Marketing';
  }

  return 'Other';
}

// Parse customer profile strings into structured data
function parseCustomerProfiles(statement: string): ParsedCustomerProfile[] {
  if (!statement) return [];

  // Split by semicolon for multiple profiles
  const profiles = statement.includes(';')
    ? statement.split(';').map(s => s.trim()).filter(s => s.length > 0)
    : [statement];

  return profiles.map(profile => {
    // Try to extract title from beginning (e.g., "CEO: description" or "CEO - description")
    const colonMatch = profile.match(/^([^:]+):\s*(.+)$/);
    if (colonMatch) {
      return {
        title: colonMatch[1].trim(),
        description: colonMatch[2].trim(),
        roleCategory: classifyRole(colonMatch[1])
      };
    }

    const dashMatch = profile.match(/^([^-]+)\s*-\s*(.+)$/);
    if (dashMatch) {
      return {
        title: dashMatch[1].trim(),
        description: dashMatch[2].trim(),
        roleCategory: classifyRole(dashMatch[1])
      };
    }

    // Fallback: use first few words as title
    const words = profile.split(' ').slice(0, 4).join(' ');
    const title = words.length > 30 ? words.slice(0, 30) + '...' : words;
    return {
      title,
      description: profile,
      roleCategory: classifyRole(title)
    };
  });
}

// Group profiles by role category
function groupProfilesByRole(profiles: ParsedCustomerProfile[]): Map<RoleCategory, ParsedCustomerProfile[]> {
  const grouped = new Map<RoleCategory, ParsedCustomerProfile[]>();
  const order: RoleCategory[] = ['C-Suite', 'Operations', 'Technology', 'Sales & Marketing', 'Other'];

  // Initialize all categories
  order.forEach(cat => grouped.set(cat, []));

  // Group profiles
  profiles.forEach(profile => {
    const category = grouped.get(profile.roleCategory) || [];
    category.push(profile);
    grouped.set(profile.roleCategory, category);
  });

  // Remove empty categories
  order.forEach(cat => {
    if (grouped.get(cat)?.length === 0) {
      grouped.delete(cat);
    }
  });

  return grouped;
}

// Role category styling
const roleCategoryStyles: Record<RoleCategory, { icon: string; color: string; bg: string; border: string }> = {
  'C-Suite': {
    icon: 'crown',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-700/50'
  },
  'Operations': {
    icon: 'cog',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700/50'
  },
  'Technology': {
    icon: 'cpu',
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-700/50'
  },
  'Sales & Marketing': {
    icon: 'megaphone',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-700/50'
  },
  'Other': {
    icon: 'users',
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-600'
  }
};

// ============================================================================
// ROLE CATEGORY GROUP - Expandable group header for customer profiles
// ============================================================================

interface RoleCategoryGroupProps {
  category: RoleCategory;
  profiles: ParsedCustomerProfile[];
  emotionalDrivers: string[];
  functionalDrivers: string[];
  onSelectItem: (item: { type: string; text: string }) => void;
}

const RoleCategoryGroup = memo(function RoleCategoryGroup({
  category,
  profiles,
  emotionalDrivers,
  functionalDrivers,
  onSelectItem
}: RoleCategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const style = roleCategoryStyles[category];

  // Get icon component based on category
  const IconComponent = {
    'C-Suite': Crown,
    'Operations': Settings,
    'Technology': Cpu,
    'Sales & Marketing': Megaphone,
    'Other': Users
  }[category] || Users;

  return (
    <div className={`rounded-lg border ${style.border} overflow-hidden`}>
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-2.5 ${style.bg} hover:opacity-90 transition-colors`}
      >
        <div className="flex items-center gap-2">
          <IconComponent className={`w-3.5 h-3.5 ${style.color}`} />
          <span className={`text-xs font-semibold ${style.color}`}>{category}</span>
          <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${style.bg} ${style.color} border ${style.border}`}>
            {profiles.length}
          </span>
        </div>
        <ChevronRight className={`w-3.5 h-3.5 ${style.color} transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded Content - Individual Profiles */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-2 space-y-2 bg-white dark:bg-slate-800/50">
              {profiles.map((profile, index) => (
                <CustomerProfileCard
                  key={`${category}-profile-${index}`}
                  title={profile.title}
                  description={profile.description}
                  emotionalDrivers={profile.emotionalDrivers?.length ? profile.emotionalDrivers : emotionalDrivers}
                  functionalDrivers={profile.functionalDrivers?.length ? profile.functionalDrivers : functionalDrivers}
                  onSelectItem={onSelectItem}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// CUSTOMER PROFILE CARD - Expandable card with drivers nested inside
// ============================================================================

interface CustomerProfileCardProps {
  title: string;
  description: string;
  emotionalDrivers?: string[];
  functionalDrivers?: string[];
  onSelectItem: (item: { type: string; text: string }) => void;
}

const CustomerProfileCard = memo(function CustomerProfileCard({
  title,
  description,
  emotionalDrivers,
  functionalDrivers,
  onSelectItem
}: CustomerProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEmotional, setShowEmotional] = useState(false);
  const [showFunctional, setShowFunctional] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
      {/* Card Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-3 h-3 text-gray-500 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{title}</span>
        </div>
        <ChevronRight className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-2 space-y-2 bg-white dark:bg-slate-800">
              {/* Description - Clickable */}
              <button
                onClick={() => onSelectItem({ type: 'customer', text: description })}
                className="w-full text-left text-[10px] text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {description}
              </button>

              {/* Emotional Drivers - Expandable Box (Amber) */}
              {emotionalDrivers && emotionalDrivers.length > 0 && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-700/50 overflow-hidden">
                  <button
                    onClick={() => setShowEmotional(!showEmotional)}
                    className="w-full flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                        Emotional Drivers
                      </span>
                      <span className="px-1 py-0.5 text-[9px] rounded bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300">
                        {emotionalDrivers.length}
                      </span>
                    </div>
                    <ChevronRight className={`w-3 h-3 text-amber-500 transition-transform ${showEmotional ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {showEmotional && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="p-2 space-y-1 bg-amber-50/50 dark:bg-amber-900/10">
                          {emotionalDrivers.map((driver, i) => (
                            <button
                              key={`emotional-${i}`}
                              onClick={() => onSelectItem({ type: 'emotional', text: driver })}
                              className="w-full text-left p-1.5 text-[10px] rounded bg-amber-100/50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200 transition-colors flex items-start gap-1.5"
                            >
                              <Heart className="w-2.5 h-2.5 mt-0.5 flex-shrink-0 text-amber-500" />
                              <span>{driver}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Functional Drivers - Expandable Box (Blue) */}
              {functionalDrivers && functionalDrivers.length > 0 && (
                <div className="rounded-lg border border-blue-200 dark:border-blue-700/50 overflow-hidden">
                  <button
                    onClick={() => setShowFunctional(!showFunctional)}
                    className="w-full flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                        Functional Drivers
                      </span>
                      <span className="px-1 py-0.5 text-[9px] rounded bg-blue-200 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300">
                        {functionalDrivers.length}
                      </span>
                    </div>
                    <ChevronRight className={`w-3 h-3 text-blue-500 transition-transform ${showFunctional ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {showFunctional && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="p-2 space-y-1 bg-blue-50/50 dark:bg-blue-900/10">
                          {functionalDrivers.map((driver, i) => (
                            <button
                              key={`functional-${i}`}
                              onClick={() => onSelectItem({ type: 'functional', text: driver })}
                              className="w-full text-left p-1.5 text-[10px] rounded bg-blue-100/50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-200 transition-colors flex items-start gap-1.5"
                            >
                              <Target className="w-2.5 h-2.5 mt-0.5 flex-shrink-0 text-blue-500" />
                              <span>{driver}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// PRODUCT CARD - Expandable card for product/service
// ============================================================================

interface ProductCardProps {
  name: string;
  description: string;
  category: string;
  onSelectItem: (item: { type: string; text: string }) => void;
}

const ProductCard = memo(function ProductCard({
  name,
  description,
  category,
  onSelectItem
}: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = description && description !== name;

  return (
    <div className="rounded-lg border border-sky-200 dark:border-sky-700/50 overflow-hidden">
      {/* Card Header */}
      <button
        onClick={() => hasDetails ? setIsExpanded(!isExpanded) : onSelectItem({ type: 'product', text: name })}
        className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 hover:from-sky-100 hover:to-cyan-100 dark:hover:from-sky-900/30 dark:hover:to-cyan-900/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Package className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
          <span className="text-xs font-medium text-sky-800 dark:text-sky-200 text-left truncate">
            {name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {category && (
            <span className="px-1.5 py-0.5 text-[9px] rounded bg-sky-100 dark:bg-sky-800/50 text-sky-600 dark:text-sky-300">
              {category}
            </span>
          )}
          {hasDetails && (
            <ChevronRight className={`w-3 h-3 text-sky-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-2.5 bg-white dark:bg-slate-800/50 space-y-2">
              {description && (
                <button
                  onClick={() => onSelectItem({ type: 'product', text: `${name}: ${description}` })}
                  className="w-full text-left text-[10px] text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                >
                  {description}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// DIFFERENTIATOR CARD - Expandable card with evidence
// ============================================================================

interface DifferentiatorCardProps {
  statement: string;
  evidence?: string;
  strengthScore?: number;
  onSelectItem: (item: { type: string; text: string }) => void;
}

const DifferentiatorCard = memo(function DifferentiatorCard({
  statement,
  evidence,
  strengthScore,
  onSelectItem
}: DifferentiatorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = evidence || strengthScore !== undefined;

  return (
    <div className="rounded-lg border border-emerald-200 dark:border-emerald-700/50 overflow-hidden">
      {/* Card Header */}
      <button
        onClick={() => hasDetails ? setIsExpanded(!isExpanded) : onSelectItem({ type: 'differentiator', text: statement })}
        className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-900/30 dark:hover:to-green-900/30 transition-colors"
      >
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-emerald-800 dark:text-emerald-200 text-left line-clamp-2">
            {statement}
          </span>
        </div>
        {hasDetails && (
          <ChevronRight className={`w-3 h-3 text-emerald-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-2.5 bg-white dark:bg-slate-800/50 space-y-2">
              {evidence && (
                <div className="flex items-start gap-1.5">
                  <Quote className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <button
                    onClick={() => onSelectItem({ type: 'evidence', text: evidence })}
                    className="text-left text-[10px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors italic"
                  >
                    "{evidence}"
                  </button>
                </div>
              )}
              {strengthScore !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">Strength:</span>
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${strengthScore * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {Math.round(strengthScore * 100)}%
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// BENEFIT CARD - Expandable card for key benefits
// ============================================================================

interface BenefitCardProps {
  statement: string;
  onSelectItem: (item: { type: string; text: string }) => void;
}

const BenefitCard = memo(function BenefitCard({
  statement,
  onSelectItem
}: BenefitCardProps) {
  return (
    <button
      onClick={() => onSelectItem({ type: 'benefit', text: statement })}
      className="w-full text-left p-2.5 rounded-lg border border-violet-200 dark:border-violet-700/50 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-900/30 dark:hover:to-purple-900/30 transition-colors"
    >
      <div className="flex items-start gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
        <span className="text-xs text-violet-800 dark:text-violet-200 line-clamp-2">
          {statement}
        </span>
      </div>
    </button>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const UVPBuildingBlocks = memo(function UVPBuildingBlocks({
  uvp,
  deepContext,
  onSelectItem,
  brandId,
  buyerPersonas
}: UVPBuildingBlocksProps) {
  // Defensive check
  if (!uvp) {
    return (
      <div className="p-3 text-xs text-gray-500 dark:text-gray-400">
        Loading UVP data...
      </div>
    );
  }

  const handleSelect = (item: { type: string; text: string }) => {
    if (onSelectItem) {
      onSelectItem(item);
    }
  };

  // Parse customer profiles from buyerPersonas (preferred) or UVP statement (fallback)
  const parsedProfiles = useMemo(() => {
    // PRIMARY: Use buyerPersonas from database if available (10 detailed profiles)
    if (buyerPersonas && buyerPersonas.length > 0) {
      console.log('[UVPBuildingBlocks] Using buyerPersonas from DB:', buyerPersonas.length);
      return buyerPersonas.map((persona) => ({
        title: persona.persona_name || persona.role?.title || 'Customer',
        description: [
          persona.role?.title,
          persona.industry?.primary_industry,
          persona.company_type,
          // Include pain points summary if available
          persona.pain_points?.length ? `Pain: ${persona.pain_points[0]?.description || persona.pain_points[0]}` : null,
        ].filter(Boolean).join(' • '),
        roleCategory: classifyRole(persona.role?.title || persona.persona_name || ''),
        // Preserve full persona data for drivers
        emotionalDrivers: persona.pain_points?.map((p: any) => typeof p === 'string' ? p : p.description || p.emotional_impact) || [],
        functionalDrivers: persona.desired_outcomes?.map((o: any) => typeof o === 'string' ? o : o.outcome || o.functional_benefit) || [],
      }));
    }

    // FALLBACK: Parse from statement field
    if (uvp?.targetCustomer?.statement && uvp.targetCustomer.statement.trim().length > 0) {
      console.log('[UVPBuildingBlocks] Parsing customer from statement:', uvp.targetCustomer.statement.slice(0, 100));
      return parseCustomerProfiles(uvp.targetCustomer.statement);
    }

    // LAST RESORT: Construct from individual fields if statement is empty
    const tc = uvp?.targetCustomer;
    if (tc?.role || tc?.industry || tc?.companySize) {
      console.log('[UVPBuildingBlocks] Constructing customer from fields:', { role: tc.role, industry: tc.industry, companySize: tc.companySize });
      const parts = [tc.role, tc.industry, tc.companySize].filter(Boolean);
      if (parts.length > 0) {
        return [{
          title: tc.role || 'Target Customer',
          description: parts.join(' - '),
          roleCategory: classifyRole(tc.role || '')
        }];
      }
    }

    console.log('[UVPBuildingBlocks] No customer data found:', { targetCustomer: uvp?.targetCustomer, buyerPersonas: buyerPersonas?.length || 0 });
    return [];
  }, [uvp?.targetCustomer, buyerPersonas]);

  // Group profiles by role category
  const groupedProfiles = useMemo(() => {
    return groupProfilesByRole(parsedProfiles);
  }, [parsedProfiles]);

  // Convert grouped map to array for rendering
  const groupedProfilesArray = useMemo(() => {
    const order: RoleCategory[] = ['C-Suite', 'Operations', 'Technology', 'Sales & Marketing', 'Other'];
    return order
      .filter(cat => groupedProfiles.has(cat))
      .map(cat => ({ category: cat, profiles: groupedProfiles.get(cat) || [] }));
  }, [groupedProfiles]);

  // Get drivers from UVP - check multiple sources
  const emotionalDrivers = useMemo(() => {
    const drivers =
      uvp?.transformationGoal?.emotionalDrivers ||
      uvp?.targetCustomer?.emotionalDrivers ||
      (deepContext?.business?.uvp as any)?.emotionalDrivers ||
      [];
    return Array.isArray(drivers) ? drivers : [];
  }, [uvp, deepContext]);

  const functionalDrivers = useMemo(() => {
    const drivers =
      uvp?.transformationGoal?.functionalDrivers ||
      uvp?.targetCustomer?.functionalDrivers ||
      (deepContext?.business?.uvp as any)?.functionalDrivers ||
      [];
    return Array.isArray(drivers) ? drivers : [];
  }, [uvp, deepContext]);

  // Extract products/services
  const productsData = useMemo(() => {
    const items: { id: string; name: string; description: string; category: string }[] = [];

    if (uvp?.productsServices?.categories?.length) {
      uvp.productsServices.categories.forEach((cat: any) => {
        if (cat?.items?.length) {
          cat.items.forEach((product: any, i: number) => {
            if (product?.name) {
              items.push({
                id: `product-${cat.name || 'default'}-${i}`,
                name: product.name,
                description: product.description || '',
                category: cat.name || 'General'
              });
            }
          });
        }
      });
    }

    return items;
  }, [uvp?.productsServices]);

  // Extract differentiators
  const differentiatorData = useMemo(() => {
    const items: { id: string; statement: string; evidence?: string; strengthScore?: number }[] = [];

    if (uvp?.uniqueSolution?.differentiators && Array.isArray(uvp.uniqueSolution.differentiators)) {
      uvp.uniqueSolution.differentiators
        .filter((d: any) => d?.statement)
        .forEach((d: any, i: number) => {
          items.push({
            id: `diff-${i}`,
            statement: d.statement,
            evidence: d.evidence,
            strengthScore: d.strengthScore
          });
        });
    }

    return items;
  }, [uvp?.uniqueSolution]);

  // Extract benefits
  const benefitData = useMemo(() => {
    const items: { id: string; statement: string }[] = [];

    // Handle semicolon-separated benefits
    if (uvp?.keyBenefit?.statement) {
      const statements = uvp.keyBenefit.statement.includes(';')
        ? uvp.keyBenefit.statement.split(';').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
        : [uvp.keyBenefit.statement];

      statements.forEach((statement: string, i: number) => {
        items.push({ id: `benefit-${i}`, statement });
      });
    }

    return items;
  }, [uvp?.keyBenefit]);

  // Extract keywords from UVP
  const keywordItems = useMemo(() => {
    const keywords: string[] = [];

    // Extract from value proposition
    if (uvp?.valuePropositionStatement) {
      const stopWords = ['the', 'and', 'for', 'with', 'that', 'from', 'your', 'are', 'who', 'our', 'you', 'can', 'will', 'their', 'they', 'this', 'into', 'not'];
      const words = uvp.valuePropositionStatement
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter((w: string) => w.length >= 4 && !stopWords.includes(w));
      keywords.push(...words.slice(0, 5));
    }

    // Extract from unique solution
    if (uvp?.uniqueSolution?.statement) {
      const words = uvp.uniqueSolution.statement
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter((w: string) => w.length >= 5);
      keywords.push(...words.slice(0, 3));
    }

    return [...new Set(keywords)].slice(0, 10).map((kw, i) => ({
      id: `keyword-${i}`,
      text: kw
    }));
  }, [uvp?.valuePropositionStatement, uvp?.uniqueSolution?.statement]);

  return (
    <div className="divide-y divide-gray-200 dark:divide-slate-700">
      {/* Customer Profile - Grouped by Role Type */}
      {parsedProfiles.length > 0 && (
        <SidebarSection
          title="Customer Profile"
          icon={<Users className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={parsedProfiles.length}
        >
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {groupedProfilesArray.map(({ category, profiles }) => (
              <RoleCategoryGroup
                key={category}
                category={category}
                profiles={profiles}
                emotionalDrivers={emotionalDrivers}
                functionalDrivers={functionalDrivers}
                onSelectItem={handleSelect}
              />
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Products & Services */}
      {productsData.length > 0 && (
        <SidebarSection
          title="Products & Services"
          icon={<Package className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={productsData.length}
        >
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {productsData.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                description={product.description}
                category={product.category}
                onSelectItem={handleSelect}
              />
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Differentiators */}
      {differentiatorData.length > 0 && (
        <SidebarSection
          title="Differentiators"
          icon={<Shield className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={differentiatorData.length}
        >
          <div className="space-y-2">
            {differentiatorData.map((diff) => (
              <DifferentiatorCard
                key={diff.id}
                statement={diff.statement}
                evidence={diff.evidence}
                strengthScore={diff.strengthScore}
                onSelectItem={handleSelect}
              />
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Key Benefits */}
      {benefitData.length > 0 && (
        <SidebarSection
          title="Key Benefits"
          icon={<Target className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={benefitData.length}
        >
          <div className="space-y-2">
            {benefitData.map((benefit) => (
              <BenefitCard
                key={benefit.id}
                statement={benefit.statement}
                onSelectItem={handleSelect}
              />
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Keywords */}
      {keywordItems.length > 0 && (
        <SidebarSection
          title="Keywords"
          icon={<Tag className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={keywordItems.length}
        >
          <div className="flex flex-wrap gap-1 p-1">
            {keywordItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect({ type: 'keyword', text: item.text })}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                {item.text}
              </button>
            ))}
          </div>
        </SidebarSection>
      )}
    </div>
  );
});

// Export for use in other services
export { parseCustomerProfiles };

export default UVPBuildingBlocks;
