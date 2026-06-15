import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
// Kita pakai require untuk midtrans-client karena mereka belum punya official TypeScript types
const midtransClient = require('midtrans-client'); 

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
    const { booking, contact, passengers } = body;

    if (!booking || !contact || !passengers || passengers.length === 0) {
      return NextResponse.json({ error: 'Data pesanan tidak lengkap' }, { status: 400 });
    }

    if (!serviceAccount) {
        return NextResponse.json({ error: 'Server configuration error: Firebase Service Account missing' }, { status: 500 });
    }

    // 1. Cek atau Buat Shadow Account
    const usersRef = db.collection('users');
    const q = usersRef.where('email', '==', contact.email).limit(1);
    const querySnapshot = await q.get();

    let userId: string;
    let isNewUser = false;

    if (querySnapshot.empty) {
      const newUserRef = usersRef.doc(); 
      userId = newUserRef.id;
      isNewUser = true;

      await newUserRef.set({
        email: contact.email,
        phone: contact.phone,
        fullName: passengers[0]?.fullName || 'Guest',
        createdAt: new Date().toISOString(),
        role: 'guest',
        pointsBalance: 0
      });
    } else {
      userId = querySnapshot.docs[0].id;
    }

    // 2. Generate Order ID Unik
    const orderId = `PMM-${Date.now()}-${uuidv4().substring(0, 4)}`;
    
    // 3. Panggil API Midtrans untuk mendapatkan Snap Token
    // Midtrans membutuhkan Gross Amount (Total) dalam format integer
    let snap = new midtransClient.Snap({
        isProduction: false, // Set ke false karena kita masih di Sandbox
        serverKey: process.env.MIDTRANS_SERVER_KEY,
        clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
    });

    let parameter = {
        "transaction_details": {
            "order_id": orderId,
            "gross_amount": booking.total
        },
        "customer_details": {
            "first_name": passengers[0]?.fullName || "Guest",
            "email": contact.email,
            "phone": contact.phone
        }
    };

    const transaction = await snap.createTransaction(parameter);
    const snapToken = transaction.token;

    // 4. Simpan Data Booking ke Firestore (Sekarang kita simpan juga snapToken-nya)
    const bookingsRef = db.collection('bookings');
    const newBooking = {
      bookingId: orderId,
      userId: userId,
      status: 'PENDING',
      paymentProvider: 'MIDTRANS',
      totalAmount: booking.total,
      currency: 'USD', 
      dateOfDeparture: booking.date,
      cabinClass: booking.cabin,
      paxCount: booking.pax,
      pickupLocation: contact.pickupLocation,
      pickupArea: contact.pickupArea,
      passengersManifest: passengers,
      contactEmail: contact.email,
      contactPhone: contact.phone,
      snapToken: snapToken, // Simpan token agar bisa dipanggil ulang jika turis belum bayar
      bookingSource: booking.bookingSource || "B2C_WEB",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await bookingsRef.doc(orderId).set(newBooking);

    return NextResponse.json({ 
      success: true, 
      orderId: orderId,
      snapToken: snapToken, // Kembalikan token ke Frontend
      message: isNewUser ? 'Shadow Account and Booking created' : 'Booking created for existing user',
    });

  } catch (error: any) {
    console.error('Error in initiate checkout API:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server', details: error.message },
      { status: 500 }
    );
  }
}