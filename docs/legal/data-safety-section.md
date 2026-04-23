# Google Play Data Safety Section -- What to Fill In

This is a guide for filling out the Data Safety form in Google Play Console.
It is not a user-facing document.

Nestly is a Zero-Data application: all tracking, health, pregnancy, baby care, journal, and media data is stored exclusively on the user's device via Android AsyncStorage (or browser localStorage for the web PWA). No user data is transmitted to servers the operator controls. The Data Safety answers below reflect that.

---

## Overview Questions

| Question | Answer |
|----------|--------|
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (trivially true — no user data is transmitted off the device) |
| Do you provide a way for users to request that their data is deleted? | **Yes** (in-app "Delete all data" action in Settings, Android Settings -> Apps -> Nestly -> Storage -> Clear Data, or app uninstall) |

---

## Data Types Collected

**None.** Google defines "collected" as: data that your app accesses and transmits off the device. Because Nestly transmits no user data, no data types apply.

### What about the device UUID?

On first launch, Nestly generates a random UUIDv4 that is stored locally on the device. The UUID partitions data between multiple local users of the same installation (Android's profile model does not do this automatically for app-level data). The UUID is never transmitted. Under Google's definition this is not collected and not shared.

### What about photos?

Photos selected via the Android image picker and stored in memory albums stay in app-local storage. They are never uploaded to any server.

### What about local reminders?

The Android app schedules local reminders (medication, appointments, due-date countdown) via the Android OS notification scheduler. No device token is collected, registered, or transmitted. There is no Firebase Cloud Messaging involvement.

### What about Health Connect?

The Android app declares Health Connect READ/WRITE permissions so users can opt in to sync their tracking data with Android's on-device Health Connect store. Health Connect is an OS-level local data store owned and managed by the user; data exchanged with Health Connect never leaves the device through Nestly. (See the Play Console Health Connect declaration section; the Play Console form treats Health Connect as a separate declaration from Data Safety data types.)

---

## Additional Declarations

| Question | Answer |
|----------|--------|
| Does your app follow Google Play's Families Policy? | **No** (app targets parents/adults, not children as users) |
| Target age group | **18+** (parents and caregivers) |
| Does your app contain ads? | **No** |
| Does your app use location data? | **No** |
| Does your app use the camera? | **No** (photo input is via the system image picker, which selects from the gallery) |
| Does your app use the microphone? | **No** |
| Privacy policy URL | **https://nestlyhealth.com/legal/privacy** |

---

## Notes for Play Console Submission

1. The privacy policy MUST be hosted at a publicly accessible URL (not a PDF, not an in-app-only page). The current hosting target is `https://nestlyhealth.com/legal/privacy` -- DNS cutover is tracked under issue #305.
2. The Data Safety section must be consistent with the Privacy Policy. Both state "No data collected" (no transmission off device).
3. Google reviews Data Safety declarations during app review. The Zero-Data story is simple and defensible because the code-level audit under issue #304 verifies zero outbound user-data traffic: `rg "fetch\(|firestore|firebase/storage|getMessaging|collection\(|setDoc|addDoc|uploadBytes|/api/ava|/api/push|/api/admin|/api/custom-plan"` returns only the `IdentityType` string-literal union and a test-file comment marker; no outbound HTTP code remains.
4. If features are added later that cross the Zero-Data boundary (cloud backup, AI that sends user context off-device, community features with server storage, analytics, crash reporting that captures user state, etc.), update BOTH the Privacy Policy and this Data Safety declaration before publishing that update.
