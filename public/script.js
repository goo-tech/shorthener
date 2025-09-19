function initializeShareButtons(shortUrl) {
    const shareLinkBtn = document.getElementById('share-link-btn');
    const shareQrBtn = document.getElementById('share-qr-btn');

    if (!navigator.share || !shareLinkBtn || !shareQrBtn) {
        return;
    }

    shareLinkBtn.classList.remove('hidden');
    shareQrBtn.classList.remove('hidden');

    shareLinkBtn.addEventListener('click', () => {
        navigator.share({
            title: 'URL Pendek',
            text: `Ini URL pendek yang baru saja saya buat: ${shortUrl}`,
            url: shortUrl
        }).catch(err => console.error("Gagal membagikan tautan:", err));
    });

    shareQrBtn.addEventListener('click', async () => {
        try {
            const qrCodeImageUrl = `${shortUrl}/qr`;
            const response = await fetch(qrCodeImageUrl);
            if (!response.ok) {
                throw new Error(`Gagal mengunduh QR code: Status ${response.status}`);
            }
            const blob = await response.blob();
            const file = new File([blob], 'qr-code.png', { type: blob.type });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'QR Code untuk URL Pendek',
                    text: `Pindai QR code ini untuk membuka ${shortUrl}`
                });
            } else {
                alert("Browser Anda tidak mendukung pembagian file gambar ini.");
            }
        } catch (err) {
            console.error("Gagal membagikan QR code:", err);
            alert("Gagal membagikan gambar QR code. Silakan coba unduh dan bagikan secara manual.");
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");

    if (hamburger) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navLinks.classList.toggle("active");
        });
    }
});

const shortenForm = document.getElementById('shorten-form');

if (shortenForm) {
    shortenForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const longUrlInput = document.getElementById('long-url').value;
        const resultDiv = document.getElementById('result');
        const shortUrlLink = document.getElementById('short-url');
        const shortenButton = event.target.querySelector('button');
        const errorMessageDiv = document.getElementById('error-message');
        const qrImage = document.getElementById('qr-code-image');
        const qrActions = document.getElementById('qr-actions');
        const downloadBtn = document.getElementById('download-qr-btn');
        const shareLinkBtn = document.getElementById('share-link-btn');

        resultDiv.classList.add('hidden');
        errorMessageDiv.classList.add('hidden');
        qrActions.classList.add('hidden');
        if (shareLinkBtn) shareLinkBtn.classList.add('hidden');
        errorMessageDiv.textContent = '';

        shortenButton.textContent = 'Memendekkan...';
        shortenButton.disabled = true;

        try {
            const response = await fetch('/api/shorten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ longUrl: longUrlInput })
            });

            if (response.ok) {
                const data = await response.json();
                shortUrlLink.href = data.shortUrl;
                shortUrlLink.textContent = data.shortUrl;
                resultDiv.classList.remove('hidden');

                const qrCodeImageUrl = `${data.shortUrl}/qr`;
                qrImage.src = qrCodeImageUrl;
                downloadBtn.href = qrCodeImageUrl;
                
                qrImage.classList.remove('hidden');
                qrActions.classList.remove('hidden');

                initializeShareButtons(data.shortUrl);

            } else {
                const errorData = await response.json();
                errorMessageDiv.textContent = `Gagal: ${errorData.error || 'Terjadi kesalahan.'}`;
                errorMessageDiv.classList.remove('hidden');
            }
        } catch (error) {
            errorMessageDiv.textContent = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
            errorMessageDiv.classList.remove('hidden');
        } finally {
            shortenButton.textContent = 'Pendekkan';
            shortenButton.disabled = false;
        }
    });
}

const copyBtn = document.getElementById('copy-btn');
if(copyBtn){
    copyBtn.addEventListener('click', function() {
        const shortUrl = document.getElementById('short-url').textContent;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shortUrl).then(() => {
                alert('URL disalin ke clipboard!');
            });
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = shortUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('URL disalin ke clipboard!');
        }
    });
}
