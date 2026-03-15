import React, { useState, useEffect } from 'react';
import { Logo } from './Logo.tsx';
import { storage } from '../services/storageService.ts';
import { subscribeUserToPush, showLocalNotification } from '../services/pushService.ts';
import { auth, googleProvider } from '../firebase.ts';
import { 
  signInWithPopup, 
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { X, Download, Share, PlusSquare } from 'lucide-react';

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
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const handleAuthSuccess = async (user: any) => {
    const identifier = user.email || `anon-${user.uid}`;
    const displayName = user.displayName || 'Guest';
    
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
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      
      await handleAuthSuccess(userCredential.user);
    } catch (err: any) {
      console.error("Email auth error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Try signing in.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-rose-50">
      <div className="w-full max-w-[480px] z-10 animate-slide-up">
        <div className="text-center mb-12">
          <div className="mb-8">
            <button 
              onClick={() => setShowInstallGuide(true)}
              className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-colors flex items-center justify-center gap-2 mx-auto bg-white py-3 px-6 rounded-2xl shadow-sm border border-rose-100"
            >
              <Download size={14} />
              How to Install App
            </button>
          </div>
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

      {showInstallGuide && (
        <div className="fixed inset-0 z-[200] bg-rose-500 flex flex-col p-6 overflow-y-auto animate-in slide-in-from-bottom-full">
          <div className="flex justify-between items-center mb-8 mt-12">
            <h2 className="text-2xl font-serif text-white">How to Install Nestly</h2>
            <button onClick={() => setShowInstallGuide(false)} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="space-y-6 text-white max-w-md mx-auto w-full">
            <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <svg viewBox="0 0 384 512" className="w-5 h-5 fill-white"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                For iOS (Safari)
              </h3>
              <ol className="list-decimal list-inside space-y-4 text-sm font-medium">
                <li>Open Nestly in Safari.</li>
                <li>Tap the <Share size={16} className="inline mx-1" /> <strong>Share</strong> button at the bottom of the screen.</li>
                <li>Scroll down and tap <PlusSquare size={16} className="inline mx-1" /> <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top right corner.</li>
              </ol>
            </div>
            <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <svg viewBox="0 0 512 512" className="w-5 h-5 fill-white"><path d="M325.3 234.3L104.6 13.6C111.8 5.6 125.3 0 140.8 0h230.4c15.5 0 29 5.6 36.2 13.6L186.7 234.3h138.6zM500.4 104.6c-5.6-11.8-16.4-21.6-29.6-27.2L250.1 298.1 29.6 77.4C16.4 83 5.6 92.8 0 104.6l250.1 250.1L500.4 104.6zM250.1 512c15.5 0 29-5.6 36.2-13.6L500.4 277.7c-5.6-11.8-16.4-21.6-29.6-27.2L250.1 471.2 29.6 250.5C16.4 256.1 5.6 265.9 0 277.7l213.9 220.7c7.2 8 20.7 13.6 36.2 13.6z"/></svg>
                For Android (Chrome)
              </h3>
              <ol className="list-decimal list-inside space-y-4 text-sm font-medium">
                <li>Open Nestly in Chrome.</li>
                <li>Tap the <strong>Menu</strong> (three dots) in the top right corner.</li>
                <li>Tap <Download size={16} className="inline mx-1" /> <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                <li>Follow the on-screen prompts to install.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
