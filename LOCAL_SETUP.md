# Running SoulJourney (KP Astrology) Locally

## Prerequisites

- **Node.js 20+**
- **Python 3.11+** — required for the accurate Swiss Ephemeris chart engine

## Steps

```bash
# 1. Install Node dependencies
npm install

# 2. Install the Python dependency used by the KP calculation engine
pip install pyswisseph
#   (or: pip3 install pyswisseph)

# 3. Start the app in development mode
npm run dev

# 4. Open it
#   http://localhost:5000
```

That's it. In development mode the app signs you in automatically as a local
demo user, so **no Firebase / Google login is required** to use the full UI
(chart generation, saved horoscopes, matches, etc.).

## Notes

- **Database:** uses a local SQLite file (`local.db`) that ships with the repo —
  no PostgreSQL needed. (The older `setup-mac.sh` mentions Postgres; that is
  outdated.) The app automatically uses SQLite when no Firebase credentials are
  present, so it runs locally with zero external services. It switches to
  Firebase/Firestore only when `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` /
  `FIREBASE_PRIVATE_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`, or `USE_FIREBASE` are
  set.
- **Port:** the server serves both the API and the client on **port 5000**.
  Override with `PORT=3000 npm run dev` if 5000 is taken.
- **Auth in production:** when built and run with `npm start`
  (`NODE_ENV=production`), the development sign-in bypass is disabled and a valid
  Firebase ID token is required. Configure Firebase in
  `client/src/lib/firebase.ts` and provide Firebase Admin credentials
  (`serviceAccountKey.json` or `GOOGLE_APPLICATION_CREDENTIALS`) for real login.
- **Optional env vars** (create a `.env` file in the project root if you want AI
  features): `OPENAI_API_KEY=...`

## Quick check without the UI

The calculation endpoint works directly (no auth needed):

```bash
curl -s -X POST http://localhost:5000/api/horoscope \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","birthDate":"1990-11-25","birthTime":"03:17:25","birthPlace":"Pudukkottai","latitude":10.381389,"longitude":78.821389}'
```
