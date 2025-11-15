const express = require('express');
const path = require('path');
const Redis = require('ioredis');
const { nanoid } = require('nanoid');
const cheerio = require('cheerio');
const QRCode = require('qrcode');
const { HfInference } = require('@huggingface/inference');

const redis = new Redis(process.env.KV_REDIS_URL || process.env.REDIS_URL);
const RECENT_URLS_KEY = 'recent_urls';

// Initialize Hugging Face
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const app = express();
app.use(express.json());

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Endpoint untuk generate QR Art
app.post('/api/generate-qr-art', async (req, res) => {
  try {
    const { shortCode, prompt } = req.body;
    
    if (!shortCode || !prompt) {
      return res.status(400).json({ error: 'shortCode dan prompt wajib diisi' });
    }

    // Ambil data dari Redis
    const jsonData = await redis.get(shortCode);
    if (!jsonData) {
      return res.status(404).json({ error: 'Short URL tidak ditemukan' });
    }

    const data = JSON.parse(jsonData);
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = process.env.VERCEL_URL ? 'https' : 'http';
    const shortUrl = `${protocol}://${host}/${shortCode}`;

    // Generate QR code base
    const qrCodeBuffer = await QRCode.toBuffer(shortUrl, {
      errorCorrectionLevel: 'H',
      width: 768,
      margin: 1,
      type: 'png'
    });

    // Convert buffer to base64
    const base64Data = qrCodeBuffer.toString('base64');

    try {
      // Generate artistic QR code menggunakan Hugging Face
      const result = await hf.textToImage({
        model: "DionTimmer/controlnet_qrcode-controlnet-v1-1",
        inputs: prompt,
        parameters: {
          num_inference_steps: 20,
          guidance_scale: 7.5,
        }
      }, {
        qr_code_image: base64Data,
      });

      // Convert blob to base64
      const arrayBuffer = await result.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const artisticQrBase64 = buffer.toString('base64');
      const artisticQrDataUrl = `data:image/png;base64,${artisticQrBase64}`;

      // Simpan hasil ke Redis (opsional)
      const artKey = `qr_art:${shortCode}:${nanoid(5)}`;
      await redis.setex(artKey, 86400, JSON.stringify({ // Expire dalam 24 jam
        prompt,
        artisticQrDataUrl,
        createdAt: new Date().toISOString()
      }));

      res.json({
        artisticQrDataUrl,
        artKey,
        prompt
      });

    } catch (hfError) {
      console.error('Hugging Face API Error:', hfError);
      
      // Fallback: generate QR code dengan styling
      const styledQrBuffer = await QRCode.toBuffer(shortUrl, {
        errorCorrectionLevel: 'H',
        width: 500,
        margin: 2,
        color: {
          dark: '#667eea',
          light: '#f8f9fa'
        },
        type: 'png'
      });
      
      const styledQrBase64 = styledQrBuffer.toString('base64');
      const styledQrDataUrl = `data:image/png;base64,${styledQrBase64}`;
      
      res.json({
        artisticQrDataUrl: styledQrDataUrl,
        artKey: `fallback:${shortCode}:${nanoid(5)}`,
        prompt: `${prompt} (Fallback Mode)`,
        fallback: true
      });
    }

  } catch (error) {
    console.error('QR Art Generation Error:', error);
    
    res.status(500).json({ 
      error: 'Gagal menghasilkan QR code artistik',
      fallback: true 
    });
  }
});

// Endpoint untuk mendapatkan hasil yang disimpan
app.get('/api/qr-art/:artKey', async (req, res) => {
  try {
    const { artKey } = req.params;
    const artData = await redis.get(artKey);
    
    if (!artData) {
      return res.status(404).json({ error: 'QR art tidak ditemukan' });
    }
    
    const parsedData = JSON.parse(artData);
    
    // Jika berupa data URL, kirim sebagai image
    if (parsedData.artisticQrDataUrl && parsedData.artisticQrDataUrl.startsWith('data:image')) {
      const base64Data = parsedData.artisticQrDataUrl.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24 jam
      return res.send(imageBuffer);
    }
    
    res.json(parsedData);
  } catch (error) {
    console.error('Get QR Art Error:', error);
    res.status(500).json({ error: 'Gagal mengambil QR art' });
  }
});

// Endpoint untuk mendapatkan daftar QR art berdasarkan shortCode
app.get('/api/qr-art/history/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const pattern = `qr_art:${shortCode}:*`;
    
    // Cari semua keys yang match pattern
    const keys = await redis.keys(pattern);
    const artHistory = [];
    
    for (const key of keys) {
      const artData = await redis.get(key);
      if (artData) {
        const parsedData = JSON.parse(artData);
        artHistory.push({
          artKey: key,
          prompt: parsedData.prompt,
          createdAt: parsedData.createdAt,
          fallback: parsedData.fallback || false
        });
      }
    }
    
    // Urutkan berdasarkan createdAt (terbaru pertama)
    artHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ artHistory });
  } catch (error) {
    console.error('QR Art History Error:', error);
    res.status(500).json({ error: 'Gagal mengambil riwayat QR art' });
  }
});

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

    const recentEntry = { shortCode, title, createdAt: new Date().toISOString() };
    await redis.lpush(RECENT_URLS_KEY, JSON.stringify(recentEntry));
    await redis.ltrim(RECENT_URLS_KEY, 0, 9);

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = process.env.VERCEL_URL ? 'https' : 'http';
    const shortUrl = `${protocol}://${host}/${shortCode}`;
    return res.status(200).json({ shortUrl });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan internal pada server' });
  }
});

