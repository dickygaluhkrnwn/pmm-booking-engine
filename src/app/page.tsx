"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Calendar, ArrowRight, Ship, ShieldCheck, 
  CheckCircle2, Sparkles, BedDouble, Minus, Plus, Loader2, 
  DoorOpen, Flame, ShoppingCart
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// --- DATA DUMMY PRESENTASI (5 KABIN) ---
const defaultCabins = [
  { 
    name: "Private Cabin Sea View", 
    desc: "A premium cabin option with stunning ocean views right from your bed. (Max 2 Guests per room)", 
    price: "4,600K", 
    features: ["Sea view window", "Private space", "Air-conditioned"], 
    image: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2069&auto=format&fit=crop", 
    popular: true 
  },
  { 
    name: "Private Cabin Standard", 
    desc: "Comfortable private room for extra privacy during the voyage. (Max 2 Guests per room)", 
    price: "4,200K", 
    features: ["Extra privacy", "Comfortable bed", "Air-conditioned"], 
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop", 
    popular: false 
  },
  { 
    name: "Down Deck Cabin (2 Pax)", 
    desc: "Cozy lower-deck cabin designed for couples or friends. (Max 2 Guests per room)", 
    price: "3,800K", 
    features: ["Cozy and quiet", "Comfortable space", "AC Central"], 
    image: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80&w=2070&auto=format&fit=crop", 
    popular: false 
  },
  { 
    name: "Down Deck Cabin (1 Pax)", 
    desc: "Exclusive lower-deck cabin tailored for solo travelers. (Max 1 Guest per room)", 
    price: "3,800K", 
    features: ["Solo Privacy", "Cozy and quiet", "AC Central"], 
    image: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80&w=2070&auto=format&fit=crop", 
    popular: false 
  },
  { 
    name: "Sharing Deck Upstair", 
    desc: "Spacious shared sleeping area on the upper deck with ocean breeze. Allows you to meet new travelers.", 
    price: "3,600K", 
    features: ["Budget-friendly", "Clean mattress & blanket", "Open Air"], 
    image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?q=80&w=2073&auto=format&fit=crop", 
    popular: false 
  }
];

