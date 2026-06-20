// src/app/api/reviews/submit/route.ts
import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { userId, bookingId, tripDay, rating, comment, imageUrls, userName, reviewId } = await request.json();

    if (!userId || !bookingId || !rating || !comment || !tripDay) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!getApps().length && serviceAccountKey) {
      initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) });
    }

    const db = getFirestore();
    const batch = db.batch();

    if (reviewId) {
      // ==========================================
      // MODE EDIT: Hanya update text & foto. Gak ada poin tambahan.
      // ==========================================
      const reviewRef = db.collection('reviews').doc(reviewId);
      batch.update(reviewRef, {
        rating,
        comment,
        imageUrls: imageUrls || [],
        updatedAt: new Date().toISOString()
      });

      await batch.commit();
      return NextResponse.json({ success: true, mode: 'edited' });

    } else {
      // ==========================================
      // MODE CREATE: Buat ulasan baru & Berikan Poin!
      // ==========================================
      const reviewRef = db.collection('reviews').doc();
      batch.set(reviewRef, {
        userId,
        bookingId,
        tripDay, // Lacak hari ke berapa
        userName: userName || 'Esteemed Explorer',
        rating,
        comment,
        imageUrls: imageUrls || [],
        isVerified: true,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString()
      });

      // Tambahkan Poin (50 Base + 25 kalau ada foto)
      const rewardPoints = imageUrls && imageUrls.length > 0 ? 75 : 50;
      const userRef = db.collection('users').doc(userId);
      
      const userSnap = await userRef.get();
      const currentPoints = userSnap.data()?.pointsBalance || 0;
      
      batch.update(userRef, { 
        pointsBalance: currentPoints + rewardPoints 
      });

      await batch.commit();
      return NextResponse.json({ success: true, mode: 'created', earnedPoints: rewardPoints });
    }

  } catch (error: any) {
    console.error('🚨 Submit Review Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}