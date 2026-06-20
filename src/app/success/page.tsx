"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, Mail, ArrowRight, Ship, Loader2, Sparkles, 
  Gift, Lock, ShieldCheck, UserCheck, Calendar, Users
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);

  // State untuk form Claim Account
  const [password, setPassword] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function fetchBooking() {
      if (!orderId) {
        setIsLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'bookings', orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBookingData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching booking on success page:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBooking();
  }, [orderId]);

  const handleClaimAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsClaiming(true);
    setErrorMessage('');

    try {
      // Mengirimkan data lengkap sesuai ekspetasi 'Trik Suntik Roh' di backend
      const response = await fetch('/api/auth/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          email: bookingData?.contactEmail,
          password: password,
          userId: bookingData?.userId // ID Shadow Account hasil checkout
        }),
      });

      const textResponse = await response.text();
      let result;

      try {
        result = JSON.parse(textResponse);
      } catch (err) {
        console.error("Gagal parse JSON respons server:", textResponse);
        throw new Error("Server response crashed. Check your server terminal configuration.");
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to claim account profile');
      }

      setClaimStatus('success');
    } catch (error: any) {
      setErrorMessage(error.message);
      setClaimStatus('error');
    } finally {
      setIsClaiming(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
        <h2 className="text-xl font-bold text-navy animate-pulse">Finalizing your journey...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans selection:bg-gold selection:text-navy">
      {/* Navbar Minimalis */}
      <nav className="bg-navy py-6 shadow-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Ship className="w-8 h-8 text-gold" />
            <span className="text-xl font-bold tracking-widest text-white uppercase hidden md:block">
              PMM <span className="text-gold">Reserve</span>
            </span>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="text-sm font-bold text-gray-300 hover:text-white transition-colors flex items-center gap-2"
          >
            Return to Homepage <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* KOLOM KIRI: Notifikasi Sukses & Tiket */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-6 bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgb(0,0,0,0.06)] border border-gray-100 relative overflow-hidden flex flex-col h-full"
          >
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-8 relative z-10 shadow-inner border border-green-100">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} className="absolute -top-2 -right-2">
                 <Sparkles className="w-6 h-6 text-gold" />
              </motion.div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-navy mb-3 relative z-10">Payment Successful!</h1>
            <p className="text-gray-500 mb-8 text-base relative z-10">
              Your expedition has been secured. Booking Reference: <br />
              <span className="font-mono font-bold text-navy text-lg bg-gray-50 px-3 py-1 rounded-lg border border-gray-200 inline-block mt-2">{orderId}</span>
            </p>

            {/* Receipt Box */}
            <div className="bg-gray-50/80 border border-gray-200/60 rounded-3xl p-6 mb-8 relative z-10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Voyage Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-navy" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-0.5">Departure Date</p>
                    <p className="font-bold text-navy">{formatDate(bookingData?.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-navy" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-0.5">Passengers</p>
                    <p className="font-bold text-navy">{bookingData?.pax} Guest(s)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 text-left relative z-10 mt-auto">
              <div className="flex items-start gap-4">
                <div className="bg-white p-2.5 rounded-full shadow-sm shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-navy text-sm mb-1">e-Ticket Sent</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    We've sent your official boarding pass and itinerary to <span className="font-bold text-navy">{bookingData?.contactEmail || "your email"}</span>.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* KOLOM KANAN: Claim Account & Rewards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="lg:col-span-6 bg-navy p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white flex flex-col justify-center border border-white/10"
          >
            <div className="absolute top-0 right-0 h-64 w-64 bg-gold/15 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            
            {claimStatus === 'success' ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center text-center relative z-10">
                <div className="w-24 h-24 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center mb-6">
                  <UserCheck className="w-12 h-12 text-gold" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-3">Welcome to the Club!</h2>
                <p className="text-gray-300 text-sm mb-10 max-w-sm leading-relaxed">
                  Your PMM Reserve VVIP account is now fully active. You can log in anytime to manage your manifest and redeem your points.
                </p>
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-gold text-navy hover:bg-[#b8972e] py-4 rounded-2xl font-bold shadow-xl shadow-gold/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  Enter My Dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            ) : (
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold px-4 py-2 rounded-full text-xs font-bold mb-8 shadow-sm">
                  <Gift className="w-4 h-4" />
                  You earned {bookingData?.pointsEarned || (bookingData?.total ? Math.floor(bookingData.total / 100000) : 0)} Gold Points!
                </div>
                
                <h2 className="text-3xl font-extrabold text-white mb-4">Claim Your Rewards</h2>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed pr-4">
                  We've temporarily saved your points. Set a password below to activate your <b>PMM Reserve Account</b> and use these points for your next luxury voyage!
                </p>

                <form onSubmit={handleClaimAccount} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Email Address</label>
                    <input 
                      type="email" 
                      value={bookingData?.contactEmail || ''} 
                      disabled
                      className="w-full bg-white/5 border border-white/10 text-gray-400 px-5 py-4 rounded-2xl focus:outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Set Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gold transition-colors" />
                      <input 
                        type="password" 
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white px-5 py-4 pl-14 rounded-2xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all placeholder:text-gray-500 font-medium"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {errorMessage && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-400 text-xs font-bold bg-red-400/10 p-4 rounded-xl border border-red-400/20 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        {errorMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button 
                    type="submit"
                    disabled={isClaiming || !password}
                    className="w-full bg-gold text-navy hover:bg-[#b8972e] py-4 rounded-2xl font-bold shadow-xl shadow-gold/10 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:hover:translate-y-0 hover:-translate-y-1"
                  >
                    {isClaiming ? (
                      <>Processing Securely <Loader2 className="w-5 h-5 animate-spin" /></>
                    ) : (
                      <>
                        Activate My Account
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center text-xs text-gray-500 mt-6">
                  Already have an account? Your booking will be synced automatically.
                </p>
              </div>
            )}
          </motion.div>

        </div>
      </main>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-navy font-bold">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}