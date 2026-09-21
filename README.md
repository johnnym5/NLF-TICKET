# National Livestock Festival 2026
## Attendee Pass, VIP Routing & Gate Scanner Platform

> **Platform:** `pass.livestockcarnival.ng`  
> **Event:** National Livestock Festival 2026, Golden Camel & Cow Carnival  
> **Dates:** 21–23 November 2026  
> **Location:** Old Parade Ground, Abuja, Nigeria

---

## 1. Overview

The National Livestock Festival 2026 Attendee Pass, VIP Routing & Gate Scanner Platform is the digital access-control system for the festival.

The platform is designed to manage the attendee journey from registration through digital pass issuance and physical gate verification, while providing authorized operational teams with tools for attendance monitoring and attendee administration.

The product combines:

- Public attendee registration
- Email/password and Google authentication
- Tier-based attendee passes
- VIP access routing
- Digital QR event passes
- Gatekeeper QR scanning
- Duplicate-scan detection
- Multi-day attendance tracking
- Referral and social sharing
- Administrative attendee management
- System diagnostics
- Responsive mobile and desktop interfaces

The interface has been developed toward a **premium, professional software-product standard**, with particular attention to hierarchy, typography, responsive behaviour, operational clarity, animation, micro-interactions, accessibility and consistent visual language.

---

# 2. Product Goals

The platform is intended to provide four primary outcomes:

### Attendee Experience
Allow an attendee to register quickly, receive a digital event pass and present that pass at the venue.

### VIP Experience
Provide controlled tier-specific registration and presentation for VIP attendees.

### Gate Operations
Give gate personnel a fast, clear and mobile-friendly method of validating attendee passes.

### Administrative Visibility
Provide authorized administrators with a centralized view of registrations, attendance and attendee records.

---

# 3. Core User Roles

The platform supports the following operational concepts:

| Role | Purpose |
|---|---|
| Public Attendee | Registers for an event pass and accesses their digital ticket |
| VIP Attendee | Receives a designated VIP pass and tier-specific access presentation |
| Gatekeeper Operator | Uses the mobile scanner to validate attendee passes |
| Gate Supervisor | Handles operational gate issues and authorized overrides |
| Executive Administrator | Manages attendee records and monitors attendance |

> **Security note:** Role and privilege enforcement must ultimately be performed by trusted backend/security controls. Client-side route or UI restrictions are not considered sufficient authorization.

---

# 4. Attendee Pass Tiers

The platform's documented event model contains four primary attendee tiers:

| Tier | Pass Type | Wristband |
|---|---|---|
| `REGULAR` | General Pass | Emerald Green |
| `VIP_SILVER` | VIP Silver | Metallic Silver |
| `VIP_GOLD` | VIP Gold Delegate | Champagne Gold |
| `VIP_PLATINUM` | Platinum Protocol | Obsidian Platinum |

Tier-specific presentation is reflected in the digital pass and attendee instructions.

Access zones and physical privileges should be treated as event-policy data rather than hard-coded assumptions wherever possible.

---

# 5. End-to-End Workflows

## 5.1 Public Attendee Workflow

```text
Landing Page
     ↓
Registration / Authentication
     ↓
Attendee Record
     ↓
Digital Event Pass
     ↓
QR Code
     ↓
Optional Social / Referral Sharing
     ↓
Venue Gate
     ↓
QR Validation
     ↓
Access Result
```

## 5.2 VIP Workflow

```text
VIP Entry Point
     ↓
VIP Registration / Authentication
     ↓
Tier Assignment
     ↓
VIP Digital Pass
     ↓
QR Presentation
     ↓
Gate Validation
     ↓
Tier-Specific Wristband / Access Instruction
```

## 5.3 Gate Verification Workflow

```text
Attendee Presents QR
        ↓
Camera Scanner
        ↓
Ticket Lookup
        ↓
Validation
   ┌────┼────┐
   ↓    ↓    ↓
 VALID DUPLICATE INVALID
   ↓    ↓    ↓
Allow  Reject  Reject
Access
```

The scanner interface is intentionally designed as an operational interface rather than a marketing interface. The primary objective is fast recognition of the result and clear instruction to gate personnel.

---

# 6. Platform Features

## 6.1 Registration & Authentication

The registration experience supports:

- Google authentication
- Email/password authentication
- Attendee identity capture
- Firebase Authentication integration
- Automatic attendee record creation
- Tier-aware registration flow
- Responsive registration interface

The registration experience is intentionally designed to minimize friction while keeping the attendee journey clear.

---

## 6.2 Digital Event Pass

Each registered attendee receives a digital pass containing relevant event-access information.

The pass can present:

