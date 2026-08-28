# Catkin — Complaint & Rider Tracking Platform

A complaint-tracking system for solar installation clients: clients raise complaints from a mobile app, riders get dispatched and tracked live on a map, and admins manage clients, riders, complaints, and payments from a web dashboard.

## Project structure

This is a multi-project repo with three independent apps:

| Path | What it is | Stack | Default port |
|---|---|---|---|
| [`backend/`](backend) | REST API | Node.js, Express, MongoDB (Mongoose), TypeScript, Zod | `5000` |
| [`webFrontend/`](webFrontend) | Admin dashboard | React, Vite, TypeScript, Tailwind CSS | `5173` |
| [`Frontendui/`](Frontendui) | Mobile app for clients & riders | React Native, Expo, TypeScript | — (Expo dev server) |

`backend` and `webFrontend` run via Docker Compose. `Frontendui` runs separately with Expo (it is not dockerized).

## Getting started

### 1. Backend + admin dashboard (Docker Compose)

```bash
# from the repo root
cp .env.example .env
cp backend/.env.example backend/.env
# edit backend/.env with real secrets (JWT_SECRET, admin credentials, Cloudinary keys)

docker compose up
```

This starts three containers:
- `mongo` — MongoDB 7, data persisted in a named volume
- `backend` — Express API at `http://localhost:5000` (hot-reloads via `tsx watch`)
- `frontend` — Vite dev server for the admin dashboard at `http://localhost:5173`

An admin user is auto-seeded on backend startup using `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `backend/.env`, if one doesn't already exist.

### 2. Mobile app (Expo)

```bash
cd Frontendui
cp .env.example .env
# edit .env — see the comments in that file for platform-specific API URLs
npm install
npm start
```

Notes:
- Some native modules (`@rnmapbox/maps`, background location, real push tokens) require a custom Expo dev client, not plain Expo Go.
- On a physical device connected over USB, `adb reverse tcp:5000 tcp:5000` is needed to reach the backend at `localhost:5000` from the device.
- Point `EXPO_PUBLIC_API_URL` at `10.0.2.2` (Android emulator) or your machine's LAN IP (physical device), per the comments in `Frontendui/.env.example`.

## Environment files

| File | Copy from | Used by |
|---|---|---|
| `.env` (repo root) | `.env.example` | Docker Compose host ports, Mongo DB name |
| `backend/.env` | `backend/.env.example` | API secrets: JWT, admin seed credentials, Cloudinary, CORS origin |
| `Frontendui/.env` | `Frontendui/.env.example` | API base URL, Mapbox tokens |

`webFrontend` reads `VITE_API_URL` (optional, defaults to `http://localhost:5000`).

## Core features

- **Complaint lifecycle** — `Pending → Assigned → On The Way → Arrived → Pending Approval → Resolved`, with photo uploads (Cloudinary) for both the client's complaint and the rider's resolution.
- **Rider dispatch & live tracking** — FIFO job queue per rider, live location shared with the client via Mapbox while a rider is en route.
- **Payments** — admin sets amounts due per complaint; a client is capped at 2 simultaneous unpaid charges, and a complaint can't be closed while it still has an unpaid balance. Payment status/history is visible on both the admin dashboard and the mobile app.
- **Guide videos** — admins manage a library of YouTube walkthrough videos from the dashboard; clients watch them in-app from the mobile app's Guide screen.
- **Push notifications** — clients are notified when their rider starts heading their way.
- **Three auth roles** — Admin (web dashboard), Client and Rider (mobile app), each with their own JWT-based login.

## Scripts reference

| Project | Command | Does |
|---|---|---|
| `backend` | `npm run dev` | Start API with hot reload (`tsx watch`) |
| `backend` | `npm run build` / `npm start` | Compile TypeScript, run compiled output |
| `webFrontend` | `npm run dev` | Start Vite dev server |
| `webFrontend` | `npm run build` | Type-check + production build |
| `webFrontend` | `npm run lint` | Lint with oxlint |
| `Frontendui` | `npm start` | Start Expo dev server |
| `Frontendui` | `npm run android` / `npm run ios` | Build & run a native dev client |

## Type checking

```bash
cd backend && npx tsc --noEmit
cd webFrontend && npx tsc --noEmit -p tsconfig.app.json
cd Frontendui && npx tsc --noEmit
```
