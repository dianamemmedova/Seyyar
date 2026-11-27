# Seyyar

Tourism platform for international visitors in Azerbaijan (starting with Baku): hotels, restaurants, places to see, transport and intercity rides in one place.

> Private project. Do not share.

## Structure

```text
seyyar/
├── backend/     Express + TypeScript + Prisma API
├── frontend/    Angular workspace
│   └── projects/
│       ├── web/      tourist website (+ /partner, /driver)
│       ├── admin/    admin panel
│       └── shared/   shared UI components, models, services
└── design/      Stitch HTML designs (reference only)
```

## Tech stack

| Part | Technology |
| --- | --- |
| Backend | Node.js (LTS), Express, TypeScript, Zod |
| Database | PostgreSQL + Prisma |
| Auth | JWT access token + httpOnly refresh cookie |
| Frontend | Angular (SSR for web) + Tailwind CSS |
| Maps | Leaflet + OpenStreetMap |
| i18n | ngx-translate (EN / RU / AZ) |

## Getting started

### Requirements

- Node.js LTS
- PostgreSQL 15+
- Angular CLI (`npm i -g @angular/cli`)

### Backend

```powershell
cd backend
copy .env.example .env   # fill in the values
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

API: http://localhost:5050/api/health

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the API and restart on changes |
| `npm run typecheck` | Check TypeScript types |
| `npm run format` | Format the code with Prettier |
| `npm run build` / `npm start` | Production build and start |
| `npm run db:migrate` | Create and apply a database migration |
| `npm run db:seed` | Fill the database with sample data |
| `npm run db:studio` | Open Prisma Studio |

Postman: import `backend/postman/seyyar-api.postman_collection.json`, then run **Auth → Login** first.

#### API overview

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `login`, `refresh`, `logout`, `forgot-password`, `reset-password`, `GET /api/auth/me` |
| Places | `GET /api/home`, `/api/places`, `/api/places/map`, `/api/places/filters`, `/api/places/:slug`, `/:slug/reviews`, `/:slug/nearby` |
| Requests | `POST /api/requests`, `GET /api/requests/my`, `GET /:code`, `PATCH /:code/cancel`, `POST /:code/messages` |
| Favorites | `GET /api/favorites`, `GET /api/favorites/slugs`, `PUT` / `DELETE /api/favorites/:slug` |
| Reviews | `POST /api/reviews`, `GET /api/reviews/my` |
| Transport | `GET /api/routes`, `/api/routes/locations`, `/api/routes/plan`, `/api/routes/:slug` |
| Itineraries | `GET /api/itineraries`, `/api/itineraries/:slug` |
| Uploads | `POST /api/uploads/reviews`, `POST /api/uploads/places` (form field `photos`) |
| Forms | `POST /api/contact`, `/api/subscribe`, `/api/partners/apply`, `GET /api/faq` |

Responses: `{ "data": ..., "meta": ... }` on success, `{ "error": { "code", "message", "requestId", "details?" } }` on error.

### Frontend

```powershell
cd frontend
npm install
ng serve web     # http://localhost:4200
ng serve admin   # http://localhost:4300
```

## Git workflow

- `main` is always working.
- New work goes in `feature/...` branches.
- Commit messages: `feat(scope): ...`, `fix(scope): ...`, `chore: ...`

## Documents

- Product and business logic, build plan and acceptance criteria are kept outside the repo.
