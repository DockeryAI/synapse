/**
 * Universal URL Parser Service
 *
 * Handles all URL formats and international TLDs
 * Part of Synapse MVP Foundation
 *
 * Requirements:
 * - Parse any URL format (with/without protocol)
 * - Handle international TLDs (.co.uk, .com.au, etc.)
 * - Extract domain, subdomain, path
 * - Validate URL structure
 * - Normalize URLs for consistency
 */

import { z } from 'zod'
import URLParse from 'url-parse'
import validator from 'validator'

// ============================================================================
// Zod Schemas (IMPLEMENTATION_STANDARDS requirement)
// ============================================================================

const ParsedURLSchema = z.object({
  original: z.string(),
  normalized: z.string().url(),
  protocol: z.string(),
  domain: z.string(),
  subdomain: z.string().nullable(),
  hostname: z.string(),
  pathname: z.string(),
  search: z.string(),
  hash: z.string(),
  port: z.string(),
  isValid: z.boolean()
})

export type ParsedURL = z.infer<typeof ParsedURLSchema>

const URLValidationSchema = z.object({
  url: z.string().min(1).max(2000),
  isValid: z.boolean(),
  errors: z.array(z.string())
})

export type URLValidation = z.infer<typeof URLValidationSchema>

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PROTOCOL = 'https://'

// Common international TLD patterns
const INTERNATIONAL_TLDS = [
  'co.uk', 'com.au', 'co.nz', 'co.za', 'co.in',
  'com.br', 'com.mx', 'com.ar', 'com.co',
  'co.jp', 'ne.jp', 'or.jp', 'ac.jp',
  'com.cn', 'net.cn', 'org.cn',
  'com.sg', 'com.my', 'com.ph',
  'com.hk', 'com.tw',
  'co.id', 'co.th', 'co.kr',
  'com.vn', 'com.pk',
  'ac.uk', 'org.uk', 'me.uk', 'ltd.uk',
  'gov.uk', 'nhs.uk', 'police.uk', 'mod.uk'
]

// ============================================================================
// Input Sanitization (IMPLEMENTATION_STANDARDS requirement)
// ============================================================================

function sanitizeURLInput(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('URL input must be a non-empty string')
  }

  return input
    .trim()
    .replace(/\s+/g, '') // Remove all whitespace
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 2000) // Limit length to prevent DoS
}

// ============================================================================
// Core URL Parser Functions
// ============================================================================

/**
 * Parse any URL format and return structured data
 * Handles international TLDs and adds protocol if missing
 *
 * @param input - Raw URL string in any format
 * @returns Parsed and validated URL object
 *
 * @example
 * parseURL('example.com') // → https://example.com
 * parseURL('www.example.com') // → https://www.example.com
 * parseURL('https://example.com') // → https://example.com
 * parseURL('example.co.uk') // → https://example.co.uk
 * parseURL('sub.example.com/path') // → https://sub.example.com/path
 */
