/**
 * AppLayout Component
 * Consistent layout wrapper for all pages
 */

import * as React from 'react'
import { MainNav } from './MainNav'
import { Breadcrumbs } from './Breadcrumbs'
import { MarbsContextProvider } from '@/components/marbs/MarbsContextProvider'
import { MarbsFloatingButton } from '@/components/marbs/MarbsFloatingButton'

interface AppLayoutProps {
  children: React.ReactNode
  showBreadcrumbs?: boolean
  showFooter?: boolean
  fullWidth?: boolean
  showNav?: boolean
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  showBreadcrumbs = true,
  showFooter = true,
  fullWidth = false,
  showNav = true
}) => {
  return (
    <MarbsContextProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Navigation */}
        {showNav && <MainNav />}

        {/* Breadcrumbs */}
        {showBreadcrumbs && <Breadcrumbs />}

        {/* Main Content */}
        <main className="flex-1">
          {fullWidth ? (
            children
          ) : (
            <div className="container mx-auto px-4 py-6">
              {children}
            </div>
          )}
        </main>

        {/* Footer */}
        {showFooter && (
          <footer className="border-t bg-muted/50 py-8 mt-auto">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">MARBA.ai</h3>
                  <p className="text-sm text-muted-foreground">
                    Marketing Intelligence Platform
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Platform</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>MIRROR Framework</li>
                    <li>Content Calendar</li>
                    <li>Intelligence Hub</li>
                    <li>Design Studio</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Resources</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Documentation</li>
                    <li>API Reference</li>
                    <li>Support</li>
                    <li>Status</li>
                  </ul>
                </div>
              </div>
              <div className="text-center text-sm text-muted-foreground pt-6 border-t">
                <p>Built with React, TypeScript, Vite, and Supabase</p>
                <p className="mt-1">&copy; 2024 MARBA.ai. All rights reserved.</p>
              </div>
            </div>
          </footer>
        )}

        {/* Marbs AI Assistant */}
        <MarbsFloatingButton />
      </div>
    </MarbsContextProvider>
  )
}
