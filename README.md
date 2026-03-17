# ABRASAS BLANES — Reservation System

A production-ready restaurant reservation system for a premium steakhouse. Built with Next.js, TypeScript, Supabase, and Tailwind CSS.

## Features

- **Mobile-first public booking** — Customers pick date, party size, see live availability, and book in seconds.
- **Server-side availability engine** — Uses PostgreSQL exclusion constraints to prevent double bookings even under concurrent load.
- **Admin dashboard** — Staff view daily reservations, manage statuses (Pending → Confirmed → Completed / No-Show / Cancelled).
- **Manual reservation creation** — Staff can create reservations directly from the admin panel.
- **WhatsApp integration** — Post-booking "Contact via WhatsApp" button with a pre-filled message.
- **Secure auth** — Supabase Auth with middleware-protected admin routes.

## Tech Stack

| Layer      | Technology             |
|------------|------------------------|
| Framework  | Next.js 15 (App Router)|
| Language   | TypeScript             |
| Database   | Supabase (PostgreSQL)  |
| Auth       | Supabase Auth          |
| Styling    | Tailwind CSS v4        |
| Icons      | Lucide React           |
| Forms      | React Hook Form + Zod  |

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd abrasas-blanes-reservations
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor
3. Create an admin user in Supabase Auth (email + password)
4. Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public booking page.  
Open [http://localhost:3000/admin](http://localhost:3000/admin) for the staff dashboard.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Public booking page
│   ├── layout.tsx                  # Root layout (dark theme)
│   ├── api/
│   │   ├── availability/route.ts   # GET: check available time slots
│   │   └── reservations/route.ts   # POST: create a reservation
│   ├── admin/
│   │   ├── login/                  # Staff login page + server actions
│   │   └── dashboard/              # Reservation management + manual creation
│   └── auth/signout/               # Sign-out route
├── components/
│   └── BookingForm.tsx             # Multi-step booking form (client)
├── lib/supabase/
│   ├── client.ts                   # Browser Supabase client
│   └── server.ts                   # Server + Service Role clients
└── middleware.ts                   # Auth route protection
supabase/
└── schema.sql                      # Database schema + seed data
```

## Reservation Logic

1. **Availability** (`GET /api/availability`): Queries all active tables with sufficient capacity, checks existing reservations for time overlaps, returns only slots with at least one free table.
2. **Booking** (`POST /api/reservations`): Finds the smallest suitable table, attempts insertion. PostgreSQL's `EXCLUDE` constraint (`prevent_double_booking`) atomically rejects conflicting inserts — if a table was concurrently booked, the system tries the next table.
3. **Concurrency safety**: The database-level exclusion constraint guarantees no double bookings, even under simultaneous requests.

## Deployment

Ready for Vercel or Netlify:

```bash
# Vercel
npx vercel

# Or build for Netlify
npm run build
```

Set these environment variables in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## License

Private — ABRASAS BLANES
