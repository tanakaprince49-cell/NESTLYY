import React, { useState } from 'react';
import { Logo } from './Logo.tsx';
import { storage } from '../services/storageService.ts';
import { subscribeUserToPush, showLocalNotification } from '../services/pushService.ts';
import { auth, googleProvider } from '../firebase.ts';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface AuthScreenProps {
  onAuthComplete: (email: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthComplete }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedEmail = email.toLowerCase().trim();

    // Admin Access Check
    if (normalizedEmail === 'tanakaprince49@gmail.com') {
      if (password === 'tanaka') {
        storage.setAuthEmail(normalizedEmail);
        onAuthComplete(normalizedEmail);
        return;
      } else {
        setError('The golden key didn\'t match. Try again, Admin.');
        setLoading(false);
        return;
      }
    }

    const logs = storage.getActivityLogs();
    const accountExists = logs.some(log => log.email.toLowerCase() === normalizedEmail);

    if (isLogin) {
      if (!accountExists) {
        setError('We couldn\'t find your nest. Would you like to sign up instead?');
        setLoading(false);
        return;
      }
    } else {
      if (accountExists) {
        setError('A nest already exists for this email. Please log in.');
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
      } else {
        await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      }

      storage.logActivity(normalizedEmail, isLogin ? 'login' : 'signup');
      storage.setAuthEmail(normalizedEmail);
      
      // Request Push Permission and Subscribe early
      try {
        await subscribeUserToPush();
      } catch (pushErr) {
        console.warn("Push subscription skipped or failed", pushErr);
      }
      
      // If it's a signup, trigger an immediate welcome notification
      if (!isLogin) {
        try {
          await showLocalNotification(
            "Welcome to the Nestly Family! 🤍",
            "Your account is ready. Let's start personalizing your experience."
          );
        } catch (notifErr) {
          console.warn("Welcome notification skipped", notifErr);
        }
      }

      onAuthComplete(normalizedEmail);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user.email) {
        storage.logActivity(user.email, 'login');
        storage.setAuthEmail(user.email);
        onAuthComplete(user.email);
      }
    } catch (err: any) {
      setError(err.message || 'Google Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-rose-50">
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
            {isLogin ? 'WELCOME BACK' : 'CREATE YOUR NEST'}
          </p>
        </div>

        <div className="card-premium p-1.5 bg-white shadow-xl rounded-[3.5rem]">
          <div className="bg-white p-8 sm:p-12 rounded-[3.2rem]">
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-2xl text-center border border-rose-100 animate-in zoom-in-95">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
                <input 
                  required
                  type="email" 
                  placeholder="name@nestly.com" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-rose-100 focus:bg-white outline-none text-sm font-semibold transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Password</label>
                <div className="relative">
                  <input 
                    required
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-rose-100 focus:bg-white outline-none text-sm font-semibold transition-all" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-rose-900 text-white font-black rounded-[1.8rem] shadow-lg hover:shadow-xl active:scale-95 transition-all text-[11px] uppercase tracking-[0.3em] mt-6 flex justify-center items-center gap-3 disabled:opacity-40"
              >
                {loading ? (
                  <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{isLogin ? 'Sign In' : 'Join Nestly'}</span>
                )}
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
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-16 bg-white text-slate-600 font-black rounded-[1.8rem] border-2 border-slate-50 shadow-sm hover:shadow-md active:scale-95 transition-all text-[11px] uppercase tracking-[0.3em] flex justify-center items-center gap-3 disabled:opacity-40"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>
            </form>

            <div className="mt-8 text-center">
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-rose-500 transition-colors"
              >
                {isLogin ? "Need an account? Sign Up" : "Already have an account? Log In"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};