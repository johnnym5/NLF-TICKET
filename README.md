# National Livestock Festival 2026 — Golden Camel & Cow Carnival
### Public Ticketing, VIP Tiering & Gatekeeper Verification System

Operating in line with the **Renewed Hope Agenda** — Federal Government of Nigeria in collaboration with **Golden Camel and Cow (GCC)**.  
Tagline: *“Everything camel, everything healthy.”*  
Dates: **November 21 – 23, 2026** • Old Parade Ground, Abuja, Nigeria.  
Entry: **100% Free**

---

## Executive Pastel Design System

- **Canvas & Surface**: Soft Cloud Alabaster (`#FBFBFA`), Pure Crisp White Cards with `border-slate-200/60`, Pale Mist Gray insets (`#F4F6F4`).
- **Primary Sage Forest**: Pastel Sage Light (`#D8EADF`), Hover (`#C2DEC9`), Deep Forest Green (`#1E4D38` — AAA accessibility compliant).
- **Secondary Champagne Gold**: Pastel Champagne Cream (`#FEF3D6`), Butter Gold Badges (`#FCE6A8`), Rich Bronze Ochre (`#8D6B1B`).
- **Status Pastels**:
  - Success / First Scan: Background `#DCFCE7`, Text `#166534`, Border `#86EFAC`
  - Duplicate Alert: Background `#FEE2E2`, Text `#991B1B`, Border `#FCA5A5`
  - Pending: Background `#FEF9C3`, Text `#854D0E`, Border `#FDE047`

---

## Recent System Updates & Refinements

- **Location Update**: Venue transitioned from Eagle Square to **Old Parade Ground, Abuja**.
- **Carnival Shift**: Removed all "Expo" and "Summit" academic terminology. The app is now 100% focused on a fun, celebratory **Carnival Experience**.
- **Navigation Redesign**: 
  - Removed fixed Bottom Navigation bar.
  - Removed top-level header links to focus on single-action funnel.
  - Implemented **Direct Stage Linking** (shareable URLs for every view).
- **Iconography**: Removed `Sparkles` system-wide for a cleaner `Info`-centric professional aesthetic.
- **UX Enhancements**:
  - Integrated a giant **Countdown Timer** as the primary landing page focal point.
  - Implemented high-performance **Slide-In/Slide-Out & Fade** animations for the Authentication Modal.
  - Wired the countdown "Action" button directly to the ticket claiming process.
- **Content Expansion**:
  - **Livestock Showcase**: Expanded to include cows, goats, camels, dogs, and more.
  - **Food Pavilion**: Now specifically features **Barbeque, Suya, and Milk Fest**.

---

## Application Routes

1. **`GET /ticker` (Grand Carnival Landing)**:
   - Fun festival introduction with giant countdown timer.
   - Simplified 1-button entry funnel.
   - Dynamic VIP link support: `/ticker?vip=silver` etc.
   - Interactive cards for Livestock Showcase, Suya/Barbeque Fest, and Cultural Gala.

2. **`GET /VIP` (Official Digital Pass)**:
   - Scannable QR ticket with real-time status sync.
   - Displays attendee name, tier, and check-in history.
   - Automated confetti and viral share drawer for new registrations.

3. **`GET /qrscanner` (Gate Staff Verification)**:
   - High-speed camera scanner for gate stewards.
   - Immediate audio/haptic feedback for valid vs. duplicate entry.
   - Automated wristband issuance instructions.

4. **`GET /admin` (Executive Command Hub)**:
   - PIN-protected real-time attendance telemetry.
   - Live turnout rates and searchable attendee directory.
   - Targeted VIP link generator and CSV report export.

---

## Running & Deploying

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Firebase Deployment
```bash
# Deploy both hosting assets and firestore rules
firebase deploy
```
