import { describe, it, expect } from 'vitest';
import { getRoundTicketCount } from './LandingPage';

describe('getRoundTicketCount', () => {
  it('rounds numbers 0 through 10 to "10+"', () => {
    expect(getRoundTicketCount(0)).toBe('10+');
    expect(getRoundTicketCount(1)).toBe('10+');
    expect(getRoundTicketCount(5)).toBe('10+');
    expect(getRoundTicketCount(10)).toBe('10+');
  });

  it('rounds numbers between 11 and 50 to nearest 10 ending in "+"', () => {
    expect(getRoundTicketCount(12)).toBe('10+');
    expect(getRoundTicketCount(25)).toBe('20+');
    expect(getRoundTicketCount(49)).toBe('40+');
    expect(getRoundTicketCount(50)).toBe('50+');
  });

  it('rounds numbers between 101 and 250 appropriately', () => {
    expect(getRoundTicketCount(105)).toBe('100+');
    expect(getRoundTicketCount(249)).toBe('200+');
    expect(getRoundTicketCount(265)).toBe('250+');
  });

  it('handles higher figures', () => {
    expect(getRoundTicketCount(520)).toBe('500+');
    expect(getRoundTicketCount(1250)).toBe('1000+');
  });
});
