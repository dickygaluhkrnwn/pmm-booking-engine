import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
  : null;

if (!getApps().length && serviceAccount) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Ekstrak data dari notifikasi Midtrans
    const { 
      order_id, 
      status_code, 
      gross_amount, 
      signature_key, 
      transaction_status, 
      fraud_status 
    } = body;

    // Keamanan: Validasi bahwa notifikasi benar-benar datang dari Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const hashData = order_id + status_code + gross_amount + serverKey;
    const expectedSignature = crypto.createHash('sha512').update(hashData).digest('hex');

    if (expectedSignature !== signature_key) {
      console.error('🚨 Akses Ditolak: Invalid Midtrans Signature!');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // Konversi status transaksi Midtrans ke status aplikasi kita
    let orderStatus = 'PENDING';
    
    if (transaction_status === 'capture') {
      // Untuk Kartu Kredit
      if (fraud_status === 'accept') {
        orderStatus = 'PAID';
      }
    } else if (transaction_status === 'settlement') {
      // Untuk e-Wallet, Bank Transfer, QRIS, dll
      orderStatus = 'PAID';
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
      orderStatus = 'FAILED';
    }

    // Proses update ke database jika statusnya berubah
    const bookingRef = db.collection('bookings').doc(order_id);
    const bookingSnap = await bookingRef.get();

    if (bookingSnap.exists) {
      const bookingData = bookingSnap.data();

      // CEGAH DOUBLE UPDATE: Hanya proses jika status sebelumnya bukan PAID
      if (bookingData?.status !== 'PAID' && orderStatus === 'PAID') {
        
        // 1. Kalkulasi Poin Loyalitas (Misal: 1 Poin per $10)
        const pointsEarned = Math.floor(parseFloat(gross_amount) / 10);

        // 2. Update status Bookings
        await bookingRef.update({
          status: 'PAID',
          pointsEarned: pointsEarned,
          updatedAt: new Date().toISOString()
        });

        // 3. Suntik Poin ke Shadow Account tamu (Menggunakan FieldValue.increment)
        if (bookingData?.userId) {
          const userRef = db.collection('users').doc(bookingData.userId);
          await userRef.update({
            pointsBalance: FieldValue.increment(pointsEarned)
          });
        }

        console.log(`✅ Pesanan ${order_id} LUNAS. User mendapat ${pointsEarned} Poin.`);
        
        // TODO: Memicu API Resend untuk mengirimkan PDF e-Ticket ke email turis.
        // Kita akan buat fitur e-ticket ini di langkah selanjutnya.

      } else if (orderStatus === 'FAILED') {
        await bookingRef.update({
          status: 'FAILED',
          updatedAt: new Date().toISOString()
        });
        console.log(`❌ Pesanan ${order_id} GAGAL/EXPIRED.`);
      }
    } else {
      console.error(`⚠️ Pesanan ${order_id} tidak ditemukan di database.`);
    }

    // Midtrans membutuhkan balasan 200 OK agar mereka tidak mengulang notifikasi
    return NextResponse.json({ success: true, message: 'Webhook successfully processed' });

  } catch (error: any) {
    console.error('🚨 Webhook Error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing webhook' }, 
      { status: 500 }
    );
  }
}