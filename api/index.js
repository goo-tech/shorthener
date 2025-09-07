// Mengimpor paket yang dibutuhkan
const express = require('express');
const path = require('path');
const { kv } = require('@vercel/kv');
const { nanoid } = require('nanoid');

// Membuat aplikasi Express
const app = express();

// Middleware untuk membaca body JSON dari request
app.use(express.json());

// Middleware untuk menyajikan file statis dari folder 'public'
// Ini akan menyajikan index.html, style.css, dan script.js
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Endpoint API untuk membuat URL pendek
app.post('/api/shorten', async (req, res) => {
  try {
    const { longUrl } = req.body;

    // Validasi URL
    if (!longUrl) {
      return res.status(400).json({ error: 'longUrl wajib diisi' });
    }
    // Cek format URL sederhana
    try {
      new URL(longUrl);
    } catch (_) {
      return res.status(400).json({ error: 'Format URL tidak valid' });
    }

    // Buat kode unik yang pendek (7 karakter)
    const shortCode = nanoid(7);

    // Simpan pasangan kode pendek -> URL panjang di database Vercel KV
    await kv.set(shortCode, longUrl);

    // Dapatkan baseUrl. Prioritaskan header dari Vercel untuk domain kustom.
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = process.env.VERCEL_URL ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    const shortUrl = `${baseUrl}/${shortCode}`;

    // Kirim URL pendek sebagai respons
    return res.status(200).json({ shortUrl });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Terjadi kesalahan internal pada server' });
  }
});

// Endpoint untuk pengalihan (redirect)
app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;
        
        // Jangan proses request ke file statis atau API
        if (shortCode === 'style.css' || shortCode === 'script.js' || shortCode === 'favicon.ico') {
            return res.status(204).send();
        }
        
        // Cari URL panjang di database berdasarkan shortCode
        const longUrl = await kv.get(shortCode);

        if (longUrl) {
            // Jika ditemukan, alihkan pengguna ke URL asli
            return res.redirect(301, longUrl);
        } else {
            // Jika tidak ditemukan, sajikan halaman 404 sederhana atau kembali ke halaman utama
            return res.status(404).sendFile(path.join(publicPath, 'index.html'));
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Terjadi kesalahan internal pada server' });
    }
});

// Export aplikasi agar bisa digunakan oleh Vercel
module.exports = app;
