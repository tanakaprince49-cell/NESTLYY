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

### Fixed
- #280 Splash icon now visually centered on device. The `splash-icon.png` asset had the app-icon card sitting at roughly 35% vertical on its 1024x1024 canvas, so Expo's `resizeMode: "contain"` (which letterboxes the square canvas vertically on portrait screens) rendered the card in the upper third of the screen rather than the middle. Rebuilt the asset with a new `scripts/recenter-splash.py` utility that extracts the card-and-halo as a feathered sprite, erases its old location with a stretched sample of the uniform top-sky band, and re-composites the sprite at the geometric canvas center (512, 512). The cloud/sky artwork is preserved -- only the card position moves. No code changes (`app.json` untouched).

- #281 Privacy consent prompt no longer appears on every app launch. The `hasAcceptedPrivacy` flag was living on `authStore` under the user-scoped AsyncStorage prefix (`{email}_auth`) and `logout()` was explicitly resetting it to `false`, so signing out wiped the flag on the way out and signing back in read from whichever email-prefixed bucket Zustand's persist middleware pointed at. Returning users were therefore re-prompted on every cold start (and even across the same session after a quick sign-out/sign-in). The flag is now a device-level value: extracted into a new `privacyStore` that persists under a single stable AsyncStorage key (`privacy`) with no email prefix, removed from `AuthState` entirely, and rehydrated at cold start via a new `rehydratePrivacyStore()` bootstrap function that runs before Firebase auth resolves so `App.tsx`'s gate no longer sees a one-frame default-`false` flash. `App.tsx` now reads `hasAcceptedPrivacy` via `usePrivacyStore` and `PrivacyScreen` writes through `usePrivacyStore.getState().setHasAcceptedPrivacy(true)`. `authStore` is back to an unpersisted store (no more `persist` wrapper, no `setAuthStorage` export, no `hasAcceptedPrivacy` field) matching the comment that Firebase Auth owns the session via `getReactNativePersistence(AsyncStorage)`. `USER_SCOPED_PERSISTED_STORES` registry no longer lists `auth`. New regression suite `__tests__/privacyConsent.test.ts` asserts logout does not touch the flag and that writes land under the bare `privacy` key (not `{email}_privacy`). 125/125 mobile tests pass.

- #276 Mobile Google Sign-In now works on release APKs. Migrated from the deprecated `expo-auth-session/providers/google` + `expo-web-browser` combo (which routed the sign-in through a `com.nestly.app:/oauthredirect` custom scheme that neither Android-type nor Web-type Google OAuth clients accept anymore) to the native `@react-native-google-signin/google-signin` library, which uses Google Identity Services on-device and does not need a redirect URI at all. `AuthScreen.tsx` now calls `GoogleSignin.hasPlayServices()` → `signIn()` and forwards the returned `idToken` to `signInWithGoogle`; error branches cover `SIGN_IN_CANCELLED`, `IN_PROGRESS`, `PLAY_SERVICES_NOT_AVAILABLE`, and a generic fallback. `SettingsScreen.tsx` sign-out and delete-account paths now call `GoogleSignin.signOut()` before `signOut(auth)` so the next account on the same device sees Google's account picker instead of silently re-picking the previous user. Extracted the sign-in branching into a pure `runGoogleSignIn` helper in `utils/googleSignInHandler.ts` with 7 unit tests covering success, cancelled, in-progress, play-services-unavailable, generic failure, missing idToken, and non-Error throw paths. `expo-auth-session` and `expo-web-browser` removed from `packages/mobile/package.json`. `@react-native-google-signin/google-signin` added to `app.json` plugins. 122/122 mobile tests pass.

- #272 Village Hub Phase 3 follow-ups (mobile): post composer now uses `Promise.allSettled` and writes the resulting `NestMedia` objects back into the picked-media state via a new pure helper (`mergeUploadResults` in `utils/uploadRetry.ts`) under an `uploaded?: NestMedia` field, so a Send retry after a partial upload only re-uploads the assets that actually failed and the skipped assets keep their original storage-assigned `id`, `url`, `thumbnail`, `size`, and `duration` (no more positional integer ids landing in Firestore). After 20 s of an in-flight upload, the composer surfaces a rose-50 hint pill ("Still uploading, this can take a while on slow networks.") with a right-aligned "Cancel upload" affordance that calls `task.cancel()` on every tracked Storage upload task and resets upload state while preserving the user's text + picked media for retry. `uploadMediaToStorage` now accepts an `onTask?: (task: UploadTask) => void` callback so the composer can collect the underlying tasks (both main and thumbnail uploads). Cancel is race-safe: tasks that arrive via `onTask` after Cancel was pressed are terminated immediately so we never leave orphan Storage objects in the multi-asset case, and an unmount-time `useEffect` cleanup also cancels any in-flight tasks and clears the slow-upload timer. Video tiles in `PostCard.MediaGrid` now show an `m:ss` (or `mm:ss` for clips >= 10 minutes) duration badge in the bottom-right corner, fed by a new optional `duration?: number` field on `NestMedia` (whole seconds) that `villageMediaService.uploadMediaToStorage` populates from the picker's millisecond duration. Repost icon swapped from `arrow-redo-outline` (which reads as "forward externally / share to WhatsApp" on Android) to `repeat-outline` paired with a visible "Repost" label, matching the icon+count treatment of like and comment in the action row. ShareModal now shows a "Reposting to this nest" subtitle under the title so users understand the repost stays in the current nest. `MediaGrid` cardPadding expression renamed to a `CARD_HORIZONTAL_PADDING` named constant with a comment explaining the layout chain (no visual change). New tests: `uploadRetry.test.ts` (8 cases) and `formatDuration.test.ts` (7 cases). 115/115 mobile tests pass.

