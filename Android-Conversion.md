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
users/{uid}
email, role ("user"|"admin"), profileComplete, createdAt, updatedAt

profiles/{uid}
name, dob, bloodGroup, gender, maritalStatus,
department, session, passingYear, finalYearRoll,
phone, email,
currentAddress: { divisionId, districtId, upazilaId, localAddress }
permanentAddress: { divisionId, districtId, upazilaId, localAddress }
employment: {
status: "studying"|"job"
jobType: "govt"|"non-govt"
govtOrg: "DGHS"|"DGFP"|"Other"
officeId, officeName,
officeDivisionId, officeDistrictId, officeUpazilaId, officeManualEntry,
officeLocation (non-govt only, free text)
}
photo: { base64, useDefault }
visibility: { phone, email, currentAddress, employment } // booleans
donationCount, lastDonationDate // client-recomputed, see donationUtils below
createdAt, updatedAt

profiles/{uid}/bloodDonations/{donationId}
date, note, createdAt

users/{uid}/favorites/{favUid}
addedAt

users/{uid}/notificationReads/{notifId}
readAt

notifications/{notifId}
title, body, audience ("all"|"user"), targetUid, createdBy, createdAt

settings/directoryVisibility (single doc)
{ [fieldKey]: boolean, ... } // per lib/directorySettings.js DIRECTORY_FIELDS

auditLogs/{logId}
targetUid, editedBy, field, oldValue, newValue, timestamp


**Firestore security rules are already deployed and shared** — the Android
app authenticates against the same Firebase project, so no rules changes are
needed unless a new read/write pattern is introduced that the current rules
don't cover.

---

## 4. Static Data Files — Port As-Is

These currently live as `.js`/`.json` in the web repo and must be ported to
Android resources/Kotlin objects with identical IDs and structure, since
`divisionId`/`districtId`/`upazilaId` values are stored in Firestore and must
resolve the same way on both platforms.

| Web file | Android equivalent |
|---|---|
| `lib/bdData.js` (Division→District→Upazila, `nameBn`) | `assets/bd_data.json` + `BdDataRepository.kt` — parse once, cache in memory |
| `lib/hospitalData.js` (`HOSPITALS`, agency/location filtering) | `assets/hospitals.json` + `HospitalRepository.kt` |
| `lib/directorySettings.js` (`DIRECTORY_FIELDS` constant) | `DirectoryFields.kt` — same keys/labels, Kotlin data class list |
| `lib/donationUtils.js` (`getLastDonation`, `getCountdown`, `sortDonations`) | `DonationUtils.kt` — port logic exactly, including the eligibility interval |
| `lib/photoUtils.js` (`defaultAvatarFor`, `resizeAndEncode`) | `PhotoUtils.kt` — same gender→avatar mapping; resize/encode via Android `Bitmap`/`Base64` APIs |

---

## 5. Android Project File Tree

