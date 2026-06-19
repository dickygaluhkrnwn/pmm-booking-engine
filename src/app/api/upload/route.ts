import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Konfigurasi Cloudinary menggunakan kredensial aman dari .env.local
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang dikirimkan' }, { status: 400 });
    }

    // Mengonversi File menjadi ArrayBuffer lalu ke Buffer agar bisa diproses Node.js
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Proses unggah aman ke Cloudinary menggunakan upload_stream
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: 'pmm_reserve_profiles',
          // Menggunakan preset yang sudah kamu set untuk konsistensi folder & optimasi
          upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET 
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    // Mengembalikan URL aman dari Cloudinary dalam format JSON yang valid
    return NextResponse.json({ url: (uploadResult as any).secure_url }, { status: 200 });

  } catch (error: any) {
    console.error('🚨 Cloudinary Backend Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengunggah file ke server' }, { status: 500 });
  }
}