# Priti Enterprises — Contractor Management System

Full-stack employee and payment management for **Priti Enterprises**, a building construction contractor. Tracks daily workers, overtime, weekly advances, salary generation, and builder payments (advance / interim / final).

## Modules

| Module | Path | Description |
|--------|------|-------------|
| **Dashboard** | `/` | Overview: employees, attendance, advances, builder receivables |
| **Employees** | `/employees` | Workers with individual daily wages & OT rates |
| **Attendance** | `/attendance` | Daily full/half day + overtime (bulk entry) |
| **Advances** | `/advances` | Weekly/emergency advances to employees |
| **Payroll** | `/payroll` | Salary generation with auto advance deduction |
| **Projects** | `/projects` | Sites, builder info, contract amounts |
| **Builder Payments** | `/builder-payments` | Advance, interim, final payments from builders |
| **Reports** | `/reports` | Employee ledger & builder settlement |

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Prisma** + **SQLite** (local) — switch to PostgreSQL for production
- **Tailwind CSS**

## Quick Start (Local)

```bash
cd priti-enterprises
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) — you will be redirected to **login**.

**"Connection failed"?** The app must be running first. In the project folder run `npm run dev` (or double-click `start.bat`) and wait until you see `Ready`. Do **not** use port 3000 — this app uses **3002** only.

### Default login

| Field | Value |
|-------|--------|
| Username | `admin` |
| Password | `priti@2025` |

Change the password under **Settings** after first login. Set `ADMIN_PASSWORD` in `.env` before `npm run db:seed` to use a different initial password.

Sample data is loaded on **first run only** (4 demo employees). Your own employees are **never deleted** unless you run `npm run db:reset`.

### Important: do not lose your data

| Command | Effect |
|---------|--------|
| `npm run db:push` | Updates database structure — **keeps your employees** |
| `npm run db:seed` | Safe: skips if employees already exist |
| `npm run db:reset` | **Deletes ALL data** and reloads demo samples — avoid unless intentional |

If employees disappeared before, it was likely because `db:seed` or `db:setup` ran when the seed script still wiped the database (fixed now). Re-add your employees; they will stay unless you run `db:reset`.

**OneDrive tip:** This project is on OneDrive Desktop. Exclude `priti-enterprises/prisma/dev.db` from sync or move the project outside OneDrive to avoid database file conflicts.

## New Features

| Feature | Description |
|---------|-------------|
| **Login protection** | JWT session cookie; all pages and APIs require auth |
| **Hindi / English UI** | Toggle in sidebar (HI/EN) or Settings — default Hindi |
| **PDF salary slips** | Full sheet or per-employee slip from payroll detail |
| **WhatsApp export** | Salary message per employee (if phone saved) or full summary |
| **CSV export** | Download payroll as spreadsheet |
| **Copy yesterday's attendance** | One-click on Attendance page |
| **Change password** | Settings page |

## Salary Calculation

For each employee in a period:

- **Gross** = (full days × daily wage) + (half days × daily wage × 0.5) + (OT hours × OT rate)
- **OT rate** = employee's overtime rate, or daily wage ÷ 8 if not set
- **Net** = Gross − pending advances (FIFO deduction)

## Builder Settlement

For each project:

- **Balance Due** = Contract Amount − (Advance + Interim + Final + Other payments)

Use the **Reports → Builder Settlement** view when preparing final bills.

## Deploy to Production

### Option A: Vercel + Neon (PostgreSQL) — Recommended

1. Create a free database at [neon.tech](https://neon.tech)
2. Update `prisma/schema.prisma` datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Push schema: `npx prisma db push`
4. Deploy on [vercel.com](https://vercel.com):
   - Import this folder as a project
   - Set `DATABASE_URL` to your Neon connection string
   - Build command: `npm run build`
   - Run seed once: `npm run db:seed` (locally with production URL)

### Option B: Railway / Render

1. Connect GitHub repo
2. Set `DATABASE_URL` (PostgreSQL)
3. Build: `npm install && npx prisma db push && npm run build`
4. Start: `npm start`

### Option C: Windows VPS

```bash
npm install
npm run db:setup
npm run build
npm start
```

Use PM2 or IIS reverse proxy for always-on service.

## Project Structure

```
priti-enterprises/
├── prisma/           # Database schema & seed
├── src/
│   ├── app/          # Pages & API routes
│   ├── components/   # Shared UI
│   ├── lib/          # Prisma client, utilities
│   └── modules/      # Business logic (payroll calc, settlement)
└── README.md
```

## Environment

Copy `.env.example` to `.env`:

```
DATABASE_URL="file:./dev.db"
```

---

**Priti Enterprises** — Construction workforce & payment management
