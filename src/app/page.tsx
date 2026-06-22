"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Calendar, ArrowRight, Ship, ShieldCheck, 
  CheckCircle2, Sparkles, BedDouble, Minus, Plus, Loader2, 
  DoorOpen, Flame, ShoppingCart, Star, Anchor, Compass, Info
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { DashboardHeader } from '@/components/layout/DashboardHeader';

const defaultCabins = [
  { 
    name: "Private Cabin Sea View", 
    desc: "A premium cabin option with stunning ocean views right from your bed. Equipped with premium amenities.", 
    price: "4,600K", 
    features: ["Sea view window", "Private space", "Air-conditioned"], 
    image: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2069&auto=format&fit=crop", 
    popular: true 
  },
  { 
    name: "Private Cabin Standard", 
    desc: "Comfortable private room for extra privacy during the voyage. Perfectly designed for tranquility.", 
    price: "4,200K", 
    features: ["Extra privacy", "Comfortable bed", "Air-conditioned"], 
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop", 
    popular: false 
  },
  { 
    name: "Down Deck Cabin (2 Pax)", 
    desc: "Cozy lower-deck cabin designed for couples or friends traveling together across the sea.", 
    price: "3,800K", 
    features: ["Cozy and quiet", "Comfortable space", "AC Central"], 
    image: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80&w=2070&auto=format&fit=crop", 
    popular: false 
  },
  { 
    name: "Down Deck Cabin (1 Pax)", 
    desc: "Exclusive lower-deck cabin tailored for solo travelers seeking a peaceful sea voyage.", 
    price: "3,800K", 
    features: ["Solo Privacy", "Cozy and quiet", "AC Central"], 
    image: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80&w=2070&auto=format&fit=crop", 
    popular: false 
  },
  { 
    name: "Sharing Deck Upstair", 
    desc: "Spacious shared sleeping area on the upper deck with ocean breeze. Perfect to meet new explorers.", 
    price: "3,600K", 
    features: ["Budget-friendly", "Clean mattress & blanket", "Open Air"], 
    image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?q=80&w=2073&auto=format&fit=crop", 
    popular: false 
  }
];