iht-rangpur-android/
├── app/
│ ├── build.gradle.kts
│ ├── google-services.json # from the SAME Firebase project as web
│ └── src/main/
│ ├── AndroidManifest.xml
│ ├── assets/
│ │ ├── bd_data.json # ported from lib/bd-data.json
│ │ └── hospitals.json # ported from lib/hospitals.json
│ ├── res/
│ │ ├── drawable/
│ │ │ ├── ic_iht_logo.xml # from public/iht-rangpur-logo.png
│ │ │ ├── avatar_default_male.xml
│ │ │ └── avatar_default_female.xml
│ │ ├── font/
│ │ │ └── hind_siliguri_*.ttf # Bangla font, matches web's Hind Siliguri
│ │ └── values/
│ │ ├── strings.xml # Bangla UI strings (mirrors AboutTab.jsx copy etc.)
│ │ └── colors.xml # ported from :root CSS vars (--forest, --coral, --ivory...)
│ │
│ └── java/com/ihtrangpur/app/
│ ├── IhtRangpurApp.kt # @HiltAndroidApp Application class
│ ├── MainActivity.kt # single-activity host, Compose Nav
│ │
│ ├── di/
│ │ ├── FirebaseModule.kt # provides FirebaseAuth, FirebaseFirestore
│ │ └── RepositoryModule.kt
│ │
│ ├── data/
│ │ ├── model/
│ │ │ ├── UserDoc.kt # users/{uid} shape
│ │ │ ├── Profile.kt # profiles/{uid} shape — mirrors lib/profile/types.ts logic from web
│ │ │ ├── Address.kt # { divisionId, districtId, upazilaId, localAddress }
│ │ │ ├── Employment.kt # sealed class: Studying | GovtJob | NonGovtJob
│ │ │ ├── Donation.kt
│ │ │ ├── Notification.kt
│ │ │ └── DirectorySettings.kt
│ │ │
│ │ ├── remote/
│ │ │ ├── AuthRepository.kt # register/login/verify — mirrors app/register, app/login
│ │ │ ├── ProfileRepository.kt # profiles/{uid} CRUD, onSnapshot-equivalent via Flow
│ │ │ ├── DirectoryRepository.kt # profiles collection query + filters, mirrors DirectoryTab.jsx
│ │ │ ├── DonationRepository.kt # bloodDonations subcollection + recalcDonationStats port
│ │ │ ├── FavoritesRepository.kt
│ │ │ ├── NotificationRepository.kt # mirrors lib/notifications.js exactly
│ │ │ ├── AdminRepository.kt # member list/edit/audit log, mirrors AdminEditForm.jsx + auditLog.js
│ │ │ └── SettingsRepository.kt # settings/directoryVisibility
│ │ │
│ │ └── local/
│ │ ├── BdDataProvider.kt # parses assets/bd_data.json
│ │ └── HospitalDataProvider.kt
│ │
│ ├── domain/
│ │ ├── ProfileCompletion.kt # port of lib/profile/completion.ts — SAME field checklist as web & firestore.rules computedProfileComplete()
│ │ ├── DonationUtils.kt
│ │ └── PhotoUtils.kt
│ │
│ ├── ui/
│ │ ├── theme/
│ │ │ ├── Color.kt # from CSS :root vars
│ │ │ ├── Type.kt # Fraunces (display) + Hind Siliguri (body/Bangla) + Public Sans
│ │ │ └── Theme.kt
│ │ │
│ │ ├── navigation/
│ │ │ ├── NavGraph.kt
│ │ │ └── Destinations.kt
│ │ │
│ │ ├── auth/
│ │ │ ├── LoginScreen.kt
│ │ │ ├── RegisterScreen.kt
│ │ │ └── AuthViewModel.kt
│ │ │
│ │ ├── onboarding/
│ │ │ ├── OnboardingWizardScreen.kt
│ │ │ ├── OnboardingViewModel.kt
│ │ │ └── steps/
│ │ │ ├── PersonalStep.kt
│ │ │ ├── AddressStep.kt # cascading Division/District/Upazila + local address field
│ │ │ ├── AcademicStep.kt
│ │ │ ├── EmploymentStep.kt # full govt/non-govt branching, office picker from HOSPITALS
│ │ │ └── PhotoStep.kt
│ │ │
│ │ ├── main/
│ │ │ ├── MainScreen.kt # bottom nav host: Profile, Directory, Notifications, About, More
│ │ │ └── MoreBottomSheet.kt
│ │ │
│ │ ├── profile/
│ │ │ ├── ProfileScreen.kt
│ │ │ └── ProfileViewModel.kt
│ │ │
│ │ ├── directory/
│ │ │ ├── DirectoryScreen.kt
│ │ │ ├── DirectoryFilterSheet.kt
│ │ │ ├── DirectoryListItem.kt # shared by Directory AND Favorites, same reuse pattern as web
│ │ │ └── DirectoryViewModel.kt
│ │ │
│ │ ├── donations/
│ │ │ ├── DonationsScreen.kt
│ │ │ └── DonationsViewModel.kt
│ │ │
│ │ ├── favorites/
│ │ │ ├── FavoritesScreen.kt
│ │ │ └── FavoritesViewModel.kt
│ │ │
│ │ ├── notifications/
│ │ │ ├── NotificationsScreen.kt
│ │ │ └── NotificationsViewModel.kt # exposes unreadCount for the bottom-nav badge
│ │ │
│ │ ├── about/
│ │ │ └── AboutScreen.kt
│ │ │
│ │ ├── admin/
│ │ │ ├── AdminNavHost.kt # Members / Directory settings / Notifications sub-tabs
│ │ │ ├── AdminMemberListScreen.kt
│ │ │ ├── AdminMemberEditScreen.kt
│ │ │ ├── AdminDirectorySettingsScreen.kt
│ │ │ ├── AdminNotificationComposeScreen.kt
│ │ │ ├── AdminStatsScreen.kt
│ │ │ └── AdminViewModel.kt
│ │ │
│ │ └── common/
│ │ ├── AddressPickerFields.kt # shared cascading Division/District/Upazila composable
│ │ ├── BloodDropBadge.kt
│ │ ├── DepartmentChip.kt
│ │ ├── AvatarImage.kt # decodes base64 or falls back to default avatar drawable
│ │ └── ProgressBar.kt
│ │
│ └── util/
│ ├── BadgeCountFlow.kt # combines broadcast+personal+reads, mirrors useNotifications()
│ └── Extensions.kt
│
├── build.gradle.kts
├── settings.gradle.kts
└── gradle/libs.versions.toml


