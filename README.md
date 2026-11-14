# Premium Numerology SaaS Platform

A complete, production-ready, modular numerology SaaS web application built with Node.js, Express, TypeScript, SQLite, and React 18 + Tailwind CSS.

---

## 🚀 Quick Start — How to Run the Servers

Open two terminal windows in the project directory (`C:\Users\Pratham Garg\Documents\AstroSOftware`):

### Terminal 1: Start the Backend Server
```bash
cd backend
npm run dev
```
- **Backend URL:** `http://localhost:5000`
- **Health Check:** `http://localhost:5000/api/health`

### Terminal 2: Start the Frontend Application
```bash
cd frontend
npm run dev
```
- **Frontend URL:** `http://localhost:5173`
- Open your browser to `http://localhost:5173` to interact with the application.

---

## 👑 Predefined Administrator Credentials

As defined in the Master Prompt Addendum Section 2, the primary administrator account is automatically seeded upon server startup:

- **Admin Email:** `pratham.garg2801@gmail.com`
- **Initial Password:** Configured in `backend/.env` under `ADMIN_PASSWORD` (`AdminAstro2026!Secure`)
- **Role:** `super_admin`
- **Admin Login:** Click **Login / Register** in the top navigation, select the **Admin Portal Login** tab, and enter the credentials above.

---

## 🧪 Running Automated Tests

All calculation rules, edge cases, single-device enforcement, and session lifecycles are covered by automated tests:

```bash
# Run both the Numerology Engine and Backend Integration test suites (38 tests)
node --experimental-strip-types --test shared/tests/numerology.node-test.ts backend/tests/backend.node-test.ts
```

---

## 📁 Repository Structure

```text
AstroSOftware/
├── shared/                       # Pure independent numerology calculation engine (zero DB/UI dependencies)
│   ├── src/
│   │   ├── numerology/
│   │   │   ├── basicNumberCalculator.ts          # Mulank (birth day digits sum to single digit)
│   │   │   ├── destinyNumberCalculator.ts        # Bhagyank (full DOB digits sum to single digit)
│   │   │   ├── natalGridCalculator.ts            # Fixed 3x3 layout, century digits excluded
│   │   │   ├── mahadashaCalculator.ts            # Sequence starting from Mulank, restarts at age 45
│   │   │   ├── personalYearCalculator.ts         # Birthday-to-birthday with weekday mapping
│   │   │   ├── pratyantarCalculator.ts           # 9 periods (360 days) + blank remainder period
│   │   │   ├── dayLordCalculator.ts              # Pratyantar + Weekday reduced to single digit
│   │   │   ├── annualGridCalculator.ts           # Natal + Mahadasha + Personal Year
│   │   │   ├── dailyGridCalculator.ts            # All active layers combined
│   │   │   └── hundredYearTimelineCalculator.ts  # Ages 0 to 99 timeline
│   │   └── types/index.ts
│   └── tests/numerology.node-test.ts
│
├── backend/                      # Express API, SQLite database, auth and entitlement services
│   ├── src/
│   │   ├── config/               # environment.ts and admin-config.ts
│   │   ├── database/             # SQLite connection, schema migrations, and admin seeding
│   │   ├── middleware/           # requireAuth (single-device & 30-day expiry), requireEntitlement, RBAC
│   │   ├── modules/
│   │   │   ├── auth/             # OTP service (email/sms), SessionManager
│   │   │   ├── users/            # User profile, birth details recalculation
│   │   │   ├── subscriptions/    # Plan tiers, upgrades, cancellations
│   │   │   ├── saved-charts/     # Chart CRUD and comparison engine
│   │   │   ├── numerology/       # Calculation and timeline API routes
│   │   │   └── admin/            # Super Admin analytics, user status, session revoking, audit logs
│   │   ├── app.ts                # Express application configuration
│   │   └── server.ts             # Server entry point
│   ├── .env                      # Server private configuration (git-ignored)
│   ├── .env.example              # Template configuration
│   └── tests/backend.node-test.ts
│
└── frontend/                     # React 18, Vite, Tailwind CSS, Lucide icons
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.tsx                # Main navigation (all 16 routes)
    │   │   ├── NumerologyGridCard.tsx    # Accessible 3x3 grid with repeated numbers & source badges
    │   │   ├── NewChartForm.tsx          # Chart input form
    │   │   ├── ProfileTab.tsx            # "My Profile" and "My Plan"
    │   │   ├── TimelineView.tsx          # 100-Year Timeline viewer
    │   │   ├── SavedChartsView.tsx       # Repository of saved charts
    │   │   ├── CompareView.tsx           # Side-by-side chart comparison
    │   │   ├── PlansModal.tsx            # Subscription catalog and upgrades
    │   │   ├── AdminPortalView.tsx       # Super Admin dashboard and audit logs
    │   │   └── AuthModal.tsx             # OTP login and Admin login dialog
    │   ├── services/api.ts               # Typed client with single-device termination handling
    │   ├── App.tsx                       # Master view coordinator
    │   └── main.tsx
    ├── index.html
    └── vite.config.ts
```

---

## 🔒 Security Architecture Highlights

1. **Single-Device Login Enforcement:**
   - On every new login, `SessionManager.createSession` revokes all existing active sessions for that user account.
   - If a previous device attempts to call an authenticated endpoint, the backend rejects it with `401 SESSION_REVOKED` and the frontend surfaces an automatic session termination alert.
2. **Strict 30-Day Session Lifetime:**
   - Every session is stamped with `expires_at = created_at + 30 days`.
   - The backend checks this timestamp on every request and blocks expired sessions with `401 SESSION_EXPIRED`.
3. **Predefined Super Admin Seeding:**
   - Auto-creates the Super Admin (`pratham.garg2801@gmail.com`) using credentials from `.env`.
   - Never exposes administrator credentials to the frontend.
4. **WCAG 2.2 AA Accessibility:**
   - 3×3 Numerology Grid includes hidden semantic table equivalents for screen readers (NVDA, JAWS, Narrator).
   - High-contrast visual badges and focus rings for keyboard navigation.
