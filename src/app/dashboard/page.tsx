"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Calendar, MapPin, Users, Ticket, 
  ChevronRight, Loader2, Clock, ChevronDown, User,
  Compass, Shield, Plus
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import Image from 'next/image';

interface Booking {
  id: string;
  dateOfDeparture: string;
  cabinClass: string;
  paxCount: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  passengersManifest: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [greeting, setGreeting] = useState("");
  
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Menentukan ucapan sapaan berdasarkan jam
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data());
        } else {
          setUserProfile({ email: user.email, pointsBalance: 0 });
        }

        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where('userId', '==', user.uid));
        
        const querySnapshot = await getDocs(q);
        const fetchedBookings: Booking[] = [];
        querySnapshot.forEach((doc) => {
          fetchedBookings.push({ id: doc.id, ...doc.data() } as Booking);
        });

        fetchedBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBookings(fetchedBookings);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    });
  };

  const isUpcoming = (dateString: string, status: string) => {
    return status === 'PAID' && new Date(dateString) > new Date();
  };

  const toggleExpand = (id: string) => {
    setExpandedBookingId(expandedBookingId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin mb-4" />
        <h2 className="text-lg font-bold text-navy animate-pulse">Loading your vault...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      <DashboardHeader />

      {/* Ditambahkan pt-28 (padding top) agar tidak tertutup header yang fixed */}
      <main className="max-w-6xl mx-auto px-4 pt-28 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: Profil & Poin (Sticky di desktop) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28 h-max">
          
          {/* Kartu Member Premium */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-navy rounded-3xl p-8 shadow-2xl relative overflow-hidden text-white border border-navy/20"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <p className="text-gold text-xs font-bold tracking-widest uppercase mb-6 flex items-center gap-2">
                <Shield className="w-4 h-4" /> PMM Reserve Member
              </p>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-[#b8972e] p-[2px] shadow-lg">
                  <div className="w-full h-full rounded-full bg-navy flex items-center justify-center overflow-hidden">
                    {userProfile?.photoUrl ? (
                      <Image 
                        src={userProfile.photoUrl} 
                        alt="Avatar" 
                        width={64} 
                        height={64} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-gold">
                        {userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : <User className="w-6 h-6 text-gold" />}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">{greeting},</p>
                  <h2 className="text-xl font-bold text-white truncate max-w-[180px]">
                    {userProfile?.fullName?.split(' ')[0] || auth.currentUser?.email?.split('@')[0]}
                  </h2>
                </div>
              </div>

              <div className="bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-gold">
                    <Award className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase tracking-wider">Gold Points</span>
                  </div>
                </div>
                <div className="text-4xl font-extrabold text-white tracking-tight">
                  {userProfile?.pointsBalance || 0}
                </div>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Use points to unlock rewards, merchandise, and exclusive cabin upgrades.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Quick Links Modern */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <h3 className="font-extrabold text-navy mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => router.push('/dashboard/profile')}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all text-sm font-bold text-navy border border-transparent hover:border-gray-100 group"
                >
                  <span className="flex items-center gap-3">
                    <div className="bg-navy/5 p-2 rounded-xl group-hover:bg-gold/10 transition-colors"><User className="w-4 h-4 text-navy group-hover:text-gold" /></div>
                    Member Identity Card
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </button>
              </li>
              <li>
                <button 
                  onClick={() => router.push('/rewards')}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all text-sm font-bold text-navy border border-transparent hover:border-gray-100 group"
                >
                  <span className="flex items-center gap-3">
                    <div className="bg-navy/5 p-2 rounded-xl group-hover:bg-gold/10 transition-colors"><Award className="w-4 h-4 text-navy group-hover:text-gold" /></div>
                    Rewards Catalog
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </button>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* KOLOM KANAN: Daftar Pesanan */}
        <div className="lg:col-span-8">
          
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
          >
            <div>
              <h2 className="text-3xl font-extrabold text-navy">My Expeditions</h2>
              <p className="text-gray-500 text-sm mt-1">Manage your voyages and passenger manifests.</p>
            </div>
            
            {/* Tombol Book New Voyage - CTA Utama */}
            <button 
              onClick={() => router.push('/')}
              className="hidden sm:flex items-center gap-2 bg-gold hover:bg-[#b8972e] text-navy px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-gold/20 transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              New Voyage
            </button>
          </motion.div>

          {bookings.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              <div className="w-24 h-24 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Compass className="w-10 h-10 text-gold" />
              </div>
              <h3 className="text-2xl font-extrabold text-navy mb-2">No Expeditions Yet</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">Your vault is currently empty. Ready to explore the magnificent islands of Komodo?</p>
              <button 
                onClick={() => router.push('/')}
                className="bg-navy text-white px-8 py-4 rounded-xl font-bold hover:bg-[#122643] transition-all shadow-xl shadow-navy/20 hover:-translate-y-1"
              >
                Discover Voyages
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking, index) => {
                const upcoming = isUpcoming(booking.dateOfDeparture, booking.status);
                
                return (
                  <motion.div 
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col relative group transition-all hover:shadow-lg ${upcoming ? 'border-2 border-gold/30' : 'border border-gray-100'}`}
                  >
                    {/* Badge Khusus untuk Perjalanan Mendatang */}
                    {upcoming && (
                      <div className="absolute top-0 right-0 bg-gold text-navy text-[10px] font-extrabold px-4 py-1.5 rounded-bl-2xl z-20 uppercase tracking-widest shadow-sm">
                        Upcoming Voyage
                      </div>
                    )}

                    {/* Bagian Atas: Info Tiket Utama */}
                    <div className="flex flex-col md:flex-row relative z-10 bg-white">
                      
                      {/* Ornamen Tiket Sobek Premium */}
                      <div className="hidden md:block absolute left-[30%] top-0 bottom-0 w-px border-l-[1.5px] border-dashed border-gray-200" />
                      <div className="hidden md:block absolute left-[30%] -top-3 w-6 h-6 bg-[#F8F9FA] rounded-full -translate-x-1/2 shadow-inner" />
                      <div className="hidden md:block absolute left-[30%] -bottom-3 w-6 h-6 bg-[#F8F9FA] rounded-full -translate-x-1/2 shadow-inner" />

                      {/* Status Tiket (Kiri) */}
                      <div className={`p-6 md:w-[30%] flex flex-col justify-center items-center text-center ${upcoming ? 'bg-gold/5' : 'bg-navy/5'}`}>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-4 shadow-sm ${
                          booking.status === 'PAID' ? 'bg-green-100 text-green-700 border border-green-200' : 
                          booking.status === 'FAILED' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}>
                          {booking.status}
                        </span>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Booking Ref</p>
                        <p className="font-mono text-sm font-extrabold text-navy truncate w-full px-2">{booking.id}</p>
                      </div>

                      {/* Detail Perjalanan (Kanan) */}
                      <div className="p-6 md:p-8 md:w-[70%] flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-6">
                            <div>
                              <div className="flex items-center gap-3 text-navy font-extrabold text-xl mb-2">
                                Lombok <MapPin className="w-5 h-5 text-gold" /> Komodo
                              </div>
                              <div className="flex items-center gap-2 text-gray-500 text-sm font-semibold bg-gray-50 px-3 py-1.5 rounded-lg w-max">
                                <Calendar className="w-4 h-4 text-navy" />
                                {formatDate(booking.dateOfDeparture)}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Cabin Class</p>
                              <p className="text-navy font-extrabold text-lg">{booking.cabinClass}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                            <div className="flex items-center gap-2">
                              <div className="bg-gray-50 p-1.5 rounded-lg"><Users className="w-4 h-4 text-navy" /></div>
                              <span className="font-semibold">{booking.paxCount} Guest{booking.paxCount > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="bg-gray-50 p-1.5 rounded-lg"><Clock className="w-4 h-4 text-navy" /></div>
                              <span className="font-semibold">3 Days 2 Nights</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Area & Toggle Penumpang */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-5 border-t border-gray-100 gap-4">
                          <button 
                            onClick={() => toggleExpand(booking.id)}
                            className="flex items-center gap-2 text-sm font-bold text-navy hover:text-gold transition-colors w-max"
                          >
                            <User className="w-4 h-4" />
                            Passenger Manifest
                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedBookingId === booking.id ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {upcoming && (
                            <button 
                              onClick={() => router.push(`/dashboard/reschedule/${booking.id}`)}
                              className="bg-white border-2 border-gray-100 text-navy hover:border-gold hover:text-gold px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                              <Calendar className="w-4 h-4" /> Reschedule
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dropdown Data Penumpang (Accordion) */}
                    <AnimatePresence>
                      {expandedBookingId === booking.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="bg-gray-50 border-t border-gray-100 overflow-hidden"
                        >
                          <div className="p-6 md:p-8">
                            <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <Ticket className="w-3 h-3" /> Detailed Manifest
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                              {booking.passengersManifest?.map((pax, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-gold/30 transition-colors">
                                  <div className="flex items-center gap-4">
                                    <div className="bg-navy/5 p-3 rounded-xl hidden sm:block border border-navy/5">
                                      <User className="w-5 h-5 text-navy" />
                                    </div>
                                    <div>
                                      <p className="text-base font-extrabold text-navy flex items-center gap-2">
                                        {pax.fullName}
                                        {idx === 0 && <span className="bg-gold/20 text-gold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Lead</span>}
                                      </p>
                                      <p className="text-xs font-semibold text-gray-500 mt-1">
                                        {pax.nationality} • {pax.gender} • <span className="text-navy">{pax.age} Yrs</span>
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-left sm:text-right bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Passport</p>
                                    <p className="text-sm font-bold text-navy font-mono">
                                      {pax.passportNumber}
                                    </p>
                                    {pax.dietaryRequirements && pax.dietaryRequirements !== 'None' && (
                                      <p className="text-[10px] bg-red-50 text-red-600 font-extrabold uppercase px-2 py-1 rounded-md mt-2 inline-block sm:block w-max sm:ml-auto">
                                        {pax.dietaryRequirements}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
          
          {/* Tombol Book New Voyage Versi Mobile (Hanya muncul jika di layar HP dan ada tiket) */}
          {bookings.length > 0 && (
            <div className="mt-8 sm:hidden">
              <button 
                onClick={() => router.push('/')}
                className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-[#b8972e] text-navy px-5 py-4 rounded-2xl font-bold shadow-lg shadow-gold/20 transition-all"
              >
                <Plus className="w-5 h-5" />
                Book Another Voyage
              </button>
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}