import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  shouldShowAvaRetirementNoticeSync,
  markAvaRetirementNoticeSeenSync,
} from '@nestly/shared';

const syncBackend = {
  getItem: (k: string): string | null => {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  setItem: (k: string, v: string): void => {
    try { localStorage.setItem(k, v); } catch {}
  },
};

export const RetirementNoticeBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShowAvaRetirementNoticeSync(syncBackend));
  }, []);

  if (!visible) return null;

  const dismiss = (): void => {
    markAvaRetirementNoticeSeenSync(syncBackend);
    setVisible(false);
  };

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-900 shadow-sm backdrop-blur"
    >
      <div className="flex-1">
        <p className="font-semibold">We've simplified the app</p>
        <p className="mt-1 leading-snug text-rose-800">
          Ava, Symptom Decoder, and the AI Meal Plan are retired while we review privacy controls. Core tracking (nutrition, sleep, kicks, growth) continues as usual.
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
