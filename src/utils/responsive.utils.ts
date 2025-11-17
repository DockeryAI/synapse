/**
 * Responsive Utilities
 *
 * Helper functions for mobile-friendly development
 * Because someone needs to save you from yourself
 *
 * @author Roy (mobile optimization veteran since iPhone 3G)
 */

/**
 * Touch-friendly class names
 * Ensures minimum 44px touch targets per Apple/Android guidelines
 */
export const touchFriendly = {
  button: 'min-h-[44px] min-w-[44px] px-6 py-3',
  icon: 'min-h-[44px] min-w-[44px] p-2',
  link: 'min-h-[44px] inline-flex items-center py-2',
  input: 'min-h-[44px] px-4 py-3',
  checkbox: 'min-h-[24px] min-w-[24px]', // Slightly smaller is OK
  radio: 'min-h-[24px] min-w-[24px]',
};

/**
 * Responsive text sizes
 * Mobile-first sizing that scales up
 */
export const responsiveText = {
  xs: 'text-xs md:text-xs', // 12px - use sparingly
  sm: 'text-sm md:text-sm', // 14px
  base: 'text-base md:text-base', // 16px - minimum for body text
  lg: 'text-lg md:text-xl', // 18-20px
  xl: 'text-xl md:text-2xl', // 20-24px
  '2xl': 'text-2xl md:text-3xl', // 24-30px
  '3xl': 'text-3xl md:text-4xl', // 30-36px
};

/**
 * Responsive spacing
 * Tighter on mobile, more generous on desktop
 */
export const responsiveSpacing = {
  tight: 'gap-2 md:gap-4',
  normal: 'gap-4 md:gap-6',
  loose: 'gap-6 md:gap-8',
  section: 'space-y-4 md:space-y-6',
  container: 'px-4 md:px-6 lg:px-8',
};

/**
 * Responsive grid
 * Mobile-first grid layouts
 */
export const responsiveGrid = {
  '1-2': 'grid grid-cols-1 md:grid-cols-2',
  '1-3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  '1-4': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  auto: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
};

/**
 * Check if device is touch-enabled
 * Use this to conditionally disable hover effects
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
};

/**
 * Check if device is mobile based on screen size
 * Breakpoint: 768px (Tailwind md)
 */
export const isMobileScreen = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

/**
 * Check if device is tablet
 * Breakpoint: 768px - 1024px
 */
export const isTabletScreen = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

/**
 * Get responsive class based on touch capability
 * Disables hover effects on touch devices
 */
export const hoverClass = (className: string): string => {
  return isTouchDevice() ? '' : className;
};

/**
 * Clamp text to prevent zoom on iOS
 * iOS Safari zooms in on inputs with font-size < 16px
 */
export const preventIOSZoom = (): string => {
  return 'text-base'; // Force 16px minimum
};

/**
 * Safe area insets for notched devices
 * Ensures content doesn't get hidden behind notches/home indicators
 */
export const safeArea = {
  top: 'pt-safe-top',
  bottom: 'pb-safe-bottom',
  left: 'pl-safe-left',
  right: 'pr-safe-right',
  all: 'p-safe',
};

/**
 * Viewport height that accounts for mobile browser chrome
 * Use this instead of h-screen on mobile
 */
export const fullHeight = 'min-h-screen md:h-screen';

/**
 * Hide scrollbar on mobile (UX best practice)
 */
export const hideScrollbar = 'scrollbar-hide md:scrollbar-default';

/**
 * Snap scroll for mobile-friendly galleries/carousels
 */
export const snapScroll = {
  x: 'snap-x snap-mandatory overflow-x-auto',
  y: 'snap-y snap-mandatory overflow-y-auto',
  item: 'snap-center snap-always',
};

/**
 * Aspect ratio utilities for responsive media
 */
export const aspectRatio = {
  square: 'aspect-square',
  video: 'aspect-video', // 16:9
  vertical: 'aspect-[9/16]', // Stories/Reels
  portrait: 'aspect-[4/5]', // Instagram portrait
};

/**
 * Generate media query hook
 * Returns boolean indicating if query matches
 */
export const useMediaQuery = (query: string): boolean => {
  if (typeof window === 'undefined') return false;

  const [matches, setMatches] = React.useState(() =>
    window.matchMedia(query).matches
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

// React import for hook
import * as React from 'react';

/**
 * Common media query breakpoints
 */
export const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  touch: '(hover: none) and (pointer: coarse)',
  mouse: '(hover: hover) and (pointer: fine)',
};

/**
 * Combine class names conditionally
 * Mobile-first utility
 */
export const cn = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Get optimal image size for current viewport
 * Returns { width, height } for responsive images
 */
export const getOptimalImageSize = (): { width: number; height: number } => {
  if (typeof window === 'undefined') {
    return { width: 1080, height: 1920 };
  }

  const dpr = window.devicePixelRatio || 1;
  const width = Math.min(window.innerWidth * dpr, 1920);
  const height = Math.min(window.innerHeight * dpr, 1920);

  return { width: Math.round(width), height: Math.round(height) };
};

/**
 * Debounce utility for resize handlers
 * Prevents performance issues on mobile
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle utility for scroll handlers
 * Better than debounce for continuous events
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Prevent body scroll (for modals on mobile)
 */
export const preventScroll = (): (() => void) => {
  if (typeof document === 'undefined') return () => {};

  const originalStyle = window.getComputedStyle(document.body).overflow;
  document.body.style.overflow = 'hidden';

  // Return cleanup function
  return () => {
    document.body.style.overflow = originalStyle;
  };
};

/**
 * Check if element is visible in viewport
 * Useful for lazy loading on mobile
 */
export const isInViewport = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

/**
 * Haptic feedback for mobile
 * Provides tactile feedback on supported devices
 */
export const hapticFeedback = (
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'
): void => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      warning: [20, 50, 20],
      error: [30, 50, 30, 50, 30],
    };

    navigator.vibrate(patterns[type]);
  }
};

/**
 * Constants for mobile optimization
 */
export const MOBILE_CONSTANTS = {
  MIN_TOUCH_TARGET: 44, // px
  MIN_FONT_SIZE: 16, // px (prevents iOS zoom)
  MIN_LINE_HEIGHT: 1.5, // ratio
  MIN_SPACING: 8, // px between interactive elements
  MAX_VIEWPORT_WIDTH: 768, // px (mobile breakpoint)
  SCROLL_THRESHOLD: 100, // px before triggering actions
  DEBOUNCE_DELAY: 300, // ms
  THROTTLE_DELAY: 100, // ms
};

export default {
  touchFriendly,
  responsiveText,
  responsiveSpacing,
  responsiveGrid,
  isTouchDevice,
  isMobileScreen,
  isTabletScreen,
  hoverClass,
  preventIOSZoom,
  safeArea,
  fullHeight,
  hideScrollbar,
  snapScroll,
  aspectRatio,
  useMediaQuery,
  breakpoints,
  cn,
  getOptimalImageSize,
  debounce,
  throttle,
  preventScroll,
  isInViewport,
  hapticFeedback,
  MOBILE_CONSTANTS,
};