- Attendee name
- Ticket code
- Ticket tier
- Wristband information
- QR code
- Registration status
- Check-in status
- Event information
- Gate instructions

The pass is designed to work effectively on mobile devices, where attendees are expected to present it at the venue.

---

## 6.3 QR Ticketing

The application uses QR codes as the attendee-facing mechanism for gate verification.

The current product architecture uses the attendee ticket code as the QR payload.

### Security Architecture

QR representation and ticket security are separate concerns.

A QR code by itself is not a security mechanism. Production deployment therefore requires authoritative server-side ticket issuance, validation and authorization controls.

Security hardening is tracked separately from visual and UX development.

---

## 6.4 Gatekeeper Scanner

The scanner provides a dedicated operational interface for venue personnel.

Capabilities include:

- Rear-camera QR scanning
- Manual ticket-code entry
- Ticket lookup
- Duplicate-scan detection
- Attendee identification
- Tier identification
- Wristband instruction
- Gate identification
- Audio feedback
- Haptic feedback
- Clear success and rejection states

The interface is optimized for rapid use at a physical event gate.

---

## 6.5 Multi-Day Attendance

The event spans three days.

The platform supports day-aware attendance concepts so that event operations can distinguish attendance across the festival period.

The production implementation should ensure that date handling is based on the event's intended local timezone rather than relying blindly on UTC date boundaries.

---

## 6.6 Referral & Sharing

The attendee experience includes a referral/share mechanism intended to allow attendees to share the event with:

- WhatsApp
- X
- Copy Link

The purpose is to make attendee sharing a natural part of the post-registration experience without interrupting access to the attendee's digital pass.

---

## 6.7 Administrative Console

The administrative interface provides tools for authorized personnel to manage attendee records.

Documented capabilities include:

- Attendee directory
- Search
- Tier management
- Access status management
- Ticket management
- Attendance controls
- Data export
- Attendance metrics
- Operational overview

The administration interface is intentionally styled as enterprise software rather than as a public marketing interface.

---

## 6.8 Diagnostics

The platform contains an operational diagnostics interface for monitoring application conditions such as:

- Network state
- Firebase connectivity
- Camera availability
- Authentication state
- Application status

Diagnostics must distinguish between:

- Real measurements
- Client-observed state
- Simulated/demo information
- Unavailable information

No simulated telemetry should be presented as production monitoring.

---

# 7. UI / UX Design System

The platform has been progressively redesigned to move away from a generic AI-generated application aesthetic and toward a premium software-product experience.

## Design Principles

### Premium Through Restraint

The interface does not rely on excessive:

- Gradients
- Glass effects
- Shadows
- Rounded cards
- Decorative icons
- Large animations
- Visual noise

Instead, the design emphasizes:

- Typography
- Spacing
- Hierarchy
- Proportion
- Consistency
- Contrast
- Interaction feedback
- Responsive composition

---

## 7.1 Visual Language

The interface is built around a refined event identity using:

- Deep Federal Green
- Rich dark green
- Champagne / event gold
- White
- Warm neutral surfaces
- Deep charcoal typography

Gold is used as an accent rather than as the dominant interface colour.

Green provides institutional identity and authority.

Neutral surfaces maintain readability and information density.

---

## 7.2 Typography

The interface uses a deliberate typographic hierarchy for:

- Hero headings
- Section headings
- Body text
- Labels
- Metrics
- Ticket information
- Tables
- Buttons
- Status messages

The objective is to make the product feel intentional and professionally designed rather than visually generated from a generic template.

---

## 7.3 Motion & Animation

Motion is used to communicate:

- Navigation
- State changes
- Loading
- Success
- Failure
- Interaction feedback
- Content hierarchy

Animations are intentionally restrained.

The product avoids excessive continuous motion and decorative animation.

Where supported, reduced-motion preferences should be respected.

---

## 7.4 Responsive Design

The platform is designed for:

- Mobile phones
- Tablets
- Laptops
- Desktop displays

Particular attention is given to:

- Mobile registration
- Digital ticket presentation
- QR-code readability
- Scanner operation
- Administrative interfaces
- Navigation
- Modals
- Touch targets

The scanner and attendee pass are treated as mobile-first operational experiences.

---

# 8. Technical Stack

The current implementation is built around:

| Technology | Purpose |
|---|---|
| React | Frontend application |
| Vite | Development and production build tooling |
| JavaScript / JSX | Application code |
| Firebase Authentication | User authentication |
| Cloud Firestore | Attendee data and operational state |
| `html5-qrcode` | Browser camera QR scanning |
| `qrcode.react` | QR-code rendering |
| Tailwind CSS | Utility-based styling |
| Lucide React | Interface iconography |
| Canvas Confetti | Registration feedback |

