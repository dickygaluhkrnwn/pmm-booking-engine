import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Inisialisasi Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
  : null;

if (!getApps().length && serviceAccount) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();
const auth = getAuth();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, email, password, userId } = body;

    if (!email || !password || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Cek apakah email ini sudah pernah diklaim / didaftarkan sebelumnya
    try {
      const existingUser = await auth.getUserByEmail(email);
      if (existingUser) {
        return NextResponse.json(
          { error: 'Account already claimed. Please login via the dashboard.' }, 
          { status: 400 }
        );
      }
    } catch (error: any) {
      // Jika errornya 'auth/user-not-found', berarti email aman untuk didaftarkan (lanjut ke tahap 2)
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // 2. TRIK SUNTIK ROH: Buat akun Auth Firebase dengan UID yang SAMA PERSIS dengan Shadow Account ID
    await auth.createUser({
      uid: userId, // Gunakan ID Shadow Account sebagai UID Auth
      email: email,
      password: password,
      emailVerified: true, // Otomatis terverifikasi karena dia sudah menerima e-Ticket di email tersebut
    });

    // 3. Update status Shadow Account di Firestore menjadi akun resmi (Bukan Guest lagi)
    await db.collection('users').doc(userId).update({
      isGuest: false,
      accountClaimedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Account successfully claimed' });

  } catch (error: any) {
    console.error('🚨 Claim Account Error:', error);
    
    // Tangkap error khas Firebase Auth jika password terlalu lemah, dll.
    if (error.code === 'auth/invalid-password') {
       return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}