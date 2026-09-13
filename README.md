# CineBook 🎬 — Production Cinema Ticket Booking Platform

**CineBook** is a full-stack, production-ready cinema ticket booking web application engineered for deployment on **Vercel** with **Neon Serverless PostgreSQL** and **Drizzle ORM**.

---

## 🏛️ Three-Agent Development Team

CineBook was developed with a collaborative 3-agent architecture:

| Agent | Responsibilities | Key Deliverables |
| :--- | :--- | :--- |
| **Agent 1: App Agent** | Frontend & Backend Operations | Responsive Next.js App Router UI, interactive seat maps, 10-min hold countdown, digital QR tickets, booking management & cancellation, Admin operations center. |
| **Agent 2: Database Engine Agent** | Relational Modeling & Transactions | 14 relational tables in Neon PostgreSQL, UTC timestamps, integer minor units, atomic row-level seat locking (`SELECT ... FOR UPDATE`), server-side price computation, idempotent payments, expired hold cleanup worker. |
| **Agent 3: QA Agent** | Quality Assurance & Concurrency Testing | Race-condition concurrency test suite, hold expiration tests, idempotency & security tests, Next.js production build verification. |

---

## 🚀 Key Features

- **Dynamic Movie Catalog**: Browse by genre, formats (`IMAX 3D`, `Dolby Atmos`, `2D`), languages, and live search.
- **Interactive Auditorium Map**: Curved cinema screen visualization, real-time seat status (`AVAILABLE`, `HELD`, `BOOKED`, `BLOCKED`), and seat tier pricing (Standard, VIP, Recliner, Accessible).
- **Atomic 10-Minute Seat Locks**: Concurrency-safe seat reservation preventing double bookings via PostgreSQL row locks.
- **Financial Precision in Minor Units**: Prices, taxes, and service fees calculated in cents on the server to prevent floating-point inaccuracies.
- **Payment Gateway in Test Mode**: Idempotent payment simulation with toggleable success/failure and Stripe test integration.
- **Boarding-Pass Digital Ticket with QR Code**: Real-time cryptographic QR ticket generation with instant print and download capabilities.
- **Booking Cancellation & Instant Refund**: Users can cancel eligible bookings, which instantly frees up seats and logs refunds.
- **Executive Admin Control Center**: Metrics overview (gross revenue, bookings, seat occupancy), movie CRUD, showtime scheduler, seat blockage maintenance tool, and audit logs viewer.

---

## 📦 Tech Stack

- **Framework**: Next.js 14 (App Router, Server & Client Components)
- **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless` / `pg`)
- **ORM**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Styling**: Tailwind CSS with custom glassmorphism and cinema dark themes
- **Security**: JWT tokens, HTTP-only secure cookies, Bcrypt password hashing
- **Icons & Visuals**: Lucide React, Canvas Confetti, QRcode generator

---

## 🗄️ Database Schema (14 Tables)

1. `users` — UUID pk, email, password hash, role (`USER`, `ADMIN`), full name, phone.
2. `genres` — UUID pk, name, slug.
3. `movies` — UUID pk, title, slug, synopsis, poster, backdrop, duration, age rating, rating score.
4. `movie_genres` — Composite junction (`movie_id`, `genre_id`).
5. `cinemas` — UUID pk, name, slug, address, city, state, postal code, amenities.
6. `auditoriums` — UUID pk, cinema_id, name, screen type (`IMAX`, `DOLBY_ATMOS`, `VIP_LUXE`, `STANDARD`), total seats.
7. `seats` — UUID pk, auditorium_id, row label, seat number, seat type, price multiplier in cents.
8. `showtimes` — UUID pk, movie_id, auditorium_id, start time, end time, base price in cents.
9. `showtime_seats` — UUID pk, showtime_id, seat_id, status (`AVAILABLE`, `HELD`, `BOOKED`, `BLOCKED`), held until UTC.
10. `bookings` — UUID pk, human reference (`CNB-XXXXXX`), total cents, tax cents, service fee cents, idempotency key, expires at.
11. `booking_items` — UUID pk, booking_id, showtime_seat_id, unit price cents, seat label.
12. `payments` — UUID pk, booking_id, payment intent id, provider, status, amount in cents, idempotency key.
13. `tickets` — UUID pk, booking_id, ticket code, QR code data URI, is used.
14. `audit_logs` — UUID pk, user_id, action, entity type, entity id, payload JSONB, created at.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```bash
# Neon PostgreSQL Connection URL
DATABASE_URL="postgresql://neondb_owner:password@ep-sample-pooler.us-east-2.aws.neon.tech/cinebook?sslmode=require"
DIRECT_DATABASE_URL="postgresql://neondb_owner:password@ep-sample.us-east-2.aws.neon.tech/cinebook?sslmode=require"

# Authentication Secrets
JWT_SECRET="your_production_jwt_secret_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Cron Secret for /api/cron/release-holds
CRON_SECRET="your_secure_cron_secret"

# Payment Provider Configuration
PAYMENT_PROVIDER="MOCK_TEST" # Or "STRIPE_TEST"
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

---

## 🛠️ Local Development & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate and push database migrations**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

3. **Seed database with sample movies, cinemas, and showtimes**:
   ```bash
   npm run db:seed
   ```

4. **Start local dev server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running QA Automated Test Suite

- **Run all tests**:
  ```bash
  npm run test:all
  ```

- **Run specific test suites**:
  - Concurrent seat-booking race condition test: `npm run test:concurrency`
  - Expired seat hold release test: `npm run test:expired-holds`
  - Payment idempotency & replay test: `npm run test:idempotency`
  - Auth token security test: `npm run test:auth`

---

## 🚢 Vercel Deployment Instructions

1. **Push code to GitHub / GitLab**.
2. **Import project into Vercel**.
3. **Provision Neon PostgreSQL from Vercel Marketplace**:
   - Go to the **Storage** tab in your Vercel Dashboard.
   - Click **Connect Store** -> Select **Neon Serverless Postgres**.
   - Vercel automatically sets `DATABASE_URL` and `POSTGRES_URL`.
4. **Configure Environment Variables in Vercel**:
   - `JWT_SECRET`: Random 64-character secret.
   - `CRON_SECRET`: Random secret to protect the hold release cron.
   - `PAYMENT_PROVIDER`: `MOCK_TEST` or `STRIPE_TEST`.
5. **Configure Vercel Cron (Optional)**:
   Add `vercel.json` to automatically trigger hold releases every 5 minutes:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/release-holds",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```
6. **Deploy**:
   ```bash
   vercel --prod
   ```

---

## 👥 Demo Credentials

- **Admin Account**: `admin@cinebook.com` / `Admin123!`
- **Demo User Account**: `user@cinebook.com` / `User123!`
