# Cryptographic QR Security Specification

## Overview
The National Livestock Festival 2026 Attendee Pass system uses a cryptographically signed QR code to prevent ticket forgery and tampering. This document outlines the signing algorithm, payload structure, and verification process.

## Signing Algorithm
- **Algorithm**: Ed25519 (Edwards-curve Digital Signature Algorithm).
- **Reasoning**: Ed25519 provides high security with small signature sizes (64 bytes), which is critical for keeping QR codes scannable on mobile devices with low-quality cameras. It is also extremely fast for verification on client devices.

## Key Management
- **Private Key**: Stored securely in Firebase Functions Secrets (`QR_SECRET_KEY`). It is NEVER exposed to the frontend or stored in public datastores.
- **Public Key**: Distributed within the authorized Gatekeeper Scanner application bundle.
- **Key Rotation**: The payload includes a `kid` (Key ID) field. In the event of a compromise, a new keypair can be generated, and the scanner will be updated to support multiple active keys until the old ones expire.

## Payload Structure
The QR code contains a Base64-encoded JSON string (conceptually). To minimize size, short keys are used:

| Key | Name | Description |
| :--- | :--- | :--- |
| `v` | Version | Protocol version (current: 1) |
| `tid` | Ticket ID | Unique identifier for the ticket |
| `uid` | User ID | The Firebase Auth UID of the owner |
| `t` | Tier | Attendee tier (REGULAR, VIP_GOLD, etc.) |
| `iat` | Issued At | Unix timestamp (seconds) when the ticket was signed |
| `exp` | Expires At | Unix timestamp (seconds) after which the QR is invalid |
| `eid` | Event ID | Identifier for the 2026 Festival (`GCC2026`) |
| `kid` | Key ID | ID of the public key used for verification |
| `sig` | Signature | Ed25519 signature of the concatenated payload fields |

### Signing Process
1. Data fields are sorted and concatenated into a canonical string.
2. The string is signed using the Ed25519 private key.
3. The signature is Base64 encoded and added to the payload.
4. The entire JSON object is Base64 encoded for the QR.

## Verification Process
1. **Local Signature Check**: The scanner decodes the QR and verifies the `sig` using the embedded public key.
2. **Structural Validation**: Ensure `eid` matches the current festival and `exp` hasn't passed.
3. **Firestore Synchronization**:
    - **Online**: The scanner checks Firestore to ensure the `tid` exists, hasn't been `REVOKED`, and hasn't been scanned for the current day.
    - **Offline**: The scanner validates the signature and queues the scan. Revocation checks are deferred until sync, unless a local "blacklist" cache is available.

## Ticket Replacement & Revocation
- **Replacement**: When a ticket is reset, a new `tid` is generated. The previous `tid` is marked as `EXPIRED` in Firestore.
- **Revocation**: Admins can set `accessRevoked: true` on an attendee record. The `executeAtomicCheckIn` transaction will reject any scan for that UID regardless of QR validity.

## Security Limitations
- **Physical Sharing**: Cryptographic signing prevents *modification* of a ticket but does not prevent a user from physically sharing their screen or a screenshot with another person. This is mitigated by:
    - **Wristband Issuance**: The scanner instructs the steward to issue a physical wristband once.
    - **Duplicate Scan Prevention**: The system rejects multiple scans for the same ticket on the same day.
- **Offline Revocation Delay**: A revoked ticket might be accepted by an offline scanner if the revocation happened after the scanner's last sync.
