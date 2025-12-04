/**
 * Brand Profile Page (/brand-profile)
 *
 * Displays and allows editing of UVP (Unique Value Proposition) data.
 * Mirrors the sidebar UVP structure with expandable customer cards.
 *
 * Features:
 * - Expandable target customer cards with emotional/functional drivers
 * - Edit capability for all UVP components
 * - Add new customers, differentiators, benefits
 * - Changes sync to database and update sidebar automatically
 *
 * Created: 2025-11-26
 * Updated: 2025-11-29 - Added expandable cards and edit capability
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Target,
  Sparkles,
  Award,
  FileText,
  Edit2,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Loader2,
  Building,
  Globe,
  MapPin,
  Users,
  Plus,
  Trash2,
  Save,
  X,
  Heart,
  Briefcase,
  Zap,
  Info,
  Package,
  Layers,
  Crown,
  Settings,
  Cpu,
  Megaphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useBrand } from '@/hooks/useBrand';
import { useBrandProfile } from '@/hooks/useBrandProfile';
import { getUVPByBrand, updateUVPComponent, recoverDriversFromSession } from '@/services/database/marba-uvp.service';
import { profileScannerService, type ProfileScanResult } from '@/services/intelligence/profile-scanner.service';
import type { CompleteUVP, CustomerProfile, TransformationGoal, UniqueSolution, KeyBenefit, Differentiator } from '@/types/uvp-flow.types';
import type { BusinessProfileType } from '@/services/synapse-v6/brand-profile.service';
import { CustomerTypeToggle } from '@/components/settings/CustomerTypeToggle';
import { GeographicScopeSelector } from '@/components/settings/GeographicScopeSelector';
import { RegionMultiSelect } from '@/components/settings/RegionMultiSelect';
import { ProfileTypeOverride } from '@/components/settings/ProfileTypeOverride';
import { ProductList } from '@/components/settings/ProductList';
import { AddEditProductModal } from '@/components/settings/AddEditProductModal';
import { useProducts } from '@/hooks/useProducts';
import type { BrandProduct, BrandProductInput } from '@/types/product.types';

// Profile type labels (V6)
const PROFILE_LABELS: Record<BusinessProfileType, string> = {
  'local-b2b': 'Local B2B Service',
  'local-b2c': 'Local B2C Service',
  'regional-agency': 'Regional Agency',
  'regional-retail': 'Regional Retail',
  'national-saas': 'National SaaS',
  'national-product': 'National Product'
};

// Profile type colors (V6)
const PROFILE_COLORS: Record<BusinessProfileType, string> = {
  'local-b2b': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'local-b2c': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'regional-agency': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'regional-retail': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'national-saas': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  'national-product': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
};

// ============================================================================
// ROLE CATEGORY TYPES AND PARSING (matches sidebar structure)
// ============================================================================
type RoleCategory = 'C-Suite' | 'Operations' | 'Technology' | 'Sales & Marketing' | 'Other';

interface ParsedCustomerProfile {
  title: string;
  description: string;
  roleCategory: RoleCategory;
}

// Classify a role title into a category
function classifyRole(title: string): RoleCategory {
  const lowerTitle = title.toLowerCase();

  // C-Suite roles
  if (/\b(ceo|cfo|cto|coo|cmo|cio|chief|president|founder|owner|principal|partner)\b/i.test(lowerTitle)) {
    return 'C-Suite';
  }

  // Operations roles
  if (/\b(operations|ops|logistics|supply chain|procurement|quality|process|administration|admin|office)\b/i.test(lowerTitle)) {
    return 'Operations';
  }

  // Technology roles
  if (/\b(tech|it|developer|engineer|software|data|digital|analytics|security|infrastructure|devops|architect)\b/i.test(lowerTitle)) {
    return 'Technology';
  }

  // Sales & Marketing roles
  if (/\b(sales|marketing|growth|revenue|business development|account|customer success)\b/i.test(lowerTitle)) {
    return 'Sales & Marketing';
  }

  return 'Other';
}

// Parse UVP statement to extract individual customer profiles with role categories
function parseCustomerProfiles(statement: string): ParsedCustomerProfile[] {
  if (!statement) return [];

  // Split by semicolons to get individual profiles
  const profiles = statement.split(';').map(s => s.trim()).filter(Boolean);

  return profiles.map(profile => {
    // Extract title - look for role/title pattern at the start
    const titleMatch = profile.match(/^([A-Z][^,;.]*?(?:Director|Manager|Leader|Owner|Principal|Officer|COO|CEO|CFO|CTO|CMO|VP|Head|Executive|Specialist|Analyst|Consultant|Agent|Broker)[^,;.]*?)(?:\s+(?:seeking|looking|responsible|needing|frustrated|in\s|who|that))/i);

    let title = 'Customer Profile';
    let description = profile;

    if (titleMatch) {
      title = titleMatch[1].trim();
      description = profile;
    } else {
      // Try a simpler extraction - just get the first noun phrase
      const simpleMatch = profile.match(/^([A-Z][a-zA-Z\s]+?)(?:\s+(?:seeking|looking|responsible|needing|frustrated|who|that|in\s))/i);
      if (simpleMatch) {
        title = simpleMatch[1].trim();
      }
    }

    return {
      title,
      description,
      roleCategory: classifyRole(title)
    };
  });
}

// Group profiles by role category
function groupProfilesByRole(profiles: ParsedCustomerProfile[]): Map<RoleCategory, ParsedCustomerProfile[]> {
  const grouped = new Map<RoleCategory, ParsedCustomerProfile[]>();
  const order: RoleCategory[] = ['C-Suite', 'Operations', 'Technology', 'Sales & Marketing', 'Other'];

  order.forEach(cat => grouped.set(cat, []));

  profiles.forEach(profile => {
    const category = profile.roleCategory;
    grouped.get(category)?.push(profile);
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
const roleCategoryStyles: Record<RoleCategory, { color: string; bg: string; border: string }> = {
  'C-Suite': {
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-700/50'
  },
  'Operations': {
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700/50'
  },
  'Technology': {
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-700/50'
  },
  'Sales & Marketing': {
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-700/50'
  },
  'Other': {
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    border: 'border-gray-200 dark:border-gray-600'
  }
};

// Get icon for role category
function getRoleCategoryIcon(category: RoleCategory) {
  const icons = {
    'C-Suite': Crown,
    'Operations': Settings,
    'Technology': Cpu,
    'Sales & Marketing': Megaphone,
    'Other': Users
  };
  return icons[category] || Users;
}

// ============================================================================
// ROLE CATEGORY GROUP COMPONENT - Expandable group header (matches sidebar)
// ============================================================================
interface RoleCategoryGroupProps {
  category: RoleCategory;
  profiles: ParsedCustomerProfile[];
  emotionalDrivers: string[];
  functionalDrivers: string[];
  isEditing: boolean;
}

function RoleCategoryGroup({ category, profiles, emotionalDrivers, functionalDrivers, isEditing }: RoleCategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const style = roleCategoryStyles[category];
  const IconComponent = getRoleCategoryIcon(category);

  return (
    <div className={`rounded-lg border ${style.border} overflow-hidden`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-3 ${style.bg} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-2">
          <IconComponent className={`w-4 h-4 ${style.color}`} />
          <span className={`font-medium text-sm ${style.color}`}>{category}</span>
          <Badge variant="outline" className="text-xs text-gray-700 dark:text-gray-300">{profiles.length}</Badge>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-300" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-300" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-2 space-y-2 bg-white/50 dark:bg-slate-900/50">
              {profiles.map((profile, index) => (
                <CustomerProfileCard
                  key={`${category}-profile-${index}`}
                  title={profile.title}
                  description={profile.description}
                  emotionalDrivers={emotionalDrivers}
                  functionalDrivers={functionalDrivers}
                  isEditing={isEditing}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// CUSTOMER PROFILE CARD COMPONENT (matches sidebar style)
// ============================================================================
interface CustomerProfileCardProps {
  title: string;
  description: string;
  emotionalDrivers: string[];
  functionalDrivers: string[];
  isEditing: boolean;
}

function CustomerProfileCard({ title, description, emotionalDrivers, functionalDrivers, isEditing }: CustomerProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex-1">
          <h4 className="font-medium text-sm text-gray-900 dark:text-white">{title}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{description}</p>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-300 flex-shrink-0 ml-2" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-300 flex-shrink-0 ml-2" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="px-3 pb-3 space-y-3 border-t border-gray-100 dark:border-slate-700 pt-3">
              {/* Emotional Drivers */}
              {emotionalDrivers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-3 h-3 text-red-500" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Emotional Drivers
                    </span>
                  </div>
                  <div className="space-y-1">
                    {emotionalDrivers.map((driver, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs">
                        <span className="text-red-500">•</span>
                        <span className="text-gray-700 dark:text-gray-300">{driver}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Functional Drivers */}
              {functionalDrivers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-3 h-3 text-blue-500" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Functional Drivers
                    </span>
                  </div>
                  <div className="space-y-1">
                    {functionalDrivers.map((driver, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
                        <span className="text-blue-500">•</span>
                        <span className="text-gray-700 dark:text-gray-300">{driver}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// EXPANDABLE CUSTOMER CARD COMPONENT (legacy - kept for backward compat)
// ============================================================================
interface CustomerCardProps {
  customer: {
    statement: string;
    emotionalDrivers: string[];
    functionalDrivers: string[];
  };
  index: number;
  isEditing: boolean;
  onUpdate: (updated: {
    statement: string;
    emotionalDrivers: string[];
    functionalDrivers: string[];
  }) => void;
  onDelete: () => void;
}

function CustomerCard({ customer, index, isEditing, onUpdate, onDelete }: CustomerCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editData, setEditData] = useState(customer);

  useEffect(() => {
    setEditData(customer);
  }, [customer]);

  const handleSave = () => {
    onUpdate(editData);
  };

  const handleAddDriver = (type: 'emotional' | 'functional') => {
    if (type === 'emotional') {
      setEditData({
        ...editData,
        emotionalDrivers: [...editData.emotionalDrivers, '']
      });
    } else {
      setEditData({
        ...editData,
        functionalDrivers: [...editData.functionalDrivers, '']
      });
    }
  };

  const handleRemoveDriver = (type: 'emotional' | 'functional', idx: number) => {
    if (type === 'emotional') {
      setEditData({
        ...editData,
        emotionalDrivers: editData.emotionalDrivers.filter((_, i) => i !== idx)
      });
    } else {
      setEditData({
        ...editData,
        functionalDrivers: editData.functionalDrivers.filter((_, i) => i !== idx)
      });
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                    Customer Persona {index + 1}
                  </CardTitle>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                    {customer.statement.slice(0, 80)}...
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs text-gray-700 dark:text-gray-300">
                  {customer.emotionalDrivers.length + customer.functionalDrivers.length} drivers
                </Badge>
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Customer Statement */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                Description
              </label>
              {isEditing ? (
                <Textarea
                  value={editData.statement}
                  onChange={(e) => setEditData({ ...editData, statement: e.target.value })}
                  className="text-sm"
                  rows={3}
                />
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {customer.statement}
                </p>
              )}
            </div>

            {/* Emotional Drivers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Emotional Drivers
                  </span>
                </div>
                {isEditing && (
                  <Button size="sm" variant="ghost" onClick={() => handleAddDriver('emotional')}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {(isEditing ? editData : customer).emotionalDrivers.map((driver, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Input
                          value={editData.emotionalDrivers[idx]}
                          onChange={(e) => {
                            const updated = [...editData.emotionalDrivers];
                            updated[idx] = e.target.value;
                            setEditData({ ...editData, emotionalDrivers: updated });
                          }}
                          className="text-sm flex-1"
                          placeholder="Enter emotional driver..."
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveDriver('emotional', idx)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg flex-1">
                        <span className="text-red-500 text-xs mt-0.5">•</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{driver}</span>
                      </div>
                    )}
                  </div>
                ))}
                {(isEditing ? editData : customer).emotionalDrivers.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No emotional drivers defined</p>
                )}
              </div>
            </div>

            {/* Functional Drivers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Functional Drivers
                  </span>
                </div>
                {isEditing && (
                  <Button size="sm" variant="ghost" onClick={() => handleAddDriver('functional')}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {(isEditing ? editData : customer).functionalDrivers.map((driver, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Input
                          value={editData.functionalDrivers[idx]}
                          onChange={(e) => {
                            const updated = [...editData.functionalDrivers];
                            updated[idx] = e.target.value;
                            setEditData({ ...editData, functionalDrivers: updated });
                          }}
                          className="text-sm flex-1"
                          placeholder="Enter functional driver..."
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveDriver('functional', idx)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex-1">
                        <span className="text-blue-500 text-xs mt-0.5">•</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{driver}</span>
                      </div>
                    )}
                  </div>
                ))}
                {(isEditing ? editData : customer).functionalDrivers.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No functional drivers defined</p>
                )}
              </div>
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-3 h-3 mr-1" /> Save Changes
                </Button>
                <Button size="sm" variant="destructive" onClick={onDelete}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete Customer
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ============================================================================
// EXPANDABLE SECTION COMPONENT
// ============================================================================
interface ExpandableSectionProps {
  icon: React.ReactNode;
  title: string;
  badge?: string | number;
  iconColor?: string;
  defaultOpen?: boolean;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

function ExpandableSection({
  icon,
  title,
  badge,
  iconColor = 'text-purple-600',
  defaultOpen = false,
  headerActions,
  children
}: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="mb-4">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-slate-800 ${iconColor}`}>
                  {icon}
                </div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                    {title}
                  </CardTitle>
                  {badge !== undefined && (
                    <Badge variant="outline" className="text-xs text-gray-700 dark:text-gray-300">
                      {badge}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {headerActions}
                {isOpen ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Content Pillars Data
const CONTENT_PILLARS = [
  { name: 'Authority', description: 'Position as industry expert and thought leader', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  { name: 'Trust', description: 'Build credibility through proof points and testimonials', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  { name: 'Problem-Solution', description: 'Address pain points with clear solutions', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  { name: 'Story', description: 'Share transformation journeys and case studies', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  { name: 'Education', description: 'How-to guides, tips, and valuable insights', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
  { name: 'Community', description: 'Local engagement and community connection', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function BrandProfilePage() {
  const navigate = useNavigate();
  const { currentBrand: brand } = useBrand();
  const { profile, updateProfile, resetToAutoDetected, isAutoDetected } = useBrandProfile();
  const [uvp, setUVP] = useState<CompleteUVP | null>(null);
  const [profileScan, setProfileScan] = useState<ProfileScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanningProfile, setScanningProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit mode states
  const [isEditingMarket, setIsEditingMarket] = useState(false);
  const [isEditingCustomers, setIsEditingCustomers] = useState(false);
  const [isEditingDifferentiators, setIsEditingDifferentiators] = useState(false);
  const [isEditingBenefits, setIsEditingBenefits] = useState(false);

  const [editForm, setEditForm] = useState<{
    customerType: 'b2b' | 'b2c' | 'b2b2c';
    geographicScope: 'local' | 'regional' | 'national' | 'global';
    primaryRegions: string[];
    profileType: BusinessProfileType;
  } | null>(null);

  // Products management state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BrandProduct | null>(null);
  const [productSaving, setProductSaving] = useState(false);

  // Products hook with auto-migration from UVP
  const {
    products,
    loading: productsLoading,
    scanning: productsScanning,
    addProduct,
    updateProduct,
    deleteProduct,
    rescanProducts,
    migrateFromUVP
  } = useProducts(brand?.id, { autoMigrateFromUVP: true, uvp });

  // Parse customers from UVP statement using role category parsing
  const parsedProfiles = useMemo(() => {
    if (!uvp?.targetCustomer?.statement) {
      console.log('[BrandProfilePage] No targetCustomer.statement in UVP');
      return [];
    }
    const profiles = parseCustomerProfiles(uvp.targetCustomer.statement);
    console.log('[BrandProfilePage] Parsed profiles:', {
      statement: uvp.targetCustomer.statement.slice(0, 100),
      profileCount: profiles.length,
      profiles: profiles.map(p => ({ title: p.title, category: p.roleCategory }))
    });
    return profiles;
  }, [uvp?.targetCustomer?.statement]);

  // Group profiles by role category
  const groupedProfiles = useMemo(() => {
    return groupProfilesByRole(parsedProfiles);
  }, [parsedProfiles]);

  // Convert to array for iteration
  const groupedProfilesArray = useMemo(() => {
    return Array.from(groupedProfiles.entries()).map(([category, profiles]) => ({
      category,
      profiles
    }));
  }, [groupedProfiles]);

  // Get drivers from UVP - check multiple sources (same as sidebar)
  const emotionalDrivers = useMemo(() => {
    const drivers =
      uvp?.transformationGoal?.emotionalDrivers ||
      uvp?.targetCustomer?.emotionalDrivers ||
      [];
    console.log('[BrandProfilePage] Emotional drivers:', {
      fromTransformation: uvp?.transformationGoal?.emotionalDrivers,
      fromCustomer: uvp?.targetCustomer?.emotionalDrivers,
      resolved: drivers
    });
    return drivers;
  }, [uvp?.transformationGoal?.emotionalDrivers, uvp?.targetCustomer?.emotionalDrivers]);

  const functionalDrivers = useMemo(() => {
    const drivers =
      uvp?.transformationGoal?.functionalDrivers ||
      uvp?.targetCustomer?.functionalDrivers ||
      [];
    console.log('[BrandProfilePage] Functional drivers:', {
      fromTransformation: uvp?.transformationGoal?.functionalDrivers,
      fromCustomer: uvp?.targetCustomer?.functionalDrivers,
      resolved: drivers
    });
    return drivers;
  }, [uvp?.transformationGoal?.functionalDrivers, uvp?.targetCustomer?.functionalDrivers]);

  // Legacy parsedCustomers for backward compat with update handlers
  const parsedCustomers = useMemo(() => {
    if (!uvp?.targetCustomer?.statement) return [];

    const statements = uvp.targetCustomer.statement.includes(';')
      ? uvp.targetCustomer.statement.split(';').map(s => s.trim()).filter(s => s.length > 0)
      : [uvp.targetCustomer.statement];

    return statements.map((statement, idx) => ({
      id: `customer-${idx}`,
      statement,
      emotionalDrivers: idx === 0 ? emotionalDrivers : [],
      functionalDrivers: idx === 0 ? functionalDrivers : [],
    }));
  }, [uvp?.targetCustomer, emotionalDrivers, functionalDrivers]);

  // Parse differentiators
  const parsedDifferentiators = useMemo(() => {
    if (!uvp?.uniqueSolution?.differentiators) return [];
    return uvp.uniqueSolution.differentiators.filter(d => d?.statement);
  }, [uvp?.uniqueSolution?.differentiators]);

  // Parse benefits from semicolon-separated statement
  const parsedBenefits = useMemo(() => {
    if (!uvp?.keyBenefit?.statement) return [];

    const statements = uvp.keyBenefit.statement.includes(';')
      ? uvp.keyBenefit.statement.split(';').map(s => s.trim()).filter(s => s.length > 0)
      : [uvp.keyBenefit.statement];

    return statements.map((statement, idx) => ({
      id: `benefit-${idx}`,
      statement,
      metrics: idx === 0 ? uvp.keyBenefit?.metrics : undefined,
    }));
  }, [uvp?.keyBenefit]);

  // Load UVP data on mount
  useEffect(() => {
    async function loadUVP() {
      if (!brand?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        let uvpData = await getUVPByBrand(brand.id);

        if (uvpData) {
          console.log('[BrandProfilePage] UVP loaded:', {
            id: uvpData?.id,
            hasTargetCustomer: !!uvpData?.targetCustomer,
            targetCustomerStatement: uvpData?.targetCustomer?.statement?.slice(0, 100),
            targetCustomerEmotional: uvpData?.targetCustomer?.emotionalDrivers,
            targetCustomerFunctional: uvpData?.targetCustomer?.functionalDrivers,
            hasTransformationGoal: !!uvpData?.transformationGoal,
            transformationEmotional: uvpData?.transformationGoal?.emotionalDrivers,
            transformationFunctional: uvpData?.transformationGoal?.functionalDrivers
          });

          // Check if drivers are missing and attempt recovery from session data
          const hasDrivers = (uvpData.targetCustomer?.emotionalDrivers?.length || 0) > 0 ||
                            (uvpData.transformationGoal?.emotionalDrivers?.length || 0) > 0;

          if (!hasDrivers) {
            console.log('[BrandProfilePage] UVP missing drivers, attempting recovery from session...');
            const recoveryResult = await recoverDriversFromSession(brand.id);

            if (recoveryResult.updated) {
              console.log('[BrandProfilePage] Drivers recovered:', {
                emotional: recoveryResult.emotionalDriversCount,
                functional: recoveryResult.functionalDriversCount
              });
              // Re-fetch UVP with recovered drivers
              uvpData = await getUVPByBrand(brand.id) || uvpData;
            } else {
              console.log('[BrandProfilePage] No drivers found in session data');
            }
          }
        }

        setUVP(uvpData);

        // Run profile scan in background
        if (uvpData) {
          setScanningProfile(true);
          try {
            const scanResult = await profileScannerService.scan(brand.id, {
              url: brand.website,
              uvp: uvpData,
              brandData: brand
            });
            setProfileScan(scanResult);
          } catch (scanErr) {
            console.error('[BrandProfilePage] Profile scan error:', scanErr);
          } finally {
            setScanningProfile(false);
          }
        }
      } catch (err) {
        console.error('[BrandProfilePage] Error loading UVP:', err);
        setError(err instanceof Error ? err.message : 'Failed to load UVP data');
      } finally {
        setLoading(false);
      }
    }

    loadUVP();
  }, [brand?.id]);

  // Calculate overall confidence percentage
  const getConfidencePercent = (): number => {
    if (!uvp?.overallConfidence) return 0;
    if (typeof uvp.overallConfidence === 'number') return uvp.overallConfidence;
    return uvp.overallConfidence.overall || 0;
  };

  // Get confidence color
  const getConfidenceColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Handle re-run UVP analysis
  const handleReanalyze = () => {
    navigate('/onboarding');
  };

  // Start editing market definition
  const handleStartEditMarket = () => {
    setEditForm({
      customerType: profile?.customerType || profileScan?.profileAnalysis.customerType || 'b2b',
      geographicScope: profile?.geographicScope || profileScan?.geography.scope || 'national',
      primaryRegions: profile?.primaryRegions || profileScan?.geography.primaryRegions || [],
      profileType: profile?.profileType || profileScan?.profileType || 'national-saas',
    });
    setIsEditingMarket(true);
  };

  // Save market profile changes
  const handleSaveMarket = async () => {
    if (!editForm) return;

    setSaving(true);
    try {
      await updateProfile({
        customerType: editForm.customerType,
        geographicScope: editForm.geographicScope,
        primaryRegions: editForm.primaryRegions,
        profileType: editForm.profileType,
        isAutoDetected: false,
      });
      setIsEditingMarket(false);
      setEditForm(null);
    } catch (err) {
      console.error('[BrandProfilePage] Failed to save profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Update customer data and sync to database
  const handleUpdateCustomer = async (index: number, updated: { statement: string; emotionalDrivers: string[]; functionalDrivers: string[] }) => {
    if (!uvp?.id) return;

    setSaving(true);
    try {
      // Rebuild the full customer data
      const newStatements = parsedCustomers.map((c, i) =>
        i === index ? updated.statement : c.statement
      );

      const newCustomer: CustomerProfile = {
        ...uvp.targetCustomer,
        statement: newStatements.join('; '),
        emotionalDrivers: index === 0 ? updated.emotionalDrivers : uvp.targetCustomer.emotionalDrivers,
        functionalDrivers: index === 0 ? updated.functionalDrivers : uvp.targetCustomer.functionalDrivers,
      };

      const result = await updateUVPComponent(uvp.id, 'customer', newCustomer);
      if (result.success) {
        // Update local state
        setUVP(prev => prev ? { ...prev, targetCustomer: newCustomer } : null);
      } else {
        setError(result.error || 'Failed to save customer');
      }
    } catch (err) {
      console.error('[BrandProfilePage] Failed to update customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  // Add new customer
  const handleAddCustomer = async () => {
    if (!uvp?.id) return;

    setSaving(true);
    try {
      const newStatement = 'New customer persona - click to edit';
      const existingStatements = parsedCustomers.map(c => c.statement);
      const allStatements = [...existingStatements, newStatement];

      const newCustomer: CustomerProfile = {
        ...uvp.targetCustomer,
        statement: allStatements.join('; '),
      };

      const result = await updateUVPComponent(uvp.id, 'customer', newCustomer);
      if (result.success) {
        setUVP(prev => prev ? { ...prev, targetCustomer: newCustomer } : null);
      }
    } finally {
      setSaving(false);
    }
  };

  // Delete customer
  const handleDeleteCustomer = async (index: number) => {
    if (!uvp?.id || parsedCustomers.length <= 1) return;

    setSaving(true);
    try {
      const newStatements = parsedCustomers
        .filter((_, i) => i !== index)
        .map(c => c.statement);

      const newCustomer: CustomerProfile = {
        ...uvp.targetCustomer,
        statement: newStatements.join('; '),
      };

      const result = await updateUVPComponent(uvp.id, 'customer', newCustomer);
      if (result.success) {
        setUVP(prev => prev ? { ...prev, targetCustomer: newCustomer } : null);
      }
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading brand profile...</p>
        </div>
      </div>
    );
  }

  // No brand selected
  if (!brand) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">No Brand Selected</h3>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    Please complete the onboarding process to create your brand profile.
                  </p>
                  <Button
                    onClick={() => navigate('/onboarding')}
                    className="mt-4"
                    variant="default"
                  >
                    Start Onboarding
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No UVP data
  if (!uvp) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{brand.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{brand.industry}</p>
          </div>

          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">No UVP Data Found</h3>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Your brand exists but no UVP analysis has been completed.
                  </p>
                  <Button onClick={handleReanalyze} className="mt-4" variant="default">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate UVP
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const confidencePercent = getConfidencePercent();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Building className="w-8 h-8 text-purple-600" />
                {brand.name}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-gray-600 dark:text-gray-400">
                {brand.industry && (
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {brand.industry}
                  </span>
                )}
                {brand.website && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {brand.website}
                  </span>
                )}
              </div>
            </div>
            <Button onClick={handleReanalyze} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-analyze
            </Button>
          </div>
        </motion.div>

        {/* Saving indicator */}
        {saving && (
          <div className="fixed top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving changes...
          </div>
        )}

        {/* Market Definition */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ExpandableSection
            icon={<Globe className="w-5 h-5" />}
            title="Market Definition"
            iconColor="text-cyan-600"
            defaultOpen={true}
            headerActions={
              !isEditingMarket ? (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleStartEditMarket(); }}>
                  <Edit2 className="w-4 h-4 mr-1" /> Edit
                </Button>
              ) : null
            }
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Your business profile and target market geography
            </p>
            {isEditingMarket && editForm ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">Customer Type</label>
                  <CustomerTypeToggle
                    value={editForm.customerType}
                    onChange={(v) => setEditForm({ ...editForm, customerType: v })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">Geographic Scope</label>
                  <GeographicScopeSelector
                    value={editForm.geographicScope}
                    onChange={(v) => setEditForm({ ...editForm, geographicScope: v })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">Primary Regions</label>
                  <RegionMultiSelect
                    value={editForm.primaryRegions}
                    onChange={(v) => setEditForm({ ...editForm, primaryRegions: v })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">Business Profile</label>
                  <ProfileTypeOverride
                    value={editForm.profileType}
                    onChange={(v) => setEditForm({ ...editForm, profileType: v })}
                    isAutoDetected={false}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveMarket} disabled={saving}>
                    <Save className="w-4 h-4 mr-1" /> Save
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditingMarket(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Business Profile</span>
                  <div className="mt-1">
                    {profileScan && (
                      <Badge className={`${PROFILE_COLORS[profileScan.profileType]}`}>
                        {PROFILE_LABELS[profileScan.profileType]}
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Geographic Scope</span>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-gray-700 dark:text-gray-300">
                      {profileScan?.geography?.scope || 'National'}
                    </Badge>
                    {profileScan?.geography?.headquarters && (
                      <span className="text-sm text-gray-700 dark:text-gray-300">HQ: {profileScan.geography.headquarters}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ExpandableSection>
        </motion.div>

        {/* Value Proposition Statement */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ExpandableSection
            icon={<Sparkles className="w-5 h-5" />}
            title="Value Proposition"
            iconColor="text-purple-600"
            defaultOpen={true}
          >
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-purple-100 dark:border-purple-800">
              <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                {uvp.valuePropositionStatement || 'No value proposition statement generated yet.'}
              </p>
            </div>

            {(uvp.whyStatement || uvp.whatStatement || uvp.howStatement) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {uvp.whyStatement && (
                  <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="text-sm font-semibold text-purple-600 mb-2">WHY</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{uvp.whyStatement}</p>
                  </div>
                )}
                {uvp.whatStatement && (
                  <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-600 mb-2">WHAT</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{uvp.whatStatement}</p>
                  </div>
                )}
                {uvp.howStatement && (
                  <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="text-sm font-semibold text-green-600 mb-2">HOW</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{uvp.howStatement}</p>
                  </div>
                )}
              </div>
            )}
          </ExpandableSection>
        </motion.div>

        {/* Target Customers - Grouped by Role Category */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <ExpandableSection
            icon={<Users className="w-5 h-5" />}
            title="Target Customers"
            badge={parsedProfiles.length}
            iconColor="text-blue-600"
            defaultOpen={true}
            headerActions={
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant={isEditingCustomers ? 'default' : 'ghost'}
                  size="sm"
                  className="text-gray-700 dark:text-gray-200"
                  onClick={() => setIsEditingCustomers(!isEditingCustomers)}
                >
                  {isEditingCustomers ? <><X className="w-4 h-4 mr-1" /> Done</> : <><Edit2 className="w-4 h-4 mr-1" /> Edit</>}
                </Button>
                <Button variant="outline" size="sm" className="text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-500" onClick={handleAddCustomer} disabled={saving}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            }
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Customer personas grouped by role category. Click each group to expand profiles with their emotional and functional drivers.
            </p>
            <div className="space-y-3">
              {groupedProfilesArray.map(({ category, profiles }) => (
                <RoleCategoryGroup
                  key={category}
                  category={category}
                  profiles={profiles}
                  emotionalDrivers={emotionalDrivers}
                  functionalDrivers={functionalDrivers}
                  isEditing={isEditingCustomers}
                />
              ))}
              {parsedProfiles.length === 0 && (
                <p className="text-gray-500 italic text-center py-4">No target customers defined</p>
              )}
            </div>
          </ExpandableSection>
        </motion.div>

        {/* Unique Solution & Differentiators */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <ExpandableSection
            icon={<Sparkles className="w-5 h-5" />}
            title="Unique Solution"
            badge={`${parsedDifferentiators.length} differentiators`}
            iconColor="text-purple-600"
            defaultOpen={true}
            headerActions={
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setIsEditingDifferentiators(!isEditingDifferentiators); }}>
                {isEditingDifferentiators ? <><X className="w-4 h-4 mr-1" /> Done</> : <><Edit2 className="w-4 h-4 mr-1" /> Edit</>}
              </Button>
            }
          >
            {uvp.uniqueSolution?.statement && (
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {uvp.uniqueSolution.outcomeStatement || uvp.uniqueSolution.statement}
              </p>
            )}
            <div className="space-y-2 mt-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Differentiators:</h4>
              {parsedDifferentiators.map((diff, idx) => (
                <div key={diff.id || idx} className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{diff.statement}</span>
                    {diff.evidence && (
                      <p className="text-xs text-gray-500 mt-1">{diff.evidence}</p>
                    )}
                  </div>
                  {diff.strengthScore && (
                    <Badge variant="secondary" className="text-xs">
                      {diff.strengthScore}%
                    </Badge>
                  )}
                </div>
              ))}
              {parsedDifferentiators.length === 0 && (
                <p className="text-gray-500 italic">No differentiators defined</p>
              )}
            </div>
          </ExpandableSection>
        </motion.div>

        {/* Key Benefits */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <ExpandableSection
            icon={<Award className="w-5 h-5" />}
            title="Key Benefits"
            badge={parsedBenefits.length}
            iconColor="text-yellow-600"
            defaultOpen={true}
            headerActions={
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setIsEditingBenefits(!isEditingBenefits); }}>
                {isEditingBenefits ? <><X className="w-4 h-4 mr-1" /> Done</> : <><Edit2 className="w-4 h-4 mr-1" /> Edit</>}
              </Button>
            }
          >
            <div className="space-y-3">
              {parsedBenefits.map((benefit, idx) => (
                <div key={benefit.id} className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{benefit.statement}</span>
                  </div>
                  {benefit.metrics && benefit.metrics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 ml-6">
                      {benefit.metrics.map((metric, mIdx) => (
                        <Badge key={mIdx} variant="secondary" className="text-xs">
                          {metric.value} {metric.metric}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {parsedBenefits.length === 0 && (
                <p className="text-gray-500 italic">No key benefits defined</p>
              )}
            </div>
          </ExpandableSection>
        </motion.div>

        {/* Content Pillars */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <ExpandableSection
            icon={<Layers className="w-5 h-5" />}
            title="Content Pillars"
            badge={CONTENT_PILLARS.length}
            iconColor="text-indigo-600"
            defaultOpen={false}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Strategic content themes that guide your messaging and build brand authority.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CONTENT_PILLARS.map((pillar, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${pillar.color}`}>
                  <h4 className="font-medium text-sm mb-1">{pillar.name}</h4>
                  <p className="text-xs opacity-80">{pillar.description}</p>
                </div>
              ))}
            </div>
          </ExpandableSection>
        </motion.div>

        {/* Products & Services - NEW: Full CRUD with database storage */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <ExpandableSection
            icon={<Package className="w-5 h-5" />}
            title="Products & Services"
            badge={products.length}
            iconColor="text-green-600"
            defaultOpen={true}
            headerActions={
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (brand?.website) {
                      rescanProducts(brand.website, brand.name, brand.industry);
                    }
                  }}
                  disabled={productsScanning || !brand?.website}
                  className="border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${productsScanning ? 'animate-spin' : ''}`} />
                  {productsScanning ? 'Scanning...' : 'Rescan Website'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingProduct(null);
                    setShowProductModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Product
                </Button>
              </div>
            }
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Products and services extracted from your website or added manually. Click "Rescan Website" to discover new products.
            </p>
            <ProductList
              products={products}
              onEdit={(product) => {
                setEditingProduct(product);
                setShowProductModal(true);
              }}
              onDelete={async (productId) => {
                if (confirm('Are you sure you want to delete this product?')) {
                  await deleteProduct(productId);
                }
              }}
              isLoading={productsLoading}
            />
          </ExpandableSection>
        </motion.div>

        {/* Product Add/Edit Modal */}
        <AddEditProductModal
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          onSave={async (productInput) => {
            setProductSaving(true);
            try {
              if (editingProduct) {
                await updateProduct(editingProduct.id, productInput);
              } else {
                await addProduct(productInput);
              }
            } finally {
              setProductSaving(false);
            }
          }}
          product={editingProduct}
          isLoading={productSaving}
        />

        {/* Data Sources & Timestamps */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <ExpandableSection
            icon={<FileText className="w-5 h-5" />}
            title="Data Sources"
            iconColor="text-gray-600"
            defaultOpen={false}
          >
            <div className="flex flex-wrap gap-2 mb-4">
              {(() => {
                const sources = new Set<string>();
                if (uvp.targetCustomer?.sources) {
                  uvp.targetCustomer.sources.filter(s => s).forEach(s => sources.add((s as any).platform || (s as any).type || 'Unknown'));
                }
                if (uvp.transformationGoal?.sources) {
                  uvp.transformationGoal.sources.filter(s => s).forEach(s => sources.add((s as any).platform || (s as any).type || 'Unknown'));
                }
                if (uvp.uniqueSolution?.sources) {
                  uvp.uniqueSolution.sources.filter(s => s).forEach(s => sources.add((s as any).platform || (s as any).type || 'Unknown'));
                }
                if (uvp.keyBenefit?.sources) {
                  uvp.keyBenefit.sources.filter(s => s).forEach(s => sources.add((s as any).platform || (s as any).type || 'Unknown'));
                }

                if (sources.size === 0) {
                  return <p className="text-gray-500 italic">No data sources recorded</p>;
                }

                return Array.from(sources).map((source, idx) => (
                  <Badge key={idx} variant="outline" className="capitalize text-gray-700 dark:text-gray-300">
                    {source}
                  </Badge>
                ));
              })()}
            </div>

            <Separator className="my-4" />
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Created: {uvp.createdAt ? new Date(uvp.createdAt).toLocaleDateString() : 'Unknown'}</span>
              <span>Updated: {uvp.updatedAt ? new Date(uvp.updatedAt).toLocaleDateString() : 'Unknown'}</span>
            </div>
          </ExpandableSection>
        </motion.div>
      </div>
    </div>
  );
}

export default BrandProfilePage;
