# Failure Recovery & Resiliency Guide

This document describes the system behavior and recovery procedures for various failure scenarios during the National Livestock Festival 2026.

## 1. Network & Connectivity Failures

### Scenario: Mobile Data / WiFi Fails at Gate
*   **Behavior**: The scanner detects `navigator.onLine` is false and switches to **OFFLINE MODE**.
*   **Validation**: Scanner uses the local `validationCache` in IndexedDB to verify Ed25519 signatures and check for local revocation/duplicates.
*   **Persistence**: Scans are stored in the `scanQueue` (IndexedDB).
*   **Recovery**: When connection returns, the `processSyncQueue` engine pushes scans sequentially to the `syncScanEvent` Cloud Function using idempotent operation IDs.

### Scenario: Firebase Backend Unavailable
*   **Behavior**: Similar to local network failure; the app treats the backend as unreachable.
*   **Recovery**: Automatic retry logic in `sync-engine.js` will attempt to push the queue once the Firebase heartbeats resume.

## 2. Device & Hardware Failures

### Scenario: Operator Phone Loses Power
*   **Behavior**: Un-synchronized scans remain safely in IndexedDB.
*   **Recovery**: Charging the device and reopening the app will trigger the sync engine. The 4-digit PIN will be required to re-access the scanner.

### Scenario: Browser Crashes / Scanner Refreshes
*   **Behavior**: The PWA service worker ensures the app shell reloads instantly from cache.
*   **State**: Current `selectedGate` and `scanQueue` are persisted in IndexedDB and remain intact across refreshes.

### Scenario: IndexedDB is Cleared by User/System
*   **Risk**: Loss of unsynced scans.
*   **Mitigation**: Service workers and PWA manifests discourage OS "cleanup" of the app. Operators are instructed never to clear browser data during the event.

## 3. Data & Security Anomalies

### Scenario: Ticket Revoked After Offline Caching
*   **Behavior**: If a ticket is revoked while a scanner is offline, the offline scanner may grant entry (as it lacks the revocation update).
*   **Reconciliation**: The `syncScanEvent` function will detect the revocation during sync and mark the event as `REVOKED` in `scanEvents` for audit review.

### Scenario: Two Gates Scan the Same Ticket
*   **Behavior**:
    *   **Online**: Second scan is rejected as `DUPLICATE` by the atomic transaction.
    *   **Offline**: If both are offline, both may grant entry.
    *   **Reconciliation**: The sync engine processes scans in order. The second sync attempt will fail server-side with a `DUPLICATE` status, creating an audit trail for the supervisor.

### Scenario: QR Signing Keys are Rotated
*   **Behavior**: The scanner supports multiple `kid` (Key IDs). 
*   **Transition**: New tickets are signed with `v2`, while the scanner retains `v1` and `v2` public keys until all `v1` tickets expire.
