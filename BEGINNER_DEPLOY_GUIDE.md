# 🚀 Complete Beginner's Guide — GitHub + Vercel Deployment

This guide assumes you know nothing about deploying websites. Follow every step and your course will be live on the internet.

---

## PART 1 — Set Up Your Computer (One Time Only)

### Step 1: Install Node.js

Node.js lets you run the development server and build the project.

1. Go to **https://nodejs.org**
2. Click the big green button that says **"LTS"** (recommended for most users)
3. Download and run the installer
4. Click Next → Next → Install → Finish
5. **Verify it worked:** Open your terminal and type:
   ```
   node --version
   ```
   You should see something like `v20.11.0`. If you do, Node.js is installed. ✅

> **Windows:** Search for "Command Prompt" or "PowerShell" in the Start menu  
> **Mac:** Press Cmd+Space, type "Terminal", press Enter

---

### Step 2: Install Git

Git is how you send code to GitHub.

1. Go to **https://git-scm.com/downloads**
2. Click your operating system (Windows / Mac)
3. Download and install with all default settings
4. **Verify it worked:**
   ```
   git --version
   ```
   You should see something like `git version 2.43.0` ✅

---

### Step 3: Create a GitHub Account (if you don't have one)

1. Go to **https://github.com**
2. Click **Sign up**
3. Enter your email, password, and username
4. Verify your email

---

### Step 4: Create a Vercel Account (free)

1. Go to **https://vercel.com**
2. Click **Sign Up**
3. Choose **"Continue with GitHub"** — this links your accounts automatically

---

## PART 2 — Set Up Your Project

### Step 5: Extract the ZIP file

1. Find the **pe-course.zip** file you downloaded
2. Right-click → Extract All (Windows) or double-click (Mac)
3. You'll get a folder called **pe-course**

### Step 6: Open a terminal in the project folder

**Windows:**
1. Open the **pe-course** folder in File Explorer
2. Click in the address bar at the top
3. Type `cmd` and press Enter
4. A black Command Prompt window opens — you're in the right folder ✅

**Mac:**
1. Open the **pe-course** folder in Finder
2. Right-click the folder → "New Terminal at Folder"
3. A Terminal window opens ✅

### Step 7: Install dependencies

In the terminal, type exactly:
```
npm install
```
Press Enter. You'll see a lot of text scrolling. Wait for it to finish (30–60 seconds).

When you see a line like `added 285 packages` — it's done ✅

### Step 8: Run it locally first (optional but recommended)

```
npm run dev
```

Open your browser and go to **http://localhost:3000**

You should see your course! Press **Ctrl+C** in the terminal to stop it when done.

---

## PART 3 — Push to GitHub

### Step 9: Create a new repository on GitHub

1. Go to **https://github.com/new**
2. Fill in:
   - **Repository name:** `prompt-engineering-course`
   - **Visibility:** Public (so Vercel can see it for free)
   - ❌ Do NOT check "Add a README file"
   - ❌ Do NOT add .gitignore
3. Click **"Create repository"**
4. You'll see a page with setup instructions — keep this page open

### Step 10: Connect your folder to GitHub

In your terminal (make sure you're still in the **pe-course** folder), run these commands **one by one**, pressing Enter after each:

```
git init
```
```
git add .
```
```
git commit -m "initial commit: prompt engineering course"
```
```
git branch -M main
```

Now copy the command from Step 9's GitHub page. It looks like this (with YOUR username):
```
git remote add origin https://github.com/YOUR_USERNAME/prompt-engineering-course.git
```

Then:
```
git push -u origin main
```

**If asked for your GitHub username and password:**
- Username: your GitHub username
- Password: you need a **Personal Access Token**, not your actual password

**How to get a token:**
1. Go to GitHub → click your profile picture → Settings
2. Scroll to the bottom → click **"Developer settings"**
3. Click **"Personal access tokens"** → **"Tokens (classic)"**
4. Click **"Generate new token (classic)"**
5. Give it a name (e.g., "deploy")
6. Check the **"repo"** box
7. Click **"Generate token"**
8. **Copy the token immediately** (you won't see it again)
9. Use this as your password when git asks

### Step 11: Verify the push worked

Go to `https://github.com/YOUR_USERNAME/prompt-engineering-course`

You should see all your project files there. ✅

---

## PART 4 — Deploy on Vercel

### Step 12: Import your project to Vercel

1. Go to **https://vercel.com/dashboard**
2. Click **"Add New…"** → **"Project"**
3. You'll see a list of your GitHub repos
4. Find **prompt-engineering-course** and click **"Import"**

### Step 13: Configure the project

You don't need to change anything! Vercel automatically detects:
- ✅ Framework: Next.js
- ✅ Build command: `npm run build`
- ✅ Output directory: `.next`

Just click the big **"Deploy"** button.

### Step 14: Wait for deployment

Vercel will build and deploy your project. This takes about 60–90 seconds.

You'll see a progress bar. When it's done, you'll see:

> 🎉 "Congratulations! Your project has been deployed."

### Step 15: Get your live URL

Vercel gives you a URL like:
```
https://prompt-engineering-course.vercel.app
```

Click it — your course is LIVE on the internet! ✅

---

## PART 5 — Making Updates Later

Every time you make changes to the code:

```
git add .
git commit -m "describe what you changed"
git push
```

Vercel automatically detects the push and redeploys. New version is live in ~60 seconds.

---

## PART 6 — Adding Real Videos

Each lesson in `src/data/courseData.js` has a `vid` field with a placeholder YouTube video ID.

To add your own videos:

1. Upload your video to YouTube (or find a relevant public video)
2. Copy the video ID from the URL:
   - URL: `https://www.youtube.com/watch?v=`**`dQw4w9WgXcQ`**
   - ID is: `dQw4w9WgXcQ`
3. Open `src/data/courseData.js` in a text editor (VS Code recommended)
4. Find `vid: "dQw4w9WgXcQ"` for the lesson you want to update
5. Replace it with your actual video ID
6. Save the file and push to GitHub

---

## 🆘 Common Problems & Fixes

| Problem | Fix |
|---|---|
| `npm: command not found` | Node.js not installed. Go back to Step 1 |
| `git: command not found` | Git not installed. Go back to Step 2 |
| `npm install` fails | Make sure you're inside the pe-course folder |
| GitHub asks for password | Use a Personal Access Token (Step 10) |
| Vercel build fails | Check the error log. Usually a missing `npm install` |
| Site shows blank page | Open browser console (F12) for error details |

---

## 🎯 Custom Domain (Optional)

Once you have a live site on Vercel:

1. Buy a domain (Namecheap, GoDaddy, Google Domains)
2. In Vercel: Project → Settings → Domains → Add
3. Type your domain name (e.g., `promptmastery.com`)
4. Vercel shows you DNS records to add
5. Go to your domain registrar → DNS settings → add those records
6. Wait 10–30 minutes → your custom domain is live ✅

---

## ✅ Summary Checklist

- [ ] Node.js installed
- [ ] Git installed
- [ ] GitHub account created
- [ ] Vercel account created (linked to GitHub)
- [ ] ZIP extracted to pe-course folder
- [ ] `npm install` completed
- [ ] Tested locally with `npm run dev`
- [ ] GitHub repo created
- [ ] Code pushed with `git push`
- [ ] Vercel project imported and deployed
- [ ] Live URL working 🎉
