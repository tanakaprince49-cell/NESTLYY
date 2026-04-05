# Village Hub Firestore: pre-merge deploy steps

These steps must be completed before merging PR #124 (Village Hub Firestore migration).
They can only be performed by someone with access to the Firebase project (`plasma-ripple-467908-e7`).

Written for Windows 11 with PowerShell. On macOS or Linux, the same steps apply, only the shell commands differ.

Total time: about 10 minutes.

## What you are doing

1. Deploying new Firestore security rules so the new collections are protected
2. Running a one-time seed script that populates the 8 template nests and their welcome posts

Without these two steps, the Village Hub tab will show an empty list after merge.

## Prerequisites

- The repo is cloned and checked out on branch `feat/village-hub-firestore`:
  ```powershell
  git fetch
  git checkout feat/village-hub-firestore
  ```
- Node.js is installed (same as for running the app locally)
- You have access to the Firebase Console for project `plasma-ripple-467908-e7`
- You have PowerShell open in the repo root (right-click the folder in Explorer and choose "Open in Terminal")

## Step 1: Deploy Firestore rules

The easiest way is through the Firebase Console web UI, no CLI setup required.

1. Open https://console.firebase.google.com/project/plasma-ripple-467908-e7/firestore/rules
2. Open the file `firestore.rules` from this branch in your editor (VS Code, Antigravity, whatever you use)
3. Select everything in `firestore.rules` and copy it
4. In the Firebase Console Rules tab, select everything in the editor and paste the new rules over it
5. Click the **Publish** button at the top right
6. Wait for the "Rules published successfully" confirmation

That is it for the rules. They are now live.

## Step 2: Download the service account key

The seed script needs admin credentials to write to Firestore.

1. Open https://console.firebase.google.com/project/plasma-ripple-467908-e7/settings/serviceaccounts/adminsdk
2. Click **Generate new private key**
3. Confirm, a JSON file downloads (looks like `plasma-ripple-467908-e7-firebase-adminsdk-xxxxx.json`)
4. Move that file to the repo root and rename it to `service-account.json`

**Important**: this file contains secrets. Do not commit it to git. The repo `.gitignore` should cover it, but verify with `git status` before any commit. The file name `service-account.json` is already listed in `.gitignore` for this reason.

## Step 3: Run the seed script

In PowerShell, still in the repo root, run these commands one at a time.

Install dependencies (safe to run even if already installed):
```powershell
npm install
```

Load the service account into an environment variable:
```powershell
$env:FIREBASE_SERVICE_ACCOUNT = Get-Content -Raw .\service-account.json
```

Run the seed script:
```powershell
npx tsx scripts\seedVillage.ts
```

Expected output:
```
Seeded 8 template nests and 15 seed posts.
```

If you see `FIREBASE_SERVICE_ACCOUNT env var not set`, the second command did not work. Check that `service-account.json` is in the current folder and run the second and third commands again in the same PowerShell window (environment variables do not persist across new terminal windows).

The seed script is **idempotent**. Fixed IDs are used (`tmpl-1` through `tmpl-8`, `seed-1` through `seed-15`), so you can run it more than once without creating duplicates. Re-running just overwrites in place.

## Step 4: Verify in Firebase Console

1. Open https://console.firebase.google.com/project/plasma-ripple-467908-e7/firestore/data
2. You should see a `nests` collection with 8 documents
3. Click into any nest document and open the `posts` subcollection, you should see 1 or 2 seed posts
4. Confirm to the PR author that the deploy is done so the PR can be merged

## Step 5: Cleanup

After the script succeeds, delete `service-account.json` from the repo folder:
```powershell
Remove-Item .\service-account.json
```

You do not need it day to day. Keeping it around risks committing it by accident. You can always download a new one from the Firebase Console if needed again.

## Troubleshooting

**`npx tsx ...` says "tsx is not recognized"**
Run `npm install` first. `tsx` is a project dev dependency and `npx` needs `node_modules` to exist.

**`Seed failed: Error: 16 UNAUTHENTICATED` or similar**
The service account JSON is wrong or expired. Download a fresh one from the Firebase Console (Step 2).

**`Seed failed: PERMISSION_DENIED`**
This should not happen because admin SDK bypasses security rules. If it does, the service account has insufficient IAM roles. Check in Google Cloud IAM that the service account has the "Cloud Datastore User" or "Firebase Admin SDK Administrator Service Agent" role.

**`The term 'npx' is not recognized`**
Node.js is not installed or not in PATH. Install Node.js from https://nodejs.org/ (LTS version), restart PowerShell, try again.
