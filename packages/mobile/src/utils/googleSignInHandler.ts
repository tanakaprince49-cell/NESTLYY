export type GoogleSignInOutcome =
  | { kind: 'success' }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

export interface GoogleSignInLike {
  hasPlayServices: () => Promise<boolean>;
  signIn: () => Promise<{ data?: { idToken?: string | null } | null } | null>;
}

export interface GoogleSignInStatusCodes {
  SIGN_IN_CANCELLED: string;
  IN_PROGRESS: string;
  PLAY_SERVICES_NOT_AVAILABLE: string;
}

export async function runGoogleSignIn(
  gs: GoogleSignInLike,
  statusCodes: GoogleSignInStatusCodes,
  forward: (idToken: string) => Promise<void>,
): Promise<GoogleSignInOutcome> {
  try {
    await gs.hasPlayServices();
    const result = await gs.signIn();
    const idToken = result?.data?.idToken;
    if (!idToken) {
      return { kind: 'error', message: "Google sign-in didn't complete. Please try again." };
    }
    await forward(idToken);
    return { kind: 'success' };
  } catch (err: unknown) {
    const code = (err as { code?: string } | null)?.code;
    if (code === statusCodes.SIGN_IN_CANCELLED || code === statusCodes.IN_PROGRESS) {
      return { kind: 'cancelled' };
    }
    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { kind: 'error', message: 'Google Play Services is not available on this device' };
    }
    return {
      kind: 'error',
      message: err instanceof Error ? err.message : 'Google sign-in failed',
    };
  }
}
