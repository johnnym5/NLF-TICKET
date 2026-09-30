import { describe, it, expect, beforeEach } from 'vitest';
import { sanitizeText, sanitizeObject } from '../src/utils/sanitizer';
import { rateLimiter, checkRateLimit } from '../src/utils/rate-limiter';

describe('Sanitizer Security Utility', () => {
  it('strips script tags and malicious attributes', () => {
    const input = '<script>alert("xss")</script>John Doe';
    expect(sanitizeText(input)).toBe('John Doe');
  });

  it('escapes HTML entity characters', () => {
    const input = '<b>Hello & "Welcome"</b>';
    expect(sanitizeText(input)).toBe('&lt;b&gt;Hello &amp; &quot;Welcome&quot;&lt;&#x2F;b&gt;');
  });

  it('recursively sanitizes nested objects', () => {
    const data = {
      name: '<script>xss()</script>Alice',
      details: {
        email: 'user@example.com<iframe src="evil.com"></iframe>'
      }
    };
    const clean = sanitizeObject(data);
    expect(clean.name).toBe('Alice');
    expect(clean.details.email).toBe('user@example.com');
  });
});

describe('Rate Limiter Utility', () => {
  beforeEach(() => {
    rateLimiter.reset('test_action');
  });

  it('allows requests within limit and blocks when threshold is exceeded', () => {
    expect(checkRateLimit('test_action', 3, 60000)).toBe(true);
    expect(checkRateLimit('test_action', 3, 60000)).toBe(true);
    expect(checkRateLimit('test_action', 3, 60000)).toBe(true);

    expect(() => checkRateLimit('test_action', 3, 60000)).toThrow(/Too many requests/);
  });
});
