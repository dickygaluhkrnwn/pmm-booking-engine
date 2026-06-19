"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Calendar, MapPin, Users, Ticket, 
  ChevronRight, Loader2, Clock, ChevronDown, User
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/layout/DashboardHeader';

interface Booking {
  id: string;
  dateOfDeparture: string;
  cabinClass: string;
  paxCount: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  passengersManifest: any[]; // Tambahan untuk menyimpan data penumpang
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // State untuk melacak tiket mana yang sedang di-expand (dilihat detail penumpangnya)
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

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
        <h2 className="text-lg font-bold text-navy">Loading your vault...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: Profil & Poin */}
        <div className="md:col-span-4 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-navy rounded-3xl p-8 shadow-xl relative overflow-hidden text-white"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Member Profile</p>
              <h2 className="text-2xl font-bold text-white mb-8 truncate">
                {userProfile?.fullName || auth.currentUser?.email?.split('@')[0]}
              </h2>

              <div className="bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-gold">
                    <Award className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase tracking-wider">Gold Points</span>
                  </div>
                </div>
                <div className="text-4xl font-extrabold text-white">
                  {userProfile?.pointsBalance || 0}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Use points to unlock rewards and merchandise.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
          >
            <h3 className="font-bold text-navy mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => router.push('/dashboard/profile')}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold text-navy border border-transparent hover:border-gray-100"
                >
                  <span className="flex items-center gap-3">
                    <div className="bg-navy/5 p-2 rounded-lg"><User className="w-4 h-4 text-navy" /></div>
                    Complete My Profile
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </li>
              <li>
                <button 
                  onClick={() => router.push('/rewards')}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold text-navy border border-transparent hover:border-gray-100"
                >
                  <span className="flex items-center gap-3">
                    <div className="bg-gold/10 p-2 rounded-lg"><Award className="w-4 h-4 text-gold" /></div>
                    Rewards Catalog
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* KOLOM KANAN: Daftar Pesanan */}
        <div className="md:col-span-8">
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="flex items-center justify-between mb-6"
          >
            <h2 className="text-2xl font-extrabold text-navy">My Expeditions</h2>
            <span className="bg-navy/10 text-navy text-xs font-bold px-3 py-1 rounded-full">
              {bookings.length} Bookings
            </span>
          </motion.div>

          {bookings.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm"
            >
              <Ticket className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-navy mb-2">No Expeditions Yet</h3>
              <p className="text-gray-500 mb-6">You haven't booked any trips. Ready to explore the islands?</p>
              <button 
                onClick={() => router.push('/')}
                className="bg-navy text-white px-8 py-3 rounded-xl font-bold hover:bg-[#122643] transition-colors shadow-lg"
              >
                Find a Voyage
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking, index) => (
                <motion.div 
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col relative group"
                >
                  {/* Bagian Atas: Info Tiket Utama */}
                  <div className="flex flex-col md:flex-row relative z-10 bg-white">
                    {/* Ornamen Tiket Sobek */}
                    <div className="hidden md:block absolute left-[28%] top-0 bottom-0 w-px border-l-2 border-dashed border-gray-200" />
                    <div className="hidden md:block absolute left-[28%] -top-3 w-6 h-6 bg-[#F8F9FA] rounded-full -translate-x-1/2" />
                    <div className="hidden md:block absolute left-[28%] -bottom-3 w-6 h-6 bg-[#F8F9FA] rounded-full -translate-x-1/2" />

                    {/* Status Tiket (Kiri) */}
                    <div className="bg-navy/5 p-6 md:w-[28%] flex flex-col justify-center items-center text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-3 ${
                        booking.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                        booking.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {booking.status}
                      </span>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Booking Ref</p>
                      <p className="font-mono text-sm font-bold text-navy truncate w-full">{booking.id}</p>
                    </div>

                    {/* Detail Perjalanan (Kanan) */}
                    <div className="p-6 md:w-[72%] flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 text-navy font-bold text-lg mb-1">
                              Lombok <MapPin className="w-4 h-4 text-gold" /> Komodo
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                              <Calendar className="w-4 h-4" />
                              {formatDate(booking.dateOfDeparture)}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Cabin</p>
                            <p className="text-navy font-bold">{booking.cabinClass}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" /> {booking.paxCount} Guest{booking.paxCount > 1 ? 's' : ''}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" /> 3 Days 2 Nights
                          </div>
                        </div>
                      </div>

                      {/* Action Area & Toggle Penumpang */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <button 
                          onClick={() => toggleExpand(booking.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold transition-colors"
                        >
                          <User className="w-4 h-4" />
                          View Manifest
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedBookingId === booking.id ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isUpcoming(booking.dateOfDeparture, booking.status) && (
                          <button 
                            onClick={() => router.push(`/dashboard/reschedule/${booking.id}`)}
                            className="bg-white border border-gray-200 text-navy hover:border-gold hover:text-gold px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                          >
                            Reschedule
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
                        <div className="p-6 md:px-8">
                          <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">Passenger Manifest Details</h4>
                          <div className="space-y-3">
                            {booking.passengersManifest?.map((pax, idx) => (
                              <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="bg-navy/5 p-3 rounded-full hidden md:block">
                                    <User className="w-5 h-5 text-navy" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-navy flex items-center gap-2">
                                      {pax.fullName}
                                      {idx === 0 && <span className="bg-gold/20 text-gold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Lead</span>}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {pax.nationality} • {pax.gender} • {pax.age} Years Old
                                    </p>
                                  </div>
                                </div>
                                <div className="text-left md:text-right">
                                  <p className="text-xs font-semibold text-gray-500">
                                    Passport: <span className="text-navy">{pax.passportNumber}</span>
                                  </p>
                                  {pax.dietaryRequirements && pax.dietaryRequirements !== 'None' && (
                                    <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                                      Dietary: {pax.dietaryRequirements}
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
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}