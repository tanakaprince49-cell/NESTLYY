import React, { useState, useEffect } from 'react';
import { Logo } from './Logo.tsx';
import { storage } from '../services/storageService.ts';
import { subscribeUserToPush, showLocalNotification } from '../services/pushService.ts';
import { auth, googleProvider, syncProfileToFirestore } from '../firebase.ts';
import { signInWithPopup, signInAnonymously, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import PhoneInput from 'react-phone-input-2';

interface AuthScreenProps {
  onAuthComplete: (email: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      auth.useDeviceLanguage();
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.');
        }
      });
    }
    
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleAuthSuccess = async (user: any) => {
    const identifier = user.email || user.phoneNumber || `anon-${user.uid}`;
    const name = user.displayName || (user.phoneNumber ? `User ${user.phoneNumber.slice(-4)}` : 'Guest');
    
    storage.logActivity(identifier, 'login');
    storage.setAuthEmail(identifier);
    
    // Initial profile sync if it doesn't exist
    await syncProfileToFirestore(user.uid, {
      email: user.email || '',
      name: name,
      lifecycleStage: 'PREGNANCY',
      createdAt: new Date().toISOString()
    });

    try {
      await subscribeUserToPush();
      
      // Founder's welcome message
      setTimeout(async () => {
        await showLocalNotification(
          "A Welcome from Nestly ❤️",
          `HEY ${name.split(' ')[0]}, this is Tanaka Gaadzikwa from NESTLY. We're so glad you're here!`
        );
      }, 2000);
    } catch (pushErr) {
      console.warn("Push subscription skipped or failed", pushErr);
    }

    onAuthComplete(identifier);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleAuthSuccess(result.user);
    } catch (err: any) {
      setError(err.message || 'Google Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInAnonymously(auth);
      await handleAuthSuccess(result.user);
    } catch (err: any) {
      setError(err.message || 'Guest Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }
    
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    setLoading(true);
    setError('');
    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
    } catch (err: any) {
      console.error("Phone auth error:", err);
      setError(err.message || 'Failed to send code. Check your number format.');
      // Reset reCAPTCHA on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId: any) => {
          if (window.grecaptcha) window.grecaptcha.reset(widgetId);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || !confirmationResult) {
      setError('Please enter the verification code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await confirmationResult.confirm(verificationCode);
      await handleAuthSuccess(result.user);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-rose-50">
      <div id="recaptcha-container"></div>
      <div className="w-full max-w-[480px] z-10 animate-slide-up">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-10">
            <div className="relative">
              <div className="p-1 bg-white rounded-[2.5rem] shadow-2xl">
                <Logo className="w-24 h-24" />
              </div>
            </div>
          </div>
          <h1 className="text-6xl font-serif text-rose-900 tracking-tight mb-4">Nestly</h1>
          <p className="text-[12px] text-[#94a3b8] font-medium uppercase tracking-[0.4em]">
            CHOOSE YOUR NEST
          </p>
        </div>

        <div className="card-premium p-1.5 bg-white shadow-xl rounded-[3.5rem]">
          <div className="bg-white p-8 sm:p-12 rounded-[3.2rem]">
            
            <div className="space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-2xl text-center border border-rose-100 animate-in zoom-in-95">
                  {error}
                </div>
              )}

              {!showPhoneInput ? (
                <>
                  <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full h-16 bg-white text-slate-600 font-black rounded-[1.8rem] border-2 border-slate-50 shadow-sm hover:shadow-md active:scale-95 transition-all text-[11px] uppercase tracking-[0.3em] flex justify-center items-center gap-3 disabled:opacity-40"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
                    <span>Continue with Google</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setShowPhoneInput(true)}
                    disabled={loading}
                    className="w-full h-16 bg-rose-900 text-white font-black rounded-[1.8rem] shadow-lg hover:shadow-xl active:scale-95 transition-all text-[11px] uppercase tracking-[0.3em] flex justify-center items-center gap-3 disabled:opacity-40"
                  >
                    <span className="text-lg">📱</span>
                    <span>Phone Number</span>
                  </button>

                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                      <span className="px-4 bg-white text-slate-300">Or</span>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleAnonymousLogin}
                    disabled={loading}
                    className="w-full h-16 bg-slate-50 text-slate-500 font-black rounded-[1.8rem] border-2 border-transparent hover:bg-slate-100 active:scale-95 transition-all text-[11px] uppercase tracking-[0.3em] flex justify-center items-center gap-3 disabled:opacity-40"
                  >
                    <span className="text-lg">✨</span>
                    <span>Enter as Guest</span>
                  </button>
                </>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  {!confirmationResult ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Phone Number</label>
                        <PhoneInput
                          country={'zw'}
                          value={phoneNumber}
                          onChange={setPhoneNumber}
                          containerClass="nestly-phone-input"
                          inputClass="!w-full !h-16 !bg-slate-50 !border-2 !border-transparent !rounded-[1.5rem] !focus:border-rose-100 !focus:bg-white !outline-none !text-sm !font-semibold !transition-all !pl-16"
                          buttonClass="!bg-transparent !border-none !rounded-[1.5rem] !pl-4"
                          dropdownClass="!rounded-[1.5rem] !shadow-xl !border-none"
                        />
                      </div>
                      <button 
                        onClick={handleSendCode}
                        disabled={loading || !phoneNumber}
                        className="w-full h-16 bg-rose-900 text-white font-black rounded-[1.8rem] shadow-lg hover:shadow-xl active:scale-95 transition-all text-[11px] uppercase tracking-[0.3em] flex justify-center items-center gap-3 disabled:opacity-40"
                      >
                        {loading ? <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Code'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Verification Code</label>
                        <input 
                          type="text" 
                          placeholder="123456" 
                          value={verificationCode}
                          onChange={e => setVerificationCode(e.target.value)}
                          className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-rose-100 focus:bg-white outline-none text-sm font-semibold transition-all text-center tracking-[0.5em]" 
                        />
                      </div>
                      <button 
                        onClick={handleVerifyCode}
                        disabled={loading || !verificationCode}
                        className="w-full h-16 bg-rose-900 text-white font-black rounded-[1.8rem] shadow-lg hover:shadow-xl active:scale-95 transition-all text-[11px] uppercase tracking-[0.3em] flex justify-center items-center gap-3 disabled:opacity-40"
                      >
                        {loading ? <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify & Enter'}
                      </button>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => { setShowPhoneInput(false); setConfirmationResult(null); setError(''); }}
                    className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-rose-500 transition-colors py-2"
                  >
                    Back to other options
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

declare global {
  interface Window {
    recaptchaVerifier: any;
    grecaptcha: any;
  }
}
