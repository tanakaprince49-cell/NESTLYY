# Changelog

All notable changes to NESTLYY are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Version policy

- **MAJOR** (`1.0.0` -> `2.0.0`): breaking data model or API changes that require user action (migration, re-login, etc.)
- **MINOR** (`0.1.0` -> `0.2.0`): new features, new screens, new tools added; backwards-compatible
- **PATCH** (`0.1.0` -> `0.1.1`): bug fixes, copy tweaks, internal refactors with no user-visible change

Every PR that modifies code under `packages/*/src/**` MUST add an entry under the `## [Unreleased]` section below. CI (`.github/workflows/version-check.yml`) enforces this. Docs-only, test-only, and config-only PRs are exempt.

When cutting a release, run `npm run version:patch|minor|major` which:

1. Moves the `## [Unreleased]` entries under a new versioned section with today's date
2. Bumps `expo.version` in `packages/mobile/app.json`
3. Increments `expo.android.versionCode`
4. Commits the change as `chore: release vX.Y.Z`

The committer then opens a release PR and, after merge, tags the merge commit `vX.Y.Z`.

## [Unreleased]

### Changed
- #190 `packages/shared/src/firebase.ts` now exports `auth` and `db` through a lazy Proxy instead of eagerly calling `getAuth(app)` / `getFirestore(app)` at module load. `getAuth` / `getFirestore` now run on first property access, which makes the RN init order (mobile's `firebaseInit.ts` → `initializeAuth` with AsyncStorage persistence) robust against future import reordering, and eliminates the zombie `getFirestore(app)` call on mobile (where `db` is never consumed). The Proxy exposes `get`, `set`, and `getPrototypeOf` traps so the Firestore SDK's `instanceof Firestore` cast guards in `collection` / `doc` / `writeBatch` / `runTransaction` still pass. `messaging` stays eager because consumers rely on its `if (messaging)` truthiness guard that a Proxy would break.

### Added
- #216 Village Hub tab now appears in the Android bottom navigation as a placeholder, matching the 7-tab layout of the web PWA (Nest / Growth / Ava / Articles / Tools / Village / Settings). The placeholder screen explains that the full community feature is available at nestlyhealth.com today and is coming to Android in a future update. The real React Native Firestore integration stays tracked in #170 Phase 6C; this change exists so Android users discover the feature instead of silently wondering why the app is missing something the website has.
- #252 Newborn / postpartum Dashboard now surfaces the mother's latest weight and blood pressure from Health Connect in a dedicated "Your Health" card. The card only renders when HC is connected and at least one reading has been logged, so users without HC do not see a dead card.

### Fixed
- #260 Tapping "Connect Health Connect" on Android no longer crashes the app with `kotlin.UninitializedPropertyAccessException`. `react-native-health-connect@3.5.0`'s Expo plugin forgets to wire `HealthConnectPermissionDelegate.setPermissionDelegate(this)` into `MainActivity.onCreate`, which the library's own `lateinit var requestPermission` requires before any permission dialog can launch. Added a local Expo config plugin (`packages/mobile/plugins/withHealthConnectPermissionDelegate.js`) that injects the import + delegate call into the generated `MainActivity.kt` at prebuild time using `@expo/config-plugins`' `mergeContents` helper (idempotent, marked with `@generated` blocks). Remove the local plugin once the upstream ships a fix.
- #219 Health Connect data now actually reaches the Dashboard. Sync fires automatically on app cold start, on foreground resume (throttled to once every 5 minutes), and immediately after the user grants permissions. Dashboard weight card now reads the latest entry from `weightLogs` (which HC sync writes into) with a fall-back to `profile.startingWeight`, and a new blood pressure stat card surfaces the most recent BP reading.
- #251 Health Connect sync metadata (`lastSyncTimestamp`, `syncError`, `isSyncing`) is now reset on account switch via a new `resetSyncState` action on `useHealthConnectStore`. Previously, if user A synced then signed out and user B signed in on the same device without a cold restart, user B inherited user A's 5-minute throttle window and a potentially stale error banner. Device-level state (`isAvailable`, `isConnected`, `permissions`) is untouched because it reflects system permissions shared across accounts.
- #253 Health Connect auto-sync failures now surface on the Dashboard via a subtle tap-to-fix banner (gated on `isConnected && syncError`). Previously, only the manual "Sync Now" path in Settings showed `syncError`, so auto-sync failures on cold start or foreground resume were invisible to the user. Tapping the banner navigates to Settings.
- #203 `DashboardScreen` no longer reaches into `packages/shared/src/data/babySizes` via a relative import. `getBabySizeForWeek` is now re-exported from `@nestly/shared` alongside the rest of the data module.
- #205 `ToolsHubScreen` now renders a proper empty state if the filtered tool list is ever empty (edge case for a future lifecycle stage with no tools). All tracker screens already delegated their empty state to the shared `TrackerHistory` component, which renders "No entries yet" when passed an empty items array; `check-empty-states.sh` now recognises this wrapper and no longer false-positives on them.

