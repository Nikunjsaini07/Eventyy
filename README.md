# College Event Management System (Backend)

Production-ready backend using **Node.js + Express + PostgreSQL + Prisma** with **JWT access/refresh auth**, **RBAC**, **MVC + Service Layer**, and scalable API modules.

## Tech Stack
- Express 5
- PostgreSQL
- Prisma ORM
- JWT (access + refresh token rotation)
- Zod validation
- Winston logging + Morgan access logs
- Helmet, CORS, rate limiting

## Project Structure

```txt
backend/
  prisma/
    schema.prisma
    migrations/
  src/
    config/
    controllers/
    middlewares/
    routes/
    services/
    utils/
    validators/
  server.js
```

## Environment Variables
Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/eventyy
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
JWT_ACCESS_SECRET=super-secret-access
JWT_REFRESH_SECRET=super-secret-refresh
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

## Run
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## API Modules
Base path: `/api/v1`

- `/auth` register/login/refresh/logout
- `/users` admin activate/ban
- `/events` CRUD + coordinator assignment + analytics
- `/games` CRUD for admins/coordinators
- `/participants` student game registration
- `/matches` bracket generation + result updates
- `/leaderboard` ranking with pagination/filtering

## Core Features
- RBAC for Admin, Coordinator, Student
- Normalized relational schema with strict FKs/indexes
- Single-elimination bracket generation
- Transactional match result update + winner archival
- Automatic leaderboard point updates
- Event analytics (participants, popularity, active students, yearly winners)
- Pagination and filtering (year, status, department)
- Centralized error handling and structured logs
