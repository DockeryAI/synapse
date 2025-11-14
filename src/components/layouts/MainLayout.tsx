import * as React from 'react'
import { cn } from '@/lib/utils'
import { CustomerLogo } from '@/components/ui/customer-logo'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

interface MainLayoutProps {
  children: React.ReactNode
  logoUrl?: string | null
  brandName?: string
  navigation?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  logoUrl,
  brandName,
  navigation,
  actions,
  className,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <CustomerLogo
              logoUrl={logoUrl}
              brandName={brandName}
              size="md"
              fallbackToMarba
            />
            {/* Desktop Navigation */}
            {navigation && (
              <nav className="hidden md:flex items-center gap-4">
                {navigation}
              </nav>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {actions}
            {/* Mobile Menu Toggle */}
            {navigation && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle menu</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {navigation && mobileMenuOpen && (
          <div className="container md:hidden border-t py-4">
            <nav className="flex flex-col gap-2">
              {navigation}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={cn('container py-6 px-4', className)}>
        {children}
      </main>
    </div>
  )
}