- #270 Village Hub Phase 3 (mobile) QA fix-now: added `firebase.json` so `storage.rules` (and `firestore.rules`) actually deploy via `firebase deploy`; renamed the `storage.rules` wildcard `{postId}` to `{uploadKey}` so the rule reflects the path PostComposer writes (`village/{nestId}/{authorUid}/{tempKey}/...`); explicit `contentType` metadata is now passed to every `uploadBytesResumable` call so the storage rule's `validImageType()` / `validVideoType()` checks pass; `validateMedia` is now wired into `PostComposer.handleAttach` (was dead code) and rejected assets surface a friendly reason via the existing `onError` channel; `MediaViewerModal` now passes the controlled `currentIndex` to `react-native-image-viewing` and re-syncs when the parent's `index` prop changes (fixes a snap-back when swiping through more than 2 images); orphan main file is now cleaned up if the thumbnail upload fails halfway through `uploadMediaToStorage`; deduped `MAX_VIDEO_DURATION_S` constant (single source of truth in `mediaValidation.ts`); renamed the `validateMedia` parameter `duration` to `durationMs` to match the unit it actually is.

### Changed
- #190 `packages/shared/src/firebase.ts` now exports `auth` and `db` through a lazy Proxy instead of eagerly calling `getAuth(app)` / `getFirestore(app)` at module load. `getAuth` / `getFirestore` now run on first property access, which makes the RN init order (mobile's `firebaseInit.ts` → `initializeAuth` with AsyncStorage persistence) robust against future import reordering, and eliminates the zombie `getFirestore(app)` call on mobile (where `db` is never consumed). The Proxy exposes `get`, `set`, and `getPrototypeOf` traps so the Firestore SDK's `instanceof Firestore` cast guards in `collection` / `doc` / `writeBatch` / `runTransaction` still pass. `messaging` stays eager because consumers rely on its `if (messaging)` truthiness guard that a Proxy would break.

### Added
- #270 Village Hub Phase 3 (mobile): media attachments in Village Hub posts. Members can attach up to 4 photos or videos per post via gallery picker. Images are compressed to 1600px long-edge (JPEG 0.8) with 320px thumbnails before upload. Videos are capped at 30 seconds. Media is uploaded to Firebase Storage (`village/{nestId}/{authorUid}/{tempKey}/`) before the Firestore post document is created. PostCard renders a 1/2/3/4-item responsive grid (full-width, side-by-side, big-left+two-right, 2x2) with video play-circle overlays. Tapping any media tile opens a fullscreen viewer: pinch-zoom + swipe for images (`react-native-image-viewing`), native controls for videos (`expo-video`). Avatar images are now shown on PostCard and CommentItem, falling back to initials on error. Members can repost into the same nest via a new ShareModal (optional message + quoted post preview). New `villageMediaService.ts` encapsulates pick, compress, thumbnail, and upload logic (mobile-only, `@nestly/shared` stays platform-agnostic). Firebase Storage security rules added (`storage.rules`).
- #266 Village Hub Phase 2 (mobile): NestDetailScreen now shows a live post feed backed by `subscribeToNest` + `subscribeToNestPosts`. Members can compose text posts (up to 500 chars) via PostComposer, optimistically like posts and comments, and view threaded comments in a `@gorhom/bottom-sheet` (75% snap). Post and comment owners can delete their own entries. Firestore rules tightened so each `likedBy` toggle can only add or remove the requesting user's own uid. New shared helpers: `subscribeToNest` (live nest document) and `timeAgo` (moved from VillageHub.tsx to `shared/utils/formatters.ts` so mobile components share the same implementation). Part of #170.
- #262 Village Hub now ships on Android as a real, Firestore-backed community tab. Replaces the "Coming soon" placeholder with a nested native stack (`VillageStack`) containing a Discover / My Nests home screen and a nest detail screen. Phase 1 covers browsing nests (category filter, debounced search, popular/newest sort), joining and leaving, creating a new nest (name, description, category, emoji), and deleting a nest you created. Posts, comments, likes, and media are tracked for Phase 2 and Phase 3. Uses existing `villageService.ts` from `@nestly/shared`; no new dependencies. Part of #170.
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
