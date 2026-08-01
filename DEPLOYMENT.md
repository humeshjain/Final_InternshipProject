# Decoupled Deployment Guide (Vercel Frontend + Render Backend)

This guide provides step-by-step instructions to deploy the **Vite + React Frontend on Vercel** and the **Node.js + Express Backend on Render**.

---

## Step 1: Deploy Backend on Render

1. Push your repository to **GitHub** or **GitLab**.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service** (or **Blueprint** using `render.yaml`).
3. Connect your repository and configure:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Set Environment Variables in Render:
   - `JWT_SECRET`: Any random strong secret key
   - `CORS_ORIGIN`: `*` (or your Vercel URL e.g. `https://your-app.vercel.app`)
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `GROK_API_KEY`: Your xAI Grok API Key (optional)
5. Click **Deploy Web Service**.
6. Copy your live Render Backend URL (e.g., `https://elevate-business-suite.onrender.com`).

---

## Step 2: Deploy Frontend on Vercel

1. Log into [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New** > **Project**.
2. Import your repository. Vercel will automatically detect `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build:frontend`
   - **Output Directory**: `dist`
3. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://elevate-business-suite.onrender.com` *(Replace with your live Render backend URL)*
   - `VITE_SUPABASE_URL`: *(optional Supabase URL)*
   - `VITE_SUPABASE_ANON_KEY`: *(optional Supabase key)*
4. Click **Deploy**. Your frontend app will be live at `https://your-app.vercel.app`.

---

## Local Development & Single-Server Production

To run the unified server locally or on a single VPS:

```bash
# 1. Build frontend and server bundle
npm run build

# 2. Start combined server
npm start
```
