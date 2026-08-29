# Render Auto-Deploy Setup

## How it works

1. **Native Render auto-deploy** (already working): Push to `main` → Render auto-rebuilds
2. **GitHub Actions** (optional): Gives cache clearing + health checks + build verification before deploy

## Setup Steps

### 1. Get Render API Key
1. Go to [Render Dashboard](https://dashboard.render.com) → **Account Settings** → **API Keys**
2. Click **Create API Key**
3. Name it `github-actions`
4. Copy the key

### 2. Get Render Service ID
1. Go to your **reciprocity** service page
2. The Service ID is in the URL: `dashboard.render.com/web/srv-XXXXX`
3. Copy `srv-XXXXX`

### 3. Add GitHub Secrets
1. Go to your repo: https://github.com/shubham001312/reciprocity
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - `RENDER_API_KEY` = (your API key)
   - `RENDER_SERVICE_ID` = `srv-XXXXX`

### 4. Test
Push any commit to `main`:
```bash
git push origin main
```

Go to **Actions** tab on GitHub → watch the pipeline run:
1. ✅ Build & Verify (client build + server modules + route checks)
2. ✅ Deploy to Render (with cache clear)
3. ✅ Health check (verifies site returns 200)

## Cache Clearing

The GitHub Actions deploy uses `johnbeynon/render-deploy-action` which:
- Clears Render's build cache before deploying
- Forces a fresh install of all dependencies
- This prevents stale cached builds from causing issues

If you ever need to manually clear cache:
1. Go to Render dashboard → your service
2. **Manual Deploy** → **Clear build cache & deploy**

## Troubleshooting

### Build fails with "vite not found"
→ Render is using wrong Node version. Check `render.yaml` has `nodeVersion: "18.20.8"`

### Deploy fails with "express not found"
→ Server dependencies not installed. Check build command includes `cd server && npm install`

### Health check returns 503
→ Server is still starting up. Wait 2-3 minutes and check again.

### MongoDB connection fails on Render
→ Check IP whitelist in MongoDB Atlas (add 0.0.0.0/0)
→ Check MONGODB_URI env var in Render matches your Atlas connection string
