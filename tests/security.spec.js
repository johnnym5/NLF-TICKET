import { describe, it, expect, vi } from 'vitest';
import { verifySignedTicket } from '../src/utils/qr-verify';

describe('Security Layer Attacks', () => {
  it('Should reject forged signature', () => {
    const malformed = btoa(JSON.stringify({
      v: 1,
      tid: 'TICKET-1',
      uid: 'user1',
      sig: 'forge-sig'
    }));
    const result = verifySignedTicket(malformed);
    expect(result.valid).toBe(false);
  });

  it('Should reject expired ticket', () => {
    const expired = btoa(JSON.stringify({
      v: 1,
      tid: 'TICKET-1',
      uid: 'user1',
      exp: Math.floor(Date.now() / 1000) - 10,
      eid: 'GCC2026',
      sig: 'valid-looking-but-will-fail-check'
    }));
    const result = verifySignedTicket(expired);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('TICKET_EXPIRED');
  });

  it('Should reject wrong event ID', () => {
    const wrongEvent = btoa(JSON.stringify({
      v: 1,
      tid: 'TICKET-1',
      uid: 'user1',
      exp: Math.floor(Date.now() / 1000) + 1000,
      eid: 'HACKER-FEST',
      sig: 'sig'
    }));
    const result = verifySignedTicket(wrongEvent);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('WRONG_EVENT');
  });
});
