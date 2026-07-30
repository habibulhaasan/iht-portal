# IHT Rangpur Portal

Registration → login → mandatory profile completion → full dashboard (profile edit, blood
donation log with countdown, member directory with filters, favorites) → admin panel.
Built with Next.js (App Router) and Firebase (Auth + Firestore + Cloud Functions).

## What's in this drop

```
lib/firebase.js              Firebase client init (reads env vars)
lib/bdData.js                Real division/district/upazila dataset (from your bd-data.ts)
lib/hospitalData.js          DGHS/DGFP/DGDA facility directory, linked to bdData (from hospital-data.ts)
lib/hospitals.json           2,606 facility records backing hospitalData.js (from your upload)
lib/donationUtils.js         Donation count / last-date / next-eligible-date math
lib/auditLog.js              Writes an auditLogs entry for every admin edit to a locked field
lib/photoUtils.js            Shared photo resize/base64-encode + gendered default avatar helper
lib/firebaseAdmin.js         Firebase Admin SDK init (server-only — never import from a client file)
lib/sessionCookie.js         Client helpers to sync/clear the server session cookie on login/logout

middleware.js                 Edge middleware — blocks unauthenticated requests to protected routes
app/api/session/route.js      Mints/clears the httpOnly session cookie middleware.js checks for

context/AuthContext.jsx      Auth state + live userDoc (role, profileComplete)
components/RouteGuard.jsx    Client-side gate: no-auth -> /login, incomplete -> /onboarding
components/AdminGuard.jsx    Client-side gate: non-admin -> /dashboard

app/register, app/login, app/forgot-password    Auth pages
app/onboarding                5-step mandatory profile wizard with progress bar
app/dashboard                 Tabbed shell: My Profile / Blood Donations / Directory / Favorites
app/admin                     Searchable member list + locked-field editor + audit history

components/steps/*            The 5 onboarding steps
components/dashboard/*         The 4 dashboard tabs
components/admin/*            AdminEditForm + AuditHistory

functions/index.js            Cloud Functions — see "Server-side integrity" below
firestore.rules               Security rules matching the user-vs-admin field split
```

## Setup

1. `npm install` in the project root (dependencies: `firebase`, `next`, `react`).
2. Create a Firebase project → enable **Authentication (Email/Password)** and **Firestore**.
   Cloud Functions requires the project be on the **Blaze (pay-as-you-go) plan** — it has a
   generous free tier, but Spark-plan projects can't deploy functions at all.
3. Copy `.env.local.example` → `.env.local` and fill in your Firebase config (Project Settings
   → General → Your apps → SDK config).
4. Also in `.env.local`: go to Project Settings → **Service Accounts** → Generate new private key.
   That downloads a JSON file — copy `project_id`, `client_email`, and `private_key` into
   `FIREBASE_ADMIN_PROJECT_ID` / `FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY`.
   This powers the session-cookie API route (`app/api/session`) — **never** commit this file or
   expose these values to the client (no `NEXT_PUBLIC_` prefix, unlike the config above).
5. Deploy security rules: `firebase deploy --only firestore:rules`
6. Deploy Cloud Functions: `cd functions && npm install && cd .. && firebase deploy --only functions`
7. `npm run dev`
8. **Create your first admin**: register a normal account through the app, then in the Firestore
   console manually set `role: "admin"` on that user's `users/{uid}` doc. After that, admins can
   promote/demote others from the admin panel itself.

## Real data now wired in
- **Address fields** (permanent + current) now store `{ divisionId, districtId, upazilaId }`
  rather than raw name strings — more robust against renamed/duplicate places, and it's what
  lets office lookups and the directory filter work off the same IDs as your hospital data.
- **DGHS/DGFP office selection** in the employment step cascades Division → District → facility
  name, filtered live against your 2,606-record facility directory, so the dropdown never shows
  more than a manageable list at once. "Other" govt org and non-govt jobs still take free text.
- If you ever get an updated version of any of these three source files, just re-run them through
  the same TS-stripping conversion (or send me the update and I'll redo it) — the app code doesn't
  need to change, only the data files in `lib/`.

## Server-side integrity (Cloud Functions)
Two Firestore-triggered functions make the important numbers tamper-proof — a user editing their
own document directly in devtools can no longer fake these:
- **`recalcProfileComplete`**: recomputes `users/{uid}.profileComplete` from the actual profile
  data every time a profile doc is written. The client no longer sets this field itself.
- **`recalcDonationStats`**: recomputes `lastDonationDate` + `donationCount` on the profile from
  the real `bloodDonations` subcollection every time a donation is added or removed.

Because these run via the Admin SDK, they bypass `firestore.rules` entirely — which is also why
`firestore.rules` no longer grants the client write access to those three fields.

## Server-side route protection (middleware)
`middleware.js` now runs on every request to `/dashboard`, `/onboarding`, and `/admin` (and their
subpaths) and redirects to `/login` if there's no `session` cookie — so those routes can't be
reached at all with JavaScript disabled or by hitting the URL directly while logged out.

**One deliberate limitation**: middleware runs on the Edge runtime, which can't run the Admin SDK,
so it only checks that the cookie *exists* — it doesn't cryptographically verify it or check
`profileComplete`/`role` there. Those finer-grained checks (incomplete profile → `/onboarding`,
non-admin → bounced from `/admin`) stay with the client-side `RouteGuard`/`AdminGuard`, which have
live Firestore listeners and react instantly when those values change (a static, edge-verified JWT
claim would actually be *worse* here — it'd go stale between token refreshes). None of this is the
actual security boundary either way: `firestore.rules` enforces every real read/write server-side
regardless of which page loads, so this whole layer is about blocking page access, not data access.

## Not yet built
- Directory search/pagination for scale beyond a few hundred members
- Loading skeletons / richer empty states
- Changing your registered email address
