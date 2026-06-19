"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, Phone, Globe, Edit3, Loader2, 
  CreditCard, Shield, Award, Utensils,
  FileText, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import Image from 'next/image';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

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
          // Jika belum ada data sama sekali
          setUserProfile({ email: user.email, pointsBalance: 0 });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin mb-4" />
        <p className="text-navy font-bold animate-pulse">Loading Member Details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      {/* Header tetap dipertahankan untuk navigasi yang konsisten */}
      <DashboardHeader />

      {/* Ditambahkan pt-28 agar konten tidak tertutup fixed header */}
      <main className="max-w-4xl mx-auto px-4 pt-28">
        
        {/* VIP MEMBER CARD BANNERS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-navy rounded-3xl p-8 shadow-2xl relative overflow-hidden text-white mb-8 border border-navy/20"
        >
          {/* Efek Kilauan Emas & Pola Geometris Mewah */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl translate-y-1/2" />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:20px_20px] mix-blend-overlay" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              
              {/* Foto Profil Avatar */}
              <div className="w-24 h-24 bg-gradient-to-br from-gold to-[#b8972e] rounded-full p-1 shadow-xl flex-shrink-0 relative">
                <div className="w-full h-full bg-navy rounded-full flex items-center justify-center border-2 border-transparent overflow-hidden">
                  {userProfile?.photoUrl ? (
                    <Image 
                      src={userProfile.photoUrl} 
                      alt="Profile" 
                      width={96} 
                      height={96} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-gold">
                      {userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : <User className="w-10 h-10 text-gold" />}
                    </span>
                  )}
                </div>
                {/* Badge Checklist Kecil di Foto */}
                <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Shield className="w-4 h-4 text-gold" />
                  <span className="text-xs font-bold tracking-widest text-gold uppercase">Verified Identity</span>
                </div>
                <h1 className="text-3xl font-extrabold text-white mb-1 truncate max-w-[250px] md:max-w-md">
                  {userProfile?.fullName || 'Esteemed Guest'}
                </h1>
                <p className="text-gray-400 text-sm font-medium">{auth.currentUser?.email}</p>
              </div>
            </div>
            
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-md min-w-[180px] text-center md:text-right shadow-inner">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center justify-center md:justify-end gap-1.5">
                <Award className="w-4 h-4 text-gold" /> Gold Points
              </p>
              <p className="text-4xl font-extrabold text-white tracking-tight">
                {userProfile?.pointsBalance || 0}
              </p>
            </div>
          </div>
        </motion.div>

        {/* PROFILE DETAILS - VIEW ONLY */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden"
        >
          {/* Watermark Logo PMM di Background */}
          <div className="absolute -right-10 -bottom-10 opacity-[0.02] pointer-events-none">
            <Shield className="w-96 h-96 text-navy" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-10 pb-6 border-b border-gray-100 gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-navy mb-2">Personal Identity</h2>
              <p className="text-gray-500 text-sm">Your information is securely stored for faster expedition bookings.</p>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: "#122643" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/dashboard/profile/edit')}
              className="flex items-center justify-center gap-2 bg-navy text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-navy/20"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </motion.button>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10">
            {/* Tampilan Data dengan Desain "Passport Card" */}
            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 hover:border-gold/30 transition-colors group">
              <label className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest block">Full Name (As in Passport)</label>
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:text-gold transition-colors"><User className="w-5 h-5 text-navy group-hover:text-gold" /></div>
                <span className={`font-bold text-lg ${userProfile?.fullName ? 'text-navy' : 'text-gray-400 italic'}`}>
                  {userProfile?.fullName || 'Not provided yet'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 hover:border-gold/30 transition-colors group">
              <label className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest block">WhatsApp Number</label>
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:text-gold transition-colors"><Phone className="w-5 h-5 text-navy group-hover:text-gold" /></div>
                <span className={`font-bold text-lg font-mono tracking-tight ${userProfile?.phone ? 'text-navy' : 'text-gray-400 italic font-sans'}`}>
                  {userProfile?.phone || 'Not provided yet'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 hover:border-gold/30 transition-colors group">
              <label className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest block">Nationality</label>
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:text-gold transition-colors"><Globe className="w-5 h-5 text-navy group-hover:text-gold" /></div>
                <span className={`font-bold text-lg ${userProfile?.nationality ? 'text-navy' : 'text-gray-400 italic'}`}>
                  {userProfile?.nationality || 'Not provided yet'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 hover:border-gold/30 transition-colors group">
              <label className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest block">Gender</label>
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:text-gold transition-colors"><User className="w-5 h-5 text-navy group-hover:text-gold" /></div>
                <span className={`font-bold text-lg ${userProfile?.gender ? 'text-navy' : 'text-gray-400 italic'}`}>
                  {userProfile?.gender || 'Not provided yet'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 hover:border-gold/30 transition-colors group">
              <label className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest block">Passport / ID Number</label>
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:text-gold transition-colors"><CreditCard className="w-5 h-5 text-navy group-hover:text-gold" /></div>
                <span className={`font-bold text-lg ${userProfile?.passportNumber ? 'text-navy uppercase tracking-widest font-mono' : 'text-gray-400 italic font-sans'}`}>
                  {userProfile?.passportNumber || 'Not provided yet'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 hover:border-gold/30 transition-colors group">
              <label className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest block">Dietary Requirements</label>
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:text-gold transition-colors"><Utensils className="w-5 h-5 text-navy group-hover:text-gold" /></div>
                <span className={`font-bold text-lg ${userProfile?.dietaryRequirements ? 'text-navy' : 'text-gray-400 italic'}`}>
                  {userProfile?.dietaryRequirements || 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* TRAVEL DOCUMENTS STATUS */}
          <div className="relative z-10 pt-8 border-t border-gray-100">
             <h3 className="text-xl font-extrabold text-navy mb-4 flex items-center gap-2">
               <FileText className="w-5 h-5 text-gold" /> Travel Documentation
             </h3>
             
             {userProfile?.passportFileUrl ? (
               <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                 <div className="flex items-center gap-4">
                   <div className="bg-green-100 p-3 rounded-full shadow-inner">
                     <CheckCircle2 className="w-7 h-7 text-green-600" />
                   </div>
                   <div>
                     <p className="font-bold text-green-900 text-lg">Passport Uploaded</p>
                     <p className="text-sm text-green-700 mt-0.5">Your document is securely stored and verified.</p>
                   </div>
                 </div>
                 <a 
                   href={userProfile.passportFileUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="bg-white border border-green-200 text-green-700 hover:bg-green-100 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors text-center shadow-sm"
                 >
                   View Document
                 </a>
               </div>
             ) : (
               <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                 <div className="flex items-center gap-4">
                   <div className="bg-red-100 p-3 rounded-full shadow-inner">
                     <AlertCircle className="w-7 h-7 text-red-600" />
                   </div>
                   <div>
                     <p className="font-bold text-red-900 text-lg">Passport Missing</p>
                     <p className="text-sm text-red-700 mt-0.5">Required for harbor clearance before departure.</p>
                   </div>
                 </div>
                 <button 
                   onClick={() => router.push('/dashboard/profile/edit')}
                   className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 w-full sm:w-auto text-center"
                 >
                   Upload Now
                 </button>
               </div>
             )}
          </div>

        </motion.div>
      </main>
    </div>
  );
}