### Removed
- #206 Dead `loggerMiddleware` store wrapper in `packages/shared/src/stores/middleware`. The middleware was exported but never applied to any Zustand store, and its only effect was a dev-only `console.log` that added noise to the console scanner. Also removed two unguarded `console.log` calls from `packages/web/src/services/pushService.ts` (FCM token log and foreground message log).
- #158 `expo-media-library` dependency from `packages/mobile`. It was never imported; the media-library permission the app actually needs is requested via `expo-image-picker`'s `requestMediaLibraryPermissionsAsync`, which does not depend on the standalone package.

## [0.1.0] - 2026-04-11

### Added
- #237 Twin and triplet pregnancies now label each emoji in the Fetal Development view with the corresponding baby's name from `profile.babies` (falls back to "Baby N" when a slot is unnamed). Singleton pregnancies are unchanged.

### Changed
- #233 Narrow `createUserScopedStorage` backend type to `IAsyncStorageBackend` (removes unsafe sync/async runtime cast)
- #244 Shared store registry (`USER_SCOPED_PERSISTED_STORES`) is now the single source of truth; mobile bootstrap iterates it so adding a new persisted store no longer requires editing two files
- #234 Expanded comment on `authStore` `partialize` to document why only `hasAcceptedPrivacy` is persisted (Firebase Auth owns email/uid)

### Fixed
- #239 Replace `catch (err: any)` with typed `catch (err: unknown)` + `instanceof Error` in AuthScreen email and anonymous handlers
- #240 Remove inline `toIsoDate`/`parseLocalIsoDate` duplicates from SetupScreen and inline `hasValidLmpDate` from BabyScreen; all three now import from `utils/dates`
- #245 FeedingRouter now carries an explicit comment documenting why `BIRTH` falls through to the infant-feeding branch rather than the maternal-nutrition branch

## [0.0.1] - 2026-04-11

Initial tracked baseline. Covers everything shipped before the semver process was introduced, including:

### Added
- Android native app shell (Expo SDK 54, React Native 0.81)
- All lifecycle stages: pre-pregnancy, pregnancy, birth, newborn, infant, toddler
- Core trackers: nutrition, feeding, sleep, diaper, vitals, symptoms, kicks, contractions, medications, vitamins, blood pressure, kegels
- Ava AI chat (OpenRouter + DeepSeek)
- Village Hub community features (Firestore-backed)
- Push notifications (FCM)
- Health Connect integration for weight/BP/heart rate/sleep sync
- Real Nestly brand assets (mobile icons, notification icon, web logo)

### Fixed (Android beta round, PRs #224 - #243)
- #212 Continue with Google sign-in flow
- #220 FeedingRouter crash in pregnancy mode
- #221 Avatar picker on SettingsScreen
- #222 Growth tab NaN guard and carousel centering
- #225 LMP/birth date UTC shift in positive timezones
- #226 User-scoped AsyncStorage persistence
- #227 PRE_PREGNANCY tool set inclusion
- #228 Growth tab NaN + carousel layout
- #229 Avatar component on SettingsScreen
- #230 Continue with Google wiring on AuthScreen
- #231 Jest regression tests for beta round
- #232 YYYY-MM-DD local parsing in pregnancyCalc
- #235 per-store try/catch in rehydrateUserStores / clearUserStores
- #236 dynamic header title in FeedingRouter
- #238 mimeType-aware avatar dataURL prefix

[Unreleased]: https://github.com/tanakaprince49-cell/NESTLYY/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/tanakaprince49-cell/NESTLYY/releases/tag/v0.1.0
[0.0.1]: https://github.com/tanakaprince49-cell/NESTLYY/releases/tag/v0.0.1
