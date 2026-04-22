import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  shouldShowWebPushStaleNoticeSync,
  dismissWebPushStaleNoticeSync,
} from '@nestly/shared';

// storage-audit: allowed — sync-backend adapter for the platform-agnostic
// shouldShow/dismiss helpers in @nestly/shared. The shared package must
// not import localStorage directly, so web supplies this thin wrapper.
const syncBackend = {
  getItem: (k: string): string | null => {
    try { return localStorage.getItem(k); } catch { return null; } // storage-audit: allowed — shared-helper sync backend
  },
  setItem: (k: string, v: string): void => {
    try { localStorage.setItem(k, v); } catch {} // storage-audit: allowed — shared-helper sync backend
  },
  removeItem: (k: string): void => {
    try { localStorage.removeItem(k); } catch {} // storage-audit: allowed — shared-helper sync backend
  },
};

export const WebPushDiscontinuedBanner: React.FC = () => {
  // See RetirementNoticeBanner.tsx for the lazy-initializer rationale:
  // role="status" must be in the DOM at first paint for assistive tech
  // to announce it.
  const [visible, setVisible] = useState<boolean>(() =>
    shouldShowWebPushStaleNoticeSync(syncBackend),
  );

  if (!visible) return null;

  const dismiss = (): void => {
    dismissWebPushStaleNoticeSync(syncBackend);
    setVisible(false);
  };

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-900 shadow-sm backdrop-blur"
    >
      <div className="flex-1">
        <p className="font-semibold">Web push notifications have been discontinued</p>
        <p className="mt-1 leading-snug text-rose-800">
          For reminders, install the Android app when it launches. Everything else on the web keeps working as usual.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notice"
        className="rounded-full p-1 text-rose-600 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
