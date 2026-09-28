import { supabase } from '../lib/supabase';

export async function executeAtomicCheckIn(ticketCode, gateName) {
  const cleanCode = (ticketCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return { status: 'INVALID', message: 'No ticket code provided.' };
  }

  try {
    const { data, error } = await supabase.rpc('atomic_checkin', {
      p_ticket_code: cleanCode,
      p_gate_name: gateName
    });

    if (error) {
      console.error('Supabase atomic_checkin RPC error:', error);
      return {
        status: 'INVALID',
        code: cleanCode,
        message: 'DATABASE ERROR: Unable to process atomic check-in.'
      };
    }

    return data;
  } catch (err) {
    console.error('executeAtomicCheckIn error:', err);
    return {
      status: 'INVALID',
      code: cleanCode,
      message: 'SYSTEM ERROR: Check-in service offline or unreachable.'
    };
  }
}
