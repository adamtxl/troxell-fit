# Troxell Fit

Personal fitness tracker for Adam & Tammy. Next.js + Neon PostgreSQL, deployed on Vercel.

---

## One-time setup (30 min total)

### 1. Database — Neon (free)

1. Go to [neon.tech](https://neon.tech) → Create account → New project → name it `troxell-fit`
2. Copy your **Connection string** (looks like `postgresql://...neon.tech/neondb?sslmode=require`)
3. Open the **SQL Editor** tab in Neon and paste + run the entire contents of `scripts/schema.sql`
   - This creates the tables AND seeds all historical weight data from the spreadsheet

### 2. GitHub repo

```bash
cd troxell-fit
git init
git add .
git commit -m "initial commit"
# Create a new repo on github.com/adamtxl (keep it private)
git remote add origin https://github.com/adamtxl/troxell-fit.git
git push -u origin main
```

### 3. Vercel deployment

1. Go to [vercel.com](https://vercel.com) → New Project → Import your `troxell-fit` repo
2. Framework preset: **Next.js** (auto-detected)
3. Add these **Environment Variables** before deploying:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon connection string |
| `APP_PIN` | Pick a PIN (e.g. `solstice2026`) — share with Tammy |
| `JWT_SECRET` | Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and paste the output |

4. Click **Deploy** → ~60 seconds → you'll get a URL like `troxell-fit.vercel.app`

### 4. Custom domain (optional, free on Vercel)

In Vercel project settings → Domains → add `fit.troxellendeavors.com` if you want a cleaner URL.

---

## Local development

```bash
cp .env.local.example .env.local
# Fill in .env.local with your values

npm install
npm run dev
# → http://localhost:3000
```

---

## How it works

- **Login**: Single shared PIN protects the app. Sets a 30-day cookie.
- **User switcher**: Adam (lime) / Tammy (pink) toggle in the header. Fully isolated data per user.
- **Data**: All logs saved to Neon via `/api/logs` and `/api/workouts`. Page loads data server-side (fast, no loading flash).
- **Tammy's goal weight**: Currently set to 310 lbs in `components/TroxellFit.tsx` → `USERS.tammy.goalWeight`. Update if she has a specific target.

---

## Updating the app

Any push to `main` auto-deploys on Vercel (takes ~45 seconds). Just:

```bash
git add .
git commit -m "your changes"
git push
```
