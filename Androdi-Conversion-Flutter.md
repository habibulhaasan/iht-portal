# Project: IHT Rangpur Alumni & Student Network — Flutter App

Cross-platform (Android + iOS) port of the existing Next.js + Firebase web
app, using **FlutterFire** to talk to the same Firebase project (Auth +
Firestore) the web app already uses — no separate backend, same schema,
same rules.

---

## 1. Tech Stack

- Language: **Dart**
- Framework: **Flutter** (Material 3 widgets, `flutter_localizations` for Bangla)
- State management: **Riverpod** (`flutter_riverpod` + `riverpod_generator`) — chosen over Provider/Bloc for its natural fit with Firestore streams via `StreamProvider`
- Firebase: **FlutterFire** — `firebase_core`, `firebase_auth`, `cloud_firestore`
- Routing: **go_router**
- Forms: **flutter_form_builder** or plain `TextEditingController`s (project is form-heavy — onboarding wizard, admin edit — worth deciding early; plan below assumes plain controllers + manual validation to mirror the web's explicit `isStepValid()` functions 1:1)
- Image handling: `image_picker` (photo capture/pick) + Dart's built-in `dart:convert` (`base64Encode`) for the same base64-in-Firestore approach as web
- Fonts: `google_fonts` package (Fraunces, Hind Siliguri, Public Sans — same three as web's CSS `@import`)

---

## 2. Screen ↔ Web Tab Mapping

| Flutter screen | Web equivalent | Notes |
|---|---|---|
| `SplashScreen` | — | Checks `FirebaseAuth.instance.authStateChanges()`, routes accordingly |
| `LandingScreen` | `app/page.jsx` | Optional — could be skipped in favor of going straight to Login, same call as Android plan |
| `LoginScreen` | `app/login/page.jsx` | |
| `RegisterScreen` | `app/register/page.jsx` | Same dual-write to `users/{uid}` + `profiles/{uid}` |
| `OnboardingWizardScreen` (+ `PageView` of 5 step widgets) | `app/onboarding/page.jsx` + `components/steps/*.jsx` | Same 5 steps, same completion-percent logic |
| `MainShell` (bottom nav scaffold) | `components/nav/AppShell.jsx` | Hosts 5 primary tabs via `IndexedStack` or `go_router` `StatefulShellRoute` |
| `ProfileScreen` | `MyProfileTab.jsx` | |
| `DirectoryScreen` | `DirectoryTab.jsx` | `ListView.builder`, no table/card split needed (mobile-only) |
| `NotificationsScreen` | `NotificationsTab.jsx` | |
| `AboutScreen` | `AboutTab.jsx` | Bangla content, reused verbatim |
| `MoreSheet` (modal bottom sheet) | `MobileMoreSheet.jsx` | Donations, Favorites, Admin |
| `DonationsScreen` | `DonationsTab.jsx` | |
| `FavoritesScreen` | `FavoritesTab.jsx` | Reuses `DirectoryListTile` widget, same reuse pattern as web's shared `DirectoryRow`/`DirectoryCard` |
| `AdminShell` | `app/admin/page.jsx` | Tab bar: Members / Directory settings / Notifications |
| `AdminMemberEditScreen` | `AdminEditForm.jsx` | |
| `AdminNotificationComposeScreen` | `AdminNotificationsPanel.jsx` | |

---

## 3. Firestore Schema — REUSE AS-IS

Identical to the Android plan — **do not redesign**. Same collections, same
field names, same nested shapes for `currentAddress`/`permanentAddress`/
`employment`/`photo`/`visibility`. This is what keeps web, Android-native (if
built later), and Flutter all interoperable against one shared backend and
one shared `firestore.rules` file.

users/{uid} → email, role, profileComplete, timestamps
profiles/{uid} → full profile fields (see prior message for complete shape)
profiles/{uid}/bloodDonations/{id} → date, note, createdAt
users/{uid}/favorites/{favUid} → addedAt
users/{uid}/notificationReads/{notifId} → readAt
notifications/{notifId} → title, body, audience, targetUid, createdBy, createdAt
settings/directoryVisibility → single doc, per-field booleans
auditLogs/{logId} → targetUid, editedBy, field, oldValue, newValue, timestamp


`firestore.rules` is shared, deployed once, and referenced by every client — no Flutter-specific rules needed unless a new access pattern is introduced.

---

## 4. Static Data Files — Port As-Is

| Web file | Flutter equivalent |
|---|---|
| `lib/bdData.js` | `assets/data/bd_data.json` + `lib/data/bd_data_repository.dart` |
| `lib/hospitalData.js` | `assets/data/hospitals.json` + `lib/data/hospital_repository.dart` |
| `lib/directorySettings.js` (`DIRECTORY_FIELDS`) | `lib/domain/directory_fields.dart` — const list of `DirectoryField` objects |
| `lib/donationUtils.js` | `lib/domain/donation_utils.dart` — port `getLastDonation`/`getCountdown`/`sortDonations` logic exactly |
| `lib/photoUtils.js` | `lib/domain/photo_utils.dart` — `defaultAvatarFor()` + resize/encode via `image` package |
| `lib/donationStats.js` (client-side `recalcDonationStats`) | `lib/data/donation_repository.dart` — same client-computed approach (Blaze-plan-independent, per the reasoning already established on web) |

---

## 5. Flutter Project File Tree

iht_rangpur_flutter/
├── pubspec.yaml
├── android/
│ └── app/google-services.json # SAME Firebase project as web
├── ios/
│ └── Runner/GoogleService-Info.plist # SAME Firebase project as web
├── assets/
│ ├── data/
│ │ ├── bd_data.json # ported from lib/bd-data.json
│ │ └── hospitals.json # ported from lib/hospitals.json
│ ├── images/
│ │ ├── iht_rangpur_logo.png # from public/iht-rangpur-logo.png
│ │ ├── avatar_default_male.png
│ │ └── avatar_default_female.png
│ └── fonts/ # only if not using google_fonts package at runtime
│
└── lib/
├── main.dart # Firebase.initializeApp(), runApp(ProviderScope(...))
├── firebase_options.dart # generated via flutterfire configure
│
├── app.dart # MaterialApp.router, theme, go_router setup
├── router/
│ ├── app_router.dart # go_router config, StatefulShellRoute for bottom nav
│ └── route_guard.dart # redirect logic — mirrors components/RouteGuard.jsx exactly:
│ # not signed in → /login
│ # signed in, !profileComplete → /onboarding
│ # signed in, complete, on auth/onboarding route → /main
│
├── theme/
│ ├── app_colors.dart # ported from CSS :root vars (--forest, --coral, --ivory, --line...)
│ ├── app_text_theme.dart # Fraunces (display) + Hind Siliguri (Bangla body) + Public Sans, via google_fonts
│ └── app_theme.dart # ThemeData, matches --radius/--shadow tokens
│
├── data/
│ ├── models/
│ │ ├── user_doc.dart # users/{uid}, with fromFirestore/toFirestore
│ │ ├── profile.dart # profiles/{uid} — freezed data class recommended
│ │ ├── address.dart # { divisionId, districtId, upazilaId, localAddress }
│ │ ├── employment.dart # sealed class: Studying | GovtJob | NonGovtJob (Dart 3 sealed classes map cleanly to the web's branching shape)
│ │ ├── donation.dart
│ │ ├── notification.dart
│ │ └── directory_settings.dart
│ │
│ ├── repositories/
│ │ ├── auth_repository.dart # register/login/verify — mirrors app/register, app/login
│ │ ├── profile_repository.dart # profiles/{uid} CRUD, exposes Stream<Profile>
│ │ ├── directory_repository.dart # profiles collection query + client-side filters, mirrors DirectoryTab.jsx
│ │ ├── donation_repository.dart # bloodDonations subcollection + recalcDonationStats port
│ │ ├── favorites_repository.dart
│ │ ├── notification_repository.dart # mirrors lib/notifications.js's dual-query (broadcast + personal) merge exactly
│ │ ├── admin_repository.dart # member list/edit/audit log
│ │ └── settings_repository.dart # settings/directoryVisibility
│ │
│ └── local/
│ ├── bd_data_repository.dart # parses assets/data/bd_data.json once, caches in memory
│ └── hospital_repository.dart
│
├── domain/
│ ├── profile_completion.dart # port of lib/profile/completion.ts — MUST match firestore.rules' computedProfileComplete() exactly
│ ├── donation_utils.dart
│ ├── photo_utils.dart
│ └── directory_fields.dart
│
├── providers/ # Riverpod providers — the Flutter equivalent of AuthContext.jsx + each tab's local state
│ ├── auth_providers.dart # authStateChangesProvider, currentUserDocProvider (StreamProvider on users/{uid})
│ ├── profile_providers.dart
│ ├── directory_providers.dart # includes filter state as a StateNotifier
│ ├── donation_providers.dart
│ ├── favorites_providers.dart
│ ├── notification_providers.dart # unreadCountProvider — feeds the bottom-nav badge, mirrors useNotifications()
│ └── admin_providers.dart
│
├── features/
│ ├── auth/
│ │ ├── login_screen.dart
│ │ └── register_screen.dart
│ │
│ ├── onboarding/
│ │ ├── onboarding_wizard_screen.dart
│ │ └── steps/
│ │ ├── personal_step.dart
│ │ ├── address_step.dart # cascading Division/District/Upazila + local address field, "same as permanent" checkbox
│ │ ├── academic_step.dart
│ │ ├── employment_step.dart # full govt/non-govt branching + office picker sourced from hospitals.json
│ │ └── photo_step.dart
│ │
│ ├── main_shell/
│ │ ├── main_shell_screen.dart # StatefulShellRoute body: bottom nav bar
│ │ └── more_bottom_sheet.dart
│ │
│ ├── profile/
│ │ └── profile_screen.dart
│ │
│ ├── directory/
│ │ ├── directory_screen.dart
│ │ ├── directory_filter_sheet.dart
│ │ └── widgets/
│ │ └── directory_list_tile.dart # shared by Directory AND Favorites screens
│ │
│ ├── donations/
│ │ └── donations_screen.dart
│ │
│ ├── favorites/
│ │ └── favorites_screen.dart
│ │
│ ├── notifications/
│ │ └── notifications_screen.dart
│ │
│ ├── about/
│ │ └── about_screen.dart # Bangla content, reused verbatim from AboutTab.jsx
│ │
│ └── admin/
│ ├── admin_shell_screen.dart # TabBar: Members / Directory settings / Notifications
│ ├── admin_member_list_screen.dart
│ ├── admin_member_edit_screen.dart
│ ├── admin_directory_settings_screen.dart
│ ├── admin_notification_compose_screen.dart
│ └── admin_stats_widget.dart
│
└── widgets/ # shared/common — Flutter's equivalent of components/nav + small reusable pieces
├── address_picker_fields.dart # shared cascading Division/District/Upazila widget, used by AddressStep AND AdminMemberEditScreen
├── blood_drop_badge.dart
├── department_chip.dart
├── avatar_image.dart # decodes base64 or falls back to default avatar asset
├── progress_bar.dart
└── toggle_switch_row.dart # mirrors the .toggle-switch CSS component from DirectorySettingsPanel


---

## 6. Files to Hand the LLM Per Build Phase

Identical phase breakdown to the Android plan — same reference files apply
regardless of target framework, since the source of truth is the web app's
logic and Firestore's rules, not any platform-specific code.

| Phase | Reference web files to provide |
|---|---|
| 1. Auth | `app/login/page.jsx`, `app/register/page.jsx`, `context/AuthContext.jsx` |
| 2. Onboarding | `app/onboarding/page.jsx`, `components/steps/*.jsx`, `firestore.rules` (`computedProfileComplete()`) |
| 3. Address/location | `lib/bdData.js`, `components/steps/AddressStep.jsx` |
| 4. Employment | `components/steps/EmploymentStep.jsx`, `lib/hospitalData.js` |
| 5. Profile view/edit | `components/dashboard/MyProfileTab.jsx` |
| 6. Directory | `components/dashboard/DirectoryTab.jsx`, `lib/directorySettings.js` |
| 7. Favorites | `components/dashboard/FavoritesTab.jsx` |
| 8. Donations | `components/dashboard/DonationsTab.jsx`, `lib/donationUtils.js`, `lib/donationStats.js` |
| 9. Notifications | `components/dashboard/NotificationsTab.jsx`, `lib/notifications.js` |
| 10. Admin | `app/admin/page.jsx`, `components/admin/AdminEditForm.jsx`, `lib/auditLog.js`, `components/admin/DirectorySettingsPanel.jsx`, `components/admin/AdminNotificationsPanel.jsx` |
| 11. About | `components/dashboard/AboutTab.jsx` |
| Every phase | `firestore.rules` (full file) |

---

## 7. Flutter-Specific Considerations (beyond the Android-native plan)

- **`RouteGuard` logic must be reimplemented as `go_router`'s `redirect`**, not scattered per-screen `initState` checks — otherwise you'll reproduce the exact race condition already debugged twice on web (login blink, "stuck on login" bug). Implement it once, centrally, exactly like `components/RouteGuard.jsx` does.
- **Firestore streams via Riverpod `StreamProvider`** are the direct equivalent of the web app's `onSnapshot` pattern used everywhere (`AuthContext`, `DirectoryTab`, `NotificationsTab`, etc.) — same one-shot-fallback-on-error principle from the `AuthContext.jsx` watchdog fix should be ported too, since the same ad-blocker-style connectivity issue doesn't apply on mobile, but plain network flakiness does.
- **Single codebase, both platforms**: unlike the Android-native plan, this same code ships to iOS too — worth deciding now whether iOS is actually in scope, since it affects `ios/Runner/GoogleService-Info.plist` setup and Apple Developer account requirements.
- **`freezed` + `json_serializable`** (build_runner-based codegen) is worth adding for the `models/` layer — keeps Firestore (de)serialization boilerplate down given how nested `Profile`/`Employment`/`Address` are.

---

## 8. Open Questions (same as Android plan, unchanged)

- [ ] Photo storage: base64-in-Firestore vs. Firebase Storage + signed URLs — now a 3-client decision (web, and whichever mobile path is chosen) if both native Android and Flutter are being considered
- [ ] Offline persistence: Firestore's default is on for mobile SDKs — decide if desired
- [ ] Push notifications via FCM on top of the existing `notifications` collection
- [ ] iOS in scope or Android-only for now
- [ ] Package/bundle ID and app signing