/**
 * App Layout Component
 *
 * Persistent layout with collapsible sidebar navigation
 * Blue icon in top-left toggles navigation visibility
 * Nested navigation structure for all app sections
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  Sparkles,
  Calendar,
  Target,
  LayoutDashboard,
  Settings,
  FileText,
  Users,
  TrendingUp,
  Lightbulb,
  Zap,
  ChevronDown,
  ChevronRight,
  BookOpen,
  MessageSquare,
  BarChart,
  Archive,
  LogOut,
  User,
  Plus,
  PenTool
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
  badge?: string;
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Onboarding',
    href: '/onboarding',
    icon: BookOpen,
  },
  {
    title: 'Sessions',
    href: '/sessions',
    icon: Archive,
  },
  {
    title: 'Synapse',
    icon: Sparkles,
    children: [
      {
        title: 'Generate Content',
        href: '/synapse',
        icon: Zap,
      },
      {
        title: 'Campaign Builder',
        href: '/campaign/new',
        icon: Target,
      },
      {
        title: 'Content Calendar',
        href: '/content-calendar',
        icon: Calendar,
      },
    ],
  },
  {
    title: 'Intelligence',
    icon: Lightbulb,
    children: [
      {
        title: 'Business Insights',
        href: '/insights',
        icon: TrendingUp,
      },
      {
        title: 'Market Trends',
        href: '/trends',
        icon: BarChart,
      },
      {
        title: 'Competitor Analysis',
        href: '/competitors',
        icon: Users,
      },
    ],
  },
  {
    title: 'Content',
    icon: FileText,
    children: [
      {
        title: 'Blog Posts',
        href: '/content/blog',
        icon: FileText,
      },
      {
        title: 'Social Media',
        href: '/content/social',
        icon: MessageSquare,
      },
      {
        title: 'Email Campaigns',
        href: '/content/email',
        icon: MessageSquare,
      },
    ],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Auto-expand active section
  useEffect(() => {
    const activeSection = navigation.find(item =>
      item.children?.some(child => child.href === location.pathname)
    );
    if (activeSection) {
      setExpandedItems(prev =>
        prev.includes(activeSection.title)
          ? prev
          : [...prev, activeSection.title]
      );
    }
  }, [location.pathname]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href;
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all",
              "hover:bg-gray-100 dark:hover:bg-slate-800",
              "text-gray-700 dark:text-gray-300"
            )}
            style={{ paddingLeft: `${12 + depth * 12}px` }}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">{item.title}</span>}
            </div>
            {sidebarOpen && (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )
            )}
          </button>

          <AnimatePresence>
            {isExpanded && sidebarOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {item.children.map(child => renderNavItem(child, depth + 1))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <Link
        key={item.title}
        to={item.href || '#'}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
          isActive(item.href)
            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            : "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300"
        )}
        style={{ paddingLeft: `${12 + depth * 12}px` }}
      >
        <Icon className="w-5 h-5" />
        {sidebarOpen && (
          <span className="font-medium">{item.title}</span>
        )}
        {item.badge && sidebarOpen && (
          <span className="ml-auto px-2 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-950">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: 280 }}
        animate={{ width: sidebarOpen ? 280 : 64 }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 z-50 shadow-xl"
      >
        {/* Header with Blue Icon */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-slate-800">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {sidebarOpen && (
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
            >
              Synapse
            </motion.h1>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navigation.map(item => renderNavItem(item))}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              U
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">User</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">user@example.com</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarOpen ? "ml-[280px]" : "ml-[64px]"
        )}
      >
        {/* Render the child route */}
        <Outlet />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}
    </div>
  );
}