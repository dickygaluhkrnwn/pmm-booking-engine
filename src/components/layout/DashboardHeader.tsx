"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Ship, LogOut, User, LayoutDashboard } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <nav className="bg-navy py-4 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div 
          onClick={() => router.push('/')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <Ship className="w-7 h-7 text-gold" />
          <span className="text-lg font-bold tracking-widest text-white uppercase hidden md:block">
            PMM <span className="text-gold">Reserve</span>
          </span>
        </div>

        {/* Navigation Links & User Actions */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/dashboard')}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${pathname === '/dashboard' ? 'text-gold' : 'text-gray-300 hover:text-white'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden md:inline">Dashboard</span>
          </button>
          
          <button 
            onClick={() => router.push('/dashboard/profile')}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${pathname.includes('/profile') ? 'text-gold' : 'text-gray-300 hover:text-white'}`}
          >
            <User className="w-4 h-4" />
            <span className="hidden md:inline">Profile</span>
          </button>

          <div className="w-px h-5 bg-gray-600 hidden md:block"></div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}