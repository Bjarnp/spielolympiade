# Agent Context for Spielolympiade

This repository is a small full-stack app for managing an annual Spielolympiade event. The app combines:

- a TypeScript/Express backend with Prisma and PostgreSQL
- an Angular frontend with standalone components and Angular Material
- Docker-based database setup for local development

## 1. What the project is

The product is centered around:

- user authentication and role-based access
- seasons and tournaments
- teams and player memberships
- matches and match results
- standings and tournament progression

The main user flow is:

1. Admin creates or starts a season.
2. Teams are created from selected players.
3. Games and tournaments are associated with the season.
4. Matches are played and results are entered.
5. The system updates standings and can advance knockout tournaments automatically.

## 2. Repository structure

- [README.md](README.md) – high-level project overview and local setup notes.
- [docker-compose.yml](docker-compose.yml) – PostgreSQL container for local development.
- [db/init](db/init) – SQL scripts executed when the database container is initialized.
- [spielolympiade-backend](spielolympiade-backend) – Express + Prisma backend.
- [spielolympiade-frontend](spielolympiade-frontend) – Angular frontend.

### Backend structure

- [spielolympiade-backend/src/index.ts](spielolympiade-backend/src/index.ts) – Express app entry point; mounts all route groups.
- [spielolympiade-backend/src/routes](spielolympiade-backend/src/routes) – REST endpoints for auth, users, teams, matches, seasons, games, tournaments.
- [spielolympiade-backend/src/middleware/auth.ts](spielolympiade-backend/src/middleware/auth.ts) – JWT authentication and simple role-based authorization.
- [spielolympiade-backend/src/utils/tournament.ts](spielolympiade-backend/src/utils/tournament.ts) – tournament progression logic for group/knockout structures.
- [spielolympiade-backend/prisma/schema.prisma](spielolympiade-backend/prisma/schema.prisma) – Prisma schema and data model.
- [spielolympiade-backend/prisma/seed.ts](spielolympiade-backend/prisma/seed.ts) – seed data for development.

### Frontend structure

- [spielolympiade-frontend/src/app/app.routes.ts](spielolympiade-frontend/src/app/app.routes.ts) – route definitions and auth guard setup.
- [spielolympiade-frontend/src/app/core](spielolympiade-frontend/src/app/core) – shared auth service, guard, and interceptor.
- [spielolympiade-frontend/src/app/pages](spielolympiade-frontend/src/app/pages) – feature pages such as dashboard, teams, matches, history, admin, login, and season setup.
- [spielolympiade-frontend/src/environments](spielolympiade-frontend/src/environments) – environment configuration, including API URL.

## 3. Core domain model

The Prisma schema defines these main entities:

- User – players/admins with username, password hash, role, and password-change flag.
- Team – belongs to a season and contains members.
- TeamMember – join table between users and teams.
- Game – a playable game type.
- Season – a yearly competition instance.
- Tournament – a tournament within a season; can use different systems.
- Match – a played or scheduled match between two teams.
- MatchResult – score entries for a match.

Important enums:

- Role: admin, player
- TournamentSystem: round_robin, single_elim, double_elim, group_ko
- MatchStage: group, semi_final, final, third_place, extra

## 4. How the app works

### Authentication

The backend exposes a public login endpoint at /auth/login. It validates the username and password against a SHA-256 hash stored in the database. On success, it returns a JWT that is stored in localStorage by the frontend.

The frontend auth flow is handled by:

- [spielolympiade-frontend/src/app/core/auth.service.ts](spielolympiade-frontend/src/app/core/auth.service.ts)
- [spielolympiade-frontend/src/app/core/auth.guard.ts](spielolympiade-frontend/src/app/core/auth.guard.ts)
- [spielolympiade-frontend/src/app/core/auth.interceptor.ts](spielolympiade-frontend/src/app/core/auth.interceptor.ts)

### Season and tournament setup

The admin workflow is centered around the season setup page:

- [spielolympiade-frontend/src/app/pages/start-season/start-season.component.ts](spielolympiade-frontend/src/app/pages/start-season/start-season.component.ts)

It lets an admin:

- choose a year/name for the season
- select players
- create teams manually or generate them automatically
- choose which games are part of the season
- choose a tournament system

The backend then creates the season and tournament via the seasons API.

### Match and result flow

The main match logic is implemented in:

- [spielolympiade-backend/src/routes/matches.ts](spielolympiade-backend/src/routes/matches.ts)

Key behavior:

- matches can be created by admins
- results can be submitted or updated
- winner and match results are stored
- after a result is saved, the backend calls tournament progression logic

The tournament progression logic in [spielolympiade-backend/src/utils/tournament.ts](spielolympiade-backend/src/utils/tournament.ts) can create later-stage matches automatically when group results are complete.

### Dashboard and standings

The dashboard is the central UI for users and admins:

- [spielolympiade-frontend/src/app/pages/dashboard/dashboard.component.ts](spielolympiade-frontend/src/app/pages/dashboard/dashboard.component.ts)

It loads:

- the user’s team
- season data and tournament matches
- standings table
- upcoming/open matches
- recommendations for matches that should be scheduled next

The backend provides the data through the seasons and matches routes, especially the dashboard-data endpoint and the season table calculation.

## 5. Development conventions and gotchas

- The frontend uses Angular standalone components, not NgModules.
- The backend uses Express with route modules rather than a larger framework structure.
- Most backend routes require a JWT and are protected by the auth middleware, except auth/login.
- Passwords are not stored in plain text; they are hashed with SHA-256.
- The app expects PostgreSQL to be available locally, typically through Docker.
- The frontend API base URL is configured in the environment files; make sure it points at the backend port.

## 6. Local development commands

### Start the database

```bash
docker compose up -d
```

### Backend

```bash
cd spielolympiade-backend
npm install
npm run dev
```

### Frontend

```bash
cd spielolympiade-frontend
npm install
npm start
```

### Prisma

```bash
cd spielolympiade-backend
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
```

## 7. Files to read first when making changes

If you are new to this repo, start with these files in order:

1. [README.md](README.md)
2. [spielolympiade-backend/src/index.ts](spielolympiade-backend/src/index.ts)
3. [spielolympiade-backend/prisma/schema.prisma](spielolympiade-backend/prisma/schema.prisma)
4. [spielolympiade-backend/src/routes/matches.ts](spielolympiade-backend/src/routes/matches.ts)
5. [spielolympiade-backend/src/utils/tournament.ts](spielolympiade-backend/src/utils/tournament.ts)
6. [spielolympiade-frontend/src/app/app.routes.ts](spielolympiade-frontend/src/app/app.routes.ts)
7. [spielolympiade-frontend/src/app/pages/dashboard/dashboard.component.ts](spielolympiade-frontend/src/app/pages/dashboard/dashboard.component.ts)

## 8. Summary

This repo is a small but fairly complete tournament-management app. The most important design idea is that the backend owns the domain data and business rules, while the frontend mainly renders the current season state and sends requests to the API.
