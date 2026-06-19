"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Ship, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Jika berhasil login, langsung arahkan ke Dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      // Tangani pesan error bawaan Firebase agar lebih ramah dibaca
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setErrorMessage('Invalid email or password. Please try again.');
      } else {
        setErrorMessage('An error occurred during login. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Navbar Minimalis */}
      <nav className="bg-navy py-6 shadow-md">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between w-full">
          <div 
            onClick={() => router.push('/')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <Ship className="w-8 h-8 text-gold" />
            <span className="text-xl font-bold tracking-widest text-white uppercase">
              PMM <span className="text-gold">Reserve</span>
            </span>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            Back to Home
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white max-w-md w-full p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden"
        >
          {/* Efek dekorasi */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold/5 rounded-full blur-3xl" />
          
          <div className="text-center mb-8 relative z-10">
            <h1 className="text-3xl font-extrabold text-navy mb-2">Member Login</h1>
            <p className="text-sm text-gray-500">
              Welcome back to PMM Reserve. Enter your credentials to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-gray-50 border border-gray-200 text-navy px-4 py-3 pl-12 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-gray-50 border border-gray-200 text-navy px-4 py-3 pl-12 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                {errorMessage}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-navy text-white hover:bg-[#122643] py-4 rounded-xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gold" />
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

        </motion.div>
      </main>
    </div>
  );
}
