/**
 * MainNav Component
 * Primary navigation component with all routes and mobile support
 */

import * as React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Target,
  Calendar,
  BarChart3,
  Lightbulb,
  Palette,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  description?: string
}

const navItems: NavItem[] = [
  {
    label: 'Home',
    path: '/',
    icon: <Sparkles className="h-4 w-4" />,
    description: 'Platform overview'
  },
  {
    label: 'MIRROR',
    path: '/mirror',
    icon: <Target className="h-4 w-4" />,
    description: 'Strategic framework'
  },
  {
    label: 'Content Calendar',
    path: '/content-calendar',
    icon: <Calendar className="h-4 w-4" />,
    description: 'Content planning'
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Performance insights'
  },
  {
    label: 'Intelligence',
    path: '/intelligence',
    icon: <Lightbulb className="h-4 w-4" />,
    description: 'Opportunity detection'
  },
  {
    label: 'Design Studio',
    path: '/design-studio',
    icon: <Palette className="h-4 w-4" />,
    description: 'Visual content creation'
  },
  {
    label: 'Admin',
    path: '/admin',
    icon: <Settings className="h-4 w-4" />,
    description: 'System settings'
  }
]

export const MainNav: React.FC = () => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  // Close mobile menu when route changes
  React.useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>MARBA.ai</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                title={item.description}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <div>
                    <div>{item.label}</div>
                    {item.description && (
                      <div className="text-xs opacity-70">{item.description}</div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
