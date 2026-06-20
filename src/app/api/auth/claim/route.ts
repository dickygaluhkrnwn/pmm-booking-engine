// src/app/api/auth/claim/route.ts
import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { email, password, orderId, userId } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Lazy Init Firebase Admin
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!getApps().length && serviceAccountKey) {
      initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) });
    }

    const auth = getAuth();
    const db = getFirestore();
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Cek apakah email sudah terdaftar di Firebase Auth
    try {
      const existingUser = await auth.getUserByEmail(normalizedEmail);
      if (existingUser) {
        return NextResponse.json({ error: 'Account already claimed. Please sign in.' }, { status: 400 });
      }
    } catch (e: any) {
      if (e.code !== 'auth/user-not-found') throw e;
    }

    let bookingsToUpdate: any[] = [];
    let totalPoints = 0;
    let phone = '';
    let fullName = 'Esteemed Guest';
    
    let targetUid = userId; 

    // 2. Cari Tiket: Berdasarkan orderId ATAU email
    if (orderId) {
      const docSnap = await db.collection('bookings').doc(orderId).get();
      if (!docSnap.exists) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      
      const data = docSnap.data() as any;
      if (data.contactEmail?.toLowerCase() !== normalizedEmail) return NextResponse.json({ error: 'Unauthorized Email' }, { status: 403 });
      if (data.isClaimed === true) return NextResponse.json({ error: 'Already claimed' }, { status: 400 });
      
      bookingsToUpdate.push({ id: docSnap.id, ...data });
      if (!targetUid) targetUid = data.userId; 

    } else {
      // HAPUS filter .where('isClaimed', '==', false) karena data lama tidak punya field ini
      const q = await db.collection('bookings')
        .where('contactEmail', '==', normalizedEmail)
        .get();
        
      if (q.empty) {
        return NextResponse.json({ error: 'No past bookings found for this email. Please ensure you typed it correctly or Sign Up instead.' }, { status: 404 });
      }
      
      // FILTER MANUAL DI MEMORI (Agar kebal terhadap data lama)
      q.forEach(doc => {
        const data = doc.data();
        if (data.isClaimed !== true) { // Jika false atau undefined (belum ada), maka masukkan!
          bookingsToUpdate.push({ id: doc.id, ...data });
          if (!targetUid) targetUid = data.userId; 
        }
      });

      if (bookingsToUpdate.length === 0) {
        return NextResponse.json({ error: 'All bookings for this email have already been claimed.' }, { status: 400 });
      }
    }

    // 3. Kumpulkan Poin & Ekstraksi Data Diri dari Tiket-tiket
    bookingsToUpdate.forEach(b => {
      totalPoints += (b.pointsEarned || 0);
      if (!phone && b.contactPhone) phone = b.contactPhone;
      if (fullName === 'Esteemed Guest' && b.passengersManifest?.length > 0) {
        fullName = b.passengersManifest[0].fullName;
      }
    });

    // 4. TRIK SUNTIK ROH: Buat User Baru di Auth
    const userCreateParams: any = { 
      email: normalizedEmail, 
      password: password, 
      emailVerified: true 
    };
    
    if (targetUid) {
      userCreateParams.uid = targetUid;
    }

    const userRecord = await auth.createUser(userCreateParams);

    // 5. Tulis User Profile & Update Tiket (Batch)
    const batch = db.batch();
    const userRef = db.collection('users').doc(userRecord.uid);
    
    batch.set(userRef, { 
      email: normalizedEmail, 
      fullName: fullName, 
      phone: phone, 
      pointsBalance: totalPoints, 
      isGuest: false, 
      role: "member", // REVISI: Update role dari 'guest' menjadi 'member'
      accountClaimedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    bookingsToUpdate.forEach(b => {
      const bRef = db.collection('bookings').doc(b.id);
      batch.update(bRef, { 
        userId: userRecord.uid, 
        isClaimed: true // Tandai dengan jelas agar tidak bisa diklaim 2 kali
      });
    });

    await batch.commit();
    return NextResponse.json({ success: true, message: 'Account successfully claimed' });

  } catch (error: any) {
    console.error('🚨 Claim API Error:', error);
    if (error.code === 'auth/invalid-password') {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }
    if (error.code === 'auth/uid-already-exists') {
      return NextResponse.json({ error: 'This shadow account ID is already registered.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}