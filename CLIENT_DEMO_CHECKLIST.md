# Client Demonstration Checklist

This checklist identifies the core flows to be demonstrated to the stakeholders to prove system integrity and PRD compliance.

## 1. Attendee Journey
- [ ] **Public Registration**: Show 1-click Google Auth and Email/Password flows.
- [ ] **Pass Issuance**: Demonstrate that a unique `ticketCode` is generated and displayed on a polished Digital Pass.
- [ ] **VIP Invitation**: Use a valid `invitationId` to register a VIP Gold attendee and show the corresponding wristband instructions.
- [ ] **Secure Tiering**: Demonstrate that changing the URL parameter `?vip=platinum` does NOT grant VIP status to a regular user.

## 2. Gate Verification (Online)
- [ ] **Camera Scanning**: Scan a valid QR code and show the "Entry Approved" success state (<250ms).
- [ ] **Duplicate Prevention**: Re-scan the same QR and show the "FLAGGED: DUPLICATE" alert with historical scan metadata.
- [ ] **Revocation Check**: Administratively revoke a user and show the scanner rejecting the pass.

## 3. Gate Verification (Offline)
- [ ] **Zero-Connectivity Startup**: Load the scanner with Airplane Mode enabled.
- [ ] **Local Validation**: Scan a signed QR offline. Show the "ENTRY APPROVED" state and the "QUEUED" counter incrementing.
- [ ] **Reconnection Sync**: Disable Airplane Mode and show the queued scans automatically syncing to the server with an audit trail.

## 4. Administrative Control
- [ ] **Scalable Dashboard**: Load the Admin Console and show real-time aggregate statistics (turnout, registrations).
- [ ] **Search & Pagination**: Search for an attendee by ticket code or name in a paginated list.
- [ ] **Audited Manual Override**: Perform a manual check-in for an attendee, entering a mandatory reason, and view the resulting audit log.
- [ ] **Secure Export**: Trigger a CSV export of the attendee database (restricted to Executive Admins).

## 5. System Health
- [ ] **Diagnostics Console**: Show real-time telemetry (actual Firestore latency and local scan performance metrics).
- [ ] **PIN Lock**: Demonstrate the 4-digit rapid PIN lock securing the device during a steward handover.
