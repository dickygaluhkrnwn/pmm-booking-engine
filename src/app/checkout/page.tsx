"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Phone, Calendar as CalendarIcon, ShieldCheck, MapPin, CheckCircle2, Info, UploadCloud, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface PassengerDetail {
  id: number;
  fullName: string;
  gender: string;
  placeOfBirth: string;
  dateOfBirth: string;
  age: number;
  passportNumber: string;
  nationality: string;
  dietaryRequirements: string;
  passportFileUrl: string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parameter URL
  const selectedDate = searchParams.get('date') || '';
  const cabinType = searchParams.get('cabin') || 'Dormitory';
  const paxCount = parseInt(searchParams.get('pax') || '1', 10);

  // Harga (Bisa dimodifikasi dari Admin kelak)
  const pricePerPax = cabinType === 'Private' ? 450 : 250;
  const totalPrice = pricePerPax * paxCount;

  // State Contact & Pickup
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupArea, setPickupArea] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  
  // State Passengers & Upload
  const [passengers, setPassengers] = useState<PassengerDetail[]>([]);
  const [uploadingState, setUploadingState] = useState<{ [key: number]: boolean }>({});
  
  // State UI
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Inisialisasi Form
  useEffect(() => {
    if (!selectedDate) {
      router.push('/');
      return;
    }

    const initialPassengers = Array.from({ length: paxCount }).map((_, index) => ({
      id: index + 1,
      fullName: '',
      gender: '',
      placeOfBirth: '',
      dateOfBirth: '',
      age: 0,
      passportNumber: '',
      nationality: '',
      dietaryRequirements: '',
      passportFileUrl: ''
    }));
    setPassengers(initialPassengers);
  }, [paxCount, selectedDate, router]);

  // Kalkulasi Umur
  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handlePassengerChange = (id: number, field: keyof PassengerDetail, value: string | number) => {
    setPassengers(prev => 
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, [field]: value };
          if (field === 'dateOfBirth') {
             updated.age = calculateAge(value as string);
          }
          return updated;
        }
        return p;
      })
    );
  };

  // Upload ke Cloudinary
  const handleFileUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingState(prev => ({ ...prev, [id]: true }));
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error?.message || 'Upload failed');

      handlePassengerChange(id, 'passportFileUrl', data.secure_url);
    } catch (err: any) {
      setErrorMessage(`Failed to upload passport: ${err.message}`);
    } finally {
      setUploadingState(prev => ({ ...prev, [id]: false }));
    }
  };

  const validateForm = () => {
    if (!email || !phone || !pickupArea || !pickupLocation) return false;
    for (const p of passengers) {
      if (!p.fullName || !p.gender || !p.placeOfBirth || !p.dateOfBirth || !p.passportNumber || !p.nationality || !p.passportFileUrl) {
        return false;
      }
    }
    return true;
  };

  const handleProceedToPayment = () => {
    setErrorMessage('');
    
    // Cek apakah ada yang masih loading upload
    if (Object.values(uploadingState).some(state => state === true)) {
      setErrorMessage('Please wait for all passports to finish uploading.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!validateForm()) {
      setErrorMessage('Please fill in all required fields and upload passports for all guests.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsModalOpen(true);
  };

  const confirmAndPay = async () => {
    setIsModalOpen(false);
    setIsLoading(true);

    try {
      const payload = {
        booking: { 
          date: selectedDate, 
          cabin: cabinType, 
          pax: paxCount, 
          total: totalPrice,
          bookingSource: "B2C_WEB" // Identifikasi B2C vs B2B Agent di masa depan
        },
        contact: { email, phone, pickupArea, pickupLocation },
        passengers
      };

      const response = await fetch('/api/checkout/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initiate booking');
      }

      router.push(`/payment?order_id=${result.orderId}`);
      
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message);
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatDateUI = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <header className="bg-navy py-6 sticky top-0 z-40 shadow-md">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-white/80 hover:text-white flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back</span>
          </button>
          <span className="text-gold font-bold tracking-widest uppercase">Checkout</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-medium rounded-r-lg">
            {errorMessage}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            
            {/* CONTACT & PICKUP */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-navy mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5 text-gold" /> Contact & Pickup Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Email Address *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Input label="WhatsApp / Phone *" type="tel" placeholder="+62..." value={phone} onChange={(e) => setPhone(e.target.value)} required />
                
                <div className="flex flex-col">
                   <label className="text-sm font-semibold text-gray-500 mb-2">Pickup Area *</label>
                   <select 
                      value={pickupArea} 
                      onChange={(e) => {
                        setPickupArea(e.target.value);
                        setPickupLocation(''); // Reset lokasi jika area berubah
                      }}
                      className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-gold focus:ring-1 focus:ring-gold outline-none"
                      required
                   >
                      <option value="" disabled>Select Area</option>
                      <option value="Mataram">Mataram</option>
                      <option value="Senggigi">Senggigi</option>
                      <option value="Kuta Mandalika">Kuta Mandalika</option>
                      <option value="Bangsal">Bangsal Harbor</option>
                   </select>
                </div>

                <div className="flex flex-col">
                  <Input 
                    label="Hotel Name / Detail Location *" 
                    placeholder={pickupArea ? `Where in ${pickupArea}?` : "Select area first"}
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    disabled={!pickupArea}
                    required
                  />
                </div>
              </div>
            </motion.section>

            {/* PASSENGER MANIFEST */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-xl font-bold text-navy mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gold" /> Passenger Manifest
              </h2>
              
              <div className="space-y-6">
                {passengers.map((p, idx) => (
                  <div key={p.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 bg-gold text-navy font-bold px-4 py-1 rounded-br-xl text-sm">
                      Passenger {p.id} {idx === 0 && "(Lead)"}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      {/* Baris 1 */}
                      <Input label="Full Name (as per Passport) *" value={p.fullName} onChange={(e) => handlePassengerChange(p.id, 'fullName', e.target.value)} required />
                      
                      <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-500 mb-2">Gender *</label>
                        <select 
                          value={p.gender} 
                          onChange={(e) => handlePassengerChange(p.id, 'gender', e.target.value)}
                          className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-gold outline-none" required
                        >
                          <option value="" disabled>Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      {/* Baris 2 */}
                      <Input label="Place of Birth *" value={p.placeOfBirth} onChange={(e) => handlePassengerChange(p.id, 'placeOfBirth', e.target.value)} required />
                      <div className="flex gap-4">
                        <div className="w-2/3">
                          <Input label="Date of Birth *" type="date" value={p.dateOfBirth} onChange={(e) => handlePassengerChange(p.id, 'dateOfBirth', e.target.value)} required />
                        </div>
                        <div className="w-1/3">
                          <Input label="Age" type="number" value={p.age} readOnly className="bg-gray-50 text-gray-500 cursor-not-allowed" />
                        </div>
                      </div>

                      {/* Baris 3 */}
                      <Input label="Nationality *" value={p.nationality} onChange={(e) => handlePassengerChange(p.id, 'nationality', e.target.value)} required />
                      <Input label="Dietary Requirements" placeholder="Vegetarian, Halal, etc. (Optional)" value={p.dietaryRequirements} onChange={(e) => handlePassengerChange(p.id, 'dietaryRequirements', e.target.value)} />

                      {/* Baris 4: Passport Data & Upload */}
                      <Input label="Passport Number *" value={p.passportNumber} onChange={(e) => handlePassengerChange(p.id, 'passportNumber', e.target.value)} required />
                      
                      <div className="flex flex-col justify-end">
                        <label className="text-sm font-semibold text-gray-500 mb-2">Upload Passport Photo/Scan *</label>
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileUpload(p.id, e)}
                            className="hidden" 
                            id={`passport-upload-${p.id}`}
                          />
                          <label 
                            htmlFor={`passport-upload-${p.id}`}
                            className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${p.passportFileUrl ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 hover:border-gold bg-gray-50 text-gray-600'}`}
                          >
                            {uploadingState[p.id] ? (
                              <span className="animate-pulse">Uploading...</span>
                            ) : p.passportFileUrl ? (
                              <><Check className="w-5 h-5" /> Passport Uploaded</>
                            ) : (
                              <><UploadCloud className="w-5 h-5" /> Choose File</>
                            )}
                          </label>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* ORDER SUMMARY */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-navy p-6 rounded-2xl shadow-xl text-white sticky top-28">
              <h3 className="text-lg font-bold text-gold mb-6 border-b border-white/10 pb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-start">
                  <div className="text-gray-300 text-sm"><CalendarIcon className="w-4 h-4 mb-1 inline mr-1" /> Departure</div>
                  <div className="font-semibold text-right max-w-[150px]">{formatDateUI(selectedDate)}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-gray-300 text-sm"><MapPin className="w-4 h-4 mb-1 inline mr-1" /> Route</div>
                  <div className="font-semibold text-right">Lombok ➔ Komodo</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-gray-300 text-sm">Class</div>
                  <div className="font-semibold text-gold">{cabinType}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-gray-300 text-sm">Guests</div>
                  <div className="font-semibold">{paxCount} Person(s)</div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 mb-8">
                <div className="flex justify-between items-end">
                  <div className="text-gray-300">Total Price</div>
                  <div className="text-3xl font-bold text-gold">${totalPrice}</div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">Includes all taxes & national park fees.</p>
              </div>

              <Button onClick={handleProceedToPayment} variant="secondary" className="w-full" isLoading={isLoading}>
                Proceed to Payment
              </Button>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4" /> Secure SSL Encrypted Checkout
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirm Your Details">
        <div className="space-y-4">
          <p className="text-gray-600">Please ensure all passenger names match their passports exactly. We will send the e-Ticket to <strong>{email}</strong>.</p>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
            <div className="flex items-center gap-2 text-navy font-semibold mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> 1x Free Reschedule Included
            </div>
            <p className="text-gray-500">You are eligible to reschedule this trip to the following week if flight delays occur.</p>
          </div>
          <div className="pt-4 flex gap-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="w-full">Edit Details</Button>
            <Button onClick={confirmAndPay} isLoading={isLoading} className="w-full">Pay ${totalPrice}</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-navy font-bold">Loading secure checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}