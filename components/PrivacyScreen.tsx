import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Trash2, CheckCircle2 } from 'lucide-react';

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
          Your Privacy & Security
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Nestly takes your data seriously. Before we begin, please review how we protect your information.
        </p>

        <div className="space-y-6 mb-8 text-gray-700">
          <div className="flex gap-4">
            <div className="mt-1"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div>
            <div>
              <h3 className="font-semibold text-gray-900">What data we collect</h3>
              <p className="text-sm">We collect pregnancy data, health inputs, and usage metrics to personalize your experience and provide relevant insights.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="mt-1"><Lock className="w-6 h-6 text-emerald-500" /></div>
            <div>
              <h3 className="font-semibold text-gray-900">How it's protected</h3>
              <p className="text-sm">Your sensitive health data is stored securely using industry-standard encryption. We do not sell your personal data to third parties.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="mt-1"><Trash2 className="w-6 h-6 text-emerald-500" /></div>
            <div>
              <h3 className="font-semibold text-gray-900">Your rights</h3>
              <p className="text-sm">You have full control over your data. You can request data removal or delete your account at any time from the settings menu.</p>
            </div>
          </div>
        </div>

        <div className="bg-rose-50 p-4 rounded-xl mb-8 border border-rose-100">
          <h4 className="font-semibold text-rose-900 mb-2">Privacy Commitment</h4>
          <p className="text-sm text-rose-800">
            Your data is encrypted and stored securely. We prioritize your privacy above all else.
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
            I have read and agree to Nestly’s Privacy & Security Policy.
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
