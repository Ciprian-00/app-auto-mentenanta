# Auto-Mentenanta

A full-stack PWA for automotive maintenance management — tracking vehicles, maintenance logs, reminders (ITP, RCA, Rovinieta, oil changes), and scanning documents via OCR. The UI is in Romanian.

## Getting Started

### Backend (`backend/`)
```bash
npm run dev     # development with nodemon hot-reload
npm start       # production
```

### Frontend (`frontend/`)
```bash
npm start       # dev server on port 3000
npm run build   # production build to build/
npm test        # run tests
```

## Environment Variables

**Backend** (`.env`): `PORT`, `MONGO_URI`, `JWT_SECRET`  
**Frontend** (`.env`): `REACT_APP_API_URL`

## Architecture

### Backend (`backend/`)

Express 5 REST API with MongoDB via Mongoose. Entry point: `server.js`.

- `config/db.js` — MongoDB connection
- `middleware/authMiddleware.js` — JWT verification; apply to all protected routes
- `models/` — Mongoose schemas: `User`, `Vehicle`, `MaintenanceLog`, `Reminder`, `VehicleSpec`
- `controllers/` — Business logic per domain
- `routes/` — API route definitions mounted under `/api/*`
- `services/ocrService.js` — Tesseract.js wrapper; `services/reminderService.js` — reminder generation logic
- `seed.js` — Seeds `VehicleSpec` collection with factory maintenance data

**API surface:**
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET|POST|PUT|DELETE /api/vehicles`, `PUT /api/vehicles/:id/mileage`, `GET /api/vehicles/:id/recommendations`
- `GET|POST|PUT /api/reminders`
- `POST /api/ocr`
- `GET /api/specs`

### Frontend (`frontend/src/`)

React 19 SPA with React Router 7, Tailwind CSS 4 (dark theme base color `#0b0e14`), and Axios.

- `context/AuthContext.js` — Global auth state (user, login, register, logout); wraps entire app
- `services/api.js` — Axios instance with base URL and JWT Authorization header interceptor
- `components/PrivateRoute.js` — Guards authenticated routes
- `components/BottomNav.js` — Mobile bottom navigation with reminder badge
- `pages/` — One file per route: `Dashboard`, `Vehicule`, `DetaliiVehicul`, `Scanner`, `Notificari`, `Login`, `Register`

**Route structure** (defined in `App.js`):
```
/login, /register          → public
/                          → Dashboard (upcoming reminders)
/vehicule                  → Vehicle list
/vehicule/:id              → DetaliiVehicul (logs + reminders per vehicle)
/scanner                   → OCR document scanner
/notificari                → All reminders
```

### Data relationships

`User` → many `Vehicle` → many `MaintenanceLog` + many `Reminder`  
`Reminder` generation is driven by `VehicleSpec` intervals (oil change km/months, ITP expiry, RCA/Rovinieta dates, tire recommendations, distribution belt intervals).

### PWA

Service worker in `frontend/public/service-worker.js` caches static assets for offline use. Registered in `src/index.js`. PWA manifest at `frontend/public/manifest.json`.
