"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, Phone, Globe, CreditCard, Utensils, 
  Camera, UploadCloud, CheckCircle, Loader2, ArrowLeft, FileText
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import Image from 'next/image';

export default function EditProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState("");

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingPassport, setUploadingPassport] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    nationality: '',
    passportNumber: '',
    dietaryRequirements: 'None',
    gender: 'Male',
    photoUrl: '',
    passportFileUrl: '',
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
          setFormData({
            fullName: data.fullName || '',
            phone: data.phone || '',
            nationality: data.nationality || '',
            passportNumber: data.passportNumber || '',
            dietaryRequirements: data.dietaryRequirements || 'None',
            gender: data.gender || 'Male',
            photoUrl: data.photoUrl || '',
            passportFileUrl: data.passportFileUrl || '',
          });
        }
      } catch (error) {
        console.error("Error fetching profile for edit:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Logika Secure Upload via Next.js Backend API
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'passport') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'photo') setUploadingPhoto(true);
    if (type === 'passport') setUploadingPassport(true);

    try {
      const data = new FormData();
      data.append('file', file); // Cukup kirim file, parameter keamanan diurus oleh API Backend

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const textResponse = await response.text();
      let result;

      try {
        result = JSON.parse(textResponse);
      } catch (err) {
        console.error("Response bermasalah (bukan JSON):", textResponse);
        throw new Error("Gagal memproses respons server. Pastikan API Route berjalan.");
      }

      if (response.ok && result.url) {
        setFormData(prev => ({
          ...prev,
          [type === 'photo' ? 'photoUrl' : 'passportFileUrl']: result.url
        }));
      } else {
        alert(`Gagal mengunggah: ${result.error || 'Terjadi kesalahan pada server'}`);
      }
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      alert(error.message || "Terjadi kesalahan koneksi saat mengunggah.");
    } finally {
      if (type === 'photo') setUploadingPhoto(false);
      if (type === 'passport') setUploadingPassport(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, formData);
      router.push('/dashboard/profile');
    } catch (error) {
      console.error("Error updating profile doc:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin mb-4" />
        <p className="text-navy font-bold">Preparing Editorial Desk...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-4 mt-8">
        
        <button 
          type="button"
          onClick={() => router.push('/dashboard/profile')}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-navy transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Identity Card
        </button>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* ZONA UPLOAD FOTO PROFIL AVATAR */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="relative w-28 h-28 bg-navy/5 rounded-full p-1 border-2 border-dashed border-gray-200 group flex items-center justify-center overflow-hidden shadow-inner">
              {formData.photoUrl ? (
                <Image 
                  src={formData.photoUrl} 
                  alt="Avatar Preview" 
                  width={112} 
                  height={112} 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-10 h-10 text-gray-300" />
              )}

              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-bold tracking-wider uppercase rounded-full">
                <Camera className="w-5 h-5 text-gold mb-1" />
                {uploadingPhoto ? "Uploading..." : "Change"}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleFileChange(e, 'photo')} 
                  disabled={uploadingPhoto}
                />
              </label>

              {uploadingPhoto && (
                <div className="absolute inset-0 bg-navy/70 flex items-center justify-center rounded-full">
                  <Loader2 className="w-6 h-6 text-gold animate-spin" />
                </div>
              )}
            </div>
            <h3 className="font-bold text-navy mt-4 text-lg">Profile Avatar</h3>
            <p className="text-gray-400 text-xs mt-1">Recommended square image, maximum 2MB size.</p>
          </motion.div>

          {/* FORM ISIAN DATA UTAMA */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100"
          >
            <h2 className="text-xl font-extrabold text-navy mb-6 pb-4 border-b border-gray-100">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest block">Full Name (As in Passport)</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-navy px-4 py-3 pl-12 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-medium placeholder:text-gray-400 placeholder:font-normal" placeholder="John Doe" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest block">WhatsApp Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-navy px-4 py-3 pl-12 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-medium placeholder:text-gray-400 placeholder:font-normal" placeholder="+628123456789" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest block">Nationality</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" name="nationality" required value={formData.nationality} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-navy px-4 py-3 pl-12 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-medium placeholder:text-gray-400 placeholder:font-normal" placeholder="United Kingdom" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest block">Passport / ID Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" name="passportNumber" required value={formData.passportNumber} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-navy px-4 py-3 pl-12 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-medium placeholder:text-gray-400 placeholder:font-normal uppercase tracking-wider" placeholder="A1234567" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest block">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-navy px-4 py-3 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-medium">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest block">Dietary Requirements</label>
                <div className="relative">
                  <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select name="dietaryRequirements" value={formData.dietaryRequirements} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-navy px-4 py-3 pl-12 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-medium appearance-none">
                    <option value="None">None (Eat Anything)</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Halal">Halal</option>
                    <option value="Gluten-Free">Gluten-Free</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* DRAG & DROP ZONA UPLOAD DOKUMEN PASPOR */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100"
          >
            <h2 className="text-xl font-extrabold text-navy mb-2">Travel Documentation</h2>
            <p className="text-gray-400 text-xs mb-6">Upload a clear photo or scan of your passport main page for harbor clearance verification.</p>

            {formData.passportFileUrl ? (
              <div className="border-2 border-solid border-green-200 bg-green-50/50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-xl text-green-600 shadow-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-navy text-sm">Passport Scanned Successfully</p>
                    <p className="text-xs text-gray-500 mt-0.5">Ready for clearance process.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <a 
                    href={formData.passportFileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs font-bold text-navy hover:text-gold transition-colors underline underline-offset-4 w-1/2 md:w-auto text-center"
                  >
                    View Current File
                  </a>
                  <label className="bg-white border border-gray-200 text-navy hover:border-gold hover:text-gold px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer w-1/2 md:w-auto text-center">
                    {uploadingPassport ? "Uploading..." : "Replace File"}
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'passport')} 
                      disabled={uploadingPassport}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-200 hover:border-gold bg-gray-50/50 hover:bg-gold/5 rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer transition-all group relative">
                {uploadingPassport ? (
                  <Loader2 className="w-8 h-8 text-gold animate-spin mb-3" />
                ) : (
                  <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-gold group-hover:scale-110 transition-all mb-3" />
                )}
                <p className="text-sm font-bold text-navy">{uploadingPassport ? "Processing Secure Upload..." : "Click or drag to upload Passport image"}</p>
                <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG, or PDF up to 5MB</p>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  className="hidden" 
                  onChange={(e) => handleFileChange(e, 'passport')} 
                  disabled={uploadingPassport}
                />
              </label>
            )}
          </motion.div>

          {/* ACTION BUTTON SUBMIT */}
          <motion.div className="flex justify-end pt-4">
            <button 
              type="submit"
              disabled={isSaving || uploadingPhoto || uploadingPassport}
              className="bg-navy hover:bg-[#122643] text-white px-8 py-4 rounded-xl font-bold text-base shadow-xl shadow-navy/10 transition-colors flex items-center justify-center gap-2 min-w-[180px] disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-gold" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-gold" />
                  Save Changes
                </>
              )}
            </button>
          </motion.div>

        </form>
      </main>
    </div>
  );
}