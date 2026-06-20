// src/app/api/rewards/redeem/route.ts
import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { userId, rewardId, rewardName, cost, discountValue } = await request.json();

    if (!userId || !rewardId || cost === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!getApps().length && serviceAccountKey) {
      initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) });
    }

    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    
    // Eksekusi Transaction agar proses pemotongan poin dan pembuatan voucher tidak balapan
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error("User profile not found.");
      }

      const userData = userDoc.data();
      const currentPoints = userData?.pointsBalance || 0;

      if (currentPoints < cost) {
        throw new Error("Insufficient Gold Points.");
      }

      // 1. Kurangi Poin User
      transaction.update(userRef, {
        pointsBalance: currentPoints - cost,
        updatedAt: new Date().toISOString()
      });

      // 2. Terbitkan Voucher Baru ke koleksi user_rewards
      const newRewardRef = db.collection('user_rewards').doc();
      transaction.set(newRewardRef, {
        userId: userId,
        rewardId: rewardId,
        rewardName: rewardName,
        discountValue: discountValue || 0,
        cost: cost,
        status: 'ACTIVE', // ACTIVE, USED, EXPIRED
        redeemedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // Berlaku 1 Tahun
      });
    });

    return NextResponse.json({ success: true, message: 'Voucher successfully redeemed!' });

  } catch (error: any) {
    console.error('🚨 Redeem Reward Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}