# Supabase Setup Guide

You want to use Supabase as your database to enable AI integration and Mobile App access. Excellent choice.

## 1. Get your Database URL
1.  Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Create a **New Project**.
3.  Go to **Project Settings** (gear icon) -> **Database**.
4.  Scroll down to **Connection String** -> **Node.js** (or URI).
5.  Copy the connection string. It looks like:
    `postgresql://postgres.yourproject:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
    *(Replace `[PASSWORD]` with the password you created).*

## 2. Connect Your App
1.  Create a file named `.env` in this project folder (if it doesn't exist).
2.  Add your URL:
    ```env
    DATABASE_URL="postgresql://postgres.yourproject:password@host:6543/postgres"
    ```

## 3. Push the Schema (Migration)
Run this command in your terminal to create the tables in Supabase:

```bash
npx drizzle-kit push --config=drizzle.config.pg.ts
```

## 4. Verify
Start your app:
```bash
npm run dev
```
It will automatically detect the `DATABASE_URL` and connect to Supabase instead of the local SQLite file.
