# Reis Invent Service

Premium event-rental and styling website foundation for Reis Invent Service.

## Stack
- Next.js
- TypeScript
- Firebase-ready
- CSS design system (no UI template)

## 1. Install

```bash
npm install
```

## 2. Firebase environment

Copy `.env.local.example` to `.env.local` and put the Firebase Web App configuration values there.

Do not add `.env.local` to GitHub.

## 3. Run

```bash
npm run dev
```

Open http://localhost:3000

## 4. Build

```bash
npm run build
```

## Current milestone

Landing page only.

The next milestone will replace sample catalogue content with Firestore/CMS-driven content and build the protected admin CMS.

## Important

The Firebase Web SDK configuration is not a server secret. Never place Firebase Admin service-account private keys, Stripe secret keys, passwords, or other server secrets in this repository.
