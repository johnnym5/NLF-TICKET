# Testing & Verification Layer

This document outlines the automated testing strategy for the National Livestock Festival 2026 system.

## 1. Local Development Setup
Ensure the Firebase Emulator is installed and running:
```bash
firebase emulators:start
```

## 2. Test Commands

### Unit Tests (Logic, Crypto, Utils)
```bash
npm run test:unit
```
Covers ticket generation, Ed25519 verification, and date resolution.

### Security Rules Tests (Firestore Permissions)
```bash
npm run test:rules
```
Verifies that attendees, gatekeepers, and admins have exactly the right permissions. Uses the Local Emulator.

### End-to-End Tests (Browser Flows)
```bash
npm run test:e2e
```
Uses Playwright to simulate full user journeys (Registration -> Pass -> Scan).

### Load Tests (Performance Simulation)
```bash
npm run test:load
```
Simulates concurrent registrations (target: 5k/hr) and burst scanning (target: 40/min/gate).

## 3. Acceptance Thresholds
- **Security Rules**: 100% pass rate mandatory.
- **Verification Latency**: P95 < 250ms (measured locally and via Diagnostics).
- **Crypto Integrity**: Zero false positives on tampered signatures.

## 4. CI/CD Integration
The project uses GitHub Actions (`.github/workflows/ci.yml`) to automatically run the test suite on every push.

---
**Note:** PWA/Offline tests should be performed in a browser with "Offline" mode enabled in DevTools to verify IndexedDB persistence and Service Worker caching.
