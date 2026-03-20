import React, { useState, useEffect, Component, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from './types';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { AdminDashboard } from './components/AdminDashboard';
import { ProfessorPortal } from './components/ProfessorPortal';
import { Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Error Boundary Component
interface EBProps { children: ReactNode }
interface EBState { hasError: boolean; error: any }

class ErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Something went wrong</h2>
            <p className="text-stone-500 mb-8 text-sm">
              {this.state.error?.message || "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-stone-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        } else {
          // Create new user profile
          const isAdmin = firebaseUser.email === 'anthonvan.calban@neu.edu.ph';
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Professor',
            role: isAdmin ? 'admin' : 'professor',
            status: 'active'
          };
          await setDoc(userRef, newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      setAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading || !authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-stone-500 font-medium animate-pulse">Loading system...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <ErrorBoundary>
      <Layout user={user}>
        <AnimatePresence mode="wait">
          {user.role === 'admin' ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminDashboard />
            </motion.div>
          ) : (
            <motion.div
              key="professor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ProfessorPortal user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </Layout>
    </ErrorBoundary>
  );
};

export default App;
