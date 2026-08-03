# MediBook — Frontend

React (Vite) frontend for the MediBook clinic booking & EHR system, built by the
Frontend Lead ahead of the backend so all three role dashboards can be demoed
and reviewed before Maida's API is live.

## Stack

- **React 18 + Vite** — app shell and dev server
- **Tailwind CSS** — styling, with a custom healthcare design token set in `tailwind.config.js`
- **React Router v6** — routing, with role-based route guards
- **React Context API** — auth state (`AuthContext`) and toast notifications (`ToastContext`)
- **React Hook Form** — all forms (login, register, booking, walk-in, clinical notes)
- **Axios** — single HTTP client in `src/api/client.js`
- **Recharts** — the appointment-load chart on the receptionist dashboard

## Running it

```bash
npm install
npm run dev
```

There's no backend yet, so every screen that fetches data will show its
**error state** ("Couldn't load this — the backend isn't reachable yet").
That's expected and intentional — see "Connecting the backend" below.

## Project structure

```
src/
  api/            Axios client + one service file per domain (auth, appointments, records)
  components/
    ui/           Reusable primitives: Button, Card, Form fields, Modal, Badge, States
    layout/       Sidebar, Topbar, MobileNav, DashboardLayout, AuthLayout
  context/        AuthContext (FR-01), ToastContext (confirmation/error messages)
  hooks/          useApi — loading/error/data wrapper for every API call
  routes/         ProtectedRoute (auth check), RoleRoute (RBAC, NFR-01)
  pages/
    auth/         Login, Register
    patient/      Overview, Book Appointment (FR-02/03), My Appointments (FR-04), Records (FR-05/11)
    receptionist/ Clinic Calendar (FR-06), Walk-in Booking (FR-07)
    doctor/       Daily Schedule (FR-08), Patient Chart + Clinical Notes (FR-09)
    shared/       404, Unauthorized
  config/nav.js   Role-based sidebar nav + specialty list
  utils/format.js Date/time formatting, 2-hour cancellation window check (FR-04)
```

## How each functional requirement maps to a page

| FR | Requirement | Where |
|----|---|---|
| FR-01 | Registration / login | `pages/auth/`, `context/AuthContext.jsx` |
| FR-02 | Real-time slots by doctor/specialty | `pages/patient/BookAppointment.jsx` |
| FR-03 | Instant reservation, unique ID | same, via `appointmentService.bookAppointment` |
| FR-04 | Cancel/reschedule, 2-hr window | `pages/patient/MyAppointments.jsx`, `utils/format.js` |
| FR-05 | Read-only visit history | `pages/patient/MedicalRecords.jsx` |
| FR-06 | Receptionist centralized calendar | `pages/receptionist/ReceptionistDashboard.jsx` |
| FR-07 | Walk-in / emergency booking | `pages/receptionist/WalkInBooking.jsx` |
| FR-08 | Doctor's chronological schedule | `pages/doctor/DoctorDashboard.jsx` |
| FR-09 | Clinical notes attached to a visit | `pages/doctor/PatientChart.jsx` |
| FR-11 | Historical medical profiles | `pages/patient/MedicalRecords.jsx`, `pages/doctor/PatientChart.jsx` |
| FR-12 | DB-level booking conflict (lock) | surfaced as a 409 → toast in `BookAppointment.jsx` / `WalkInBooking.jsx` |

FR-10 (automated SMS/email reminders) and FR-12 itself are backend/Twilio
concerns — the frontend only needs to display the confirmation it gets back,
which `ToastContext` already handles.

## Connecting the backend

Everything goes through `src/api/client.js`. Once Maida's API is deployed:

1. Set `VITE_API_BASE_URL` in a `.env` file (see `.env.example`).
2. Check each `*Service.js` file in `src/api/` against her actual endpoint
   shapes — the URLs and payloads here are my best guess from the FR list
   in the slides, so route paths or field names may need small tweaks.
3. Nothing else changes. Every page already calls these services and
   already has loading / empty / error states, so real data will simply
   start appearing.

No mock data was hardcoded anywhere, per your call — every list, chart, and
detail view is wired to a real (currently empty/erroring) API call.

## Auth note

`AuthContext` expects a backend that returns `{ token, user: { id, name,
email, role } }` on login/register, where `role` is one of `patient`,
`receptionist`, `doctor`. Routing (`/patient`, `/receptionist`, `/doctor`)
is driven entirely by that `role` field.

## Taking this to mobile

The app is responsive already (sidebar collapses to a slide-over drawer
under the `md` breakpoint), so it's usable on a phone browser today. Three
paths from here, roughly in order of effort:

1. **PWA (lowest effort).** Add a `manifest.json` + service worker (Vite
   has a `vite-plugin-pwa` for this). Gets you an installable home-screen
   icon and offline caching of the shell, no code rewrite.
2. **Capacitor (medium effort).** Wraps this exact React build in a native
   shell to ship to the App Store / Play Store, with access to native APIs
   (camera, push notifications) when needed. The component code doesn't
   change.
3. **React Native (highest effort).** A real native rewrite — `src/api/`
   (the service layer) and `src/context/` (state logic) port over almost
   as-is since they're plain JS, but everything in `components/ui` and
   `components/layout` would need native equivalents, since Tailwind/HTML
   elements don't exist in RN.

For a clinic booking app, option 1 or 2 is the usual choice unless the team
specifically needs deep native device features.
