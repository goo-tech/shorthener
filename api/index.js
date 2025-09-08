const express = require('express');
const path = require('path');
const Redis = require('ioredis');
const { nanoid } = require('nanoid');
const cheerio = require('cheerio');

// Membuat koneksi ke Redis Cloud menggunakan variabel lingkungan.
// Ganti 'KV_REDIS_URL' dengan 'REDIS_URL' jika Anda menggunakan nama itu.
const redis = new Redis(process.env.KV_REDIS_URL || process.env.REDIS_URL);

const app = express();
app.use(express.json());

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Endpoint API untuk membuat URL pendek
app.post('/api/shorten', async (req, res) => {
  try {
    const { longUrl } = req.body;

    if (!longUrl) {
      return res.status(400).json({ error: 'longUrl wajib diisi' });
    }
    
    let title = 'Judul tidak tersedia';
    let description = 'Deskripsi tidak tersedia.';

    try {
      new URL(longUrl); // Validasi format URL dasar
      const response = await fetch(longUrl);
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        title = $('title').text() || title;
        description = $('meta[name="description"]').attr('content') || description;
      }
    } catch (fetchError) {
      console.warn(`Gagal memvalidasi atau mengambil metadata untuk ${longUrl}:`, fetchError.message);
      // Jika fetch gagal atau URL tidak valid, kita bisa mengembalikan error atau melanjutkan tanpa metadata.
      // Untuk pengalaman pengguna yang lebih baik, kita kembalikan error.
      return res.status(400).json({ error: 'URL yang dimasukkan tidak valid atau tidak dapat diakses.' });
    }

    const shortCode = nanoid(7);
    
    const dataToStore = {
      longUrl,
      title,
      description
    };
    await redis.set(shortCode, JSON.stringify(dataToStore));

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
        
        // Cek ini untuk memastikan permintaan untuk file statis tidak diproses sebagai short code
        if (['style.css', 'script.js', 'favicon.ico', 'transit.html'].includes(shortCode)) {
            // Biarkan express.static yang menanganinya
            return res.status(404).end(); 
        }
        
        const jsonData = await redis.get(shortCode);

        if (jsonData) {
            const data = JSON.parse(jsonData);
            const transitPageUrl = `/transit.html?url=${encodeURIComponent(data.longUrl)}&title=${encodeURIComponent(data.title)}&description=${encodeURIComponent(data.description)}`;
            return res.redirect(transitPageUrl);
        } else {
            return res.status(404).sendFile(path.join(publicPath, 'index.html'));
        }
    } catch (error) {
        console.error('Redirect Error:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan internal pada server' });
    }
});

module.exports = app;

