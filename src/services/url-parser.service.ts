/**
 * Universal URL Parser Service
 *
 * Handles any URL format globally with support for 50+ international TLDs.
 * Extracts domain, subdomain, path, TLD, and protocol information.
 * Normalizes URLs to canonical format for consistent processing.
 *
 * @example
 * const parser = new URLParserService();
 * const result = parser.parse('www.example.com');
 * // Returns: { domain: 'example.com', protocol: 'https', isValid: true, ... }
 */

export interface ParsedURL {
  /** Original input URL */
  original: string;
  /** Normalized canonical URL */
  normalized: string;
  /** Main domain (without subdomain) */
  domain: string;
  /** Subdomain if present */
  subdomain?: string;
  /** URL path */
  path: string;
  /** Top-level domain (com, co.uk, etc) */
  tld: string;
  /** Protocol (http or https) */
  protocol: string;
  /** Whether the URL is valid */
  isValid: boolean;
  /** Port number if specified */
  port?: number;
  /** Error message if invalid */
  error?: string;
}

/**
 * International TLDs - Common country code and multi-part TLDs
 */
const MULTI_PART_TLDS = [
  // Common country code TLDs with second level
  'co.uk', 'co.nz', 'co.za', 'co.jp', 'co.kr', 'co.in', 'co.id', 'co.th',
  'com.au', 'com.br', 'com.cn', 'com.mx', 'com.ar', 'com.co', 'com.sg',
  'com.my', 'com.ph', 'com.tw', 'com.hk', 'com.vn', 'com.tr', 'com.sa',
  // European multi-part TLDs
  'ac.uk', 'gov.uk', 'org.uk', 'net.uk', 'sch.uk',
  'ac.nz', 'govt.nz', 'geek.nz', 'gen.nz', 'kiwi.nz',
  // German
  'de.com', 'com.de',
  // French
  'fr.com', 'com.fr',
  // Spanish
  'es.com', 'com.es',
  // Italian
  'it.com', 'com.it',
  // Netherlands
  'nl.com', 'com.nl',
  // Other common patterns
  'ne.jp', 'or.jp', 'ac.jp', 'go.jp',
  'net.au', 'org.au', 'edu.au', 'gov.au',
  'edu.cn', 'net.cn', 'org.cn', 'gov.cn',
  // Additional common patterns
  'co.il', 'co.ke', 'co.tz', 'co.ug', 'co.zm', 'co.zw',
  'me.uk', 'ltd.uk', 'plc.uk'
];

