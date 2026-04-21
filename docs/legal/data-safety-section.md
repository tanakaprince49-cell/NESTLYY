# Google Play Data Safety Section -- What to Fill In

This is a guide for filling out the Data Safety form in Google Play Console.
It is not a user-facing document.

---

## Overview Questions

| Question | Answer |
|----------|--------|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS/TLS) |
| Do you provide a way for users to request that their data is deleted? | **Yes** (account deletion in settings + contact email) |

---

## Data Types Collected

### Personal Info

Nestly does not collect name, email, or user IDs. The app uses a local device-scoped UUID for storage partitioning on the device only; it is never transmitted.

### Health and Fitness

| Data type | Collected | Shared with third parties | Purpose | Required/Optional |
|-----------|-----------|--------------------------|---------|-------------------|
| Health info (pregnancy data, symptoms, vitals, baby health logs) | Yes | No (stored in localStorage on device) | App functionality, Personalisation | Optional |

**Note:** All health data stays on-device and is never transmitted to our servers.

### Messages

Nestly does not collect in-app messages. No AI chat or community-messaging features are present.

### Photos and Videos

| Data type | Collected | Shared with third parties | Purpose | Required/Optional |
|-----------|-----------|--------------------------|---------|-------------------|
| Photos (profile, memory albums) | Yes | No (stored locally on device) | App functionality | Optional |

### App Activity

| Data type | Collected | Shared with third parties | Purpose | Required/Optional |
|-----------|-----------|--------------------------|---------|-------------------|
| In-app search history (food research query text) | Yes | Yes (Google Gemini for nutrition guidance) | App functionality | Optional |

### Device or Other IDs

| Data type | Collected | Shared with third parties | Purpose | Required/Optional |
|-----------|-----------|--------------------------|---------|-------------------|
| Device or other IDs (push notification tokens) | Yes | No (stored in Firebase Cloud Messaging) | App functionality (push notifications) | Optional |

---

## Data Sharing Clarifications

**"Shared" in Google Play terms means transferred to a third party.**

Data that IS shared with third parties:
- **Food-research query text** with Google Gemini (for nutrition-safety guidance during pregnancy)
- **Push notification tokens** with Firebase Cloud Messaging (delivery only)
- **Email address** with Resend (transactional email; only when you opt in)

---

## Additional Declarations

| Question | Answer |
|----------|--------|
| Does your app follow Google Play's Families Policy? | **No** (app targets parents/adults, not children as users) |
| Target age group | **18+** (parents and caregivers) |
| Does your app contain ads? | **No** |
| Does your app use location data? | **No** |
| Does your app use the camera? | **No** (photo upload is from gallery only) |
| Does your app use the microphone? | **No** |
| Privacy policy URL | **[REQUIRED -- insert URL of hosted privacy policy]** |

---

## Notes for Play Console Submission

1. The privacy policy MUST be hosted at a publicly accessible URL (not a PDF, not an in-app-only page). Host it as a web page.
2. The Data Safety section must be consistent with your Privacy Policy. If the policy says you collect health data, the Data Safety form must declare it too.
3. Google reviews Data Safety declarations during app review. Inaccurate declarations can lead to app rejection or removal.
4. If you add features later (e.g. Health Connect integration, location tracking), update the Data Safety section before publishing the update.
