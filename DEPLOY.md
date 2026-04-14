# 🚀 Deployment Guide

## Prerequisites
- Node.js 18+ installed → https://nodejs.org
- Git installed → https://git-scm.com
- GitHub account → https://github.com
- Vercel account (free) → https://vercel.com

---

## Step 1 — Run locally first (optional but recommended)

```bash
# Inside the pe-course folder:
npm install
npm run dev
# Open http://localhost:3000
```

---

## Step 2 — Push to GitHub

```bash
# 1. Create a new repo on GitHub:
#    Go to https://github.com/new
#    Name it: prompt-engineering-course
#    Set to Public
#    Don't initialise with README (we have one)
#    Click "Create repository"

# 2. In your terminal, inside the pe-course folder:
git init
git add .
git commit -m "feat: initial commit"
git remote add origin https://github.com/YOUR_USERNAME/prompt-engineering-course.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 3 — Deploy on Vercel

### Option A: Dashboard (easiest)
1. Go to **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Select your `prompt-engineering-course` repo
4. Leave all settings as default — Vercel auto-detects Next.js
5. Click **Deploy**
6. ✅ Live in ~60 seconds at `https://prompt-engineering-course.vercel.app`

### Option B: Vercel CLI
```bash
npm install -g vercel
vercel --prod
# Follow the prompts — link to your GitHub repo
```

---

## Step 4 — Custom Domain (optional)

In Vercel dashboard:
1. Go to your project → **Settings** → **Domains**
2. Add your domain (e.g. `promptmastery.com`)
3. Update your DNS with the records Vercel provides

---

## Updating the course later

To update content (e.g. add real YouTube video IDs):

1. Edit `src/data/courseData.js`
2. Find the lesson: `vid: "dQw4w9WgXcQ"`
3. Replace `dQw4w9WgXcQ` with your actual YouTube video ID
4. Save, commit, push → Vercel auto-redeploys

```bash
git add .
git commit -m "content: update video IDs for module 1"
git push
```

Vercel picks up the push and redeploys automatically.

---

## Adding Your Real Videos

Each lesson in `courseData.js` has a `vid` field:
```js
{
  title: "How LLMs Actually Work",
  dur: "25 min",
  vid: "dQw4w9WgXcQ",  ← replace this with your YouTube video ID
  body: `...`
}
```

The YouTube video ID is the part after `?v=` in a YouTube URL:
`https://www.youtube.com/watch?v=`**`dQw4w9WgXcQ`**
