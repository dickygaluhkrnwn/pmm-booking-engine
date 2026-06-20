"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ship, Mail, Lock, Loader2, ArrowRight, ShieldCheck, 
  Sparkles, Gift, Search, Info, User, Phone, CheckCircle2
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

type AuthMode = 'login' | 'register' | 'claim';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
    setPassword('');
  };

  // --- HANDLER 1: NORMAL LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setErrorMessage(''); setSuccessMessage('');

    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      router.push('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setErrorMessage('Invalid email or password. Please try again.');
      } else {
        setErrorMessage('An error occurred during login.');
      }
      setIsLoading(false);
    }
  };

  // --- HANDLER 2: REGISTER VIA BACKEND API ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return setErrorMessage("Password must be at least 6 characters.");
    setIsLoading(true); setErrorMessage(''); setSuccessMessage('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, fullName, phone })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setSuccessMessage("Account created! Logging you in...");
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      router.push('/dashboard');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create account.');
      setIsLoading(false);
    }
  };

  // --- HANDLER 3: CLAIM ACCOUNT VIA BACKEND API ---
  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return setErrorMessage("Password must be at least 6 characters.");
    setIsLoading(true); setErrorMessage(''); setSuccessMessage('');

    try {
      const response = await fetch('/api/auth/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setSuccessMessage("Account and points successfully claimed! Logging you in...");
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      router.push('/dashboard');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to claim account.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans selection:bg-gold selection:text-navy">
      <nav className="bg-navy py-6 shadow-md border-b border-white/5 relative z-20">
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex items-center justify-between w-full">
          <div onClick={() => router.push('/')} className="flex items-center gap-3 cursor-pointer group">
            <Ship className="w-8 h-8 text-gold group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold tracking-widest text-white uppercase hidden sm:block">PMM <span className="text-gold">Reserve</span></span>
          </div>
          <button onClick={() => router.push('/')} className="text-sm font-bold text-gray-300 hover:text-white transition-colors flex items-center gap-2">
            Back to Home
          </button>
        </div>
      </nav>

      <main className="flex-1 flex w-full h-full relative">
        {/* KOLOM KIRI (Visual Desktop) */}
        <div className="hidden lg:flex w-1/2 bg-navy relative items-center justify-center overflow-hidden flex-col p-12 text-center">
          <div className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-overlay" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?q=80&w=2000&auto=format&fit=crop")' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent z-10" />
          <div className="relative z-20 max-w-lg">
            <div className="w-20 h-20 bg-gold/10 rounded-full border border-gold/30 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(212,175,55,0.2)]">
              <Sparkles className="w-10 h-10 text-gold" />
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight">Unlock Your <br/> <span className="text-gold">VVIP Privileges</span></h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-10">Manage your expeditions, access priority boarding passes, and redeem your Gold Points for exclusive cabin upgrades.</p>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm">
                <Gift className="w-6 h-6 text-gold mb-3" />
                <h3 className="font-bold text-white mb-1">Earn Points</h3>
                <p className="text-xs text-gray-400">Collect points on every voyage.</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm">
                <ShieldCheck className="w-6 h-6 text-gold mb-3" />
                <h3 className="font-bold text-white mb-1">Priority Support</h3>
                <p className="text-xs text-gray-400">24/7 dedicated concierge.</p>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (Form Area) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto no-scrollbar py-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-[80px] lg:hidden" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-navy/5 rounded-full blur-[60px] lg:hidden" />
          
          <div className="w-full max-w-md relative z-10 my-auto">
            <AnimatePresence mode="wait">
              
              {/* ===================== MODE LOGIN ===================== */}
              {mode === 'login' && (
                <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgb(0,0,0,0.06)] border border-gray-100">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-navy mb-2">Member Portal</h1>
                    <p className="text-sm text-gray-500">Sign in securely to access your vault.</p>
                  </div>
                  {errorMessage && <div className="mb-6 text-red-500 text-xs font-bold bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-2"><ShieldCheck className="w-4 h-4 shrink-0" /> {errorMessage}</div>}

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gold transition-colors" />
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" className="w-full bg-gray-50 hover:bg-white border border-gray-200 text-navy font-bold px-4 py-3.5 pl-12 rounded-xl focus:outline-none focus:border-gold transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gold transition-colors" />
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-gray-50 hover:bg-white border border-gray-200 text-navy font-bold px-4 py-3.5 pl-12 rounded-xl focus:outline-none focus:border-gold transition-all" />
                      </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-navy text-white hover:bg-[#122643] py-4 rounded-xl font-extrabold shadow-xl shadow-navy/10 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 hover:-translate-y-1">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-gold" /> : <>Sign In Securely <ArrowRight className="w-5 h-5" /></>}
                    </button>
                  </form>

                  <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500">Don't have an account? <button onClick={() => switchMode('register')} className="text-navy font-bold hover:text-gold transition-colors ml-1">Sign Up Here</button></p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">Booked before?</p>
                    <button type="button" onClick={() => switchMode('claim')} className="w-full bg-[#fdfaf5] border border-gold/30 text-navy hover:bg-gold hover:text-white py-3.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-sm group">
                      <Search className="w-4 h-4 text-gold group-hover:text-white" /> Claim My Past Bookings
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ===================== MODE REGISTER ===================== */}
              {mode === 'register' && (
                <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgb(0,0,0,0.06)] border border-gray-100">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-navy mb-2">Join the Club</h1>
                    <p className="text-sm text-gray-500">Create your VVIP account to manage future voyages.</p>
                  </div>
                  {errorMessage && <div className="mb-6 text-red-500 text-xs font-bold bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-2"><ShieldCheck className="w-4 h-4 shrink-0" /> {errorMessage}</div>}
                  {successMessage && <div className="mb-6 text-green-700 text-sm font-bold bg-green-50 p-4 rounded-xl border border-green-200 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 shrink-0 text-green-500" /> {successMessage}</div>}

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gold transition-colors" />
                        <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="w-full bg-gray-50 hover:bg-white border border-gray-200 text-navy font-bold px-4 py-3.5 pl-12 rounded-xl focus:outline-none focus:border-gold transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Phone</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gold transition-colors" />
                        <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+62 812..." className="w-full bg-gray-50 hover:bg-white border border-gray-200 text-navy font-bold px-4 py-3.5 pl-12 rounded-xl focus:outline-none focus:border-gold transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gold transition-colors" />
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" className="w-full bg-gray-50 hover:bg-white border border-gray-200 text-navy font-bold px-4 py-3.5 pl-12 rounded-xl focus:outline-none focus:border-gold transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Create Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gold transition-colors" />
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" className="w-full bg-gray-50 hover:bg-white border border-gray-200 text-navy font-bold px-4 py-3.5 pl-12 rounded-xl focus:outline-none focus:border-gold transition-all" />
                      </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-navy text-white hover:bg-[#122643] py-4 rounded-2xl font-extrabold shadow-xl shadow-navy/10 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 hover:-translate-y-1">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-gold" /> : <>Create VVIP Account <ArrowRight className="w-5 h-5" /></>}
                    </button>
                  </form>
                  <div className="mt-8 text-center pt-6 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Already have an account? <button onClick={() => switchMode('login')} className="text-navy font-bold hover:text-gold transition-colors ml-1">Sign In</button></p>
                  </div>
                </motion.div>
              )}

              {/* ===================== MODE CLAIM ===================== */}
              {mode === 'claim' && (
                <motion.div key="claim" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgb(0,0,0,0.06)] border border-gray-100 border-t-4 border-t-gold">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4"><Gift className="w-6 h-6 text-gold" /></div>
                    <h1 className="text-2xl font-extrabold text-navy mb-2">Claim Past Bookings</h1>
                    <p className="text-sm text-gray-500 leading-relaxed">Enter the email used on your previous ticket to unlock your points.</p>
                  </div>
                  {errorMessage && <div className="mb-6 text-red-500 text-xs font-bold bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-2"><ShieldCheck className="w-4 h-4 shrink-0" /> {errorMessage}</div>}
                  {successMessage && <div className="mb-6 text-green-700 text-sm font-bold bg-green-50 p-4 rounded-xl border border-green-200 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 shrink-0 text-green-500" /> {successMessage}</div>}

                  <form onSubmit={handleClaim} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Booking Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gold transition-colors" />
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email used for purchase" className="w-full bg-gray-50 hover:bg-white border border-gray-200 text-navy font-bold px-4 py-3.5 pl-12 rounded-xl focus:outline-none focus:border-gold transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Set New Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gold transition-colors" />
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" className="w-full bg-gray-50 hover:bg-white border border-gray-200 text-navy font-bold px-4 py-3.5 pl-12 rounded-xl focus:outline-none focus:border-gold transition-all" />
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100 flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-500 shrink-0" />
                      <p className="text-[10px] text-blue-700 font-medium leading-relaxed">If past records match this email, we will sync all data to your new VVIP profile.</p>
                    </div>
                    <button type="submit" disabled={isLoading || !password || !email} className="w-full bg-gold text-navy hover:bg-[#b8972e] py-4 rounded-2xl font-extrabold shadow-xl shadow-gold/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 hover:-translate-y-1">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Claim Account & Points <ArrowRight className="w-5 h-5" /></>}
                    </button>
                  </form>
                  <div className="mt-6 text-center">
                    <button type="button" onClick={() => switchMode('login')} className="text-xs font-bold text-gray-400 hover:text-navy transition-colors underline underline-offset-4">
                      Wait, I already have a password. Take me back.
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </main>
    </div>
  );
}