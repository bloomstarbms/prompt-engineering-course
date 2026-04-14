#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Prompt Engineering Course — GitHub + Vercel Deploy Script
# ─────────────────────────────────────────────────────────────
# Usage: bash deploy.sh YOUR_GITHUB_USERNAME YOUR_REPO_NAME
#
# Example:
#   bash deploy.sh bloomstarbms prompt-engineering-course
# ─────────────────────────────────────────────────────────────

GITHUB_USER=${1:-"your-username"}
REPO_NAME=${2:-"prompt-engineering-course"}

echo ""
echo "🚀 Prompt Engineering Course — Deploy Setup"
echo "============================================"
echo ""

# ── Step 1: Init git ──────────────────────────────────────────
echo "📁 Step 1: Initialising git repository..."
git init
git add .
git commit -m "feat: initial commit — Prompt Engineering course v1.0"
echo "✓ Git repo initialised"
echo ""

# ── Step 2: GitHub remote ─────────────────────────────────────
echo "🔗 Step 2: Linking to GitHub..."
echo "   Make sure you've created the repo first at:"
echo "   https://github.com/new → name it: $REPO_NAME"
echo ""
read -p "   Press ENTER once the GitHub repo is created..."
echo ""

git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
git branch -M main
git push -u origin main

echo ""
echo "✓ Code pushed to: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""

# ── Step 3: Vercel ────────────────────────────────────────────
echo "🌐 Step 3: Deploy to Vercel"
echo ""
echo "   Option A — Via Vercel Dashboard (recommended, 2 min):"
echo "   1. Go to https://vercel.com/new"
echo "   2. Click 'Import Git Repository'"
echo "   3. Select: $GITHUB_USER/$REPO_NAME"
echo "   4. Click Deploy — Vercel auto-detects Next.js"
echo "   5. Your site will be live at:"
echo "      https://$REPO_NAME.vercel.app"
echo ""
echo "   Option B — Vercel CLI:"
echo "   npm i -g vercel && vercel --prod"
echo ""
echo "✅ Done! Your course will be live in ~60 seconds after Vercel deploys."
echo ""
