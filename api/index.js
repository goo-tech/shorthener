const express = require('express');
const path = require('path');
// Impor ioredis, klien Redis standar
const Redis = require('ioredis');
// Impor nanoid v3 untuk kompatibilitas
const { nanoid } = require('nanoid');

// Membuat koneksi ke Redis Cloud.
// ioredis akan secara otomatis membaca dan menggunakan variabel lingkungan REDIS_URL.
const redis = new Redis(process.env.REDIS_URL);

const app = express();
app.use(express.json());

// Sajikan file front-end statis dari folder 'public'
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Endpoint API untuk membuat URL pendek
app.post('/api/shorten', async (req, res) => {
  try {
    const { longUrl } = req.body;

    if (!longUrl) {
      return res.status(400).json({ error: 'longUrl wajib diisi' });
    }
    
    // Validasi sederhana untuk memastikan itu adalah URL yang valid
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

// Endpoint untuk pengalihan (redirect)
app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;
        const longUrl = await redis.get(shortCode);

        if (longUrl) {
            return res.redirect(301, longUrl);
        } else {
            // Jika tidak ditemukan, sajikan halaman utama (404)
            return res.status(404).sendFile(path.join(publicPath, 'index.html'));
        }
    } catch (error) {
        console.error('Redirect Error:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan internal pada server' });
    }
});

module.exports = app;

