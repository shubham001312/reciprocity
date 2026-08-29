# Setup Render Auto-Deploy with GitHub Actions

## Step 1: Get Render API Key

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click your avatar → **Account Settings**
3. Scroll to **API Keys** section
4. Click **Create API Key**
5. Name it `github-actions`
6. Copy the key (shown only once!)

## Step 2: Get Service ID

1. Go to your Render service dashboard
2. The URL is: `https://dashboard.render.com/web/svc-xxxxxxxx`
3. Copy the `svc-xxxxxxxx` part — that's your Service ID

## Step 3: Add to GitHub Secrets

1. Go to your GitHub repo: `https://github.com/shubham001312/reciprocity`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these two secrets:

| Name | Value |
|------|-------|
| `RENDER_API_KEY` | The API key from Step 1 |
| `RENDER_SERVICE_ID` | The service ID from Step 2 |

## Step 4: Test It

Push any change to `main`:
```bash
git push origin main
```

Go to **Actions** tab on GitHub — you'll see the pipeline running!

## How It Works

```
Push to main
    ↓
GitHub Actions triggers
    ↓
Build & Verify (client build + server checks)
    ↓ ✅ All passed
Deploy to Render (via API)
    ↓
Live at https://reciprocity.onrender.com
```

## Without Render API Keys

If you don't set up the API keys, the **CI pipeline** still runs on every push:
- ✅ Client builds successfully
- ✅ Server modules load correctly
- ✅ All route files present

Render's built-in auto-deploy still works (connected via GitHub integration).

## Troubleshooting

**Build fails in Actions?**
- Check the Actions tab for detailed logs
- Usually a missing dependency or syntax error

**Deploy fails?**
- Verify `RENDER_API_KEY` is correct
- Verify `RENDER_SERVICE_ID` matches your service
- Check Render dashboard for deployment logs
