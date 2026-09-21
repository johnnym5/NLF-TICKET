# Implementation Roadmap: GCC Attendee Pass & Gate Scanner

## Current Progress
- [x] Stage 1: Security Hardening & Server-Authoritative Roles
- [x] Stage 2: Cryptographic QR & Secure Verification
- [x] Stage 3: Offline Resiliency (PWA & IndexedDB)
- [x] Stage 4: Admin Scalability & Auditability
- [ ] Stage 5: Production Polish & Rapid Access

---

## Stage 1: Security Hardening & Server-Authoritative Roles
**Objective:** Prevent unauthorized VIP tier assignment and replace hardcoded role logic.

*   **Affected Files:**
    *   `src/context/AuthContext.jsx` (Modify `ensureAttendeeDoc`)
    *   `firestore.rules` (Update to use role-based checks)
    *   [NEW] `src/hooks/useAdmin.js` (For clean role detection)
*   **Database/Schema Changes:**
    *   Add `roles` field to `attendees` (or use Custom Claims).
    *   Create `operators` collection for gatekeeper management.
*   **Security Changes:**
    *   Restrict `create` in Firestore rules to prevent `tier` manipulation.
    *   Implement server-side tier validation (via Firebase Functions or stricter rules).
*   **Tests Required:**
    *   Firestore Rules unit tests for `create` and `update` permissions.
    *   Auth integration tests.
*   **Acceptance Criteria:**
    *   Registered users cannot change their `tier` via the browser console.
    *   Admin access is restricted to verified accounts in the `operators` collection.

---

## Stage 2: Cryptographic QR & Secure Verification
**Objective:** Ensure QR codes cannot be forged or tampered with.

*   **Affected Files:**
    *   `src/utils/crypto.js` [NEW] (HMAC signing logic)
    *   `src/views/DigitalPassView.jsx` (Generate signed QR)
    *   `src/utils/atomic-checkin.js` (Verify signature before transaction)
*   **Database/Schema Changes:**
    *   None.
*   **Security Changes:**
    *   QR value changes from `ticketCode` to `ticketCode:signature`.
*   **Tests Required:**
    *   Unit tests for signature generation and verification.
    *   Tamper detection tests (modifying ticket code in QR).
*   **Acceptance Criteria:**
    *   Scanner rejects QR codes that do not have a valid server-side signature.

---

## Stage 3: Offline Resiliency (PWA & IndexedDB)
**Objective:** Support scanning in zero-connectivity environments at the festival gates.

*   **Affected Files:**
    *   `vite.config.js` (Add `vite-plugin-pwa`)
    *   `src/lib/db-local.js` [NEW] (IndexedDB setup using Dexie)
    *   `src/views/GatekeeperScanner.jsx` (Switch to local queue when offline)
    *   `src/utils/sync-engine.js` [NEW] (Background sync and reconciliation)
*   **Database/Schema Changes:**
    *   Add `localSyncStatus` to scan records.
*   **Security Changes:**
    *   Ensure signed QR verification works offline (requires public key or shared secret in app bundle).
*   **Tests Required:**
    *   Offline scan simulation tests.
    *   Conflict resolution tests (simultaneous online/offline scans).
*   **Acceptance Criteria:**
    *   App remains functional when `navigator.onLine` is false.
    *   Scans are queued locally and synced automatically when connectivity returns.

---

## Stage 4: Admin Scalability & Auditability
**Objective:** Support 5,000+ users without performance degradation and track administrative actions.

*   **Affected Files:**
    *   `src/views/AdminCommandConsole.jsx` (Implement pagination and server-side filtering)
    *   `src/utils/logger.js` [NEW] (Audit logging utility)
*   **Database/Schema Changes:**
    *   [NEW] `auditLogs` collection.
    *   [NEW] `scanEvents` collection (Move history out of `attendees`).
*   **Security Changes:**
    *   Strict rules for `auditLogs` (Create only, no delete).
*   **Tests Required:**
    *   Load tests for admin data fetching.
    *   Audit trail verification.
*   **Acceptance Criteria:**
    *   Admin console loads in < 1s with 5,000 records.
    *   Every manual override is recorded in `auditLogs`.

---

## Stage 5: Production Polish & Rapid Access
**Objective:** Finalize UX for gate operators and prepare for deployment.

*   **Affected Files:**
    *   `src/components/PinLock.jsx` [NEW] (4-digit rapid PIN entry)
    *   `src/views/GatekeeperScanner.jsx` (Integrate PIN lock)
    *   `firebase.json` (Add security headers, CSP, App Check)
*   **Database/Schema Changes:**
    *   Add `operatorPin` to `operators`.
*   **Security Changes:**
    *   Enable Firebase App Check.
*   **Tests Required:**
    *   End-to-End (E2E) testing of the entire flow.
    *   App Check enforcement verification.
*   **Acceptance Criteria:**
    *   Gatekeepers can re-lock the scanner with a 4-digit PIN for rapid handovers.
    *   Production URL scores "A" on security header audits.

---

## Rollback Considerations
*   **Database:** Use Firestore backups/exports before schema migrations.
*   **Deployment:** Use Firebase Hosting versions for instant rollback to previous stable builds.
*   **Offline:** Implement a "Force Sync" button in the admin/diagnostics view to resolve stuck queues.
