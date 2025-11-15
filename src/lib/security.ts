/**
 * Security and Input Sanitization Functions
 */

/**
 * Sanitize user input to prevent XSS and injection attacks
 *
 * @example
 * const safe = sanitizeUserInput(userInput)
 */
export function sanitizeUserInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 10000) // Limit length to prevent DoS
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url)
    return url.startsWith('http://') || url.startsWith('https://')
  } catch {
    return false
  }
}

/**
 * Sanitize HTML (basic implementation)
 * For production, use DOMPurify library
 */
export function sanitizeHTML(dirty: string): string {
  return dirty
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}
