# Deploy RECIPROCITY to Render

## Quick Deploy (5 minutes)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account

### Step 2: Create New Web Service
1. Click **New** → **Web Service**
2. Connect your GitHub repo: `shubham001312/reciprocity`
3. Configure:
   - **Name:** `reciprocity`
   - **Runtime:** Node
   - **Build Command:** `cd client && npm install && npm run build`
   - **Start Command:** `cd server && node index.js`
   - **Plan:** Free

### Step 3: Set Environment Variables
In the Render dashboard → Environment tab, add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority` |
| `JWT_SECRET` | `<generate a random 32+ char string>` |

**For MongoDB Atlas:**
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free cluster
3. Click **Connect** → **Connect your application**
4. Copy the connection string
5. Replace `<password>` with your database password

### Step 4: Deploy
1. Click **Create Web Service**
2. Render will auto-build and deploy
3. Your app will be live at `https://reciprocity.onrender.com`

---

## What Happens on Deploy

1. Render clones your GitHub repo
2. Runs `buildCommand`: installs client deps + builds React app
3. Runs `startCommand`: starts Express server
4. Server serves the built React app from `client/dist/`
5. All API routes work at `/api/*`

---

## Auto-Deploy

Once connected, every push to `main` branch auto-deploys.

To manually deploy:
- Go to Render dashboard → Manual Deploy → **Deploy latest commit**

---

## Troubleshooting

**Build fails?**
- Check Render build logs
- Make sure `client/package.json` has `vite` in devDependencies

**App crashes on start?**
- Check Render runtime logs
- Ensure `MONGODB_URI` is set correctly
- Server falls back to JSON storage if MongoDB is unavailable

**API 404 errors?**
- The SPA catch-all handles all non-API routes
- Make sure you're logged in for protected endpoints

---

## Free Tier Limits

- 750 hours/month (enough for personal use)
- Spins down after 15 min of inactivity (cold start ~30s)
- 512 MB RAM
- Shared CPU

---

## Production Checklist

- [x] MongoDB Atlas connected (or JSON fallback)
- [x] JWT secret set
- [x] CORS configured
- [x] Static files served correctly
- [x] SPA routing works
- [x] All API endpoints respond
