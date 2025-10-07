This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Facilium

Facilium is a Next.js-based e-room plotting and scheduling system, developed as a capstone project to automate and simplify room assignments.

## Table of Contents

- [About](#about)
- [Demo](#demo)
- [Features](#features)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Built With](#built-with)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)
- [Contact](#contact)

## Demo

null

## Features

- Automated room assignment
- Real-time scheduling with Firebase
- Responsive UI powered by Next.js and Shadcn UI
- Customizable via `.env.local`

## Getting Started

1. Clone repo
2. Install dependencies (`npm install`)
3. Add `.env.local` from Discord
4. Run with `npm run dev`
5. Visit application at `localhost:3000`

## Usage

null

## Built With

- Next.js • TypeScript • Firebase • Tailwind CSS

## Environment Variables

Create a `.env.local` file (never commit it). Required variables

```
# Firebase Client (public – safe to expose in browser)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (server-side only)
FIREBASE_ADMIN_PRIVATE_KEY_ID=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nLINE1\nLINE2\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_CLIENT_ID=...

# Optional (future)
# FIREBASE_EMULATORS=1
```

Important:

1. If you paste the private key from JSON, convert real newlines to literal `\n` or wrap it in quotes as shown. The app normalizes both forms.
2. On Vercel paste the key exactly as copied from the JSON (with real newlines) – no extra quotes. The normalization in `firebase/server.ts` handles it.
3. If build logs show: `Firebase admin initialization skipped: missing env vars -> ...`, add the missing values in your environment.

Key rotation: Create a new service account key in GCP Console, update env vars, redeploy, then remove the old key.

## Architecture Notes (Guards & Roles)

Client Guard Flow:

1. Middleware (`middleware.ts`) enforces coarse route protection at the edge.
2. `AuthProvider` manages Firebase user + custom claims + cookie sync.
3. `useRequireAuth` (in `lib/use-require-auth.ts`) prevents UI flash by client-side redirect once auth state resolved.
4. `RoleGate` (in `lib/roles.tsx`) conditionally renders UI for specific roles (e.g., show admin-only actions) without extra network calls.

Why both middleware + client guard? Middleware protects server-rendered responses; the hook cleans up client navigation flickers.

Token Refresh Strategy:

- Silent refresh every 25 minutes resets cookies and claims if changed.
- Manual trigger available via `refreshSession()` from `useAuth()` if you promote a user mid-session.

Error Handling:

- Global runtime errors fall back to `app/error.tsx` with reset + reload controls.

Adding a Protected Page:

1. Wrap page content with `RoleGate required={['admin']}` (if role-specific) OR rely on middleware for basic blocking.
2. Use `useRequireAuth()` at top of client component if rendering sensitive user-dependent UI directly.

Future Enhancements (safe to add later):

- Skeleton states keyed on role detection.
- Central analytics logging inside error boundary.
- Batched Firestore reads using data loader pattern.

## License

© Marlon Pondavilla

## Contact

Discord: [_kepler1]  
Repo: https://github.com/marlonpondavilla/facilium
