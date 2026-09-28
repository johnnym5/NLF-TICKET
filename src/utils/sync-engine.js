import { supabase } from '../lib/supabase';
import { localDB, setConfig, getConfig } from '../lib/db-local';
import { executeAtomicCheckIn } from './atomic-checkin';

/**
 * syncValidationDataset
 * Fetches authorized attendee data from Supabase and updates local cache.
 */
export async function syncValidationDataset() {
  try {
    const { data: dataset, error } = await supabase
      .from('tickets')
      .select('*');

    if (error) throw error;

    const timestamp = new Date().toISOString();

    // Atomic update of the local cache
    await localDB.transaction('rw', localDB.validationCache, async () => {
      await localDB.validationCache.clear();
      await localDB.validationCache.bulkAdd(dataset || []);
    });

    await setConfig('last_sync_timestamp', timestamp);
    console.log(`Sync complete: ${(dataset || []).length} records cached.`);
    return true;
  } catch (err) {
    console.error('Validation dataset sync failed:', err);
    return false;
  }
}

/**
 * queueScan
 * Records a scan event locally.
 */
export async function queueScan(scanData) {
  const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const item = {
    operationId,
    ...scanData,
    syncStatus: 'PENDING',
    retryCount: 0
  };
  await localDB.scanQueue.add(item);
  return operationId;
}

/**
 * processSyncQueue
 * Sequentially pushes pending scans to Supabase via RPC.
 */
export async function processSyncQueue() {
  const pending = await localDB.scanQueue
    .where('syncStatus')
    .equals('PENDING')
    .sortBy('timestamp');

  if (pending.length === 0) return;

  for (const item of pending) {
    try {
      await localDB.scanQueue.update(item.operationId, { syncStatus: 'SYNCING' });

      const result = await executeAtomicCheckIn(
        item.tid || item.ticketId,
        item.gateId
      );

      if (result?.success || result?.status === 'VALID' || result?.status === 'DUPLICATE') {
        await localDB.scanQueue.update(item.operationId, { syncStatus: 'SYNCED' });
      } else {
        await localDB.scanQueue.update(item.operationId, {
          syncStatus: 'FAILED',
          lastError: result?.message || 'Sync failed'
        });
      }
    } catch (err) {
      console.error(`Failed to sync scan ${item.operationId}:`, err);
      await localDB.scanQueue.update(item.operationId, {
        syncStatus: 'PENDING',
        retryCount: (item.retryCount || 0) + 1,
        lastError: err.message
      });
      // Stop sequential processing if network fails again
      break;
    }
  }
}
