# FITTRACK — Body Composition Monitoring App

> A clean, data-driven web app for tracking body fat percentage and physical measurements using the **US Navy Method** — the same formula used by military fitness standards worldwide.

<!-- 🖼️ IMAGE 1: Screenshot of the landing/hero page showing the mock card and feature grid -->
![Hero Page](https://github.com/user-attachments/assets/95c107fa-f2b2-4bb5-aae9-636e64d8958f)

## What It Does

FITTRACK lets you log and visualise body composition over time. You enter a few circumference measurements, and the app calculates your body fat percentage using the scientifically validated Hodgdon & Beckett (1984) formula. Results are categorised against **ACE (American Council on Exercise)** standards — Athlete, Fit, Average, or Obese — so the numbers always have context.

Key highlights:
- **Multi-user support** — track separate profiles in one instance, no authentication friction
- **US Navy body fat calculation** — height, neck, waist & hip circumferences in, body fat % out
- **Interactive charts** — area, line, and bar charts for body fat, weight, and circumferences over time
- **SVG body diagram** — a visual overlay that highlights proportions from the latest entry
- **ACE category badges** — instantly see which fitness tier each measurement falls into
- **Responsive UI** — works on desktop and mobile, with skeleton loaders and smooth transitions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database ORM | Prisma 7 (PostgreSQL) |
| Charts | Recharts 3 |
| Auth | NextAuth.js v5 (Auth.js) |
| Validation | Zod 4 |
| Password Hashing | bcryptjs |
| Date Utilities | date-fns |

---

## Screenshots & Demo

<!-- 🖼️ IMAGE 2: Dashboard page showing stat cards, body diagram, and trend charts for a selected user -->
![Dashboard Overview](https://github.com/user-attachments/assets/5c058503-8a61-4989-b047-9e53830af3a7)

<!-- 🖼️ IMAGE 3: Body metrics log form — the page where measurements are entered -->
![Log Metrics Form](https://github.com/user-attachments/assets/f0a8ace7-b700-4893-afcb-c47e7e9b834e)

<!-- 🎬 VIDEO/GIF: Short walkthrough — add a user → log measurements → see the dashboard update with charts and category badge -->
![App Demo](https://github.com/user-attachments/assets/12f1aac5-3b8a-4d64-8606-02cab672e5bf)

---

## Prerequisites

Make sure you have these installed before you start:

- **Node.js** v18 or later — [nodejs.org](https://nodejs.org/)
- **npm** v9+ (comes with Node.js)
- **PostgreSQL** — a running instance, local or remote ([postgresql.org](https://www.postgresql.org/))

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/fitness-monitoring.git
cd fitness-monitoring
```

### 2. Install dependencies

```bash
npm install
```
or simple type
```bash
npm i
```


### 3. Configure environment variables

Copy the example env file and fill in your database credentials:

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder values:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/YOUR_DB_NAME?schema=public"
```

> If you use a different database provider, update the `provider` field in `prisma/schema.prisma` and install the matching Prisma adapter.

### 4. Apply database migrations

```bash
npx prisma migrate deploy
```

This creates all the required tables (`User`, `BodyMetrics`) in your database.

### 5. Generate the Prisma client

```bash
npx prisma generate
```

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Main dashboard with charts & body diagram
│   ├── body-metrics/      # Measurement log form
│   ├── users/             # User profile management
│   ├── api/               # REST API routes (Next.js Route Handlers)
│   └── components/
│       ├── Navbar.tsx
│       └── BodyDiagram.tsx
├── lib/
│   └── usnavy.ts          # US Navy body fat formula + ACE categorisation
└── generated/
    └── prisma/            # Auto-generated Prisma client
prisma/
├── schema.prisma          # Database schema
└── migrations/            # Migration history
```

---

## How the US Navy Formula Works

The app implements the **Hodgdon & Beckett (1984)** method:

**Male:**
```
%BF = 495 / (1.0324 - 0.19077 × log10(waist - neck) + 0.15456 × log10(height)) - 450
```

**Female:**
```
%BF = 495 / (1.29579 - 0.35004 × log10(waist + hip - neck) + 0.22100 × log10(height)) - 450
```

All measurements are in centimetres. The result is classified using ACE categories:

| Category | Male BF% | Female BF% |
|---|---|---|
| Athlete | 6–12% | 14–19% |
| Fit | 13–16% | 20–23% |
| Average | 17–24% | 24–30% |
| Obese | 25%+ | 31%+ |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at `localhost:3000` |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

---

## License

MIT