export class URLParserService {
  /**
   * Parse any URL format into structured components
   *
   * @param url - URL string in any format
   * @returns Parsed URL components
   *
   * @example
   * parse('www.example.com') → { domain: 'example.com', protocol: 'https', ... }
   * parse('https://subdomain.example.co.uk/path') → { subdomain: 'subdomain', tld: 'co.uk', ... }
   */
  parse(url: string): ParsedURL {
    const original = url.trim();

    // Initialize result
    const result: ParsedURL = {
      original,
      normalized: '',
      domain: '',
      path: '',
      tld: '',
      protocol: 'https',
      isValid: false
    };

    // Handle empty or whitespace-only input
    if (!original) {
      result.error = 'URL cannot be empty';
      return result;
    }

    try {
      // Normalize the URL first
      const normalized = this.normalize(original);
      result.normalized = normalized;

      // Create URL object for parsing
      const urlObj = new URL(normalized);

      // Extract protocol
      result.protocol = urlObj.protocol.replace(':', '');

      // Extract port if present
      if (urlObj.port) {
        result.port = parseInt(urlObj.port, 10);
      }

      // Extract path
      result.path = urlObj.pathname + urlObj.search + urlObj.hash;

      // Extract hostname components
      const hostname = urlObj.hostname;

      // Handle IP addresses
      if (this.isIPAddress(hostname)) {
        result.domain = hostname;
        result.tld = 'ip';
        result.isValid = true;
        return result;
      }

      // Handle localhost
      if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
        result.domain = hostname;
        result.tld = 'localhost';
        result.isValid = true;
        return result;
      }

      // Extract TLD and domain
      const { tld, domain, subdomain } = this.extractDomainParts(hostname);

      result.tld = tld;
      result.domain = domain;
      result.subdomain = subdomain;

      // Validate the domain has a proper structure
      if (!domain || !tld) {
        result.error = 'Invalid domain structure';
        return result;
      }

      result.isValid = true;
      return result;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Invalid URL format';
      return result;
    }
  }

  /**
   * Normalize a URL to canonical format
   *
   * @param url - URL string in any format
   * @returns Normalized URL with https:// protocol
   *
   * @example
   * normalize('example.com') → 'https://example.com'
   * normalize('www.example.com') → 'https://www.example.com'
   */
  normalize(url: string): string {
    let normalized = url.trim();

    // Remove trailing slashes (except for root path)
    normalized = normalized.replace(/\/+$/, '');

    // Add protocol if missing
    if (!normalized.match(/^https?:\/\//i)) {
      // Check if it starts with // (protocol-relative URL)
      if (normalized.startsWith('//')) {
        normalized = 'https:' + normalized;
      } else {
        normalized = 'https://' + normalized;
      }
    }

    // Ensure protocol is lowercase
    normalized = normalized.replace(/^HTTP/i, 'http').replace(/^HTTPS/i, 'https');

    return normalized;
  }

  /**
   * Validate if a URL string is valid
   *
   * @param url - URL string to validate
   * @returns True if URL is valid
   *
   * @example
   * validate('https://example.com') → true
   * validate('not a url') → false
   */
  validate(url: string): boolean {
    return this.parse(url).isValid;
  }

  /**
   * Extract domain parts (TLD, domain, subdomain) from hostname
   *
   * @private
   * @param hostname - Hostname to parse
   * @returns Domain components
   */
  private extractDomainParts(hostname: string): {
    tld: string;
    domain: string;
    subdomain?: string;
  } {
    const parts = hostname.toLowerCase().split('.');

    // Need at least 2 parts for a valid domain
    if (parts.length < 2) {
      return { tld: '', domain: hostname };
    }

    // Check for multi-part TLDs (co.uk, com.au, etc)
    for (const multiTld of MULTI_PART_TLDS) {
      const tldParts = multiTld.split('.');
      const hostnameEnd = parts.slice(-tldParts.length).join('.');

      if (hostnameEnd === multiTld) {
        // Found multi-part TLD
        const beforeTld = parts.slice(0, -tldParts.length);

        if (beforeTld.length === 0) {
          // Just the TLD, no domain
          return { tld: multiTld, domain: multiTld };
        }

        if (beforeTld.length === 1) {
          // domain.co.uk
          return {
            tld: multiTld,
            domain: beforeTld[0] + '.' + multiTld
          };
        }

        // subdomain.domain.co.uk
        return {
          tld: multiTld,
          domain: beforeTld[beforeTld.length - 1] + '.' + multiTld,
          subdomain: beforeTld.slice(0, -1).join('.')
        };
      }
    }

    // Standard single-part TLD (.com, .org, etc)
    const tld = parts[parts.length - 1];
    const domainPart = parts[parts.length - 2];

    if (parts.length === 2) {
      // domain.com
      return {
        tld,
        domain: domainPart + '.' + tld
      };
    }

    // subdomain.domain.com
    return {
      tld,
      domain: domainPart + '.' + tld,
      subdomain: parts.slice(0, -2).join('.')
    };
  }

  /**
   * Check if a string is an IP address
   *
   * @private
   * @param hostname - Hostname to check
   * @returns True if hostname is an IP address
   */
  private isIPAddress(hostname: string): boolean {
    // IPv4 regex
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;

    // IPv6 regex (simplified)
    const ipv6Pattern = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;

    return ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname);
  }

  /**
   * Get the base domain without subdomain
   *
   * @param url - URL to extract base domain from
   * @returns Base domain or empty string if invalid
   *
   * @example
   * getBaseDomain('https://blog.example.com') → 'example.com'
   * getBaseDomain('https://example.co.uk') → 'example.co.uk'
   */
  getBaseDomain(url: string): string {
    const parsed = this.parse(url);
    return parsed.isValid ? parsed.domain : '';
  }

  /**
   * Get the full hostname including subdomain
   *
   * @param url - URL to extract hostname from
   * @returns Full hostname or empty string if invalid
   *
   * @example
   * getHostname('https://blog.example.com/path') → 'blog.example.com'
   */
  getHostname(url: string): string {
    const parsed = this.parse(url);
    if (!parsed.isValid) return '';

    return parsed.subdomain
      ? `${parsed.subdomain}.${parsed.domain}`
      : parsed.domain;
  }
}

// Export singleton instance
export const urlParser = new URLParserService();
