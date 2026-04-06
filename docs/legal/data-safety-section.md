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

| Data type | Collected | Shared with third parties | Purpose | Required/Optional |
|-----------|-----------|--------------------------|---------|-------------------|
| Name | Yes | Yes (Google/Firebase for authentication) | App functionality, Account management | Required |
| Email address | Yes | Yes (Google/Firebase for authentication, Resend for transactional email) | App functionality, Account management | Required |
| User IDs | Yes | Yes (Google/Firebase for authentication) | App functionality | Required |

### Health and Fitness

| Data type | Collected | Shared with third parties | Purpose | Required/Optional |
|-----------|-----------|--------------------------|---------|-------------------|
| Health info (pregnancy data, symptoms, vitals, baby health logs) | Yes | No (stored in localStorage on device) | App functionality, Personalisation | Optional |

**Note:** Most health data stays on-device in localStorage and is never transmitted to our servers. The exception is when a user sends health-related questions to the Ava chatbot -- those messages are sent to the AI provider.

### Messages

| Data type | Collected | Shared with third parties | Purpose | Required/Optional |
|-----------|-----------|--------------------------|---------|-------------------|
| In-app messages (Ava chat) | Yes | Yes (OpenRouter/DeepSeek for AI processing) | App functionality | Optional |
| Other (Village Hub posts/comments) | Yes | No (stored in Firestore, visible to other app users) | App functionality | Optional |

### Photos and Videos

| Data type | Collected | Shared with third parties | Purpose | Required/Optional |
|-----------|-----------|--------------------------|---------|-------------------|
| Photos (profile, memories, Village Hub) | Yes | No | App functionality | Optional |

### App Activity

| Data type | Collected | Shared with third parties | Purpose | Required/Optional |
|-----------|-----------|--------------------------|---------|-------------------|
| In-app search history (Village Hub search) | No (not persisted) | No | N/A | N/A |

### Device or Other IDs

| Data type | Collected | Shared with third parties | Purpose | Required/Optional |
|-----------|-----------|--------------------------|---------|-------------------|
| Device or other IDs (push notification tokens) | Yes | No (stored in Firebase) | App functionality (push notifications) | Optional |

---

## Data Sharing Clarifications

**"Shared" in Google Play terms means transferred to a third party.** Village Hub posts visible to other users within the app do NOT count as "shared with third parties" per Google's definition (it's user-to-user within the app).

Data that IS shared with third parties:
- **Name, email, user IDs** with Google/Firebase (authentication and account management)
- **Email address** with Resend (email delivery)
- **Chat messages** with OpenRouter/DeepSeek (AI processing)
- **Village Hub post media** embedded in Firestore (Google) -- visible to other app users

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
