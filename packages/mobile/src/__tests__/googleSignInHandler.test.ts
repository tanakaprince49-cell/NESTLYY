import {
  runGoogleSignIn,
  type GoogleSignInLike,
  type GoogleSignInStatusCodes,
} from '../utils/googleSignInHandler';

const statusCodes: GoogleSignInStatusCodes = {
  SIGN_IN_CANCELLED: '12501',
  IN_PROGRESS: '8',
  PLAY_SERVICES_NOT_AVAILABLE: '7',
};

function makeGs(impl: Partial<GoogleSignInLike>): GoogleSignInLike {
  return {
    hasPlayServices: impl.hasPlayServices ?? (async () => true),
    signIn: impl.signIn ?? (async () => ({ data: { idToken: 'tok' } })),
  };
}

describe('#276 runGoogleSignIn', () => {
  test('success forwards the returned idToken', async () => {
    const forward = jest.fn().mockResolvedValue(undefined);
    const gs = makeGs({ signIn: async () => ({ data: { idToken: 'abc123' } }) });
    const outcome = await runGoogleSignIn(gs, statusCodes, forward);
    expect(outcome).toEqual({ kind: 'success' });
    expect(forward).toHaveBeenCalledWith('abc123');
  });

  test('cancelled (user dismissed) returns cancelled without surfacing an error', async () => {
    const forward = jest.fn();
    const gs = makeGs({
      signIn: async () => {
        throw Object.assign(new Error('cancelled'), { code: statusCodes.SIGN_IN_CANCELLED });
      },
    });
    const outcome = await runGoogleSignIn(gs, statusCodes, forward);
    expect(outcome).toEqual({ kind: 'cancelled' });
    expect(forward).not.toHaveBeenCalled();
  });

  test('IN_PROGRESS (double-tap) returns cancelled without surfacing an error', async () => {
    const forward = jest.fn();
    const gs = makeGs({
      signIn: async () => {
        throw Object.assign(new Error('in progress'), { code: statusCodes.IN_PROGRESS });
      },
    });
    const outcome = await runGoogleSignIn(gs, statusCodes, forward);
    expect(outcome).toEqual({ kind: 'cancelled' });
    expect(forward).not.toHaveBeenCalled();
  });

  test('PLAY_SERVICES_NOT_AVAILABLE returns a device-specific error message', async () => {
    const forward = jest.fn();
    const gs = makeGs({
      hasPlayServices: async () => {
        throw Object.assign(new Error('no play services'), {
          code: statusCodes.PLAY_SERVICES_NOT_AVAILABLE,
        });
      },
    });
    const outcome = await runGoogleSignIn(gs, statusCodes, forward);
    expect(outcome).toEqual({
      kind: 'error',
      message: 'Google Play Services is not available on this device',
    });
    expect(forward).not.toHaveBeenCalled();
  });

  test('generic failure surfaces the underlying error message', async () => {
    const forward = jest.fn();
    const gs = makeGs({
      signIn: async () => {
        throw new Error('network unreachable');
      },
    });
    const outcome = await runGoogleSignIn(gs, statusCodes, forward);
    expect(outcome).toEqual({ kind: 'error', message: 'network unreachable' });
    expect(forward).not.toHaveBeenCalled();
  });

  test('missing idToken surfaces a deterministic error', async () => {
    const forward = jest.fn();
    const gs = makeGs({ signIn: async () => ({ data: { idToken: null } }) });
    const outcome = await runGoogleSignIn(gs, statusCodes, forward);
    expect(outcome).toEqual({
      kind: 'error',
      message: 'Google did not return an ID token',
    });
    expect(forward).not.toHaveBeenCalled();
  });

  test('non-Error throw surfaces a fallback message', async () => {
    const forward = jest.fn();
    const gs = makeGs({
      signIn: async () => {
        throw 'raw string';
      },
    });
    const outcome = await runGoogleSignIn(gs, statusCodes, forward);
    expect(outcome).toEqual({ kind: 'error', message: 'Google sign-in failed' });
  });
});
