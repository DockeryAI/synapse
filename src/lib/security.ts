/**
 * Security utilities for input sanitization
 * Following PATTERNS.md standards
 */

/**
 * Sanitize user input by removing dangerous characters
 */
export function sanitizeUserInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000) // Limit length
}

/**
 * Sanitize business name for API calls
 */
export function sanitizeBusinessName(name: string): string {
  return name
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
    .trim()
    .substring(0, 200)
}
