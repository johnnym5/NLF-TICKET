# National Livestock Festival 2026
## Attendee Pass, VIP Routing & Gate Scanner Platform

> **Platform:** `pass.livestockcarnival.ng`  
> **Event:** National Livestock Festival 2026, Golden Camel & Cow Carnival  
> **Dates:** 21–23 November 2026  
> **Location:** Old Parade Ground, Abuja, Nigeria

---

## 1. Overview

The National Livestock Festival 2026 Attendee Pass, VIP Routing & Gate Scanner Platform is the official digital access-control, accreditation, and event operations system for the festival.

The platform manages the complete attendee lifecycle—from public registration and Google OAuth authentication through digital QR pass issuance, VIP guest roster allocation, physical gate verification, and enterprise admin telemetry.

Key capabilities include:

- **Public & VIP Attendee Registration** (Google OAuth Popup & Email/Password)
- **Supabase Backend** (PostgreSQL, Realtime Subscriptions, Row Level Security, RPC stored procedures)
- **Tier-Aware Digital Event Passes** (General Admission, VIP Tier 1, VIP Tier 2, VIP Tier 3)
- **VIP Accompanying Guest Roster Management** (10, 15, 20 Total Pass Allotments with local & database persistence)
- **Mobile Gatekeeper Scanner** (Camera QR scanning, manual code lookup, offline audio/haptic feedback, duplicate scan guards)
- **Atomic Check-In Engine** (`atomic_checkin` PL/pgSQL stored procedure with `FOR UPDATE` row locking)
- **3-Day Event Itinerary Modal** (Interactive 3-slide daily schedule)
- **7-Second Ken Burns Image Carousel** (16 local carnival photos with smooth fade & slow zoom transitions)
- **Admin Dashboard Console** (Real-time telemetry, clickable KPI filters, 3-day attendance dashes, 10/25/50/100 pagination, custom wristband color allocator, and deletion controls)
- **System-Wide Security** (Client-side & API sliding-window rate limiting + XSS text sanitization)

---

## 2. Core User Roles & Credentials

| Role | Purpose | Default Credentials |
|---|---|---|
| Public Attendee | Registers for a free entry pass and views digital QR pass | Public Self-Registration |
| VIP Delegate | Receives a tier-specific pass and accompanying guest pass allotment | VIP Link / Registration |
| Gatekeeper / Security | Uses the mobile scanner to validate attendee passes at venue gates | `qrscanner1@livestockcarnival.ng` |
| Super Administrator | Full access to Admin Dashboard Console, telemetry, and user management | `admin@livestockcarnival.ng` (`.Carny@26`) |

---

## 3. Attendee Pass Tiers & Wristband Allocations

| Tier | Pass Name | Total Allotment | Physical Wristband |
|---|---|---|---|
| `general` | General Admission Pass | 1 Pass | Emerald Green Band |
| `vip_1` | VIP Tier 1 | 10 Passes (1 Primary + 9 Guests) | Metallic Silver Foil |
| `vip_2` | VIP Tier 2 | 15 Passes (1 Primary + 14 Guests) | Champagne Gold Foil |
| `vip_3` | VIP Tier 3 | 20 Passes (1 Primary + 19 Guests) | Obsidian Platinum Badge |

### VIP Guest Roster Rules:
- Unnamed guest slots remain blank placeholders and do **not** count towards total attendee telemetry until assigned a guest name.
- As soon as the VIP enters a guest's name, the pass becomes active, shows in the digital pass slider, and counts towards active attendee statistics.
- Guest lists are saved into Supabase and cached locally in `localStorage` for instant offline persistence across page reloads.

---

## 4. Platform Architecture & Features

### 4.1 Authentication & Google OAuth Popup
- Supports Google OAuth 2.0 via Supabase Auth with **centered popup window** (`skipBrowserRedirect: true`).
- Supports email and password sign-up and sign-in with automatic primary ticket provisioning upon initial login.