export function parseURL(input: string): ParsedURL {
  try {
    // 1. Validate and sanitize input
    const sanitized = sanitizeURLInput(input)

    // 2. Add protocol if missing
    let urlWithProtocol = sanitized
    if (!sanitized.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) {
      urlWithProtocol = DEFAULT_PROTOCOL + sanitized
    }

    // 3. Parse using url-parse library
    const parsed = new URLParse(urlWithProtocol, true)

    // 4. Extract domain and subdomain
    const domain = extractDomain(urlWithProtocol)
    const subdomain = extractSubdomain(urlWithProtocol)

    // 5. Normalize the URL
    const normalized = normalizeURL(urlWithProtocol)

    // 6. Build result object
    const result: ParsedURL = {
      original: input,
      normalized,
      protocol: parsed.protocol,
      domain,
      subdomain,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      search: parsed.query ? `?${parsed.query}` : '',
      hash: parsed.hash,
      port: parsed.port,
      isValid: validateURL(urlWithProtocol)
    }

    // 7. Validate with Zod schema
    return ParsedURLSchema.parse(result)
  } catch (error) {
    // Error handling per IMPLEMENTATION_STANDARDS
    throw new Error(`Failed to parse URL "${input}": ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate URL structure and format
 * Uses validator library + custom checks for edge cases
 *
 * @param url - URL string to validate
 * @returns boolean indicating if URL is valid
 *
 * @example
 * validateURL('https://example.com') // → true
 * validateURL('not a url') // → false
 * validateURL('javascript:alert(1)') // → false (security)
 */
export function validateURL(url: string): boolean {
  try {
    // 1. Basic validation
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return false
    }

    const sanitized = sanitizeURLInput(url)

    // 2. Add protocol if missing for validation
    let urlToValidate = sanitized
    if (!sanitized.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) {
      urlToValidate = DEFAULT_PROTOCOL + sanitized
    }

    // 3. Security check: block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
    const protocol = urlToValidate.split(':')[0].toLowerCase()
    if (dangerousProtocols.includes(protocol + ':')) {
      return false
    }

    // 4. Use validator library
    if (!validator.isURL(urlToValidate, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      allow_underscores: true,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false
    })) {
      return false
    }

    // 5. Additional check: ensure it's a valid URL object
    try {
      new URL(urlToValidate)
      return true
    } catch {
      return false
    }
  } catch {
    return false
  }
}

/**
 * Normalize URL for consistency
 * - Lowercase domain
 * - Remove trailing slashes
 * - Remove default ports
 * - Sort query parameters (optional)
 *
 * @param url - URL to normalize
 * @returns Normalized URL string
 *
 * @example
 * normalizeURL('EXAMPLE.COM/') // → https://example.com
 * normalizeURL('example.com:443') // → https://example.com
 */
export function normalizeURL(url: string): string {
  try {
    const sanitized = sanitizeURLInput(url)

    // Add protocol if missing
    let urlWithProtocol = sanitized
    if (!sanitized.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) {
      urlWithProtocol = DEFAULT_PROTOCOL + sanitized
    }

    const parsed = new URL(urlWithProtocol)

    // Lowercase hostname
    parsed.hostname = parsed.hostname.toLowerCase()

    // Remove default ports
    if ((parsed.protocol === 'https:' && parsed.port === '443') ||
        (parsed.protocol === 'http:' && parsed.port === '80')) {
      parsed.port = ''
    }

    // Remove trailing slash from pathname (unless it's just '/')
    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1)
    }

    return parsed.toString()
  } catch (error) {
    throw new Error(`Failed to normalize URL "${url}": ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract root domain from URL
 * Handles international TLDs correctly
 *
 * @param url - URL to extract domain from
 * @returns Root domain (without subdomain)
 *
 * @example
 * extractDomain('https://www.example.com') // → example.com
 * extractDomain('https://blog.example.co.uk') // → example.co.uk
 * extractDomain('https://sub.domain.example.com.au') // → example.com.au
 */
export function extractDomain(url: string): string {
  try {
    const sanitized = sanitizeURLInput(url)

    // Add protocol if missing
    let urlWithProtocol = sanitized
    if (!sanitized.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) {
      urlWithProtocol = DEFAULT_PROTOCOL + sanitized
    }

    const parsed = new URL(urlWithProtocol)
    const hostname = parsed.hostname.toLowerCase()

    // Split hostname into parts
    const parts = hostname.split('.')

    // Check for international TLDs (multi-part TLDs like .co.uk)
    for (const tld of INTERNATIONAL_TLDS) {
      if (hostname.endsWith('.' + tld)) {
        const tldParts = tld.split('.')
        const domainParts = parts.slice(-(tldParts.length + 1))
        return domainParts.join('.')
      }
    }

    // Standard TLD (take last 2 parts: domain.com)
    if (parts.length >= 2) {
      return parts.slice(-2).join('.')
    }

    // Single part (unlikely but handle edge case)
    return hostname
  } catch (error) {
    throw new Error(`Failed to extract domain from "${url}": ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract subdomain from URL
 * Returns null if no subdomain exists
 *
 * @param url - URL to extract subdomain from
 * @returns Subdomain or null
 *
 * @example
 * extractSubdomain('https://www.example.com') // → www
 * extractSubdomain('https://blog.example.co.uk') // → blog
 * extractSubdomain('https://example.com') // → null
 * extractSubdomain('https://api.v2.example.com') // → api.v2
 */
export function extractSubdomain(url: string): string | null {
  try {
    const sanitized = sanitizeURLInput(url)

    // Add protocol if missing
    let urlWithProtocol = sanitized
    if (!sanitized.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) {
      urlWithProtocol = DEFAULT_PROTOCOL + sanitized
    }

    const parsed = new URL(urlWithProtocol)
    const hostname = parsed.hostname.toLowerCase()
    const domain = extractDomain(url)

    // Split hostname into parts
    const parts = hostname.split('.')
    const domainParts = domain.split('.')

    // If hostname has more parts than domain, the extra parts are the subdomain
    if (parts.length > domainParts.length) {
      const subdomainParts = parts.slice(0, parts.length - domainParts.length)
      return subdomainParts.join('.')
    }

    return null
  } catch (error) {
    throw new Error(`Failed to extract subdomain from "${url}": ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Detailed URL validation with error messages
 * Useful for form validation and user feedback
 *
 * @param url - URL to validate
 * @returns Validation result with error messages
 *
 * @example
 * validateURLDetailed('https://example.com')
 * // → { url: 'https://example.com', isValid: true, errors: [] }
 *
 * validateURLDetailed('not a url')
 * // → { url: 'not a url', isValid: false, errors: ['Invalid URL format'] }
 */
export function validateURLDetailed(url: string): URLValidation {
  const errors: string[] = []

  try {
    // 1. Check if empty
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      errors.push('URL cannot be empty')
      return URLValidationSchema.parse({ url, isValid: false, errors })
    }

    // 2. Check length
    if (url.length > 2000) {
      errors.push('URL is too long (max 2000 characters)')
    }

    // 3. Sanitize
    const sanitized = sanitizeURLInput(url)

    // 4. Add protocol if missing
    let urlToValidate = sanitized
    if (!sanitized.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) {
      urlToValidate = DEFAULT_PROTOCOL + sanitized
    }

    // 5. Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
    const protocol = urlToValidate.split(':')[0].toLowerCase()
    if (dangerousProtocols.includes(protocol + ':')) {
      errors.push(`Dangerous protocol not allowed: ${protocol}`)
    }

    // 6. Validate with validator library
    if (!validator.isURL(urlToValidate, {
      protocols: ['http', 'https'],
      require_protocol: true
    })) {
      errors.push('Invalid URL format')
    }

    // 7. Try to parse as URL object
    try {
      new URL(urlToValidate)
    } catch {
      errors.push('URL cannot be parsed')
    }

    // 8. Return validation result
    return URLValidationSchema.parse({
      url: sanitized,
      isValid: errors.length === 0,
      errors
    })
  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return URLValidationSchema.parse({
      url,
      isValid: false,
      errors
    })
  }
}

// ============================================================================
// Edge Case Handlers
// ============================================================================

/**
 * Handle edge cases per IMPLEMENTATION_STANDARDS:
 * 1. Null/undefined inputs → throw error
 * 2. Empty strings → throw error
 * 3. Extremely long inputs (>2000 chars) → truncate
 * 4. Special characters/emojis → sanitize
 * 5. Invalid URLs → throw clear error
 */

// All functions above already handle these edge cases through:
// - sanitizeURLInput() for sanitization and length limiting
// - Error throwing for null/undefined/empty
// - Clear error messages
// - Zod validation for type safety

// ============================================================================
// Compatibility Export (for existing code)
// ============================================================================

/**
 * Singleton instance for backward compatibility
 * Use standalone functions (parseURL, validateURL, etc.) for new code
 */
export const urlParser = {
  parse: parseURL,
  validate: validateURL,
  normalize: normalizeURL,
  extractDomain,
  extractSubdomain,
  validateDetailed: validateURLDetailed
}
