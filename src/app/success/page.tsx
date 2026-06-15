"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, ArrowRight, Ship, Loader2, Sparkles } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
        <h2 className="text-xl font-bold text-navy">Verifying your transaction...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Navbar Minimalis */}
      <nav className="bg-navy py-6 shadow-md">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-center gap-3">
          <Ship className="w-8 h-8 text-gold" />
          <span className="text-xl font-bold tracking-widest text-white uppercase">
            PMM <span className="text-gold">Voyage</span>
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white max-w-lg w-full p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 text-center relative overflow-hidden"
        >
          {/* Efek dekorasi di background */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-navy/5 rounded-full blur-3xl" />

          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10, delay: 0.2 }}
            className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10"
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
               className="absolute -top-2 -right-2"
            >
               <Sparkles className="w-6 h-6 text-gold" />
            </motion.div>
          </motion.div>
          
          <h1 className="text-3xl font-extrabold text-navy mb-3 relative z-10">Payment Successful!</h1>
          <p className="text-gray-500 mb-8 text-sm relative z-10">
            Thank you for choosing PMM Voyage. Your booking ID is <br/>
            <span className="font-mono font-bold text-navy text-base">{orderId}</span>
          </p>

          <div className="bg-navy/5 border border-gold/30 rounded-2xl p-6 mb-8 text-left relative z-10">
            <div className="flex items-start gap-4">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <Mail className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h3 className="font-bold text-navy mb-1">e-Ticket is on the way</h3>
                <p className="text-sm text-gray-600">
                  We are generating your official e-Ticket. It will be sent to <span className="font-semibold text-navy">{bookingData?.contactEmail || "your email"}</span> shortly. Please check your inbox or spam folder.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <button 
              onClick={() => router.push('/')}
              className="w-full bg-navy text-white hover:bg-[#122643] py-4 rounded-xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              Return to Homepage
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-gray-400 mt-4">
              A magic link has also been created for your email to access our Member Portal in the future.
            </p>
          </div>
        </motion.div>
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