// Public URLs and paths for the hosted legal pages built by
// packages/web/scripts/build-legal.mjs (#305 Phase B) and wired into the UI
// in #305 Phase C. The canonical domain is nestlyhealth.com; DNS cutover
// from the Vercel preview alias to the apex is maintainer work.
//
// Web prefers the relative *_PATH constant so links work on whichever origin
// the app is currently served from (localhost dev, Vercel preview, or
// nestlyhealth.com after DNS). Mobile uses Linking.openURL which requires an
// absolute URL, so it consumes *_URL.

export const LEGAL_PRIVACY_PATH = '/legal/privacy' as const;
export const LEGAL_TERMS_PATH = '/legal/terms' as const;

export const LEGAL_PRIVACY_URL = 'https://nestlyhealth.com/legal/privacy' as const;
export const LEGAL_TERMS_URL = 'https://nestlyhealth.com/legal/terms' as const;
