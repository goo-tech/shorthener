const express = require('express');
const path = require('path');
const Redis = require('ioredis');
const { nanoid } = require('nanoid');
// Impor cheerio untuk parsing HTML
const cheerio = require('cheerio');

const redis = new Redis(process.env.KV_REDIS_URL);

const app = express();
app.use(express.json());

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// --- PERUBAHAN PADA ENDPOINT /api/shorten ---
app.post('/api/shorten', async (req, res) => {
  try {
    const { longUrl } = req.body;

    if (!longUrl) {
      return res.status(400).json({ error: 'longUrl wajib diisi' });
    }
    
    let title = 'Judul tidak tersedia';
    let description = 'Deskripsi tidak tersedia.';

    try {
      // Fetch konten dari URL tujuan untuk mendapatkan metadata
      const response = await fetch(longUrl);
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        title = $('title').text() || title;
        description = $('meta[name="description"]').attr('content') || description;
      }
    } catch (fetchError) {
      console.warn(`Gagal mengambil metadata untuk ${longUrl}:`, fetchError.message);
      // Jika fetch gagal, kita tetap lanjutkan tanpa metadata
    }

    const shortCode = nanoid(7);
    
    // Simpan data sebagai objek JSON yang di-string-kan
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

// --- PERUBAHAN PADA ENDPOINT /:shortCode ---
app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;
        
        if (['style.css', 'script.js', 'favicon.ico', 'transit.html'].includes(shortCode)) {
            return res.status(404).end(); 
        }
        
        // Ambil data JSON dari Redis
        const jsonData = await redis.get(shortCode);

        if (jsonData) {
            // Parse data JSON kembali menjadi objek
            const data = JSON.parse(jsonData);

            // Kirim semua data (url, title, description) sebagai parameter
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
