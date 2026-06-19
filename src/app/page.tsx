"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  MapPin, Calendar, Users, ArrowRight, Ship, Info, 
  ShieldCheck, BedDouble, ChevronDown, Award, Anchor, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const router = useRouter();
  
  // State untuk Auth & Form pencarian
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [cabinType, setCabinType] = useState("Dormitory");
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Efek transparan navbar saat scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mengecek status login user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Logika Bisnis: Menghitung 4 jadwal Sabtu ke depan
  useEffect(() => {
    const getNextSaturdays = () => {
      const dates = [];
      let d = new Date();
      const currentDay = d.getDay();
      
      // Jika hari ini Jumat (5) atau Sabtu (6), tutup jadwal minggu ini
      if (currentDay === 5 || currentDay === 6) {
         d.setDate(d.getDate() + (6 - currentDay + 7)); 
      } else {
         d.setDate(d.getDate() + (6 - currentDay));
      }

      for (let i = 0; i < 4; i++) {
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

  const handleSearch = () => {
    setIsLoading(true);
    const queryParams = new URLSearchParams({
      date: selectedDate,
      cabin: cabinType,
      pax: passengerCount.toString()
    });

    setTimeout(() => {
      router.push(`/checkout?${queryParams.toString()}`);
    }, 800);
  };

  const formatDateUI = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans overflow-x-hidden selection:bg-gold selection:text-navy">
      
      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-navy/95 backdrop-blur-md py-4 shadow-xl' : 'bg-gradient-to-b from-black/60 to-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Ship className="w-8 h-8 text-gold" />
            <span className="text-xl font-bold tracking-widest text-white uppercase">
              PMM <span className="text-gold">Reserve</span>
            </span>
          </div>
          <button 
            onClick={() => router.push(isLoggedIn ? '/dashboard' : '/login')}
            className="flex items-center gap-2 bg-white/10 hover:bg-gold text-white hover:text-navy px-5 py-2.5 rounded-full text-sm font-bold transition-all border border-white/20 hover:border-gold backdrop-blur-sm"
          >
            {isLoggedIn ? 'Go to Dashboard' : 'Member Login'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="relative h-[90vh] flex flex-col justify-center items-center text-center px-4 overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transform scale-105 motion-safe:animate-pulse-slow"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1621501103258-3e0e77490076?q=80&w=2000&auto=format&fit=crop")' }}
        />
        {/* Gradient Overlay Mewah */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-navy/90 via-navy/40 to-[#F8F9FA]" />
        
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
           className="relative z-10 max-w-4xl mx-auto mt-16"
        >
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/10 backdrop-blur-md text-gold font-bold tracking-[0.2em] text-xs uppercase mb-6">
             <Sparkles className="w-4 h-4" />
             Luxury Liveaboard Expeditions
           </div>
           <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-2xl">
             Journey Beyond <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-200">The Ordinary</span>
           </h1>
           <p className="text-gray-300 max-w-2xl mx-auto text-lg md:text-xl font-light">
             Secure your spot on our premium expedition from Lombok to Komodo. Experience world-class hospitality at sea.
           </p>
        </motion.div>
      </div>

      {/* ENGINE BOOKING CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
        className="relative z-20 max-w-6xl mx-auto px-4 -mt-40 mb-20"
      >
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(11,25,44,0.1)] p-2 border border-gray-100">
           
           <div className="bg-white rounded-2xl p-6 md:p-8">
             <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-7 h-7 text-gold" />
                  <h2 className="text-2xl font-bold text-navy">Book Your Expedition</h2>
                </div>
                <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live Availability
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                
                {/* Rute */}
                <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
                   <label className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest block">Route</label>
                   <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gold" />
                      <span className="font-bold text-navy text-base">Lombok ➔ Komodo</span>
                   </div>
                </div>

                {/* Tanggal */}
                <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-gray-200 hover:bg-gray-50 transition-colors group relative cursor-pointer">
                   <label className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest block">Departure</label>
                   <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
                      <select 
                         value={selectedDate}
                         onChange={(e) => setSelectedDate(e.target.value)}
                         className="w-full bg-transparent outline-none font-bold text-navy text-base cursor-pointer appearance-none truncate relative z-10"
                      >
                         {availableDates.map(date => (
                           <option key={date} value={date}>{formatDateUI(date)}</option>
                         ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4" />
                   </div>
                </div>

                {/* Tipe Kabin */}
                <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-gray-200 hover:bg-gray-50 transition-colors group relative cursor-pointer">
                   <label className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest block">Cabin Class</label>
                   <div className="flex items-center gap-3">
                      <BedDouble className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
                      <select 
                         value={cabinType}
                         onChange={(e) => setCabinType(e.target.value)}
                         className="w-full bg-transparent outline-none font-bold text-navy text-base cursor-pointer appearance-none truncate relative z-10"
                      >
                         <option value="Dormitory">Shared Dormitory</option>
                         <option value="Private">Private Sea View</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4" />
                   </div>
                </div>

                {/* Jumlah Penumpang */}
                <div className="p-4 md:p-5 hover:bg-gray-50 transition-colors group relative cursor-pointer">
                   <label className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest block">Passengers</label>
                   <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
                      <select 
                         value={passengerCount}
                         onChange={(e) => setPassengerCount(Number(e.target.value))}
                         className="w-full bg-transparent outline-none font-bold text-navy text-base cursor-pointer appearance-none relative z-10"
                      >
                         {[1,2,3,4,5,6,7,8].map(num => (
                           <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                         ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4" />
                   </div>
                </div>
             </div>

             {/* LOGISTIC WARNING & SUBMIT BUTTON */}
             <div className="mt-8 flex flex-col lg:flex-row gap-6 items-center justify-between">
               <div className="bg-navy/5 border border-navy/10 rounded-2xl p-5 flex gap-4 items-start w-full lg:w-2/3">
                  <div className="bg-white p-2 rounded-full shadow-sm flex-shrink-0">
                    <Info className="w-5 h-5 text-gold" />
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    Pickup covers: <span className="font-bold text-navy">Mataram, Senggigi, Kuta Mandalika, & Bangsal</span>. Bookings close Fridays at 23:59 WITA.
                    <span className="block mt-1"><span className="text-gold font-bold">1x Free Reschedule</span> available for flight delays or personal emergencies.</span>
                  </div>
               </div>

               <Button 
                  onClick={handleSearch} 
                  isLoading={isLoading}
                  className="w-full lg:w-auto min-w-[240px] py-4 text-lg shadow-xl shadow-navy/20"
               >
                  Search Availability
                  {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
               </Button>
             </div>
           </div>
        </div>
      </motion.div>

      {/* WHY CHOOSE US / VALUE PROPOSITION */}
      <div className="max-w-6xl mx-auto px-4 pb-24 grid grid-cols-1 md:grid-cols-3 gap-8">
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
         >
            <div className="w-14 h-14 bg-navy/5 rounded-2xl flex items-center justify-center mb-6">
               <Anchor className="w-7 h-7 text-navy" />
            </div>
            <h3 className="text-xl font-bold text-navy mb-3">Premium Fleet</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
               Sail aboard our meticulously maintained Phinisi vessels. Equipped with modern navigation and luxurious amenities.
            </p>
         </motion.div>

         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-navy p-8 rounded-3xl shadow-xl relative overflow-hidden text-white"
         >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/20 rounded-full blur-2xl" />
            <div className="w-14 h-14 bg-gold/20 rounded-2xl flex items-center justify-center mb-6 relative z-10">
               <Award className="w-7 h-7 text-gold" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 relative z-10">Member Rewards</h3>
            <p className="text-gray-300 text-sm leading-relaxed relative z-10">
               Earn <span className="text-gold font-bold">Gold Points</span> on every booking. Claim your account to redeem points for free upgrades and exclusive merchandise.
            </p>
         </motion.div>

         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
         >
            <div className="w-14 h-14 bg-navy/5 rounded-2xl flex items-center justify-center mb-6">
               <Calendar className="w-7 h-7 text-navy" />
            </div>
            <h3 className="text-xl font-bold text-navy mb-3">Flexible Booking</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
               We understand travel plans change. Manage your bookings directly from your dashboard and enjoy a hassle-free reschedule.
            </p>
         </motion.div>
      </div>

    </div>
  );
}