app.get('/api/recent', async (req, res) => {
    try {
        const recentJsonStrings = await redis.lrange(RECENT_URLS_KEY, 0, 9);
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const protocol = process.env.VERCEL_URL ? 'https' : 'http';
        const baseUrl = `${protocol}://${host}`;
        const recentUrls = recentJsonStrings.map(jsonString => {
            const entry = JSON.parse(jsonString);
            return {
                shortUrl: `${baseUrl}/${entry.shortCode}`,
                title: entry.title
            };
        });
        return res.status(200).json({ recentUrls });
    } catch (error) {
        console.error('Recent URLs Fetch Error:', error);
        return res.status(500).json({ error: 'Gagal mengambil URL terbaru.' });
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
        const qrOptions = { type: 'png', width: 640, margin: 6, errorCorrectionLevel: 'H' };
        const qrCodeBuffer = await QRCode.toBuffer(shortUrl, qrOptions);
        res.setHeader('Content-Type', 'image/png');
        res.send(qrCodeBuffer);
    } catch (error) {
        console.error('QR Code Generation Error:', error);
        res.status(500).send('Could not generate QR code');
    }
});

// Endpoint untuk QR code dengan styling
app.get('/:shortCode/qr/styled', async (req, res) => {
    try {
        const { shortCode } = req.params;
        const jsonData = await redis.get(shortCode);
        if (!jsonData) {
            return res.status(404).send('Short URL Not Found');
        }
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const protocol = process.env.VERCEL_URL ? 'https' : 'http';
        const shortUrl = `${protocol}://${host}/${shortCode}`;
        
        const qrOptions = { 
            type: 'png', 
            width: 640, 
            margin: 4, 
            errorCorrectionLevel: 'H',
            color: {
                dark: '#667eea',
                light: '#f8f9fa'
            }
        };
        
        const qrCodeBuffer = await QRCode.toBuffer(shortUrl, qrOptions);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(qrCodeBuffer);
    } catch (error) {
        console.error('Styled QR Code Generation Error:', error);
        res.status(500).send('Could not generate styled QR code');
    }
});

app.get('/:shortCode', async (req, res) => {
    try {
        const userAgent = (req.headers['user-agent'] || '').toLowerCase();
        console.log(`[LOG] User-Agent terdeteksi: ${userAgent}`);

        const { shortCode } = req.params;
        const staticPages = ['terms', 'privacy', 'dmca', 'transit', 'recent'];
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
        const isBot = botUserAgents.some(bot => userAgent.includes(bot));

        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const protocol = process.env.VERCEL_URL ? 'https' : 'http';
        const shortUrl = `${protocol}://${host}/${shortCode}`;

        if (isBot) {
            const qrCodeImageUrl = `${shortUrl}/qr`;
            const html = `
                <!DOCTYPE html><html lang="id"><head>
                    <title>${title.replace(/"/g, '&quot;')}</title>
                    <meta name="description" content="${description.replace(/"/g, '&quot;')}">
                    <meta property="og:title" content="${title.replace(/"/g, '&quot;')}">
                    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}">
                    <meta property="og:url" content="${shortUrl}">
                    <meta property="og:image" content="${qrCodeImageUrl}">
                    <meta property="og:image:width" content="640">
                    <meta property="og:image:height" content="640">
                    <meta name="twitter:card" content="summary_large_image">
                </head><body><p>Ini adalah halaman pratinjau untuk URL pendek. Anda dapat mengunjungi tautan aslinya di <a href="${longUrl}">${longUrl}</a>.</p></body></html>
            `;
            return res.status(200).setHeader('Content-Type', 'text/html').send(html);
        }

        const qrCodeDataUri = await QRCode.toDataURL(shortUrl, { errorCorrectionLevel: 'H' });
        const params = new URLSearchParams({ 
            url: longUrl, 
            title: title, 
            description: description,
            qr: qrCodeDataUri,
            surl: shortUrl
        });
        if (ogImage) {
            params.append('image', ogImage);
        }
        return res.redirect(`/transit.html?${params.toString()}`);
    } catch (error) {
        console.error('Redirect Error:', error);
        return res.status(500).sendFile(path.join(publicPath, 'index.html'));
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        features: {
            qrArt: true,
            urlShortening: true,
            redis: true
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan internal pada server' });
});

// 404 handler untuk API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint API tidak ditemukan' });
});

module.exports = app;