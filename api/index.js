const express = require('express');
const path = require('path');
const Redis = require('ioredis');
const { nanoid } = require('nanoid');
const cheerio = require('cheerio');
const QRCode = require('qrcode');

const redis = new Redis(process.env.KV_REDIS_URL || process.env.REDIS_URL);

const app = express();
app.use(express.json());

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.post('/api/shorten', async (req, res) => {
    // ... (Logika endpoint ini tidak berubah)
    try {
        const { longUrl } = req.body;
        if (!longUrl) return res.status(400).json({ error: 'longUrl wajib diisi' });
        
        let title = 'Judul tidak tersedia';
        let description = 'Deskripsi tidak tersedia.';
        try {
          new URL(longUrl);
          const response = await fetch(longUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }});
          if (response.ok) {
            const html = await response.text();
            const $ = cheerio.load(html);
            title = $('title').text() || title;
            description = $('meta[name="description"]').attr('content') || description;
          }
        } catch (fetchError) {
          console.warn(`Gagal memvalidasi atau mengambil metadata untuk ${longUrl}:`, fetchError.message);
          return res.status(400).json({ error: 'URL yang dimasukkan tidak valid atau tidak dapat diakses.' });
        }
    
        const shortCode = nanoid(7);
        await redis.set(shortCode, JSON.stringify({ longUrl, title, description }));
    
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const protocol = process.env.VERCEL_URL ? 'https' : 'http';
        const shortUrl = `${protocol}://${host}/${shortCode}`;
        return res.status(200).json({ shortUrl });
      } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan internal pada server' });
      }
});

// Penyesuaian kecil di sini untuk mengabaikan transit.js
app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;

        // Cek ini untuk memastikan permintaan untuk file statis tidak diproses sebagai short code
        // Menambahkan 'transit.js' ke dalam daftar
        const staticFiles = ['style.css', 'script.js', 'transit.js', 'favicon.ico', 'transit.html', 'terms.html', 'privacy.html', 'dmca.html'];
        if (staticFiles.includes(shortCode)) {
            // Biarkan express.static yang menanganinya dengan benar
            return res.status(404).end();
        }

        const jsonData = await redis.get(shortCode);

        // ... sisa logika endpoint ini tidak berubah ...
        if (!jsonData) {
            return res.status(404).sendFile(path.join(publicPath, 'index.html'));
        }

        const data = JSON.parse(jsonData);
        const { longUrl, title, description } = data;

        const botUserAgents = ['facebookexternalhit', 'twitterbot', 'linkedinbot', 'discordbot', 'pinterest', 'whatsapp', 'telegrambot'];
        const userAgent = (req.headers['user-agent'] || '').toLowerCase();
        const isBot = botUserAgents.some(bot => userAgent.includes(bot));

        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const protocol = process.env.VERCEL_URL ? 'https' : 'http';
        const shortUrl = `${protocol}://${host}/${shortCode}`;

        if (isBot) {
            const qrCodeDataUri = await QRCode.toDataURL(shortUrl, { errorCorrectionLevel: 'H' });
            const html = `
                <!DOCTYPE html><html lang="id"><head>
                    <title>${title.replace(/"/g, '&quot;')}</title>
                    <meta name="description" content="${description.replace(/"/g, '&quot;')}">
                    <meta property="og:title" content="${title.replace(/"/g, '&quot;')}">
                    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}">
                    <meta property="og:url" content="${longUrl}">
                    <meta property="og:image" content="${qrCodeDataUri}">
                    <meta name="twitter:card" content="summary_large_image">
                    <meta http-equiv="refresh" content="0; url=${longUrl}">
                </head><body><p>Redirecting to <a href="${longUrl}">${longUrl}</a></p></body></html>
            `;
            return res.status(200).setHeader('Content-Type', 'text/html').send(html);
        }

        const qrCodeDataUri = await QRCode.toDataURL(shortUrl, { errorCorrectionLevel: 'H' });
        const params = new URLSearchParams({
            url: longUrl,
            title: title,
            description: description,
            qr: qrCodeDataUri
        });
        return res.redirect(`/transit.html?${params.toString()}`);

    } catch (error) {
        console.error('Redirect Error:', error);
        return res.status(500).sendFile(path.join(publicPath, 'index.html'));
    }
});

module.exports = app;
