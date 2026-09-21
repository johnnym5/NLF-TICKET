import Dexie from 'dexie';

export const localDB = new Dexie('GCC_GateScanner_Local');

localDB.version(1).stores({
  // validationCache: Offline credential verification
  // Stores: ticketId (tid), uid, tier, wristband, exp, status, accessRevoked, signedPayload
  validationCache: 'tid, uid, status',

  // scanQueue: Queued scans to be synced
  // Stores: operationId, tid, uid, timestamp, gateId, operatorUid, syncStatus
  scanQueue: 'operationId, tid, uid, timestamp, syncStatus',

  // config: Local scanner configuration
  // Stores: key, value
  config: 'key',

  // performanceLogs: Measured timings
  // Stores: id, event, duration, timestamp
  performanceLogs: '++id, event, timestamp'
});

export const getConfig = async (key, defaultValue = null) => {
  const item = await localDB.config.get(key);
  return item ? item.value : defaultValue;
};

export const setConfig = async (key, value) => {
  await localDB.config.put({ key, value });
};
