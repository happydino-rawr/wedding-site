//Includes mobile-camera capture, on-device compression down to 400KB, and a live-updating layout.

"use client";
import { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient("YOUR_SUPABASE_URL", "YOUR_SUPABASE_ANON_KEY");
const R2_PUBLIC_VIEW_URL = "https://pub-xxxxxx.r2.dev"; // Found in your Cloudflare Bucket details

export default function WeddingPortal() {
  const [name, setName] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  // 1. Fetch data automatically every 10 seconds
  useEffect(() => {
    fetchPhotos();
    const interval = setInterval(fetchPhotos, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPhotos = async () => {
    const { data } = await supabase.from('wedding_photos').select('*').order('created_at', { ascending: false });
    if (data) setPhotos(data);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !name) return alert("Please enter your name first!");
    setUploading(true);

    try {
      // 2. Compress photo down to roughly 400KB directly on guest device
      const options = { maxSizeMB: 0.4, maxWidthOrHeight: 1920, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      // 3. Ask Vercel backend for a secure upload ticket
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      const { signedUrl, fileKey } = await res.json();

      // 4. Push file from phone directly to Cloudflare R2
      await fetch(signedUrl, { method: 'PUT', body: compressedFile, headers: { 'Content-Type': file.type } });

      // 5. Write the image link into Supabase
      const finalImageUrl = `${R2_PUBLIC_VIEW_URL}/${fileKey}`;
      await supabase.from('wedding_photos').insert([{ guest_name: name, image_url: finalImageUrl }]);
      
      fetchPhotos();
      alert("Photo uploaded successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1>Our Wedding Day</h1>
        <p>Venue: The Rose Garden | Time: 4:00 PM</p>
      </header>

      <section style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '40px' }}>
        <h3>Share Your Memories</h3>
        <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
        <input type="file" accept="image/*" capture="environment" onChange={handleUpload} disabled={uploading} />
        {uploading && <p>Uploading and compressing your photo...</p>}
      </section>

      <h3>Guest Photo Feed</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {photos.map(p => (
          <div key={p.id} style={{ border: '1px solid #ddd', padding: '5px', borderRadius: '4px' }}>
            <img src={p.image_url} alt="Wedding" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>By: {p.guest_name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}