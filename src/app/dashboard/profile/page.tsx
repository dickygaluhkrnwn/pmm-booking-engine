"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, Globe, Edit3, CheckCircle, Loader2, 
  CreditCard, Shield, Award, Utensils, X
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/layout/DashboardHeader';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);

  // State untuk form
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    nationality: '',
    passportNumber: '',
    dietaryRequirements: 'None',
    gender: 'Male',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.uid);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setUserProfile(data); // Simpan semua data untuk keperluan UI (seperti poin)
          setFormData({
            fullName: data.fullName || '',
            phone: data.phone || '',
            nationality: data.nationality || '',
            passportNumber: data.passportNumber || '',
            dietaryRequirements: data.dietaryRequirements || 'None',
            gender: data.gender || 'Male',
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, formData);
      
      // Update state lokal agar UI langsung berubah tanpa refresh
      setUserProfile((prev: any) => ({ ...prev, ...formData }));
      setIsEditing(false); 
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-4 mt-8">
        
        {/* VIP MEMBER CARD BANNERS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-navy rounded-3xl p-8 shadow-2xl relative overflow-hidden text-white mb-8 border border-navy/20"
        >
          {/* Efek Kilauan Emas */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl translate-y-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-gold to-[#b8972e] rounded-full p-1 shadow-lg">
                <div className="w-full h-full bg-navy rounded-full flex items-center justify-center border-2 border-transparent">
                  <span className="text-3xl font-bold text-gold">
                    {userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : <User className="w-8 h-8 text-gold" />}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-gold" />
                  <span className="text-xs font-bold tracking-widest text-gold uppercase">Verified Member</span>
                </div>
                <h1 className="text-3xl font-extrabold text-white mb-1 truncate max-w-[250px] md:max-w-md">
                  {userProfile?.fullName || 'Esteemed Guest'}
                </h1>
                <p className="text-gray-400 text-sm">{auth.currentUser?.email}</p>
              </div>
            </div>
            
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-md min-w-[160px] text-center md:text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center justify-center md:justify-end gap-1">
                <Award className="w-3 h-3 text-gold" /> Gold Points
              </p>
              <p className="text-3xl font-extrabold text-white">
                {userProfile?.pointsBalance || 0}
              </p>
            </div>
          </div>
        </motion.div>

        {/* PROFILE DETAILS FORM */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-100 gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-navy mb-1">Personal Identity</h2>
              <p className="text-gray-500 text-sm">This information will be used to autofill your future expedition bookings.</p>
            </div>
            
            {/* Tombol Toggle Edit / Save */}
            <AnimatePresence mode="wait">
              {!isEditing ? (
                <motion.button 
                  key="edit"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-navy hover:border-gold hover:text-gold px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  <Edit3 className="w-4 h-4" /> Update Details
                </motion.button>
              ) : (
                <motion.div 
                  key="actions"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-3"
                >
                  <button 
                    onClick={() => {
                      // Reset form ke data asli jika dibatalkan
                      setFormData({
                        fullName: userProfile?.fullName || '',
                        phone: userProfile?.phone || '',
                        nationality: userProfile?.nationality || '',
                        passportNumber: userProfile?.passportNumber || '',
                        dietaryRequirements: userProfile?.dietaryRequirements || 'None',
                        gender: userProfile?.gender || 'Male',
                      });
                      setIsEditing(false);
                    }}
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    disabled={isSaving}
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-gold text-navy hover:bg-[#b8972e] shadow-lg shadow-gold/20 px-6 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-70"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Save Changes
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Full Name */}
            <div className="group">
              <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest block">Full Name (As in Passport)</label>
              {isEditing ? (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-navy px-4 py-3 pl-12 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all" placeholder="Enter your full name" />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-transparent group-hover:border-gray-100 transition-colors">
                  <User className="w-5 h-5 text-gold" />
                  <span className={`font-bold text-lg ${formData.fullName ? 'text-navy' : 'text-gray-400 italic'}`}>
                    {formData.fullName || 'Not provided yet'}
                  </span>
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div className="group">
              <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest block">WhatsApp Number</label>
              {isEditing ? (
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-navy px-4 py-3 pl-12 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all" placeholder="+62..." />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-transparent group-hover:border-gray-100 transition-colors">
                  <Phone className="w-5 h-5 text-gold" />
                  <span className={`font-bold text-lg ${formData.phone ? 'text-navy' : 'text-gray-400 italic'}`}>
                    {formData.phone || 'Not provided yet'}
                  </span>
                </div>
              )}
            </div>

            {/* Nationality */}
            <div className="group">
              <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest block">Nationality</label>
              {isEditing ? (
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-navy px-4 py-3 pl-12 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all" placeholder="e.g. United Kingdom" />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-transparent group-hover:border-gray-100 transition-colors">
                  <Globe className="w-5 h-5 text-gold" />
                  <span className={`font-bold text-lg ${formData.nationality ? 'text-navy' : 'text-gray-400 italic'}`}>
                    {formData.nationality || 'Not provided yet'}
                  </span>
                </div>
              )}
            </div>

            {/* Passport Number */}
            <div className="group">
              <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest block">Passport / ID Number</label>
              {isEditing ? (
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" name="passportNumber" value={formData.passportNumber} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-navy px-4 py-3 pl-12 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all" placeholder="Document number" />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-transparent group-hover:border-gray-100 transition-colors">
                  <CreditCard className="w-5 h-5 text-gold" />
                  <span className={`font-bold text-lg ${formData.passportNumber ? 'text-navy uppercase tracking-wider' : 'text-gray-400 italic'}`}>
                    {formData.passportNumber || 'Not provided yet'}
                  </span>
                </div>
              )}
            </div>

            {/* Gender */}
            <div className="group">
              <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest block">Gender</label>
              {isEditing ? (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-navy px-4 py-3 pl-12 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all appearance-none">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-transparent group-hover:border-gray-100 transition-colors">
                  <User className="w-5 h-5 text-gold" />
                  <span className={`font-bold text-lg ${formData.gender ? 'text-navy' : 'text-gray-400 italic'}`}>
                    {formData.gender || 'Not provided yet'}
                  </span>
                </div>
              )}
            </div>

            {/* Dietary */}
            <div className="group">
              <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest block">Dietary Requirements</label>
              {isEditing ? (
                <div className="relative">
                  <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select name="dietaryRequirements" value={formData.dietaryRequirements} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-navy px-4 py-3 pl-12 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all appearance-none">
                    <option value="None">None (Eat Anything)</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Halal">Halal</option>
                    <option value="Gluten-Free">Gluten-Free</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-transparent group-hover:border-gray-100 transition-colors">
                  <Utensils className="w-5 h-5 text-gold" />
                  <span className={`font-bold text-lg ${formData.dietaryRequirements ? 'text-navy' : 'text-gray-400 italic'}`}>
                    {formData.dietaryRequirements || 'None'}
                  </span>
                </div>
              )}
            </div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}