---

## 6. Files to Hand the LLM Per Build Phase

Give these web-source files as reference context alongside the phase being built — the LLM should port logic 1:1, not reinterpret it, since Firestore rules and the web client both depend on identical completeness/validation logic.

| Phase | Reference web files to provide |
|---|---|
| 1. Auth | `app/login/page.jsx`, `app/register/page.jsx`, `context/AuthContext.jsx`, `lib/sessionCookie.js` (skip — cookies are web-only, Android just holds `FirebaseUser` in memory/`DataStore`) |
| 2. Onboarding | `app/onboarding/page.jsx`, `components/steps/*.jsx`, `firestore.rules` (`computedProfileComplete()` — **must match exactly**) |
| 3. Address/location | `lib/bdData.js`, `components/steps/AddressStep.jsx` |
| 4. Employment | `components/steps/EmploymentStep.jsx`, `lib/hospitalData.js` |
| 5. Profile view/edit | `components/dashboard/MyProfileTab.jsx` |
| 6. Directory | `components/dashboard/DirectoryTab.jsx`, `lib/directorySettings.js` |
| 7. Favorites | `components/dashboard/FavoritesTab.jsx` |
| 8. Donations | `components/dashboard/DonationsTab.jsx`, `lib/donationUtils.js`, `lib/donationStats.js` |
| 9. Notifications | `components/dashboard/NotificationsTab.jsx`, `lib/notifications.js` |
| 10. Admin | `app/admin/page.jsx`, `components/admin/AdminEditForm.jsx`, `lib/auditLog.js`, `components/admin/DirectorySettingsPanel.jsx`, `components/admin/AdminNotificationsPanel.jsx` |
| 11. About | `components/dashboard/AboutTab.jsx` (Bangla copy — reuse verbatim) |
| Every phase | `firestore.rules` (full file) — the LLM should treat this as the contract for what each write is allowed to contain |

---

## 7. Open Questions Before Building

- [ ] **Photo storage**: web stores base64 in Firestore. Confirm Android should do the same (simpler, matches web) vs. this being the moment to finally switch to Firebase Storage + signed URLs for both platforms (flagged as a concern back at the original web spec too — worth revisiting now that there are two clients).
- [ ] **Offline support**: Firestore's Android SDK has offline persistence on by default — decide if that's desired here (web currently has none) or should be disabled to keep behavior identical across platforms.
- [ ] **Push notifications**: current `notifications` collection is in-app-only (member has to open the tab to see it). Native mobile is the natural place to add **FCM push** on top of the same collection — worth deciding now since it changes `sendNotification()`'s shape (would need an FCM trigger, likely a Cloud Function — same Blaze-plan consideration as `recalcDonationStats` earlier in this project).
- [ ] **Minimum SDK / target devices**: affects Compose Material 3 feature availability.
- [ ] **App signing / Play Store listing**: package name (`com.ihtrangpur.app` used as a placeholder above — confirm final), keystore ownership.