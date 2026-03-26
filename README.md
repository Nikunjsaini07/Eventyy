# EVN Backend

Backend foundation for a multi-role event platform using:

- `Express`
- `Prisma`
- `PostgreSQL`
- `JWT`
- `OTP-based auth`

## Roles

- `ADMIN`
- `STUDENT`
- `COORDINATOR` via temporary assignment records

Admins are real user roles. Coordinators are assigned by admins and can be event-specific or global.

## Main Features

- OTP registration/login flow for students
- JWT authentication
- University badge submission and admin approval flow
- Open events and university-only events
- Event types:
  - `VISITING`
  - `PVP`
  - `RANKED`
- Solo and team events
- Optional paid events
- Coordinator tools for:
  - round management
  - PVP match creation
  - winner progression
  - leaderboard updates
  - final result publishing

## Project Structure

```text
prisma/
  schema.prisma
src/
  config/
  middlewares/
  routes/
  services/
  utils/
  validators/
```

The code is intentionally split into small service modules so you can change business rules later without rewriting the whole app.

## Environment

Copy `.env.example` to `.env` and update:

```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/evn?schema=public"
JWT_SECRET="replace-with-a-long-secret"
JWT_EXPIRES_IN="7d"
OTP_TTL_MINUTES=10
```

## Scripts

```bash
npm run dev
npm run build
npm run prisma:generate
npm run db:push
npm run db:migrate
```

## API Overview

Base path: `/api/v1`

### Auth

- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `GET /auth/me`

### Profile

- `GET /profile/me`
- `PATCH /profile/university`

### Admin

- `GET /admin/users`
- `POST /admin/users/:userId/make-admin`
- `PATCH /admin/users/:userId/university-badge`
- `POST /admin/coordinators`
- `PATCH /admin/coordinators/:assignmentId/deactivate`
- `POST /admin/events`
- `DELETE /admin/events/:eventId`

### Events

- `GET /events`
- `GET /events/:eventId`
- `POST /events/:eventId/register`
- `POST /events/:eventId/register-team`
- `GET /events/:eventId/bracket`
- `GET /events/:eventId/leaderboard`

### Competition

- `POST /competition/events/:eventId/rounds`
- `POST /competition/events/:eventId/matches`
- `PATCH /competition/matches/:matchId/result`
- `PUT /competition/events/:eventId/leaderboard`
- `PUT /competition/events/:eventId/results`

## Current Assumptions

- OTP is email-based for now.
- University badge approval is handled by admins.
- Payment support is modeled in the database, but no payment gateway is connected yet.
- Match auto-advancement is supported through `nextMatchId` and `nextMatchSlot`.

## Verification

Completed locally:

- `npx prisma generate`
- `npm run build`
