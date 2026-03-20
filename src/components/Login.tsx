import React, { useEffect, useState } from 'react';
import { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { LogIn, QrCode, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

export const Login: React.FC = () => {
  const [isProcessingQr, setIsProcessingQr] = useState(false);

  // Ensure the account selection screen is always shown
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isQrLogin = params.get('action') === 'login';
    
    if (!isQrLogin) return;

    setIsProcessingQr(true);

    // 1. Listen for auth state changes - if user is already logged in, clear URL
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const url = new URL(window.location.href);
        url.searchParams.delete('action');
        window.history.replaceState({}, '', url.toString());
        sessionStorage.removeItem('qr_login_attempt');
        setIsProcessingQr(false);
      }
    });

    const handleAuth = async () => {
      try {
        // 2. Check for redirect result
        const result = await getRedirectResult(auth);
        
        if (result || auth.currentUser) {
          const url = new URL(window.location.href);
          url.searchParams.delete('action');
          window.history.replaceState({}, '', url.toString());
          sessionStorage.removeItem('qr_login_attempt');
          setIsProcessingQr(false);
          return;
        }

        // 3. Initiate redirect if not already attempted in this session
        const hasAttempted = sessionStorage.getItem('qr_login_attempt');
        if (!hasAttempted) {
          sessionStorage.setItem('qr_login_attempt', 'true');
          await signInWithRedirect(auth, googleProvider);
        } else {
          // If we're back here but no user, stop the loop
          const url = new URL(window.location.href);
          url.searchParams.delete('action');
          window.history.replaceState({}, '', url.toString());
          sessionStorage.removeItem('qr_login_attempt');
          setIsProcessingQr(false);
        }
      } catch (error) {
        console.error('Auth error:', error);
        const url = new URL(window.location.href);
        url.searchParams.delete('action');
        window.history.replaceState({}, '', url.toString());
        sessionStorage.removeItem('qr_login_attempt');
        setIsProcessingQr(false);
      }
    };

    handleAuth();
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Append action=login to the QR code URL
  const qrUrl = `${window.location.origin}${window.location.pathname}?action=login`;

  if (isProcessingQr) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-3xl shadow-xl max-w-md w-full text-center"
        >
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Authenticating...</h2>
          <p className="text-stone-500">Please wait while we connect your account.</p>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center"
      >
        <div className="mb-8">
          <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
            <LogIn className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900">NEU Lab Logs</h1>
          <p className="text-stone-500 mt-2">Laboratory Room Management System</p>
        </div>

        <div className="mb-10 p-6 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200 flex flex-col items-center">
          <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
            <QRCodeSVG 
              value={qrUrl} 
              size={160} 
              level="H"
              includeMargin={false}
            />
          </div>
          <div className="flex items-center gap-2 text-stone-400 text-sm font-medium">
            <QrCode className="w-4 h-4" />
            <span>Scan to Login on Mobile</span>
          </div>
        </div>
        
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-stone-200 text-stone-700 py-4 px-6 rounded-2xl font-bold hover:bg-stone-50 transition-all active:scale-95 shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          Sign in with Google
        </button>
        
        <p className="mt-8 text-xs text-stone-400 leading-relaxed">
          By signing in, you agree to the terms of the NEU Laboratory Room Logs system.
        </p>
      </motion.div>
    </div>
  );
};
