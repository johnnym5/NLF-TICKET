import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Fix undici/jsdom compatibility in CI environments
if (typeof globalThis !== 'undefined') {
  try {
    // Provide polyfill for markAsUncloneable if missing in undici
    const globalWebidl = globalThis.webidl || {};
    if (!globalWebidl.util) globalWebidl.util = {};
    if (!globalWebidl.util.markAsUncloneable) {
      globalWebidl.util.markAsUncloneable = () => {};
    }
    globalThis.webidl = globalWebidl;
  } catch (e) {}
}

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithOAuth: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: { status: 'VALID' }, error: null }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  })),
}));