export default function Home() {
  const router = useRouter();
  
  // State Navigasi & Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // State Data
  const [cabins, setCabins] = useState<any[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(true);

  // State Formulir Pemesanan MULTI-CABIN
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  
  // Objek penyimpan pilihan tamu: { "Nama Kabin": jumlah_tamu }
  const [selectedCabins, setSelectedCabins] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  // KUNCI SEMENTARA KE DEFAULT CABINS AGAR MUNCUL 5 KARTU
  useEffect(() => {
    const fetchExpeditionSettings = async () => {
      try {
        setCabins(defaultCabins);
      } catch (error) {
        console.error("Error setting cabins:", error);
        setCabins(defaultCabins);
      } finally {
        setIsFetchingData(false);
      }
    };
    fetchExpeditionSettings();
  }, []);

  // --- PEMBARUAN: GENERATE JADWAL 1 TAHUN (52 MINGGU) KE DEPAN ---
  useEffect(() => {
    const getNextSaturdays = () => {
      const dates = [];
      let d = new Date();
      const currentDay = d.getDay();
      
      // Jika hari ini Jumat (5) atau Sabtu (6), tutup booking minggu ini, geser ke Sabtu depan
      if (currentDay === 5 || currentDay === 6) {
         d.setDate(d.getDate() + (6 - currentDay + 7)); 
      } else {
         d.setDate(d.getDate() + (6 - currentDay));
      }

      // Generate 52 jadwal (1 Tahun)
      for (let i = 0; i < 52; i++) {
        const nextSat = new Date(d);
        nextSat.setDate(d.getDate() + (i * 7));
        dates.push(nextSat.toISOString().split('T')[0]);
      }
      return dates;
    };

    const dates = getNextSaturdays();
    setAvailableDates(dates);
    setSelectedDate(dates[0]); // Auto-select jadwal terdekat
  }, []);

  // --- LOGIKA KERANJANG KABIN ---
  const handleAddPax = (cabinName: string, maxPax: number) => {
    setSelectedCabins(prev => {
      const current = prev[cabinName] || 0;
      if (current >= maxPax) return prev; 
      return { ...prev, [cabinName]: current + 1 };
    });
  };

  const handleRemovePax = (cabinName: string) => {
    setSelectedCabins(prev => {
      const current = prev[cabinName] || 0;
      if (current <= 1) {
        const newState = { ...prev };
        delete newState[cabinName]; 
        return newState;
      }
      return { ...prev, [cabinName]: current - 1 };
    });
  };

  const parsePrice = (priceStr: string) => {
    if (!priceStr) return 0;
    const numStr = priceStr.replace(/,/g, '').replace('K', '000').replace(/[^0-9]/g, '');
    return parseInt(numStr) || 0;
  };

  const totalPax = Object.values(selectedCabins).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(selectedCabins).reduce((total, [cabinName, count]) => {
    const cabinData = cabins.find(c => c.name === cabinName);
    const price = cabinData ? parsePrice(cabinData.price) : 0;
    return total + (price * count);
  }, 0);

  const handleProceedToCheckout = () => {
    setIsSubmitting(true);
    const cartString = encodeURIComponent(JSON.stringify(selectedCabins));
    const queryParams = new URLSearchParams({
      date: selectedDate,
      cart: cartString, 
      pax: totalPax.toString()
    });

    setTimeout(() => {
      router.push(`/checkout?${queryParams.toString()}`);
    }, 600);
  };

  const formatDateUI = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' 
    });
  };

  // --- LOGIKA AVAILABILITY CERDAS ---
  const getAvailabilityInfo = (cabinName: string) => {
    const name = cabinName.toLowerCase();
    // Private Sea View: 4 kamar * 2 org = 8
    if (name.includes("sea view")) return { text: "4 Rooms • 8 Seats Available", isLow: false, maxPax: 8 }; 
    // Private Standard: 2 kamar * 2 org = 4
    if (name.includes("standard")) return { text: "Only 2 Rooms • 4 Seats Left!", isLow: true, maxPax: 4 }; 
    // Down Deck 2 Pax: 8 kamar * 2 org = 16
    if (name.includes("down deck") && name.includes("2 pax")) return { text: "8 Rooms • 16 Seats Available", isLow: false, maxPax: 16 }; 
    // Down Deck 1 Pax: 2 kamar * 1 org = 2
    if (name.includes("down deck") && name.includes("1 pax")) return { text: "Only 2 Rooms • 2 Seats Left!", isLow: true, maxPax: 2 }; 
    // Sharing: 22 org (Hanya kursi)
    if (name.includes("sharing")) return { text: "22 Seats Available", isLow: false, maxPax: 22 }; 
    
    return { text: "Available", isLow: false, maxPax: 8 };
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans overflow-x-hidden selection:bg-gold selection:text-navy">
      
      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-navy/95 backdrop-blur-md py-3 md:py-4 shadow-xl' : 'bg-gradient-to-b from-navy/80 to-transparent py-5 md:py-6'}`}>
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Ship className="w-7 h-7 md:w-8 md:h-8 text-gold" />
            <span className="text-lg md:text-xl font-bold tracking-widest text-white uppercase">
              PMM <span className="text-gold">Reserve</span>
            </span>
          </div>
          <button 
            onClick={() => router.push(isLoggedIn ? '/dashboard' : '/login')}
            className="flex items-center gap-2 bg-white/10 hover:bg-gold text-white hover:text-navy px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all border border-white/20 hover:border-gold backdrop-blur-sm shadow-lg"
          >
            {isLoggedIn ? 'Go to Dashboard' : 'Member Login'}
            <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      </nav>

      {/* HERO SECTION: PARALLAX */}
      <div className="relative h-[80vh] flex flex-col justify-center items-center text-center px-4 overflow-hidden bg-navy">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-fixed transform scale-105"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1621501103258-3e0e77490076?q=80&w=2000&auto=format&fit=crop")' }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-navy/80 via-navy/50 to-transparent" />
        
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
           className="relative z-10 max-w-4xl mx-auto -mt-10"
        >
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/20 backdrop-blur-md text-gold font-bold tracking-[0.2em] text-[10px] md:text-xs uppercase mb-6 shadow-2xl">
             <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
             Lombok to Komodo Expedition
           </div>
           <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-6 leading-[1.1] drop-shadow-2xl">
             Secure Your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-200">Voyage</span>
           </h1>
           <p className="text-gray-200 max-w-2xl mx-auto text-base md:text-xl font-light leading-relaxed hidden md:block drop-shadow-lg">
             Mix and match your preferred cabins, choose your departure date, and prepare for an unforgettable journey across the Indonesian archipelago.
           </p>
        </motion.div>
      </div>

      {/* THE SLIDING SHEET */}
      <div className="relative z-20 bg-[#F8F9FA] rounded-t-[2.5rem] md:rounded-t-[3.5rem] -mt-16 pt-16 md:pt-24 pb-24 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
            
            {/* LEFT COLUMN: CABIN SELECTION */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 text-gold font-bold text-xs tracking-widest uppercase mb-1">
                      <BedDouble className="w-4 h-4" /> Step 2
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-navy">Choose Your Accommodations</h2>
                    <p className="text-gray-500 text-sm mt-1">You can select multiple cabin types for your group.</p>
                  </div>
                  {isFetchingData && <span className="text-xs font-bold text-gray-400 animate-pulse flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin"/> Validating Quota...</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  {cabins.map((cabin, idx) => {
                    const availability = getAvailabilityInfo(cabin.name);
                    const paxInCabin = selectedCabins[cabin.name] || 0;
                    const isSelected = paxInCabin > 0;

                    return (
                      <motion.div 
                        key={idx}
                        className={`relative rounded-2xl overflow-hidden transition-all duration-300 border-2 flex flex-col ${
                          isSelected 
                            ? 'border-gold shadow-lg shadow-gold/20' 
                            : 'border-gray-100 hover:border-gray-300 shadow-sm'
                        }`}
                      >
                        {/* Popular Badge */}
                        {cabin.popular && (
                          <div className="absolute top-3 left-3 z-20 bg-navy text-gold text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                            Most Popular
                          </div>
                        )}

                        <div className="h-40 md:h-48 overflow-hidden relative shrink-0">
                          <img 
                            src={cabin.image} 
                            alt={cabin.name} 
                            className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105" 
                          />
                          <div className={`absolute inset-0 transition-colors duration-300 ${isSelected ? 'bg-navy/10' : 'bg-navy/40 group-hover:bg-navy/20'}`} />
                        </div>
                        
                        <div className={`p-5 flex flex-col flex-grow transition-colors duration-300 ${isSelected ? 'bg-[#fdfbf7]' : 'bg-white'}`}>
                          
                          {/* AVAILABILITY BADGE W/ ROOMS & SEATS */}
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest mb-3 border w-max ${
                            availability.isLow 
                              ? 'bg-red-50 text-red-600 border-red-100 shadow-sm shadow-red-100' 
                              : 'bg-green-50 text-green-700 border-green-100'
                          }`}>
                            {availability.isLow ? <Flame className="w-3.5 h-3.5" /> : <DoorOpen className="w-3.5 h-3.5" />}
                            {availability.text}
                          </div>

                          <h3 className="text-lg font-extrabold text-navy leading-tight mb-1">{cabin.name}</h3>
                          <p className="text-gold font-bold text-sm mb-3">IDR {cabin.price} <span className="text-gray-400 font-medium text-xs">/pax</span></p>
                          
                          <p className="text-xs text-gray-500 mb-4 leading-relaxed min-h-[3rem]">
                            {cabin.desc}
                          </p>

                          <div className="mt-auto pt-4 border-t border-gray-200/60">
                            {/* INLINE GUEST COUNTER */}
                            <div className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${isSelected ? 'bg-white border-gold/40 shadow-inner' : 'bg-gray-50 border-gray-200'}`}>
                              <span className={`text-[10px] font-bold uppercase tracking-widest ml-1 md:ml-2 ${isSelected ? 'text-navy' : 'text-gray-400'}`}>
                                Add Guests
                              </span>
                              <div className="flex items-center gap-2 md:gap-3">
                                <button 
                                  onClick={() => handleRemovePax(cabin.name)}
                                  className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-navy hover:text-gold hover:shadow-md transition-all border border-gray-100 disabled:opacity-40"
                                  disabled={paxInCabin === 0}
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className={`text-base font-extrabold w-4 text-center ${isSelected ? 'text-navy' : 'text-gray-400'}`}>
                                  {paxInCabin}
                                </span>
                                <button 
                                  onClick={() => handleAddPax(cabin.name, availability.maxPax)}
                                  className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-navy hover:text-gold hover:shadow-md transition-all border border-gray-100 disabled:opacity-40"
                                  disabled={paxInCabin >= availability.maxPax}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            {/* INDIKATOR BATAS KAMAR */}
                            {paxInCabin >= availability.maxPax && (
                              <p className="text-[9px] text-red-500 font-bold text-right mt-2 uppercase tracking-widest">
                                Limit Reached
                              </p>
                            )}
                          </div>

                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: STICKY DYNAMIC RECEIPT WIDGET */}
            <div className="lg:col-span-4 relative">
              <div className="sticky top-28 space-y-6">
                
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgb(0,0,0,0.08)] border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gold via-yellow-200 to-gold" />
                  
                  {/* STEP 1: DATE */}
                  <div className="flex items-center gap-2 text-gold font-bold text-xs tracking-widest uppercase mb-1">
                    <MapPin className="w-4 h-4" /> Step 1
                  </div>
                  <h2 className="text-2xl font-extrabold text-navy mb-6">Select Date</h2>

                  <div className="mb-8">
                    <div className="relative group cursor-pointer">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Calendar className="w-5 h-5 text-navy group-hover:text-gold transition-colors" />
                      </div>
                      <select 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-gray-50 hover:bg-white border border-gray-200 hover:border-gold text-navy font-bold text-sm px-4 py-4 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold/30 appearance-none transition-all shadow-sm cursor-pointer"
                      >
                        {availableDates.map(date => (
                          <option key={date} value={date}>{formatDateUI(date)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* DYNAMIC CART SUMMARY */}
                  <div className="bg-navy rounded-2xl p-6 text-white shadow-inner">
                    <h3 className="text-sm font-bold text-gold mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                      <ShoppingCart className="w-4 h-4" /> Booking Summary
                    </h3>

                    <div className="space-y-4 mb-6 min-h-[80px]">
                      <AnimatePresence mode="popLayout">
                        {Object.keys(selectedCabins).length === 0 && (
                          <motion.p 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="text-xs text-gray-400 italic text-center py-4"
                          >
                            Please select guests from the cabins on the left to see your summary.
                          </motion.p>
                        )}

                        {Object.entries(selectedCabins).map(([cabinName, count]) => {
                          const cabinData = cabins.find(c => c.name === cabinName);
                          const price = cabinData ? parsePrice(cabinData.price) : 0;
                          const subtotal = count * price;

                          return (
                            <motion.div 
                              key={cabinName}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="flex justify-between items-start border-b border-white/5 pb-3 last:border-0 last:pb-0"
                            >
                              <div className="pr-2">
                                <p className="text-sm font-bold text-white">{count}x Guest{count > 1 ? 's' : ''}</p>
                                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{cabinName}</p>
                              </div>
                              <div className="text-sm font-bold text-gold shrink-0">
                                {subtotal.toLocaleString('id-ID')}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>

                    <div className="border-t-2 border-dashed border-white/20 pt-4">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Price (IDR)</span>
                        <span className="text-xs font-bold text-navy bg-gold px-2 py-0.5 rounded-md">
                          {totalPax} PAX
                        </span>
                      </div>
                      <div className="text-3xl font-extrabold text-white tracking-tighter text-right mt-1">
                        {totalPrice.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button 
                      onClick={handleProceedToCheckout}
                      disabled={isSubmitting || totalPax === 0}
                      className="w-full bg-gold hover:bg-[#b8972e] text-navy py-4 rounded-2xl font-extrabold shadow-xl shadow-gold/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin text-navy" />
                      ) : (
                        <>Checkout {totalPax > 0 ? `(${totalPax})` : ''} <ArrowRight className="w-5 h-5" /></>
                      )}
                    </button>
                  </div>
                  
                  <div className="mt-5 flex items-start gap-3 bg-navy/5 p-4 rounded-xl border border-navy/5">
                    <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                    <p className="text-[10px] text-gray-600 leading-relaxed font-medium">
                      Payments are securely processed by Midtrans. Earn Gold Points upon successful booking!
                    </p>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}