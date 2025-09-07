// File: api/index.js

const express = require('express');
const { kv } = require('@vercel/kv');
const { nanoid } = require('nanoid');

const app = express();
// Middleware untuk membaca JSON dari body request
app.use(express.json());

// Endpoint untuk membuat URL pendek
app.post('/api/shorten', async (req, res) => {
  try {
    const { longUrl } = req.body;

    // Validasi sederhana
    if (!longUrl) {
      return res.status(400).json({ error: 'longUrl is required' });
    }

    // Buat ID unik yang pendek (misal: 7 karakter)
    const shortCode = nanoid(7);

    // Simpan pasangan shortCode -> longUrl di database Vercel KV
    await kv.set(shortCode, longUrl);

    // Bangun URL pendek yang lengkap
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const shortUrl = `${baseUrl}/${shortCode}`;

    // Kirim kembali URL pendek sebagai respons
    return res.status(200).json({ shortUrl });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint untuk redirection
app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;

        // Cari URL panjang di database berdasarkan shortCode
        const longUrl = await kv.get(shortCode);

        if (longUrl) {
            // Jika ditemukan, arahkan pengguna ke URL asli
            // 301 Moved Permanently adalah kode status yang tepat untuk ini
            return res.redirect(301, longUrl);
        } else {
            // Jika tidak ditemukan, kirim error 404
            return res.status(404).json({ error: 'Short URL not found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Export app agar bisa digunakan oleh Vercel
module.exports = app;