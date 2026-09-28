import { describe, it, expect } from 'vitest';
import { formatTicketBannerText } from './LandingPage';

describe('formatTicketBannerText', () => {
  it('formats banner for unauthenticated user with 0 tickets', () => {
    expect(formatTicketBannerText(0, false)).toBe('BE THE FIRST TO CLAIM YOUR FREE FESTIVAL PASS');
  });

  it('formats banner for unauthenticated user with tickets', () => {
    expect(formatTicketBannerText(1, false)).toBe('1 PERSON HAS ALREADY GOTTEN THEIR TICKET');
    expect(formatTicketBannerText(15, false)).toBe('JOIN 15 PEOPLE WHO HAVE ALREADY GOTTEN THEIR TICKET');
  });

  it('formats banner for logged in ticket holder', () => {
    expect(formatTicketBannerText(1, true)).toBe('YOU ALREADY HAVE YOUR OFFICIAL FESTIVAL PASS');
    expect(formatTicketBannerText(2, true)).toBe('YOU AND 1 OTHER HAVE ALREADY GOTTEN THEIR TICKET');
    expect(formatTicketBannerText(15, true)).toBe('YOU AND 14 OTHERS HAVE ALREADY GOTTEN THEIR TICKETS');
  });
});
