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
  try {
    const { longUrl } = req.body;
    if (!longUrl) {
      return res.status(400).json({ error: 'longUrl wajib diisi' });
    }
    
    let title = 'Judul tidak tersedia';
    let description = 'Deskripsi tidak tersedia.';
    let ogImage = null;

    try {
      new URL(longUrl);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(longUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        title = $('title').text() || title;
        description = $('meta[name="description"]').attr('content') || description;
        ogImage = $('meta[property="og:image"]').attr('content') || null;
      }
    } catch (fetchError) {
      console.warn(`Gagal memvalidasi atau mengambil metadata untuk ${longUrl}:`, fetchError.message);
      return res.status(400).json({ error: 'URL yang dimasukkan tidak valid atau tidak dapat diakses.' });
    }

    const shortCode = nanoid(7);
    await redis.set(shortCode, JSON.stringify({ longUrl, title, description, ogImage }));

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = process.env.VERCEL_URL ? 'https' : 'http';
    const shortUrl = `${protocol}://${host}/${shortCode}`;
    return res.status(200).json({ shortUrl });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan internal pada server' });
  }
});

app.get('/:shortCode/qr', async (req, res) => {
    try {
        const { shortCode } = req.params;
        const jsonData = await redis.get(shortCode);
        if (!jsonData) {
            return res.status(404).send('Short URL Not Found');
        }
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const protocol = process.env.VERCEL_URL ? 'https' : 'http';
        const shortUrl = `${protocol}://${host}/${shortCode}`;
        const qrOptions = { type: 'png', width: 256, margin: 2, errorCorrectionLevel: 'H' };
        const qrCodeBuffer = await QRCode.toBuffer(shortUrl, qrOptions);
        res.setHeader('Content-Type', 'image/png');
        res.send(qrCodeBuffer);
    } catch (error) {
        console.error('QR Code Generation Error:', error);
        res.status(500).send('Could not generate QR code');
    }
});

app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;
        const staticPages = ['terms', 'privacy', 'dmca', 'transit'];
        if (shortCode.includes('.') || staticPages.includes(shortCode)) {
            return res.status(404).sendFile(path.join(publicPath, 'index.html'));
        }

        const jsonData = await redis.get(shortCode);
        if (!jsonData) {
            return res.status(404).sendFile(path.join(publicPath, 'index.html'));
        }

        const data = JSON.parse(jsonData);
        const { longUrl, title, description, ogImage } = data;

        const botUserAgents = ['facebookexternalhit', 'twitterbot', 'linkedinbot', 'discordbot', 'pinterest', 'whatsapp', 'telegrambot'];
        const userAgent = (req.headers['user-agent'] || '').toLowerCase();
        const isBot = botUserAgents.some(bot => userAgent.includes(bot));

        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const protocol = process.env.VERCEL_URL ? 'https' : 'http';
        const shortUrl = `${protocol}://${host}/${shortCode}`;

        if (isBot) {
            const qrOptions = { errorCorrectionLevel: 'H', type: 'image/png', width: 600, margin: 2 };
            const qrCodeDataUri = await QRCode.toDataURL(shortUrl, qrOptions);
            const html = `
                <!DOCTYPE html><html lang="id"><head>
                    <title>${title.replace(/"/g, '&quot;')}</title>
                    <meta name="description" content="${description.replace(/"/g, '&quot;')}">
                    <meta property="og:title" content="${title.replace(/"/g, '&quot;')}">
                    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}">
                    <meta property="og:url" content="${shortUrl}">
                    <meta property="og:image" content="${qrCodeDataUri}">
                    <meta property="og:image:width" content="600">
                    <meta property="og:image:height" content="600">
                    <meta name="twitter:card" content="summary_large_image">
                    <meta http-equiv="refresh" content="0; url=${longUrl}">
                </head><body><p>Redirecting to <a href="${longUrl}">${longUrl}</a></p></body></html>
            `;
            return res.status(200).setHeader('Content-Type', 'text/html').send(html);
        }

        const qrCodeDataUri = await QRCode.toDataURL(shortUrl, { errorCorrectionLevel: 'H' });
        const params = new URLSearchParams({ url: longUrl, title, description, qr: qrCodeDataUri });
        if (ogImage) {
            params.append('image', ogImage);
        }
        return res.redirect(`/transit.html?${params.toString()}`);
    } catch (error) {
        console.error('Redirect Error:', error);
        return res.status(500).sendFile(path.join(publicPath, 'index.html'));
    }
});

module.exports = app;