const express = require('express');
const path = require('path');
const Redis = require('ioredis');
const { nanoid } = require('nanoid');

// Membuat koneksi ke Redis Cloud menggunakan variabel lingkungan.
const redis = new Redis(process.env.KV_REDIS_URL);

const app = express();
app.use(express.json());

// Sajikan file statis (seperti index.html, style.css, dan transit.html) dari folder 'public'
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Endpoint API untuk membuat URL pendek
app.post('/api/shorten', async (req, res) => {
  try {
    const { longUrl } = req.body;

    if (!longUrl) {
      return res.status(400).json({ error: 'longUrl wajib diisi' });
    }
    
    try {
      new URL(longUrl);
    } catch (_) {
      return res.status(400).json({ error: 'Format URL tidak valid' });
    }

    const shortCode = nanoid(7);
    await redis.set(shortCode, longUrl);

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = process.env.VERCEL_URL ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    const shortUrl = `${baseUrl}/${shortCode}`;

    return res.status(200).json({ shortUrl });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan internal pada server' });
  }
});

// Endpoint untuk pengalihan ke halaman transit
app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;
        
        // Mencegah file statis diinterpretasikan sebagai short code
        if (['style.css', 'script.js', 'favicon.ico', 'transit.html'].includes(shortCode)) {
            // Biarkan express.static yang menangani permintaan ini
            // Mengirim 404 jika file tidak ditemukan oleh static handler
            return res.status(404).end(); 
        }
        
        const longUrl = await redis.get(shortCode);

        if (longUrl) {
            // Arahkan pengguna ke halaman transit.html, sambil mengirimkan
            // URL tujuan asli sebagai parameter query.
            // encodeURIComponent sangat penting untuk menangani karakter khusus dalam URL.
            const transitPageUrl = `/transit.html?url=${encodeURIComponent(longUrl)}`;
            return res.redirect(transitPageUrl);
        } else {
            // Jika short code tidak ditemukan, kembalikan pengguna ke halaman utama.
            return res.status(404).sendFile(path.join(publicPath, 'index.html'));
        }
    } catch (error) {
        console.error('Redirect Error:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan internal pada server' });
    }
});

module.exports = app;
