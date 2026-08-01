# Project: IHT Rangpur Alumni & Student Network — Android Native App

Port of the existing Next.js + Firebase web app to native Android, reusing the
same Firebase project (Auth + Firestore) as the backend — no API layer needed,
the Android app talks to Firestore directly via the official Android SDK,
mirroring what the web client does with the JS SDK.

---

## 1. Tech Stack

- Language: **Kotlin**
- UI: **Jetpack Compose** (Material 3)
- Architecture: **MVVM** — `ViewModel` + `StateFlow`, repository layer wrapping Firestore
- DI: **Hilt**
- Navigation: **Navigation Compose**
- Auth: **Firebase Authentication** (Android SDK) — same project as web
- Database: **Cloud Firestore** (Android SDK) — same collections/documents as web, see §3
- Image handling: **Coil** (for base64 → Bitmap decode of profile photos; see §6 note on this)
- Async: **Kotlin Coroutines + Flow**

---

## 2. Screen ↔ Web Tab Mapping

| Android screen | Web equivalent | Notes |
|---|---|---|
| `SplashScreen` | — | Checks auth state, routes to Login or Main |
| `LandingScreen` | `app/page.jsx` | Optional on mobile — app install itself is the "landing"; can skip or keep as onboarding carousel |
| `LoginScreen` | `app/login/page.jsx` | Firebase Auth email/password |
| `RegisterScreen` | `app/register/page.jsx` | Creates `users/{uid}` + `profiles/{uid}` docs identically to web |
| `EmailVerificationScreen` | (implicit in login flow) | Blocks until `FirebaseUser.isEmailVerified` |
| `OnboardingWizardScreen` | `app/onboarding/page.jsx` | Multi-step form, same 5 steps (Personal, Address, Academic, Employment, Photo), same `isStepValid`/completion logic ported to Kotlin |
| `MainScreen` (bottom nav host) | `components/nav/AppShell.jsx` | Hosts the 5 primary destinations below |
| `ProfileScreen` | `MyProfileTab.jsx` | View/edit split, same admin-locked-field pattern |
| `DirectoryScreen` | `DirectoryTab.jsx` | List + filters; RecyclerView-equivalent via `LazyColumn` (no desktop-table/mobile-card split needed — mobile *is* the only form factor) |
| `NotificationsScreen` | `NotificationsTab.jsx` | Same `notifications` + `notificationReads` collections |
| `AboutScreen` | `AboutTab.jsx` | Static content, Bangla strings |
| `MoreScreen` (bottom sheet) | `MobileMoreSheet.jsx` | Blood Donations, Favorites, Admin panel |
| `DonationsScreen` | `DonationsTab.jsx` | Same `bloodDonations` subcollection + client-side `recalcDonationStats` logic ported to Kotlin |
| `FavoritesScreen` | `FavoritesTab.jsx` | Reuses `DirectoryListItem` composable, same pattern as web reusing `DirectoryRow`/`DirectoryCard` |
| `AdminScreen` (nav graph) | `app/admin/page.jsx` | Member list, stats, directory settings, notification compose — likely 4 sub-screens/tabs |
| `AdminMemberEditScreen` | `AdminEditForm.jsx` | Full profile edit + audit history |
| `AdminNotificationComposeScreen` | `AdminNotificationsPanel.jsx` | Send to all / specific member |

---

## 3. Firestore Schema — REUSE AS-IS, DO NOT REDESIGN

This is the most important constraint: **the Android app must read/write the
exact same collections, document shapes, and field names as the web app**, so
both clients stay interoperable against one shared backend.