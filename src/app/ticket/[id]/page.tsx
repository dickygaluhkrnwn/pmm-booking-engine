// src/app/ticket/[id]/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Ship, Loader2, MapPin, Calendar, Clock, Anchor, ShieldCheck, Printer } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function TicketPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'bookings', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBooking({ id: docSnap.id, ...docSnap.data() });
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching ticket:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [id, router]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin mb-4" />
        <p className="text-navy font-bold tracking-widest uppercase text-sm animate-pulse">Generating Boarding Pass...</p>
      </div>
    );
  }

  if (!booking) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 font-sans print:bg-white print:py-0">
      
      {/* Tombol Print (Sembunyi saat dicetak) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center px-4 print:hidden">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-navy font-bold text-sm transition-colors">
          &larr; Back to Dashboard
        </button>
        <button 
          onClick={handlePrint}
          className="bg-navy hover:bg-[#122643] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
        >
          <Printer className="w-4 h-4" /> Save as PDF / Print
        </button>
      </div>

      {/* ========================================================= */}
      {/* AREA KERTAS E-TICKET (A4 Size Approach)                     */}
      {/* ========================================================= */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none relative print-color-adjust-exact">
        
        {/* Desain Latar E-Ticket */}
        <div className="absolute top-0 left-0 w-2 h-full bg-gold z-10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-navy/5 rounded-full blur-3xl pointer-events-none" />

        <div className="p-10 md:p-12 relative z-20">
          
          {/* HEADER: LOGO & STATUS */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-gray-100 pb-8 mb-8">
            <div className="flex items-center gap-4 mb-6 md:mb-0">
              <div className="bg-navy p-3 rounded-xl">
                <Ship className="w-8 h-8 text-gold" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-navy tracking-tight uppercase">PMM Reserve</h1>
                <p className="text-xs font-bold text-gold tracking-widest uppercase mt-1">Official Boarding Pass</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Booking Reference</p>
              <p className="text-2xl font-mono font-extrabold text-navy tracking-wider">{booking.id}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" /> {booking.status === 'PAID' ? 'Confirmed & Paid' : booking.status}
              </div>
            </div>
          </div>

          {/* MAIN ITINERARY & QR CODE */}
          <div className="flex flex-col md:flex-row gap-10 mb-10">
            
            {/* Kiri: Itinerary */}
            <div className="flex-1 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                <Anchor className="w-4 h-4 text-gold" /> Voyage Itinerary
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Route</p>
                  <p className="text-base font-extrabold text-navy">Lombok ➔ Komodo</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Duration</p>
                  <p className="text-base font-extrabold text-navy">4 Days 3 Nights</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Departure Date</p>
                  <p className="text-lg font-extrabold text-navy">{formatDate(booking.dateOfDeparture)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1"><Ship className="w-3 h-3"/> Cabin Class</p>
                  <p className="text-base font-extrabold text-navy">{booking.cabinClass}</p>
                </div>
              </div>
            </div>

            {/* Kanan: QR Code (Dinamis) */}
            <div className="shrink-0 flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.id}&color=0f172a`} 
                alt="QR Code" 
                className="w-32 h-32 mb-3"
              />
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center">Scan at Harbor <br/> Check-in Desk</p>
            </div>
          </div>

          {/* PASSENGER MANIFEST */}
          <div className="mb-10">
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 border-b-2 border-gray-100 pb-2">
              Passenger Manifest ({booking.paxCount} Pax)
            </h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">Full Name</th>
                  <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">Passport</th>
                  <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">Nationality</th>
                  <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 text-right">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {booking.passengersManifest?.map((pax: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-4 text-sm font-extrabold text-navy">
                      {pax.fullName}
                      {idx === 0 && <span className="ml-2 bg-gold/10 text-gold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider font-bold">Lead</span>}
                    </td>
                    <td className="py-4 text-sm font-mono font-bold text-gray-600">{pax.passportNumber}</td>
                    <td className="py-4 text-sm font-bold text-gray-600">{pax.nationality}</td>
                    <td className="py-4 text-right">
                      {pax.dietaryRequirements && pax.dietaryRequirements !== 'None' ? (
                        <span className="text-[9px] bg-red-50 text-red-600 font-extrabold uppercase px-2 py-1 rounded-md">
                          {pax.dietaryRequirements}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TERMS & FOOTER */}
          <div className="bg-navy/5 p-6 rounded-xl border border-navy/10 mt-12">
            <h4 className="text-[10px] font-extrabold text-navy uppercase tracking-widest mb-2">Important Boarding Information</h4>
            <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
              <li>Please arrive at the designated meeting point at least <strong>2 hours</strong> before departure.</li>
              <li>You must present this physical or digital boarding pass along with your original passport.</li>
              <li>Baggage allowance is strictly 20kg per passenger. Soft duffel bags are highly recommended.</li>
              <li>Emergency Contact / Harbor Master: <strong>+62 812-3456-7890</strong> (PMM Reserve 24/7 Concierge).</li>
            </ul>
          </div>

        </div>
      </div>

      {/* PERBAIKAN: Menggunakan dangerouslySetInnerHTML */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />
    </div>
  );
}