export default function Home() {
  const router = useRouter();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  const [cabins, setCabins] = useState<any[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [verifiedReviews, setVerifiedReviews] = useState<any[]>([]);

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCabins, setSelectedCabins] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const q = query(collection(db, 'reviews'), where('status', '==', 'PUBLISHED'));
        const snap = await getDocs(q);
        const reviewsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVerifiedReviews(reviewsData.filter((r: any) => r.rating >= 4).slice(0, 8)); 
      } catch (error) {
        console.error("Error fetching reviews", error);
      }
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    setCabins(defaultCabins);
    setIsFetchingData(false);
  }, []);

  useEffect(() => {
    const getNextSaturdays = () => {
      const dates = [];
      let d = new Date();
      const currentDay = d.getDay();
      
      if (currentDay === 5 || currentDay === 6) {
         d.setDate(d.getDate() + (6 - currentDay + 7)); 
      } else {
         d.setDate(d.getDate() + (6 - currentDay));
      }

      for (let i = 0; i < 52; i++) {
        const nextSat = new Date(d);
        nextSat.setDate(d.getDate() + (i * 7));
        dates.push(nextSat.toISOString().split('T')[0]);
      }
      return dates;
    };

    const dates = getNextSaturdays();
    setAvailableDates(dates);
    setSelectedDate(dates[0]); 
  }, []);

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

  const getAvailabilityInfo = (cabinName: string) => {
    const name = cabinName.toLowerCase();
    if (name.includes("sea view")) return { text: "4 Rooms Available", isLow: false, maxPax: 8 }; 
    if (name.includes("standard")) return { text: "Only 2 Rooms Left!", isLow: true, maxPax: 4 }; 
    if (name.includes("down deck") && name.includes("2 pax")) return { text: "8 Rooms Available", isLow: false, maxPax: 16 }; 
    if (name.includes("down deck") && name.includes("1 pax")) return { text: "Only 2 Rooms Left!", isLow: true, maxPax: 2 }; 
    if (name.includes("sharing")) return { text: "22 Seats Available", isLow: false, maxPax: 22 }; 
    return { text: "Available", isLow: false, maxPax: 8 };
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans overflow-x-hidden selection:bg-gold selection:text-navy pt-24">
      
      {/* HEADER INTEGRASI */}
      {isLoggedIn ? (
        <DashboardHeader />
      ) : (
        <nav className="fixed top-0 w-full z-50 bg-navy border-b border-white/5 py-4 shadow-xl">
          <div className="max-w-7xl mx-auto px-5 md:px-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Ship className="w-6 h-6 text-gold" />
              <span className="text-base font-bold tracking-widest text-white uppercase">
                PMM <span className="text-gold">Reserve</span>
              </span>
            </div>
            <button 
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 bg-white/5 hover:bg-gold border border-white/10 hover:border-gold text-white hover:text-navy px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Member Login <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </nav>
      )}

      {/* CORE SCHEDULER & BOOKING ENGINE GRID */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 pb-24">
        
        {/* BANNER UTAMA MINIMALIS (PENGGANTI HERO JADUL) */}
        <div className="bg-navy rounded-[2rem] p-6 md:p-10 text-white relative overflow-hidden mb-8 shadow-xl border border-white/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold/20 bg-gold/10 text-gold font-bold text-[10px] uppercase tracking-wider mb-3">
                <Anchor className="w-3 h-3" /> B2C Expedition Terminal
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Lombok ➔ Komodo Fleet</h1>
              <p className="text-gray-400 text-xs md:text-sm mt-1">Configure your group layout, select dates within 1 year, and request instant clearance.</p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl shrink-0 backdrop-blur-sm">
              <Compass className="w-5 h-5 text-gold animate-spin-slow" />
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Duration</p>
                <p className="text-sm font-bold text-white">4 Days 3 Nights Voyage</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* KOLOM KIRI: STUDIOGALLERY SELEKSI KAMAR */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-navy">Available Accommodations</h2>
                <p className="text-xs text-gray-500 mt-0.5">Mix and match different cabins based on your companion architecture.</p>
              </div>
              {isFetchingData && <Loader2 className="w-5 h-5 animate-spin text-gold" />}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {cabins.map((cabin, idx) => {
                const availability = getAvailabilityInfo(cabin.name);
                const paxInCabin = selectedCabins[cabin.name] || 0;
                const isSelected = paxInCabin > 0;

                return (
                  <motion.div 
                    key={idx}
                    className={`bg-white rounded-3xl overflow-hidden border transition-all flex flex-col md:flex-row shadow-sm hover:shadow-md ${
                      isSelected ? 'border-gold ring-1 ring-gold/30' : 'border-gray-200/70'
                    }`}
                  >
                    {/* Gambar Kabin (Rasio Lebar Widescreen) */}
                    <div className="md:w-2/5 h-48 md:h-auto min-h-[180px] relative overflow-hidden shrink-0 bg-gray-100">
                      <img src={cabin.image} alt={cabin.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      {cabin.popular && (
                        <span className="absolute top-4 left-4 bg-navy text-gold text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-md border border-gold/20">
                          Most Popular
                        </span>
                      )}
                    </div>

                    {/* Deskripsi & Control Panel Kabin */}
                    <div className="p-6 flex flex-col justify-between flex-1 bg-white">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <h3 className="text-lg font-extrabold text-navy leading-tight">{cabin.name}</h3>
                          <div className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${
                            availability.isLow ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'
                          }`}>
                            {availability.text}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">{cabin.desc}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100 mt-auto">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rate per Passenger</p>
                          <p className="text-gold font-extrabold text-base">IDR {cabin.price}</p>
                        </div>

                        {/* COUNTER GUEST */}
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-1.5 rounded-xl w-max self-end sm:self-auto">
                          <button 
                            onClick={() => handleRemovePax(cabin.name)} disabled={paxInCabin === 0}
                            className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-navy border border-gray-200 disabled:opacity-30 transition-shadow hover:shadow-sm shadow-inner"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-extrabold w-6 text-center text-navy">{paxInCabin}</span>
                          <button 
                            onClick={() => handleAddPax(cabin.name, availability.maxPax)} disabled={paxInCabin >= availability.maxPax}
                            className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-navy border border-gray-200 disabled:opacity-30 transition-shadow hover:shadow-sm shadow-inner"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* KOLOM KANAN: STICKY PANEL DYNAMIC INVENTORY */}
          <div className="lg:col-span-4 relative">
            <div className="lg:sticky lg:top-28 space-y-6">
              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_20px_50px_rgb(0,0,0,0.05)] border border-gray-200/80 relative">
                
                {/* PILIH TANGGAL (1 TAHUN PENUH) */}
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gold" /> 1. Expedition Calendar
                </h3>
                <div className="relative group mb-6">
                  <select 
                    value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-navy font-bold text-sm px-4 py-4 rounded-xl focus:outline-none focus:border-gold cursor-pointer transition-colors shadow-sm appearance-none"
                  >
                    {availableDates.map(date => (
                      <option key={date} value={date}>{formatDateUI(date)}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 font-bold text-xs">▼</div>
                </div>

                {/* RINGKASAN PEMESANAN */}
                <div className="bg-navy rounded-2xl p-5 text-white shadow-inner">
                  <h4 className="text-xs font-bold text-gold mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
                    <ShoppingCart className="w-3.5 h-3.5" /> Live Manifest Manifest
                  </h4>

                  <div className="space-y-4 mb-6 min-h-[60px]">
                    <AnimatePresence mode="popLayout">
                      {Object.keys(selectedCabins).length === 0 && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-gray-400 italic text-center py-2">
                          No seats selected. Choose passengers from the list.
                        </motion.p>
                      )}

                      {Object.entries(selectedCabins).map(([cabinName, count]) => {
                        const cabinData = cabins.find(c => c.name === cabinName);
                        const price = cabinData ? parsePrice(cabinData.price) : 0;
                        return (
                          <motion.div 
                            key={cabinName} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="flex justify-between items-start border-b border-white/5 pb-2.5 last:border-0 last:pb-0 text-xs"
                          >
                            <div>
                              <p className="font-bold text-white">{count}x Guest{count > 1 ? 's' : ''}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5 max-w-[150px] truncate">{cabinName}</p>
                            </div>
                            <span className="font-bold text-gold">{(count * price).toLocaleString('id-ID')}</span>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  <div className="border-t border-dashed border-white/20 pt-4">
                    <div className="flex justify-between items-end mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>Total Amount</span>
                      <span className="bg-gold text-navy px-2 py-0.5 rounded font-extrabold">{totalPax} PAX</span>
                    </div>
                    <div className="text-2xl font-extrabold text-white tracking-tighter text-right">
                      {totalPrice.toLocaleString('id-ID')} <span className="text-xs text-gray-400 font-bold">IDR</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleProceedToCheckout} disabled={isSubmitting || totalPax === 0}
                  className="w-full bg-gold hover:bg-[#b8972e] text-navy py-4 rounded-xl font-extrabold shadow-lg shadow-gold/10 transition-all flex items-center justify-center gap-2 mt-5 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Request Clearance ({totalPax}) <ArrowRight className="w-4 h-4" /></>}
                </button>
                
                <div className="mt-4 flex items-start gap-2 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  <Info className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                    Sailing credentials and manifests are protected under strict maritime privacy encryptions.
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </main>

      {/* VERIFIED GUEST REVIEWS SECTION */}
      {verifiedReviews.length > 0 && (
        <div className="relative py-24 bg-navy overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/10 text-gold font-bold tracking-[0.2em] text-[10px] uppercase mb-4">
              <ShieldCheck className="w-4 h-4" /> Verified Explorers
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Journeys Beyond Words</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">Real logs and memories shared by our members during their liveaboard expeditions.</p>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-8 pt-4 px-4 md:px-8 snap-x snap-mandatory no-scrollbar relative z-10">
            {verifiedReviews.map((review) => (
              <div 
                key={review.id} 
                className="snap-center shrink-0 w-[300px] md:w-[380px] bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-md shadow-2xl flex flex-col hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-0.5">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                    ))}
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified Explorer
                  </div>
                </div>

                <p className="text-gray-200 leading-relaxed mb-6 flex-grow text-xs md:text-sm italic">
                  "{review.comment}"
                </p>

                {review.imageUrls && review.imageUrls.length > 0 && (
                   <div className="h-32 w-full rounded-xl overflow-hidden mb-6 border border-white/10 shadow-inner bg-gray-800">
                     <img src={review.imageUrls[0]} alt="Trip memory" className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                   </div>
                )}

                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/10">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-[#b8972e] flex items-center justify-center font-bold text-navy text-xs shadow-sm uppercase">
                    {review.userName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs">{review.userName}</p>
                    <p className="text-[10px] text-gold font-medium">Logged on Day {review.tripDay}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}