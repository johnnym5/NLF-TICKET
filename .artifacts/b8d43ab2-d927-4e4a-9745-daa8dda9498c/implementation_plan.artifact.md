# Enhanced Admin Analytics & Date-Based Telemetry

This plan outlines the enhancements to the GCC application to capture registration/attendance timestamps more accurately and provide the Admin Command Hub with detailed daily/weekly analytics and gate-specific telemetry.

## Proposed Changes

### Data Layer & Security

#### [MODIFY] [AuthContext.jsx](file:///C:/Users/HP/Documents/CODING/GCC/src/context/AuthContext.jsx)
- Ensure `createdAt` is consistently captured as an ISO string for all new registrations.

#### [MODIFY] [GatekeeperScanner.jsx](file:///C:/Users/HP/Documents/CODING/GCC/src/views/GatekeeperScanner.jsx)
- Update check-in logic to store `checkedInFullDate` (ISO string) alongside the existing `checkedInAt` (display time).
- This enables precise filtering by date/week in the Admin Hub.

#### [MODIFY] [firestore.rules](file:///C:/Users/HP/Documents/CODING/GCC/firestore.rules)
- Update the `update` rule for `attendees` to allow the new `checkedInFullDate` field.

---

### Admin Command Hub

#### [MODIFY] [AdminCommandConsole.jsx](file:///C:/Users/HP/Documents/CODING/GCC/src/views/AdminCommandConsole.jsx)
- **New Filters:** Add a Date Range selector to filter the attendee list.
- **Registration Analytics:**
  - Add a "Registration Velocity" section showing counts per day and per week.
  - Implement a clickable chart/list where selecting a date filters the main directory to users from that day.
- **Attendance Analytics:**
  - Add a "Check-in Performance" section showing total scans per day.
  - Show a breakdown of attendance by **Gate Location**.
- **Enhanced Metrics:** Update top metric cards to reflect the current filtered view.

## Verification Plan

### Automated Tests
- I will verify that the new fields are correctly written to Firestore by checking the console logs during a test scan in `GatekeeperScanner`.

### Manual Verification
1. **Accreditation:** Use the Gate Scanner to check in a user and verify `checkedInFullDate` is saved.
2. **Analytics Check:** Open Admin Hub and verify the daily/weekly counts match the actual records.
3. **Filtering:** Click a specific date in the analytics view and verify the Attendee Directory updates to show only users from that period.
4. **Gate Telemetry:** Verify the gate breakdown accurately reflects the gates used during scanning.
