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

API: http://localhost:3000/api/health

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
