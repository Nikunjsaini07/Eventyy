<div align="center">
  <h1>🎉 Eventyy (EVN)</h1>
  <p><strong>A Modern, Multi-Role University Event Management Platform</strong></p>

  [![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-8-purple.svg)](https://vitejs.dev/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC.svg)](https://tailwindcss.com/)
  [![Express.js](https://img.shields.io/badge/Express.js-5-lightgrey.svg)](https://expressjs.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-7-2D3748.svg)](https://www.prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
</div>

<br />

## 📖 Overview

Eventyy is a comprehensive, full-stack event management platform tailored for universities. It enables seamless coordination of fests, competitions, and visits. With dedicated roles for Admins, Coordinators, and Students, the platform handles everything from secure OTP registrations to complex bracket and match progression for competitive events.

---

## ✨ Key Features

- 🔐 **Robust Authentication:** OTP-based email verification, password reset flows, and JWT-secured routes.
- 🎓 **University Centric:** Built-in university badge submission and admin approval workflows. Open and university-restricted events.
- 🎭 **Role-Based Access Control:** 
  - `ADMIN`: Full platform control.
  - `COORDINATOR`: Temporary, event-specific administrative rights assigned by admins.
  - `STUDENT`: Base participant role.
- 🏆 **Comprehensive Event Types:**
  - `VISITING`: Seminars, guest lectures, and exhibitions.
  - `PVP`: Player vs Player competitive tournaments with bracket management.
  - `RANKED`: Score-based leaderboard competitions.
- 👥 **Solo & Team Registration:** Support for individual participation and team creation.
- 📊 **Match & Bracket Management:** Built-in tools for coordinators to manage rounds, progress winners, update leaderboards, and publish final results.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Routing:** React Router v7

### Backend (API)
- **Framework:** Express.js (Node.js)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT, bcryptjs
- **Emails:** Nodemailer
- **File Uploads:** Multer & Cloudinary

---

## 📂 Project Structure

```text
evn/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Frontend helpers
│   └── package.json
├── src/                    # Express Backend
│   ├── config/             # Environment & service configurations
│   ├── controllers/        # Request handlers
│   ├── middlewares/        # Auth and validation middlewares
│   ├── routes/             # Express route definitions
│   ├── services/           # Business logic (DB interactions)
│   └── validators/         # Zod schemas for request validation
├── prisma/                 # Database
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seeding script
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v22+ recommended)
- [PostgreSQL](https://www.postgresql.org/) running locally or remotely

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Nikunjsaini07/Eventyy.git
   cd Eventyy
   ```

2. **Install Backend Dependencies:**
   ```bash
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

### Environment Setup

Create a `.env` file in the root directory (based on `.env.example`):

```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/evn?schema=public"
JWT_SECRET="replace-with-a-very-long-secret"
JWT_EXPIRES_IN="7d"
OTP_TTL_MINUTES=10
SENDER_EMAIL="noreply@example.com"

# Cloudinary (For University Badges)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Admin Seed Info
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_NAME="Platform Admin"
SEED_ADMIN_PASSWORD="ChangeMe123!"
```

Create a `.env` file in the `client/` directory:
```env
VITE_API_URL="http://localhost:4000/api/v1"
```

### Database Setup

1. Push the Prisma schema to your database:
   ```bash
   npm run db:push
   ```
   *(Alternatively, run `npm run db:migrate` if using migration history)*

2. Seed the database with the initial Admin user:
   ```bash
   npm run db:seed
   ```

### Running the Application

**Run backend and frontend separately:**

1. **Start the Backend:**
   ```bash
   # From root directory
   npm run dev
   ```

2. **Start the Frontend:**
   ```bash
   # In a new terminal
   cd client
   npm run dev
   ```

---

## 🌐 Deployment

### Backend (Render)
The backend is configured for deployment on Render. 
- **Build Command:** `npm install --include=dev && npm run build`
- **Start Command:** `npm start`
*(Ensure all `.env` variables are added to Render environment settings)*

### Frontend (Vercel)
The frontend is optimized for Vercel deployment.
- Framework Preset: `Other`
- Root Directory: `./` (Project Root)
- The commands are already handled via `vercel.json` (`npm run vercel:install` & `npm run vercel:build`).

---

## 📜 API Documentation
*(Base URL: `/api/v1`)*

- **Auth:** `/auth/register`, `/auth/login`, `/auth/verify-email`, etc.
- **Admin:** `/admin/users`, `/admin/event-groups`, `/admin/coordinators`
- **Events:** `/events`, `/events/:eventId/register`, `/events/:eventId/bracket`
- **Competition (Coordinators):** `/competition/events/:eventId/matches`

*For full API details, refer to the backend route files in `src/routes/`.*