The project is designed as a web application and can be hosted through Firebase Hosting or another compatible static hosting environment.

---

# 9. Application Structure

The application is organized around reusable components, shared context and feature-specific views.

Conceptual structure:

```text
src/
├── components/
│   ├── AuthModal
│   ├── Navbar
│   ├── StaffLogin
│   ├── CountdownTimer
│   ├── ViralReferralDrawer
│   └── shared UI components
│
├── context/
│   └── AuthContext
│
├── lib/
│   └── Firebase configuration
│
├── utils/
│   ├── Atomic check-in logic
│   └── Audio / feedback utilities
│
├── views/
│   ├── LandingPage
│   ├── DigitalPassView
│   ├── GatekeeperScanner
│   ├── AdminCommandConsole
│   └── DiagnosticsConsole
│
├── App.jsx
├── main.jsx
└── index.css
```

The exact structure may evolve as the design system and production architecture mature.

---

# 10. Main Application Routes

| Route | Purpose |
|---|---|
| `/` | Public event landing / registration experience |
| `/ticket` | Digital attendee pass |
| `/VIP` | VIP-oriented entry point |
| `/qrscanner` | Gatekeeper scanner |
| `/admin` | Administrative console |
| `/diagnostics` | Operational diagnostics |

Route availability should always be paired with server-side authorization where privileged functionality is involved.

---

# 11. Firebase Architecture

The current application uses Firebase for authentication and attendee data.

Primary data model:

```text
attendees/{userId}
```

Representative attendee fields include:

```text
uid
fullName
email
ticketCode
tier
wristbandColor
status
checkedInAt
checkedInFullDate
checkedInBy
daysAttended
referralSource
createdAt
accessRevoked
```

The exact production schema should be treated as an evolving contract and documented whenever it changes.

---

# 12. Check-In Architecture

The scanner uses a transactional check-in process.

Conceptually:

```text
QR Code
   ↓
Ticket Code
   ↓
Attendee Lookup
   ↓
Atomic Validation
   ↓
Access / Duplicate / Invalid Result
   ↓
Attendance Update
```

The transaction model is intended to prevent conflicting check-in writes when multiple gate operators interact with the same attendee record.

For production operation, this must be complemented by:

- Strong authorization
- Idempotency
- Immutable scan records
- Reliable offline reconciliation where required
- Server-authoritative validation
- Audit logging

---

# 13. Security Model

Security is treated as a separate engineering concern from visual UI.

The application currently uses Firebase Authentication and Firestore Security Rules.

Production security hardening should include, where applicable:

- Server-authoritative role assignment
- Strong role-based access control
- Server-side ticket issuance
- Cryptographically verifiable ticket payloads
- Firebase App Check
- Rate limiting / abuse protection
- Immutable audit events
- Restricted data exposure
- Secure environment configuration
- Security Rules testing
- Dependency security scanning
- Monitoring and alerting

Client-side route guards and hidden UI controls must never be considered sufficient authorization.

---

# 14. Performance & Reliability Targets

The product requirements specify the following operational targets:

- Registration concurrency target: up to 5,000 registrations per hour
- Gate scanning target: up to 40 scans per minute per gate
- Target verification response: sub-250ms under appropriate network conditions
- Mobile browser compatibility
- Reliable operation during event-day traffic
- Offline queueing and reconciliation for intermittent connectivity

These are **requirements and targets**, not proof that the current implementation has already passed the corresponding load or resilience tests.

Formal load testing and event-day simulation are required before making production performance claims.

---

# 15. Testing Strategy

The project should be validated at multiple levels.

## Functional Testing

Validate:

- Registration
- Authentication
- Ticket creation
- Ticket display
- QR generation
- QR scanning
- Manual ticket lookup
- Duplicate detection
- Multi-day attendance
- Admin operations
- Referral sharing

## Security Testing

Validate:

- Authentication enforcement
- Authorization enforcement
- Role separation
- Unauthorized reads
- Unauthorized writes
- Privilege escalation attempts
- Client-side manipulation
- Ticket tampering
- Replay scenarios
- Duplicate submissions

## Performance Testing

Validate:

- Registration concurrency
- Gate scan throughput
- Database performance
- Mobile camera performance
- Network degradation
- Reconnection behaviour

## End-to-End Testing

Validate the complete journeys:

```text
Registration
→ Ticket
→ Gate Scan
→ Attendance
→ Admin Visibility
```

and:

```text
VIP Entry
→ VIP Registration
→ VIP Pass
→ Gate Verification
```

---

# 16. Production Readiness

The platform should not be considered production-ready solely because the UI looks complete or the application runs locally.

Production readiness requires evidence for:

