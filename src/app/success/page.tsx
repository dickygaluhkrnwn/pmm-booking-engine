"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, ArrowRight, Ship, Loader2, Sparkles, Gift, Lock, ShieldCheck, UserCheck } from 'lucide-react';
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
        console.error("Error fetching booking:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBooking();
  }, [orderId]);

  const handleClaimAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    setIsClaiming(true);
    setErrorMessage('');

    try {
      // TODO: Kita akan membuat API ini di langkah selanjutnya
      const response = await fetch('/api/auth/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          email: bookingData.contactEmail,
          password: password,
          userId: bookingData.userId // ID Shadow Account
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to claim account');
      }

      setClaimStatus('success');
    } catch (error: any) {
      setErrorMessage(error.message);
      setClaimStatus('error');
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
        <h2 className="text-xl font-bold text-navy">Finalizing your journey...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Navbar Minimalis */}
      <nav className="bg-navy py-6 shadow-md">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
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

      {/* Main Content (Grid 2 Kolom di Desktop) */}
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* KOLOM KIRI: Notifikasi Sukses & Tiket */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold/5 rounded-full blur-3xl" />
            
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6 relative z-10">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute -top-1 -right-1">
                 <Sparkles className="w-5 h-5 text-gold" />
              </motion.div>
            </div>
            
            <h1 className="text-3xl font-extrabold text-navy mb-2 relative z-10">Payment Successful!</h1>
            <p className="text-gray-500 mb-8 text-sm relative z-10">
              Booking ID: <span className="font-mono font-bold text-navy">{orderId}</span>
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-6 text-left relative z-10">
              <div className="flex items-start gap-4">
                <div className="bg-white p-2.5 rounded-full shadow-sm">
                  <Mail className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-navy text-sm mb-1">e-Ticket Sent</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    We've sent your official boarding pass to <span className="font-semibold text-navy">{bookingData?.contactEmail}</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4" />
              Secure transaction verified by Midtrans
            </div>
          </motion.div>

          {/* KOLOM KANAN: Claim Account & Rewards (Marketing Hook) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="bg-navy p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden text-white"
          >
            {/* Efek Kilauan Premium */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            {claimStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center text-center h-full py-8 relative z-10">
                <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mb-6">
                  <UserCheck className="w-10 h-10 text-gold" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Welcome to the Club!</h2>
                <p className="text-gray-300 text-sm mb-8">
                  Your PMM Reserve account is now active. You can log in anytime to manage your bookings and redeem your points.
                </p>
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-gold text-navy hover:bg-[#b8972e] py-4 rounded-xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-gold/20 text-gold px-3 py-1.5 rounded-full text-xs font-bold mb-6">
                  <Gift className="w-4 h-4" />
                  You earned {bookingData?.pointsEarned || 0} Gold Points!
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-3">Claim Your Rewards</h2>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                  We've saved your points in a guest profile. Create a password now to activate your <b>PMM Reserve Member Account</b> and use your points for future trips!
                </p>

                <form onSubmit={handleClaimAccount} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      value={bookingData?.contactEmail || ''} 
                      disabled
                      className="w-full bg-white/5 border border-white/10 text-gray-300 px-4 py-3 rounded-xl focus:outline-none cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Set Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="password" 
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 pl-12 rounded-xl focus:outline-none focus:border-gold transition-colors placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                      {errorMessage}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isClaiming}
                    className="w-full bg-gold text-navy hover:bg-[#b8972e] py-4 rounded-xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
                  >
                    {isClaiming ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Activate Account
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
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