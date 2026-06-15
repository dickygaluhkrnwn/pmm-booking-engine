"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, ArrowRight, Ship, Info, ShieldCheck, BedDouble } from 'lucide-react';
import { Button } from '@/components/ui/Button'; // Memanggil komponen yang kita buat di Fase 1

export default function Home() {
  const router = useRouter();
  
  // State untuk form pencarian
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

      // Format ISO (YYYY-MM-DD) lebih aman untuk database dan URL
      for (let i = 0; i < 4; i++) {
        const nextSat = new Date(d);
        nextSat.setDate(d.getDate() + (i * 7));
        dates.push(nextSat.toISOString().split('T')[0]); // Output: "2026-06-20"
      }
      return dates;
    };

    const dates = getNextSaturdays();
    setAvailableDates(dates);
    setSelectedDate(dates[0]);
  }, []);

  // Fungsi untuk memproses pencarian dan pindah halaman
  const handleSearch = () => {
    setIsLoading(true);
    
    // Kita lempar data pilihan user ke halaman checkout via URL Parameters
    // Contoh URL: /checkout?date=2026-06-20&cabin=Dormitory&pax=2
    const queryParams = new URLSearchParams({
      date: selectedDate,
      cabin: cabinType,
      pax: passengerCount.toString()
    });

    // Simulasi loading sejenak agar animasi terasa mewah, lalu pindah halaman
    setTimeout(() => {
      router.push(`/checkout?${queryParams.toString()}`);
    }, 800);
  };

  // Fungsi bantu untuk format tanggal di tampilan (UI)
  const formatDateUI = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans overflow-x-hidden selection:bg-gold selection:text-navy">
      
      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-navy/95 backdrop-blur-md py-4 shadow-lg' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Ship className="w-8 h-8 text-gold" />
            <span className="text-xl font-bold tracking-widest text-white uppercase">
              PMM <span className="text-gold">Voyage</span>
            </span>
          </div>
          <button className="text-sm font-semibold text-white hover:text-gold transition-colors">
            Member Portal
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="relative h-[85vh] flex flex-col justify-center items-center text-center px-4 overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transform scale-105 motion-safe:animate-pulse-slow"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1621501103258-3e0e77490076?q=80&w=2000&auto=format&fit=crop")' }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-navy/80 via-navy/50 to-navy" />
        
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
           className="relative z-10 max-w-4xl mx-auto mt-16"
        >
           <span className="text-gold font-bold tracking-[0.3em] text-sm uppercase mb-4 block">
             Luxury Liveaboard Expeditions
           </span>
           <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              Journey Beyond <br/> The Ordinary
           </h1>
        </motion.div>
      </div>

      {/* ENGINE BOOKING CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
        className="relative z-20 max-w-6xl mx-auto px-4 -mt-32 md:-mt-24 mb-24"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100">
           <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-6 h-6 text-gold" />
              <h2 className="text-2xl font-bold text-navy">Book Your Expedition</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
              {/* Rute */}
              <div className="flex flex-col">
                 <label className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Route</label>
                 <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <MapPin className="w-5 h-5 text-gold" />
                    <span className="font-semibold text-navy text-sm">Lombok ➔ Komodo</span>
                 </div>
              </div>

              {/* Tanggal */}
              <div className="flex flex-col">
                 <label className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Departure</label>
                 <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-gold transition-colors focus-within:border-gold focus-within:ring-1 focus-within:ring-gold">
                    <Calendar className="w-5 h-5 text-gold flex-shrink-0" />
                    <select 
                       value={selectedDate}
                       onChange={(e) => setSelectedDate(e.target.value)}
                       className="w-full bg-transparent outline-none font-semibold text-navy text-sm cursor-pointer appearance-none truncate"
                    >
                       {availableDates.map(date => (
                         <option key={date} value={date}>{formatDateUI(date)}</option>
                       ))}
                    </select>
                 </div>
              </div>

              {/* Tipe Kabin */}
              <div className="flex flex-col">
                 <label className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Cabin Class</label>
                 <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-gold transition-colors focus-within:border-gold focus-within:ring-1 focus-within:ring-gold">
                    <BedDouble className="w-5 h-5 text-gold flex-shrink-0" />
                    <select 
                       value={cabinType}
                       onChange={(e) => setCabinType(e.target.value)}
                       className="w-full bg-transparent outline-none font-semibold text-navy text-sm cursor-pointer appearance-none truncate"
                    >
                       <option value="Dormitory">Shared Dormitory</option>
                       <option value="Private">Private Sea View</option>
                    </select>
                 </div>
              </div>

              {/* Jumlah Penumpang */}
              <div className="flex flex-col">
                 <label className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Passengers</label>
                 <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-gold transition-colors focus-within:border-gold focus-within:ring-1 focus-within:ring-gold">
                    <Users className="w-5 h-5 text-gold flex-shrink-0" />
                    <select 
                       value={passengerCount}
                       onChange={(e) => setPassengerCount(Number(e.target.value))}
                       className="w-full bg-transparent outline-none font-semibold text-navy text-sm cursor-pointer appearance-none"
                    >
                       {[1,2,3,4,5,6,7,8].map(num => (
                         <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                       ))}
                    </select>
                 </div>
              </div>
           </div>

           {/* LOGISTIC WARNING & SUBMIT BUTTON */}
           <div className="mt-8 flex flex-col md:flex-row gap-6 items-center justify-between">
             <div className="bg-navy/5 border border-gold/40 rounded-xl p-4 flex gap-4 items-start w-full md:w-2/3">
                <Info className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" />
                <div className="text-sm text-navy">
                  Pickup covers: <span className="font-bold">Mataram, Senggigi, Kuta Mandalika, & Bangsal</span>. Bookings close Fridays at 23:59 WITA.
                  <br/><span className="text-gold font-bold">1x Free Reschedule</span> available for flight delays.
                </div>
             </div>

             <Button 
                onClick={handleSearch} 
                isLoading={isLoading}
                className="w-full md:w-auto min-w-[200px]"
             >
                Check Availability
                {!isLoading && <ArrowRight className="w-5 h-5" />}
             </Button>
           </div>
        </div>
      </motion.div>

    </div>
  );
}