### 4.2 Admin Dashboard Console
- **Clickable KPI Filter Cards**: Clicking Total Issued Tickets, Checked In, Pending Passes, or Manual Gate Tickets filters the registry table instantly. Click again to collapse.
- **Header Navigation**: Single-row desktop / 2x2 mobile grid tabs for Tickets Registry, Venue Gates, Personnel & Roles, and Gatekeeper Audit.
- **Attendee Display**: Displays Attendee Full Name in bold with Ticket Code and Email underneath.
- **3-Day Attendance Telemetry**: Renders 3 horizontal dash pills representing Day 1 (Nov 21), Day 2 (Nov 22), and Day 3 (Nov 23) attendance status.
- **Pagination**: Configurable page size (10, 25, 50, 100 items per page, starting at 10) with previous/next controls.
- **Permanent Deletion Controls**: Admins can permanently delete individual tickets or user profiles (clearing all profile and ticket records from Supabase).

### 4.3 3-Day Itinerary & Schedule Modal
- **Interactive 3-Slide Carousel**:
  - **Day 1 (Sat Nov 21)**: Sovereign Opening, Ribbon Cutting by Hon. Minister of Livestock, E-Tagging & Vet Showcase, Cultural Heritage Night & Opening Fireworks.
  - **Day 2 (Sun Nov 22)**: Agro-Investment Summit, Concurrent Forums, Live Livestock Auction, Pastoralist Forum, Concert Night 1 (Top Nigerian Artist #1).
  - **Day 3 (Mon Nov 23)**: Commercial B2B Matchmaking, Breed Champions Awards, Closing Press Conference, Grand Finale Concert (Superstar Top Nigerian Artist #2) & Laser Light Show.

### 4.4 7-Second Ken Burns Image Carousel
- Includes 16 local high-resolution carnival photos (`/carnival/...`).
- Auto-advances every 7 seconds with a smooth 1-second cross-fade and slow Ken Burns zoom effect.
- Features a top 7-second progress bar countdown and manual controls.

### 4.5 System-Wide Security: Rate Limiting & Sanitization
- **Sliding-Window Rate Limiter** (`rate-limiter.js`):
  - Auth logins/registrations: max 5 per minute.
  - Gatekeeper scans: max 10 per 5 seconds.
  - Admin manual user creation & VIP link generation: max 10 per minute.
- **XSS Text Sanitizer** (`sanitizer.js`):
  - Strips `<script>`, `<iframe>`, `javascript:`, and `on*=` event handlers while escaping HTML entities across all text inputs.

---

## 5. Technical Stack

| Technology | Purpose |
|---|---|
| React 18 | Declarative UI framework |
| Vite 5 | Fast development server & production build bundler |
| Supabase (`@supabase/supabase-js`) | PostgreSQL database, Auth, Realtime, RLS & RPC procedures |
| Tailwind CSS | Utility-first responsive styling |
| Lucide React | Modern interface iconography |
| `html5-qrcode` | In-browser camera QR code scanning |
| `qrcode.react` | SVG QR code rendering |
| Vitest | Fast unit & security testing framework |
| Vite PWA | Offline progressive web app support |

---

## 6. Main Application Routes

| Route | View Component | Description |
|---|---|---|
| `/` | `LandingPage.jsx` | Public event landing page, ticket counter, and itinerary modal |
| `/ticket` | `DigitalPassView.jsx` | Attendee digital QR pass and VIP guest list management |
| `/qrscanner` | `GatekeeperScanner.jsx` | Mobile QR gatekeeper verification terminal |
| `/admin` | `AdminCommandConsole.jsx` | Executive Admin Dashboard Console |
| `/diagnostics` | `DiagnosticsConsole.jsx` | Operational system diagnostics & latency benchmarks |

---

## 7. Database Setup & Supabase Migrations

The database schema and procedures are located in `supabase/migrations/01_init.sql`.

Key PostgreSQL procedures:
- `atomic_checkin(p_ticket_code, p_gate_id)`: Atomic transaction with `FOR UPDATE` row locking to prevent duplicate entry.
- `handle_new_user()`: Trigger on `auth.users` that creates `public.profiles` and provisions a default primary pass in `public.tickets`.

To ensure complete column compatibility in Supabase, execute:
```sql
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS guest_name TEXT;
```

---

## 8. Development & Build Commands

Install dependencies:
```bash
npm install
```

Run local development server (port 3000):
```bash
npm run dev
```

Run unit test suite:
```bash
npm run test:unit
```

Build production bundle:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

---

## 9. License & Ownership

Developed for the **National Livestock Festival 2026** digital ecosystem.  
All rights reserved © 2026 NLF Steering Committee & Golden Camel and Cow (GCC).
