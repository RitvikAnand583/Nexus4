# Nexus4 Deployment Guide (Render)

## Prerequisites
- GitHub repository with your code
- Render account (free tier works)

## Step 1: Deploy PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **PostgreSQL**
3. Configure:
   - Name: `nexus4-db`
   - Free tier
4. Copy the **Internal Database URL** after creation

## Step 2: Deploy Backend (Web Service)

1. Click **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - Name: `nexus4-server`
   - Root Directory: `server`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Environment Variables:
   - `PORT` = `3001`
   - `DATABASE_URL` = (paste Internal Database URL from Step 1)
5. Deploy

## Step 3: Deploy Frontend (Static Site)

1. Click **New** → **Static Site**
2. Connect same GitHub repo
3. Configure:
   - Name: `nexus4-client`
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. Environment Variables:
   - `VITE_WS_URL` = `wss://nexus4-server.onrender.com` (your backend URL with wss://)
5. Deploy

## Step 4: Update WebSocket URL

After backend deploys, update frontend env:
- Use `wss://` (secure WebSocket) for production
- Example: `wss://nexus4-server.onrender.com`

## Step 5: Initialize Database

Run schema in Render PostgreSQL:
1. Go to your PostgreSQL service
2. Open **Shell** tab
3. Run: `psql -f ../server/src/database/schema.sql`

Or use an external tool like pgAdmin with the External Database URL.

## Notes
- Free tier services sleep after 15 min inactivity
- First request may take ~30s to wake up
- Kafka analytics is skipped (not needed for core gameplay)
