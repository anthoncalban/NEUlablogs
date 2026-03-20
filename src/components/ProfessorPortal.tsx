import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  History, 
  DoorOpen, 
  LogOut, 
  LogIn,
  X,
  Clock,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Log, User } from '../types';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

interface ProfessorPortalProps {
  user: User;
}

export const ProfessorPortal: React.FC<ProfessorPortalProps> = ({ user }) => {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [lastRoom, setLastRoom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLoginNotify, setShowLoginNotify] = useState(true);
  const [ongoingRooms, setOngoingRooms] = useState<Set<string>>(new Set());

  const rooms = Array.from({ length: 10 }, (_, i) => (101 + i).toString());

  useEffect(() => {
    const timer = setTimeout(() => setShowLoginNotify(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch recent logs and track ongoing status
  useEffect(() => {
    const q = query(
      collection(db, 'logs'),
      where('professorId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Log[];
      
      setRecentLogs(logsData.slice(0, 5));

      // Determine ongoing rooms (latest log for each room is 'login')
      const ongoing = new Set<string>();
      const processedRooms = new Set<string>();
      
      logsData.forEach(log => {
        if (!processedRooms.has(log.roomNumber)) {
          if (log.type === 'login') {
            ongoing.add(log.roomNumber);
          }
          processedRooms.add(log.roomNumber);
        }
      });
      
      setOngoingRooms(ongoing);
    }, (err) => {
      console.error("Firestore error:", err);
      setError("Failed to sync with database.");
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleLogAction = async (type: 'login' | 'logout', roomNum?: string) => {
    const room = roomNum || selectedRoom;
    if (!room) return;

    try {
      const logData = {
        professorId: user.uid,
        professorName: user.displayName,
        roomNumber: room,
        timestamp: new Date().toISOString(),
        type: type
      };

      await addDoc(collection(db, 'logs'), logData);

      setLastAction(type);
      setLastRoom(room);
      setShowSuccess(true);
      setSelectedRoom(null);
      
      setTimeout(() => {
        setShowSuccess(false);
        setLastAction(null);
        setLastRoom(null);
      }, 5000);
    } catch (err) {
      console.error("Error adding log:", err);
      setError("Failed to save log entry.");
    }
  };

  if (user.status === 'blocked') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-xl border border-red-100 text-center max-w-md mx-auto mt-20">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Account Blocked</h2>
        <p className="text-stone-500 mb-6">Your account has been restricted. Please contact the administrator for assistance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Login Notification */}
      <AnimatePresence>
        {showLoginNotify && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm"
          >
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <p className="text-emerald-900 font-bold">Welcome back, {user.displayName}!</p>
              <p className="text-emerald-700 text-xs">You are successfully logged in to the system.</p>
            </div>
            <button onClick={() => setShowLoginNotify(false)} className="ml-auto text-emerald-400 hover:text-emerald-600">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Action Area */}
      {!selectedRoom && !showSuccess && (
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <DoorOpen className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-stone-900">Select Room</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {rooms.map(room => {
                const isOngoing = ongoingRooms.has(room);
                return (
                  <button
                    key={room}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-4 border rounded-2xl font-bold transition-all flex flex-col items-center gap-2 group relative overflow-hidden ${
                      isOngoing 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'
                    }`}
                  >
                    {isOngoing && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      </div>
                    )}
                    <span className={`text-xs uppercase tracking-widest ${isOngoing ? 'text-emerald-500' : 'text-stone-400 group-hover:text-emerald-500'}`}>
                      {isOngoing ? 'Ongoing' : 'Room'}
                    </span>
                    <span className="text-2xl">{room}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Log Action Modal */}
      <AnimatePresence>
        {selectedRoom && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <DoorOpen className="w-10 h-10" />
              </div>
              
              <h3 className="text-2xl font-bold text-stone-900 mb-2">Room {selectedRoom}</h3>
              
              <div className="bg-stone-50 p-4 rounded-2xl space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3 text-stone-600">
                  <CalendarIcon className="w-4 h-4 text-stone-400" />
                  <span className="text-sm font-medium">{format(new Date(), 'EEEE, MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-3 text-stone-600">
                  <Clock className="w-4 h-4 text-stone-400" />
                  <span className="text-sm font-medium">{format(new Date(), 'hh:mm a')}</span>
                </div>
                <div className="flex items-center gap-3 text-stone-600">
                  <div className={`w-2 h-2 rounded-full ${ongoingRooms.has(selectedRoom) ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
                  <span className="text-sm font-medium">Status: {ongoingRooms.has(selectedRoom) ? 'On Going' : 'Available'}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {!ongoingRooms.has(selectedRoom) ? (
                  <button
                    onClick={() => handleLogAction('login')}
                    className="flex items-center justify-center gap-3 p-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                  >
                    <LogIn className="w-6 h-6" />
                    Confirm Log In
                  </button>
                ) : (
                  <button
                    onClick={() => handleLogAction('logout')}
                    className="flex items-center justify-center gap-3 p-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-colors shadow-lg shadow-stone-200"
                  >
                    <LogOut className="w-6 h-6" />
                    Confirm Log Out
                  </button>
                )}
                
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="py-3 text-stone-400 hover:text-stone-600 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-emerald-600 text-white p-8 rounded-3xl shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Success!</h3>
            <p className="text-emerald-50 mb-4 text-lg">
              Thank you for using Room {lastRoom}.
            </p>
            {lastAction === 'login' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-bold animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full" />
                Status: On Going
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Activity */}
      {!selectedRoom && !showSuccess && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-100 text-stone-600 rounded-xl flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-stone-900">Recent Activity</h2>
            </div>
          </div>
          
          <div className="space-y-4">
            {recentLogs.length > 0 ? (
              recentLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      log.type === 'login' ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {log.type === 'login' ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">Room {log.roomNumber}</p>
                      <p className="text-xs text-stone-500">{format(parseISO(log.timestamp), 'MMM dd, hh:mm a')}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${
                    log.type === 'login' ? 'text-emerald-600' : 'text-stone-400'
                  }`}>
                    {log.type}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-stone-400 py-8 italic">No recent activity found.</p>
            )}
          </div>
        </div>
      )}

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-2 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
