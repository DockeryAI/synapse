import * as React from 'react'
import { cn } from '@/lib/utils'

interface CustomerLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  logoUrl?: string | null
  brandName?: string
  size?: 'sm' | 'md' | 'lg'
  fallbackToMarba?: boolean
}

const sizeClasses = {
  sm: 'h-8 w-auto',
  md: 'h-10 w-auto',
  lg: 'h-12 w-auto',
}

export const CustomerLogo = React.forwardRef<HTMLDivElement, CustomerLogoProps>(
  (
    {
      logoUrl,
      brandName,
      size = 'md',
      fallbackToMarba = true,
      className,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false)
    const [imageLoaded, setImageLoaded] = React.useState(false)

    // Reset error state when logoUrl changes
    React.useEffect(() => {
      setImageError(false)
      setImageLoaded(false)
    }, [logoUrl])

    const showLogo = logoUrl && !imageError
    const showFallback = !showLogo && fallbackToMarba

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-2',
          className
        )}
        {...props}
      >
        {showLogo ? (
          <>
            <img
              src={logoUrl}
              alt={brandName || 'Brand logo'}
              className={cn(
                'object-contain transition-opacity duration-200',
                sizeClasses[size],
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                console.warn('Failed to load customer logo:', logoUrl)
                setImageError(true)
              }}
            />
            {!imageLoaded && (
              <div
                className={cn(
                  'animate-pulse bg-muted rounded',
                  sizeClasses[size]
                )}
              />
            )}
          </>
        ) : showFallback ? (
          <div className="flex items-center gap-2">
            <span className={cn(
              'font-bold text-primary',
              size === 'sm' && 'text-lg',
              size === 'md' && 'text-xl',
              size === 'lg' && 'text-2xl',
            )}>
              MARBA
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Mirror
            </span>
          </div>
        ) : null}
      </div>
    )
  }
)

CustomerLogo.displayName = 'CustomerLogo'
