# Deployment Guide for "Cosmic Horoscopes"

This application uses a modern stack (React, Node.js, SQLite) that works best on platforms that support persistent storage for the database.

## Option 1: Replit (Recommended)
Since your project already includes Replit configuration, this is the easiest path.

1.  **Create a Replit Account**: Go to [replit.com](https://replit.com).
2.  **Import Repo**: Click "Create Repl" -> "Import from GitHub" (or upload folder).
3.  **Run**: Click the "Run" button. Replit automatically detects `package.json`.
    *   It will run `npm install` and `npm run dev`.
    *   Your database (`sqlite.db`) will be preserved automatically.
4.  **Publish**: Click "Deploy" in the top right to get a permanent URL (e.g., `soul-journey.replit.app`).

## Option 2: Render.com (Free/Cheap)
If you prefer a standalone wrapper:

1.  **Push to GitHub**: Ensure your code is on GitHub.
2.  **Create Web Service**: Go to dashboard.render.com -> "New Web Service".
3.  **Settings**:
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
4.  **Important - Database**:
    *   Render's free tier *wipes data* when it restarts.
    *   **Fix**: You must attach a **Disk** (requires paid plan ~$7/mo) to store `sqlite.db` OR switch to PostgreSQL (Neon/Supabase).

## Option 3: Docker (Cheapest & Most Flexible)
Since you asked for **Docker**, this is the best way to deploy anywhere.

### 1. The Setup (Done)
I have created the `Dockerfile` and `docker-compose.yml` for you.

### 2. Cheap Hosting Recommendations
*   **Hetzner Cloud (Recommended for Cheapest)**:
    *   **Cost**: ~€4-5/month.
    *   **Pros**: Incredible performance for the price, full root access.
    *   **How**: Buy a VPS -> SSH in -> `git clone` -> `docker-compose up -d`.
*   **Railway.app**:
    *   **Cost**: ~$5/month (usage based).
    *   **Pros**: Connects to GitHub, auto-builds Dockerfile. Zero setup.
    *   **Note**: Use a "Volume" for the database.
*   **DigitalOcean App Platform**:
    *   **Cost**: $5/month (Basic).
    *   **Pros**: Simple interface, supports Docker directly.

### 3. How to Deploy with Docker (VPS)
1.  **SSH into your server**: `ssh root@your-ip`
2.  **Clone your repo**: `git clone https://github.com/your/repo.git`
3.  **Run**:
    ```bash
    cd repo
    docker-compose up -d --build
    ```
4.  Your app is now live on the server's IP!

