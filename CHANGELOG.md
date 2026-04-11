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
