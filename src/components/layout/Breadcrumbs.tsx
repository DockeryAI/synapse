/**
 * Breadcrumbs Component
 * Auto-generates breadcrumbs from current route
 */

import * as React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  path: string
}

const routeLabels: Record<string, string> = {
  '': 'Home',
  'mirror': 'MIRROR Framework',
  'content-calendar': 'Content Calendar',
  'analytics': 'Analytics',
  'intelligence': 'Intelligence Hub',
  'design-studio': 'Design Studio',
  'admin': 'Admin'
}

export const Breadcrumbs: React.FC = () => {
  const location = useLocation()

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = location.pathname.split('/').filter(Boolean)

    if (paths.length === 0) {
      return []
    }

    const breadcrumbs: BreadcrumbItem[] = []
    let currentPath = ''

    paths.forEach((path) => {
      currentPath += `/${path}`
      const label = routeLabels[path] || path.charAt(0).toUpperCase() + path.slice(1)
      breadcrumbs.push({ label, path: currentPath })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="py-3 px-4 border-b bg-muted/30">
      <ol className="flex items-center gap-2 text-sm">
        <li>
          <Link
            to="/"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <React.Fragment key={breadcrumb.path}>
              <li>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </li>
              <li>
                {isLast ? (
                  <span className="font-medium text-foreground">
                    {breadcrumb.label}
                  </span>
                ) : (
                  <Link
                    to={breadcrumb.path}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {breadcrumb.label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
