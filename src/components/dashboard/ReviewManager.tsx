"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, UploadCloud, CheckCircle2, MessageSquareQuote, Lock, Calendar, Edit3, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ReviewManagerProps {
  booking: any;
  userProfile: any;
}

export function ReviewManager({ booking, userProfile }: ReviewManagerProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  
  // Form States
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewImage, setReviewImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hitung hari berjalan (Day 1 - 4)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const depDate = new Date(booking.date); // Asumsi field tanggal keberangkatan adalah 'date'
  depDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - depDate.getTime();
  const currentTripDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const fetchReviews = async () => {
    try {
      const q = query(collection(db, 'reviews'), where('bookingId', '==', booking.id));
      const snap = await getDocs(q);
      const fetchedReviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(fetchedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [booking.id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) setReviewImage(data.secure_url);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReviewModal = (day: number, existingReview?: any) => {
    setSelectedDay(day);
    if (existingReview) {
      setEditingReviewId(existingReview.id);
      setRating(existingReview.rating);
      setComment(existingReview.comment);
      setReviewImage(existingReview.imageUrls?.[0] || '');
    } else {
      setEditingReviewId(null);
      setRating(5);
      setComment('');
      setReviewImage('');
    }
    setIsModalOpen(true);
  };

  const submitReview = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.uid || booking.userId,
          bookingId: booking.id,
          tripDay: selectedDay,
          userName: userProfile?.fullName || 'Esteemed Guest',
          rating,
          comment,
          imageUrls: reviewImage ? [reviewImage] : [],
          reviewId: editingReviewId // Kirim ID jika ini mode EDIT
        })
      });
      const result = await response.json();
      if (response.ok) {
        if (!editingReviewId) {
          // Hanya beri tahu soal poin jika ini ulasan baru
          alert(`Success! You earned ${result.earnedPoints} Gold Points.`);
        }
        setIsModalOpen(false);
        fetchReviews(); // Refresh lokal
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="animate-pulse h-20 bg-gray-100 rounded-2xl mt-4" />;

  // Render 4 Hari Trip
  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <h4 className="text-sm font-extrabold text-navy mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gold" /> Voyage Daily Journal
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((day) => {
          const isUnlocked = currentTripDay >= day;
          const existingReview = reviews.find(r => r.tripDay === day);

          return (
            <div key={day} className={`p-4 rounded-2xl border ${existingReview ? 'bg-green-50 border-green-200' : isUnlocked ? 'bg-white border-gold/40 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-navy">Day {day}</span>
                {!isUnlocked && !existingReview && <Lock className="w-3 h-3 text-gray-400" />}
                {existingReview && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              </div>

              {existingReview ? (
                <div>
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(existingReview.rating)].map((_, i) => <Star key={i} className="w-3 h-3 text-gold fill-gold" />)}
                  </div>
                  <button onClick={() => openReviewModal(day, existingReview)} className="text-[10px] font-bold text-navy hover:text-gold flex items-center gap-1 underline underline-offset-2">
                    <Edit3 className="w-3 h-3" /> Edit Journal
                  </button>
                </div>
              ) : isUnlocked ? (
                <button onClick={() => openReviewModal(day)} className="w-full bg-gold/10 hover:bg-gold text-navy text-[10px] font-extrabold uppercase tracking-widest py-2 rounded-lg transition-colors flex justify-center items-center gap-1">
                  <MessageSquareQuote className="w-3 h-3" /> Share (+50 Pts)
                </button>
              ) : (
                <p className="text-[10px] font-medium text-gray-400 mt-2">Unlocks on Day {day}</p>
              )}
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Day ${selectedDay} Voyage Journal`}>
        <div className="space-y-6">
          {!editingReviewId && (
            <p className="text-gray-500 text-sm text-center bg-gold/5 p-3 rounded-xl border border-gold/20">
              Share your moments today and earn up to <strong className="text-gold">75 Gold Points</strong>!
            </p>
          )}

          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} onClick={() => setRating(star)}
                className={`w-10 h-10 cursor-pointer transition-transform hover:scale-110 ${rating >= star ? 'text-gold fill-gold drop-shadow-md' : 'text-gray-200'}`} 
              />
            ))}
          </div>

          <textarea 
            value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about the cabins, the food, the mantas..."
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-navy focus:border-gold outline-none min-h-[120px] resize-none"
          />

          <div className="relative h-32 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center bg-gray-50 hover:bg-gold/5 transition-colors overflow-hidden">
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            {reviewImage ? (
              <img src={reviewImage} alt="Review" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-gray-400">
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gold" /> : <UploadCloud className="w-8 h-8 mx-auto mb-2" />}
                <p className="text-xs font-bold uppercase tracking-widest">Add a Photo (Optional)</p>
                {!editingReviewId && <p className="text-[10px] font-bold text-gold mt-1">+25 Extra Points</p>}
              </div>
            )}
          </div>

          <Button onClick={submitReview} isLoading={isSubmitting} className="w-full bg-navy hover:bg-[#122643] text-white py-4 rounded-xl font-bold">
            {editingReviewId ? 'Update Journal' : 'Publish Journal'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}