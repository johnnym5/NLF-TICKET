import { describe, it, expect } from 'vitest';
import { getRoundTicketCount } from './LandingPage';

describe('getRoundTicketCount', () => {
  it('returns fallback "10+" when count is 0 or invalid', () => {
    expect(getRoundTicketCount(0)).toBe('10+');
    expect(getRoundTicketCount(null)).toBe('10+');
    expect(getRoundTicketCount(undefined)).toBe('10+');
  });

  it('returns exact dynamic ticket count as a string when tickets exist', () => {
    expect(getRoundTicketCount(1)).toBe('1');
    expect(getRoundTicketCount(12)).toBe('12');
    expect(getRoundTicketCount(105)).toBe('105');
    expect(getRoundTicketCount(520)).toBe('520');
  });
});
