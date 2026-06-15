"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, Ship, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Deklarasi Window untuk Midtrans Snap
declare global {
  interface Window {
    snap: any;
  }
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [bookingData, setBookingData] = useState<any>(null);

  // Load Script Midtrans Snap
  useEffect(() => {
    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
    
    const script = document.createElement("script");
    script.src = snapScript;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch Data Booking dari Firebase
  useEffect(() => {
    async function fetchBooking() {
      if (!orderId) {
        setErrorMessage("Order ID not found.");
        setIsLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'bookings', orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBookingData(docSnap.data());
        } else {
          setErrorMessage("Booking not found.");
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
        setErrorMessage("Error loading payment data.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooking();
  }, [orderId]);

  const handlePayNow = () => {
    if (!bookingData?.snapToken) {
      setErrorMessage("Payment token is missing.");
      return;
    }

    // Memunculkan Pop-up Midtrans
    window.snap.pay(bookingData.snapToken, {
      onSuccess: function(result: any){
        console.log("Success", result);
        router.push(`/success?order_id=${orderId}`);
      },
      onPending: function(result: any){
        console.log("Pending", result);
        alert("Payment is pending. Please complete your payment.");
      },
      onError: function(result: any){
        console.log("Error", result);
        setErrorMessage("Payment failed. Please try again.");
      },
      onClose: function(){
        console.log("Closed by user");
        // User menutup popup sebelum bayar
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
        <h2 className="text-xl font-bold text-navy">Preparing secure gateway...</h2>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-xl text-red-600 font-bold">{errorMessage}</div>
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white max-w-md w-full p-8 rounded-3xl shadow-xl border border-gray-100 text-center"
        >
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-navy mb-2">Complete Your Payment</h1>
          <p className="text-gray-500 mb-8 text-sm">
            Booking ID: <span className="font-mono font-bold text-navy">{orderId}</span>
          </p>

          <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left border border-gray-100">
            <div className="flex justify-between mb-3 text-sm">
              <span className="text-gray-500">Route</span>
              <span className="font-bold text-navy">Lombok ➔ Komodo</span>
            </div>
            <div className="flex justify-between mb-3 text-sm">
              <span className="text-gray-500">Guests</span>
              <span className="font-bold text-navy">{bookingData?.paxCount} Person(s)</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200 mt-3">
              <span className="font-semibold text-navy">Total Amount</span>
              <span className="text-2xl font-bold text-gold">${bookingData?.totalAmount}</span>
            </div>
          </div>

          <button 
            onClick={handlePayNow}
            className="w-full bg-navy text-white hover:bg-[#122643] py-4 rounded-xl font-bold shadow-lg transition-colors text-lg"
          >
            Pay Now
          </button>
          
          <div className="mt-6 flex justify-center items-center gap-3 opacity-50 grayscale">
            {/* Fake logos untuk meyakinkan bule */}
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1200px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6 object-contain" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/1200px-Visa_Inc._logo.svg.png" alt="Visa" className="h-4 object-contain" />
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-navy font-bold">Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}