import React from 'react';
import { auth } from '../firebase';
import { LogOut, User as UserIcon, Settings, ClipboardList } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  user: User;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, children }) => {
  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <ClipboardList className="text-white w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-stone-900 hidden sm:block">NEU Lab Logs</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-2">
                <span className="text-sm font-semibold text-stone-900">{user.displayName}</span>
                <span className="text-xs text-stone-500 capitalize">{user.role}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleLogout}
                  className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      <footer className="bg-white border-t border-stone-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-stone-400 text-sm">
          &copy; {new Date().getFullYear()} NEU Laboratory Room Logs. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
