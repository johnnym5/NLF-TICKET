import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { localDB, setConfig, getConfig } from '../lib/db-local';

/**
 * syncValidationDataset
 * Fetches authorized attendee data from server and updates local cache.
 */
export async function syncValidationDataset() {
  try {
    const getDataset = httpsCallable(functions, 'getValidationDataset');
    const result = await getDataset();
    const { dataset, timestamp } = result.data;

    // Atomic update of the local cache
    await localDB.transaction('rw', localDB.validationCache, async () => {
      await localDB.validationCache.clear();
      await localDB.validationCache.bulkAdd(dataset);
    });

    await setConfig('last_sync_timestamp', timestamp);
    console.log(`Sync complete: ${dataset.length} records cached.`);
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
 * Sequentially pushes pending scans to the server.
 */
export async function processSyncQueue() {
  const pending = await localDB.scanQueue
    .where('syncStatus')
    .equals('PENDING')
    .sortBy('timestamp');

  if (pending.length === 0) return;

  const syncScanEvent = httpsCallable(functions, 'syncScanEvent');

  for (const item of pending) {
    try {
      await localDB.scanQueue.update(item.operationId, { syncStatus: 'SYNCING' });

      const result = await syncScanEvent({
        operationId: item.operationId,
        ticketId: item.tid,
        uid: item.uid,
        gateId: item.gateId,
        timestamp: item.timestamp,
        eventDay: item.eventDay,
        source: 'OFFLINE'
      });

      if (result.data.success) {
        await localDB.scanQueue.update(item.operationId, { syncStatus: 'SYNCED' });
      } else {
        // Log error and keep in queue
        await localDB.scanQueue.update(item.operationId, {
          syncStatus: 'FAILED',
          lastError: result.data.message
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
