import { supabase } from '../lib/supabase';

/**
 * executeAtomicCheckIn
 * Invokes the atomic_checkin Postgres RPC with FOR UPDATE row locking.
 */
export async function executeAtomicCheckIn(ticketCode, gateId) {
  const cleanCode = (ticketCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return {
      success: false,
      status: 'INVALID',
      message: 'No ticket code provided.'
    };
  }

  // Default gate ID fallback if gateId is missing or non-UUID
  const validGateId = (gateId && gateId.length === 36)
    ? gateId
    : '11111111-1111-1111-1111-111111111111';

  try {
    const { data, error } = await supabase.rpc('atomic_checkin', {
      p_ticket_code: cleanCode,
      p_gate_id: validGateId
    });

    if (error) {
      console.error('Supabase atomic_checkin RPC error:', error);
      return {
        success: false,
        status: 'INVALID',
        code: cleanCode,
        message: 'DATABASE ERROR: Unable to process atomic check-in.'
      };
    }

    return data;
  } catch (err) {
    console.error('executeAtomicCheckIn error:', err);
    return {
      success: false,
      status: 'INVALID',
      code: cleanCode,
      message: 'SYSTEM ERROR: Check-in service offline or unreachable.'
    };
  }
}
