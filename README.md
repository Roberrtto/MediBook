# MediBook

**Integrated Healthcare Booking and Record Keeping System**
SWE 2030 — Software Requirement Engineering | Group 1

Praise Daniella · Robert Ondigo · Maida Hassan Mohamed · Abdullahi Muhsin · Sumeiya Hassan Mohamed

---

## What it does

MediBook replaces the paper diary and phone-line chaos of a small clinic with:

- **Real-time booking** patients can do themselves, 24/7
- **Transaction-safe scheduling** that makes double-booking impossible, not just unlikely
- **Role-based dashboards** for patients, doctors, and front-desk staff
- **Secure, read-only medical records** (visit notes, prescriptions, lab results)
- **Automated reminders** sent 24 hours before an appointment

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Notifications | Twilio (SMS) + SendGrid (email), behind a swappable interface |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |

## Project structure

```
medibook/
├── backend/
│   ├── src/
│   │   ├── config/        # DB pool + schema.sql
│   │   ├── models/
│   │   ├── repositories/  # all raw SQL lives here, one file per table
│   │   ├── services/      # business logic (AppointmentService, AuthService, ...)
│   │   │   └── notifications/  # INotificationService + Console/Twilio adapters
│   │   ├── controllers/   # thin HTTP handlers
│   │   ├── routes/        # Express routers + RBAC
│   │   ├── middleware/    # auth, error handling
│   │   └── app.js / server.js
│   └── tests/             # Jest unit tests (no DB needed - see below)
├── frontend/
│   └── src/
│       ├── pages/         # Landing, Login, Register, 3 role dashboards
│       ├── components/    # Navbar, AppointmentCard, StatusBadge, ...
│       ├── context/        # AuthContext (JWT + user in memory)
│       └── services/api.js # single fetch wrapper, all HTTP calls go through it
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Why it's built this way (SOLID)

- **Single Responsibility** — repositories only talk to the DB, services only hold
  business rules, controllers only translate HTTP ↔ services.
- **Open/Closed** — `notificationFactory.js` picks a provider by config; adding a
  new one (e.g. WhatsApp) means adding a class, not editing existing code.
- **Liskov Substitution** — `ConsoleNotificationService` and
  `TwilioSendGridNotificationService` are both drop-in `INotificationService`s.
- **Interface Segregation** — `INotificationService` only exposes the 3 methods a
  caller actually needs, nothing provider-specific leaks through.
- **Dependency Inversion** — `AppointmentService` depends on the
  `INotificationService` abstraction (and on repository interfaces passed into
  its constructor), never on a concrete database or SMS provider. This is also
  exactly what makes it unit-testable without a real database (see below).

## Testing

```bash
cd backend
npm install
npm test
```

`tests/appointmentService.test.js` and `tests/authService.test.js` use plain
JS objects as fake repositories/notification services (dependency injection),
so they run in milliseconds with no PostgreSQL connection required. They cover:

- Successful booking + confirmation notification
- Rejecting a booking in the past
- **Rejecting a double-booking for the same doctor/time slot**
- Rejecting an unknown doctor
- Cancelling within/outside the 2-hour window (FR-04)
- Staff override on the cancellation window
- Blocking a patient from cancelling someone else's appointment

## Running it locally

### Option A — Docker (recommended, matches CI/production)

```bash
cp backend/.env.example backend/.env   # fill in JWT_SECRET at minimum
docker compose up --build
```

- Backend: http://localhost:4000
- Frontend: http://localhost:5173
- Postgres: localhost:5432 (schema is applied automatically on first boot)

### Option B — running each side manually

```bash
# Terminal 1 - database only
docker compose up db

# Terminal 2 - backend
cd backend
cp .env.example .env
npm install
npm run dev

# Terminal 3 - frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main` and `develop`:

1. Spins up a throwaway Postgres service container
2. Installs backend deps, lints, runs the Jest suite with coverage
3. Installs frontend deps and builds the production bundle
4. On `main`, a placeholder deploy job runs after both pass (swap in a real
   Render/Vercel deploy hook when you're ready to go live)

## Team & workflow

- **Version control:** GitHub, `main → develop → feature/*` branches, PRs
  require at least 1 reviewer before merging.
- **Project management:** GitHub Projects (Kanban) — see the group's board for
  the 4-sprint plan (DB foundation → auth → booking logic → clinical notes &
  release).
- **Communication:** Slack (channels split by area) + biweekly Zoom stand-ups.
