import React, { useState, useEffect } from 'react';
import { Logo } from './Logo.tsx';
import { storage } from '../services/storageService.ts';
import { subscribeUserToPush, showLocalNotification } from '../services/pushService.ts';
import { auth, googleProvider, syncProfileToFirestore } from '../firebase.ts';
import { 
  signInWithPopup, 
  signInAnonymously
} from 'firebase/auth';

interface AuthScreenProps {
  onAuthComplete: (email: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);

  const handleAuthSuccess = async (user: any) => {
    const identifier = user.email || `anon-${user.uid}`;
    const displayName = user.displayName || name || 'Guest';
    
    storage.logActivity(identifier, 'login');
    storage.setAuthEmail(identifier);
    
    try {
      await subscribeUserToPush();
      
      // Founder's welcome message
      setTimeout(async () => {
        await showLocalNotification(
          "A Welcome from Nestly ❤️",
          `HEY ${displayName.split(' ')[0]}, this is Tanaka Gaadzikwa from NESTLY. We're so glad you're here!`
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
      console.error("Anonymous login error:", err);
      setError(err.message || 'Guest Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (isSignUp && !name) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Disconnected from Firebase Auth as requested. 
      // We use Anonymous login behind the scenes to maintain Firestore sync capability 
      // while managing the "Email/Password" logic locally.
      const result = await signInAnonymously(auth);
      
      const localUser = {
        uid: result.user.uid,
        email: email,
        displayName: name || email.split('@')[0],
        isLocal: true
      };

      // Store local credentials mapping (simulated)
      const localUsers = JSON.parse(localStorage.getItem('nestly_local_users') || '{}');
      if (isSignUp) {
        if (localUsers[email]) {
          throw new Error('User already exists locally.');
        }
        localUsers[email] = { password, name, uid: result.user.uid };
      } else {
        const stored = localUsers[email];
        if (!stored || stored.password !== password) {
          throw new Error('Invalid email or password.');
        }
        localUser.displayName = stored.name;
        localUser.uid = stored.uid;
      }
      localStorage.setItem('nestly_local_users', JSON.stringify(localUsers));

      await handleAuthSuccess(localUser);
    } catch (err: any) {
      console.error("Local Email auth error:", err);
      setError(err.message || 'Authentication failed.');
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

              {!showEmailAuth ? (
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
                    onClick={() => setShowEmailAuth(true)}
                    disabled={loading}
                    className="w-full h-16 bg-rose-900 text-white font-black rounded-[1.8rem] shadow-lg hover:shadow-xl active:scale-95 transition-all text-[11px] uppercase tracking-[0.3em] flex justify-center items-center gap-3 disabled:opacity-40"
                  >
                    <span className="text-lg">✉️</span>
                    <span>Email & Password</span>
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
                <form onSubmit={handleEmailAuth} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="space-y-4">
                    {isSignUp && (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Name</label>
                        <input 
                          type="text" 
                          placeholder="Your Name" 
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-rose-100 focus:bg-white outline-none text-sm font-semibold transition-all" 
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Address</label>
                      <input 
                        type="email" 
                        placeholder="mama@example.com" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-rose-100 focus:bg-white outline-none text-sm font-semibold transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-rose-100 focus:bg-white outline-none text-sm font-semibold transition-all" 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full h-16 bg-rose-900 text-white font-black rounded-[1.8rem] shadow-lg hover:shadow-xl active:scale-95 transition-all text-[11px] uppercase tracking-[0.3em] flex justify-center items-center gap-3 disabled:opacity-40"
                  >
                    {loading ? <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
                  </button>

                  <div className="text-center space-y-4">
                    <button 
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-rose-500 transition-colors"
                    >
                      {isSignUp ? 'Already have an account? Sign In' : 'New to Nestly? Create Account'}
                    </button>
                    <br />
                    <button 
                      type="button"
                      onClick={() => { setShowEmailAuth(false); setError(''); }}
                      className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-rose-500 transition-colors py-2"
                    >
                      Back to other options
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
