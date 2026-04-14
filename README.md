# EVN Backend

Backend foundation for a multi-role event platform using:

- `Express`
- `Prisma`
- `PostgreSQL`
- `JWT`
- `Password auth with OTP verification/reset`

## Roles

- `ADMIN`
- `STUDENT`
- `COORDINATOR` via temporary assignment records

Admins are real user roles. Coordinators are temporary assignments made by admins for a specific event and a specific time window.

## Main Features

- Student registration with password
- Email verification OTP flow
- Password login
- Password reset OTP flow
- JWT authentication
- University badge submission and admin approval flow
- Open events and university-only events
- Event groups/fests that contain multiple child events
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
  controllers/
  middlewares/
  routes/
  services/
  utils/
  validators/
```

The code is intentionally split into small service modules so you can change business rules later without rewriting the whole app.
The request flow now follows:

`route -> controller -> service -> prisma`

## Environment

Copy `.env.example` to `.env` and update:

```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/evn?schema=public"
JWT_SECRET="replace-with-a-long-secret"
JWT_EXPIRES_IN="7d"
OTP_TTL_MINUTES=10
SENDER_EMAIL="noreply@example.com"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_NAME="Platform Admin"
SEED_ADMIN_PASSWORD="ChangeMe123!"
```

## Scripts

```bash
npm run dev
npm run build
npm run prisma:generate
npm run db:push
npm run db:migrate
npm run db:seed
```

## API Overview

Base path: `/api/v1`

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/request-verification-otp`
- `POST /auth/verify-email`
- `POST /auth/request-password-reset-otp`
- `POST /auth/reset-password`
- `GET /auth/me`

### Profile

- `GET /profile/me`
- `PATCH /profile/university`

### Admin

- `GET /admin/users`
- `POST /admin/users/:userId/make-admin`
- `PATCH /admin/users/:userId/university-badge`
- `POST /admin/coordinators`
- `GET /admin/coordinators`
- `PATCH /admin/coordinators/:assignmentId/deactivate`
- `POST /admin/event-groups`
- `PATCH /admin/event-groups/:groupId`
- `DELETE /admin/event-groups/:groupId`
- `POST /admin/events`
- `PATCH /admin/events/:eventId`
- `DELETE /admin/events/:eventId`

### Events

- `GET /events/groups`
- `GET /events/groups/:groupId`
- `GET /events`
- `GET /events/:eventId`
- `POST /events/:eventId/register`
- `DELETE /events/:eventId/register`
- `POST /events/:eventId/register-team`
- `GET /events/:eventId/bracket`
- `GET /events/:eventId/leaderboard`

### Competition

- `POST /competition/events/:eventId/rounds`
- `GET /competition/events/:eventId/registrations`
- `POST /competition/events/:eventId/matches`
- `PATCH /competition/matches/:matchId/result`
- `PUT /competition/events/:eventId/leaderboard`
- `PUT /competition/events/:eventId/results`

## Current Assumptions

- Email verification and password reset are OTP-based.
- Login itself is email + password based.
- University badge approval is handled by admins.
- Each big fest/program is modeled as an `EventGroup`, and each actual competition/visit is a child `Event`.
- Child events inherit parent visibility in practice:
  - draft groups hide their child events from public users
  - university-only groups make their child events university-only too
- Payment support is modeled in the database, but no payment gateway is connected yet.
- Match auto-advancement is supported through `nextMatchId` and `nextMatchSlot`.
- Coordinators must be verified university students.
- Coordinator assignments must be event-specific and time-bound.

## Verification

Completed locally:

- `npx prisma generate`
- `npm run build`

## Render Deployment

This backend can be deployed to Render as a Node web service.

Recommended settings:

- Build command: `npm install --include=dev && npm run build`
- Start command: `npm start`

Why this is enough:

- `npm run build` now runs `prisma generate` before TypeScript compilation.
- You do not need a separate `npx prisma generate` step in Render anymore.
- `--include=dev` is important on Render because TypeScript and `@types/*` packages are needed during the build step.

Required environment variables on Render:

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `OTP_TTL_MINUTES`
- `SENDER_EMAIL`
- `CORS_ORIGIN`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

A sample configuration is included in `.env.example`, and a Render blueprint is included in `render.yaml`.

## Vercel Deployment

This repo can also be deployed to Vercel as a single project:

- frontend: built from `client/dist`
- backend API: served through the serverless function in `api/index.ts`

Files added for this flow:

- `vercel.json`
- `api/index.ts`

Recommended Vercel setup:

- Framework preset: `Other`
- Root directory: project root
- Build and install commands are already defined in `vercel.json`

How it works:

- `npm run vercel:install` installs root and client dependencies
- `npm run vercel:build` builds the Vite frontend in `client`
- Vercel serves `client/dist` as the site output
- Requests to `/api/*` are rewritten to the Express app exported from `api/index.ts`

Required environment variables on Vercel:

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `OTP_TTL_MINUTES`
- `SENDER_EMAIL`
- `CORS_ORIGIN`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Important notes for Vercel:

- Set `CORS_ORIGIN` to your deployed Vercel frontend domain.
- The backend runs as a serverless function, so local-disk uploads are not suitable; Cloudinary-backed uploads are the right approach here.
- Prisma is generated during the root install/build flow already used by this project.
