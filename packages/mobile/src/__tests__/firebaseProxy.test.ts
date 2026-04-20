// #190 follow-up: verify the lazy Proxy wrappers in
// packages/shared/src/firebase.ts behave like real Firestore instances
// for the two checks that would otherwise silently break.
//
// The Firestore modular SDK does `instanceof Firestore` guards in
// __PRIVATE_cast on every top-level function (collection, doc, writeBatch,
// runTransaction, ...). Without a getPrototypeOf trap on the Proxy those
// guards throw INVALID_ARGUMENT. This test pins that the Proxy's prototype
// chain resolves to the real class so collection(db, 'x') does not throw
// at the SDK boundary.
//
// villageService.ts (the only consumer of db) is web-only, so the regular
// mobile test suite would never catch this regression. Putting the check
// here keeps it in the Jest run that CI executes.
//
// Note: Firebase Auth proxy removed in #293 (Zero-Data MVP). Only db proxy
// is tested here now.

import { collection, Firestore } from 'firebase/firestore';
import { db } from '@nestly/shared';

describe('#190 lazy firebase proxies', () => {
  test('db proxy satisfies instanceof Firestore', () => {
    expect(db).toBeInstanceOf(Firestore);
  });

  test('collection(db, path) does not throw (SDK cast guard passes)', () => {
    expect(() => collection(db, 'test-collection')).not.toThrow();
  });
});
