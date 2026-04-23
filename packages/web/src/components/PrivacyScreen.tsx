import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Smartphone, Download, CheckCircle2 } from 'lucide-react';
import { LEGAL_PRIVACY_PATH, LEGAL_TERMS_PATH } from '@nestly/shared';

interface PrivacyScreenProps {
  onAccept: () => void;
}

export const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ onAccept }) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl max-w-2xl w-full p-8 md:p-12"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-rose-100 p-4 rounded-full">
            <Shield className="w-12 h-12 text-rose-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Your data stays with you
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Nestly does not collect, store, or transmit your tracking data. Here is how that works.
        </p>

        <div className="space-y-6 mb-8 text-gray-700">
          <div className="flex gap-4">
            <div className="mt-1"><Smartphone className="w-6 h-6 text-rose-500" /></div>
            <div>
              <h3 className="font-semibold text-gray-900">Stored on this device only</h3>
              <p className="text-sm">Everything you log — pregnancy details, feeding, sleep, vitals, journal — lives in your browser storage on this device. Nothing is sent to a Nestly server because there is no Nestly server for your data.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="mt-1"><Download className="w-6 h-6 text-rose-500" /></div>
            <div>
              <h3 className="font-semibold text-gray-900">You own the export</h3>
              <p className="text-sm">Use Settings &raquo; Your Data to download a JSON backup any time, or to wipe everything from this device. There is no account to delete because there is no account in the first place.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="mt-1"><CheckCircle2 className="w-6 h-6 text-rose-500" /></div>
            <div>
              <h3 className="font-semibold text-gray-900">No tracking, no analytics</h3>
              <p className="text-sm">No third-party trackers. No ads. No usage telemetry. Clearing browser data or uninstalling the app permanently erases everything Nestly knows about you.</p>
            </div>
          </div>
        </div>

        <div className="bg-rose-50 p-4 rounded-xl mb-8 border border-rose-100 text-sm">
          <p className="text-rose-900 font-semibold mb-1">Read the full text:</p>
          <p>
            <a
              href={LEGAL_PRIVACY_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-700 underline hover:text-rose-900"
            >
              Privacy Policy
            </a>
            <span className="text-rose-300 mx-2">&middot;</span>
            <a
              href={LEGAL_TERMS_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-700 underline hover:text-rose-900"
            >
              Terms of Service
            </a>
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-8 group">
          <div className="relative flex items-center mt-1">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <div className="w-6 h-6 border-2 border-gray-300 rounded-md peer-checked:bg-rose-500 peer-checked:border-rose-500 transition-colors flex items-center justify-center">
              <CheckCircle2 className={`w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity`} />
            </div>
          </div>
          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
            I have read and agree to the Privacy Policy and Terms of Service.
          </span>
        </label>

        <button
          onClick={onAccept}
          disabled={!accepted}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
            accepted
              ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue to Nestly
        </button>
      </motion.div>
    </div>
  );
};
