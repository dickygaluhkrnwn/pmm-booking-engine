"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Ship, LogOut, User, LayoutDashboard, ChevronDown } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State untuk fitur Smart Header (Hide on scroll down)
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Mengambil data profile untuk foto dan nama
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile({ email: user.email, ...userDoc.data() });
          } else {
            setUserProfile({ email: user.email });
          }
        } catch (error) {
          console.error("Error fetching user data for header:", error);
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Menutup dropdown jika user klik di luar area menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Logika Smart Header (Scroll tracking)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Deteksi apakah sudah di-scroll dari posisi paling atas
      setIsScrolled(currentScrollY > 20);

      // Hide saat scroll ke bawah, Show saat scroll ke atas
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
        setIsDropdownOpen(false); // Otomatis tutup dropdown saat scroll turun
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isScrolled ? 'bg-navy/95 backdrop-blur-md shadow-lg border-b border-white/5' : 'bg-navy py-2'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div 
          onClick={() => router.push('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="bg-white/5 p-2 rounded-xl group-hover:bg-white/10 transition-colors border border-white/5">
            <Ship className="w-5 h-5 text-gold" />
          </div>
          <span className="text-lg font-bold tracking-widest text-white uppercase hidden md:block">
            PMM <span className="text-gold">Reserve</span>
          </span>
        </div>

        {/* User Dropdown Premium */}
        <div className="flex items-center" ref={dropdownRef}>
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 pr-4 pl-1.5 py-1.5 rounded-full transition-all"
            >
              {/* Avatar Circle */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-[#b8972e] p-[2px] flex-shrink-0 shadow-sm">
                <div className="w-full h-full rounded-full bg-navy flex items-center justify-center overflow-hidden">
                  {userProfile?.photoUrl ? (
                    <Image 
                      src={userProfile.photoUrl} 
                      alt="Avatar" 
                      width={32} 
                      height={32} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-gold">
                      {userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : <User className="w-4 h-4 text-gold" />}
                    </span>
                  )}
                </div>
              </div>

              {/* Name & Chevron */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white hidden sm:block max-w-[120px] truncate">
                  {userProfile?.fullName?.split(' ')[0] || 'Guest'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.1)] border border-gray-100 overflow-hidden z-50 origin-top-right"
                >
                  <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                    <p className="text-sm font-bold text-navy truncate">
                      {userProfile?.fullName || 'Esteemed Guest'}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {userProfile?.email}
                    </p>
                  </div>
                  
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        router.push('/dashboard');
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors ${pathname === '/dashboard' ? 'bg-gold/10 text-gold' : 'text-navy hover:bg-gray-50 hover:text-gold'}`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      My Expeditions
                    </button>
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        router.push('/dashboard/profile');
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors ${pathname.includes('/profile') ? 'bg-gold/10 text-gold' : 'text-navy hover:bg-gray-50 hover:text-gold'}`}
                    >
                      <User className="w-4 h-4" />
                      Member Profile
                    </button>
                  </div>

                  <div className="p-2 border-t border-gray-50">
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </nav>
  );
}