- Functional correctness
- Authorization
- Data integrity
- Security
- Performance
- Reliability
- Offline behaviour where required
- Automated testing
- Security Rules testing
- Load testing
- Deployment configuration
- Monitoring
- Backup / recovery
- Operational procedures

The project therefore distinguishes between:

| Stage | Meaning |
|---|---|
| Prototype | Concept or early implementation |
| Demo Ready | Suitable for presentation |
| UAT Ready | Suitable for controlled user acceptance testing |
| Controlled Deployment | Suitable for limited operational use |
| Production Ready | Appropriate verification has been completed for live operation |

---

# 17. Known Engineering Hardening Areas

The current product direction includes several areas that require explicit production hardening before live event deployment.

These include:

1. Server-authoritative VIP entitlement
2. Secure ticket issuance
3. Cryptographically verifiable QR payloads
4. Strong role-based authorization
5. Offline scan queue and reconciliation
6. Immutable scan event history
7. App Check and abuse protection
8. Automated tests
9. Firestore Security Rules tests
10. Load and concurrency testing
11. Production monitoring
12. Backup and recovery procedures
13. Paginated / scalable administrative data access
14. Accurate production diagnostics
15. CI/CD and deployment controls

These are engineering requirements, not UI defects.

---

# 18. Development Principles

Development follows these principles:

### Understand Before Coding
Requirements and workflows must be understood before major implementation.

### Ask Before Guessing
Security-, architecture-, data- or scope-critical uncertainty must be resolved rather than silently assumed.

### Keep Business Logic Separate From Presentation
Visual redesign should not silently alter security-sensitive or operational behaviour.

### Prefer Reusable Components
Repeated UI and application patterns should be centralized where practical.

### Test Before Claiming
A generated feature is not considered verified until it has been tested.

### Security Is Not a UI Feature
Hiding a button or route does not constitute authorization.

### Document Important Decisions
Significant architecture, security and data decisions should remain traceable.

### Preserve Working Functionality
Refactoring should not introduce unnecessary regressions.

---

# 19. Development Commands

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Create production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

# 20. Environment & Configuration

Firebase configuration is required for authentication and Firestore functionality.

Production deployments should use environment-specific configuration and must never expose privileged server credentials in the client application.

Recommended environments:

```text
Development
    ↓
Staging / UAT
    ↓
Production
```

Production data should not be casually used during development.

---

# 21. Deployment Checklist

Before production deployment:

- [ ] Production Firebase project configured
- [ ] Authentication providers verified
- [ ] Firestore rules reviewed
- [ ] Security Rules tests passed
- [ ] Role authorization verified
- [ ] Ticket issuance verified
- [ ] QR validation verified
- [ ] Duplicate scan behaviour verified
- [ ] Multi-day attendance verified
- [ ] Offline/reconnection behaviour verified
- [ ] Load testing completed
- [ ] Mobile camera testing completed
- [ ] Browser compatibility tested
- [ ] Monitoring configured
- [ ] Error reporting configured
- [ ] Backup strategy verified
- [ ] Restore procedure tested
- [ ] Production environment variables configured
- [ ] Deployment rollback procedure documented
- [ ] Event-day support procedure documented

---

# 22. Event-Day Operational Considerations

The system is intended for a physical event environment where:

- Users may have low battery
- Mobile networks may become congested
- Attendee phones may have damaged screens
- Gate staff may need rapid decisions
- Multiple gates may operate simultaneously
- Duplicate presentation attempts may occur
- VIP and general access may need different handling

The scanner interface therefore prioritizes:

**READABILITY → SPEED → RESULT → ACTION**

rather than decorative interaction.

---

# 23. Product Philosophy

This platform is being built as a real operational software product, not merely as a demonstration website.

The product standard is:

> **Premium through precision, not decoration.**

The interface should be visually polished, but the engineering standard must extend beyond the interface.

A professional product must be:

- understandable
- secure
- maintainable
- testable
- observable
- resilient
- scalable
- operationally defensible

---

# 24. Project Status

**Current phase:** Active development and production hardening.

The UI/UX layer is being refined toward a premium production-grade software experience.

Core application capabilities are implemented, while deeper production requirements such as hardened authorization, cryptographic ticket security, offline reconciliation, automated testing, load testing and operational monitoring require formal verification before live event deployment.

---

# 25. License & Ownership

This project is developed for the National Livestock Festival 2026 digital ecosystem.

Unless otherwise specified by the project owner or contract, source code, design assets, event data and deployment configuration should be treated as project-confidential.

---

## National Livestock Festival 2026

**Attendee Pass • VIP Routing • Gate Scanner**

`pass.livestockcarnival.ng`
