/**
 * Universal URL Parser Service - Test Suite
 * 50+ test cases covering all edge cases and international TLDs
 */

import { URLParserService } from './url-parser.service';

describe('URLParserService', () => {
  let parser: URLParserService;

  beforeEach(() => {
    parser = new URLParserService();
  });

  describe('Basic URL Parsing', () => {
    test('should parse simple domain', () => {
      const result = parser.parse('example.com');
      expect(result.isValid).toBe(true);
      expect(result.domain).toBe('example.com');
      expect(result.tld).toBe('com');
      expect(result.protocol).toBe('https');
    });

    test('should parse domain with www', () => {
      const result = parser.parse('www.example.com');
      expect(result.isValid).toBe(true);
      expect(result.domain).toBe('example.com');
      expect(result.subdomain).toBe('www');
    });

    test('should parse domain with http protocol', () => {
      const result = parser.parse('http://example.com');
      expect(result.isValid).toBe(true);
      expect(result.protocol).toBe('http');
    });

    test('should parse domain with https protocol', () => {
      const result = parser.parse('https://example.com');
      expect(result.isValid).toBe(true);
      expect(result.protocol).toBe('https');
    });

    test('should parse domain with path', () => {
      const result = parser.parse('https://example.com/path/to/page');
      expect(result.isValid).toBe(true);
      expect(result.path).toBe('/path/to/page');
    });

    test('should parse domain with query string', () => {
      const result = parser.parse('https://example.com?param=value');
      expect(result.isValid).toBe(true);
      expect(result.path).toContain('?param=value');
    });

    test('should parse domain with hash', () => {
      const result = parser.parse('https://example.com#section');
      expect(result.isValid).toBe(true);
      expect(result.path).toContain('#section');
    });

    test('should parse domain with port', () => {
      const result = parser.parse('example.com:8080');
      expect(result.isValid).toBe(true);
      expect(result.port).toBe(8080);
    });
  });

  describe('Subdomain Handling', () => {
    test('should parse single subdomain', () => {
      const result = parser.parse('blog.example.com');
      expect(result.subdomain).toBe('blog');
      expect(result.domain).toBe('example.com');
    });

    test('should parse multiple subdomains', () => {
      const result = parser.parse('api.v2.example.com');
      expect(result.subdomain).toBe('api.v2');
      expect(result.domain).toBe('example.com');
    });

    test('should parse deep subdomain hierarchy', () => {
      const result = parser.parse('a.b.c.d.example.com');
      expect(result.subdomain).toBe('a.b.c.d');
      expect(result.domain).toBe('example.com');
    });
  });

  describe('International TLDs', () => {
    test('should parse UK domain (.co.uk)', () => {
      const result = parser.parse('example.co.uk');
      expect(result.isValid).toBe(true);
      expect(result.domain).toBe('example.co.uk');
      expect(result.tld).toBe('co.uk');
    });

    test('should parse Australian domain (.com.au)', () => {
      const result = parser.parse('example.com.au');
      expect(result.domain).toBe('example.com.au');
      expect(result.tld).toBe('com.au');
    });

    test('should parse New Zealand domain (.co.nz)', () => {
      const result = parser.parse('example.co.nz');
      expect(result.tld).toBe('co.nz');
    });

    test('should parse Japanese domain (.co.jp)', () => {
      const result = parser.parse('example.co.jp');
      expect(result.tld).toBe('co.jp');
    });

    test('should parse Brazilian domain (.com.br)', () => {
      const result = parser.parse('example.com.br');
      expect(result.tld).toBe('com.br');
    });

    test('should parse German domain (.de)', () => {
      const result = parser.parse('example.de');
      expect(result.tld).toBe('de');
    });

    test('should parse French domain (.fr)', () => {
      const result = parser.parse('example.fr');
      expect(result.tld).toBe('fr');
    });

    test('should parse Spanish domain (.es)', () => {
      const result = parser.parse('example.es');
      expect(result.tld).toBe('es');
    });

    test('should parse UK academic domain (.ac.uk)', () => {
      const result = parser.parse('example.ac.uk');
      expect(result.tld).toBe('ac.uk');
    });

    test('should parse UK government domain (.gov.uk)', () => {
      const result = parser.parse('example.gov.uk');
      expect(result.tld).toBe('gov.uk');
    });
  });

  describe('International TLDs with Subdomains', () => {
    test('should parse UK domain with subdomain', () => {
      const result = parser.parse('www.example.co.uk');
      expect(result.domain).toBe('example.co.uk');
      expect(result.subdomain).toBe('www');
      expect(result.tld).toBe('co.uk');
    });

    test('should parse Australian domain with subdomain', () => {
      const result = parser.parse('shop.example.com.au');
      expect(result.domain).toBe('example.com.au');
      expect(result.subdomain).toBe('shop');
    });

    test('should parse complex subdomain with multi-part TLD', () => {
      const result = parser.parse('api.v2.example.co.uk');
      expect(result.domain).toBe('example.co.uk');
      expect(result.subdomain).toBe('api.v2');
      expect(result.tld).toBe('co.uk');
    });
  });

  describe('Edge Cases', () => {
    test('should handle localhost', () => {
      const result = parser.parse('localhost');
      expect(result.isValid).toBe(true);
      expect(result.tld).toBe('localhost');
    });

    test('should handle localhost with port', () => {
      const result = parser.parse('localhost:3000');
      expect(result.isValid).toBe(true);
      expect(result.port).toBe(3000);
    });

    test('should handle IPv4 address', () => {
      const result = parser.parse('192.168.1.1');
      expect(result.isValid).toBe(true);
      expect(result.tld).toBe('ip');
    });

    test('should handle IPv4 with port', () => {
      const result = parser.parse('192.168.1.1:8080');
      expect(result.isValid).toBe(true);
      expect(result.port).toBe(8080);
    });

    test('should handle protocol-relative URL', () => {
      const result = parser.parse('//example.com');
      expect(result.isValid).toBe(true);
      expect(result.protocol).toBe('https');
    });

    test('should handle uppercase protocol', () => {
      const result = parser.parse('HTTPS://example.com');
      expect(result.protocol).toBe('https');
    });

    test('should handle trailing slash', () => {
      const result = parser.parse('example.com/');
      expect(result.isValid).toBe(true);
    });

    test('should handle multiple trailing slashes', () => {
      const result = parser.parse('example.com///');
      expect(result.isValid).toBe(true);
    });
  });

  describe('URL Normalization', () => {
    test('should add https protocol to bare domain', () => {
      const result = parser.normalize('example.com');
      expect(result).toBe('https://example.com');
    });

    test('should keep existing https protocol', () => {
      const result = parser.normalize('https://example.com');
      expect(result).toBe('https://example.com');
    });

    test('should keep existing http protocol', () => {
      const result = parser.normalize('http://example.com');
      expect(result).toBe('http://example.com');
    });

    test('should normalize protocol-relative URL', () => {
      const result = parser.normalize('//example.com');
      expect(result).toBe('https://example.com');
    });

    test('should remove trailing slash', () => {
      const result = parser.normalize('example.com/');
      expect(result).toBe('https://example.com');
    });

    test('should lowercase protocol', () => {
      const result = parser.normalize('HTTPS://example.com');
      expect(result).toBe('https://example.com');
    });
  });

  describe('Validation', () => {
    test('should validate correct URL', () => {
      expect(parser.validate('https://example.com')).toBe(true);
    });

    test('should validate domain without protocol', () => {
      expect(parser.validate('example.com')).toBe(true);
    });

    test('should reject empty string', () => {
      expect(parser.validate('')).toBe(false);
    });

    test('should reject whitespace-only string', () => {
      expect(parser.validate('   ')).toBe(false);
    });

    test('should reject invalid characters', () => {
      expect(parser.validate('not a url')).toBe(false);
    });
  });

  describe('Helper Methods', () => {
    test('getBaseDomain should extract domain', () => {
      expect(parser.getBaseDomain('https://blog.example.com/path')).toBe('example.com');
    });

    test('getBaseDomain should handle multi-part TLD', () => {
      expect(parser.getBaseDomain('https://www.example.co.uk')).toBe('example.co.uk');
    });

    test('getHostname should include subdomain', () => {
      expect(parser.getHostname('https://blog.example.com')).toBe('blog.example.com');
    });

    test('getHostname should return domain when no subdomain', () => {
      expect(parser.getHostname('https://example.com')).toBe('example.com');
    });
  });

  describe('Error Handling', () => {
    test('should return error for empty URL', () => {
      const result = parser.parse('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle malformed URL gracefully', () => {
      const result = parser.parse('ht!tp://bad url');
      expect(result.isValid).toBe(false);
    });
  });
});
