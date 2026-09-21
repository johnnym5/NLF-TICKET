# Operational Runbook: National Livestock Festival 2026

## Phase 1: Pre-Event Preparation (T-24 Hours)

### 1. Device Preparation
- [ ] Ensure all gate phones are fully charged.
- [ ] Install the PWA on all devices (`Add to Home Screen`).
- [ ] Verify that `html5-qrcode` has camera permissions on each device.

### 2. Operator Setup
- [ ] Verify operator accounts exist in the `operators` collection.
- [ ] Ensure Custom Claims (`gatekeeper` or `gate_supervisor`) are active.
- [ ] Set unique 4-digit PINs on each device.

### 3. Final Readiness Tests
- [ ] **Network Test**: Perform 5 successful online scans.
- [ ] **Offline Test**: Disable WiFi/Data and perform 3 scans. Verify they appear in "QUEUED" status.
- [ ] **Sync Test**: Re-enable network and verify "QUEUED" items change to "SYNCED".

## Phase 2: Live Operation (Event Days 1-3)

### 1. Gate Initialization
- [ ] Operator logins via `Staff Log In`.
- [ ] Confirm correct `Gate Location` is selected in the dropdown.
- [ ] Perform a calibration scan using a test pass.

### 2. Handling Disputes
- **Status: DUPLICATE**: Do NOT admit. Show the user the "Original Scan" time/gate details.
- **Status: REVOKED**: Escalate to `gate_supervisor` immediately.
- **Status: INVALID**: Attempt a manual override entry if the QR is damaged but the physical ID is verified.

### 3. Manual Overrides
- Required for cracked screens or dead batteries.
- Supervisor must enter a **Mandatory Reason** for the audit log.

### 4. Synchronization Monitoring
- Check the `Diagnostics Console` hourly.
- Ensure "QUEUED" counts are decreasing.
- Alert IT if latency exceeds 500ms consistently.

## Phase 3: Post-Event (Final Day + 2 Hours)

### 1. Reconciliation
- [ ] Verify all devices have 0 pending sync items.
- [ ] Trigger "Export CSV" from the `Admin Command Console`.
- [ ] Review `auditLogs` for any suspicious manual overrides.

### 2. System Deactivation
- [ ] Revoke temporary gatekeeper Custom Claims.
- [ ] Clear `validationCache` from IndexedDB on all physical devices.
- [ ] Archive the `scanEvents` collection for the final festival report.
