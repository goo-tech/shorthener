document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");

    if (hamburger && navLinks) {
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

        resultDiv.classList.add('hidden');
        errorMessageDiv.classList.add('hidden');
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

                const qrCanvas = document.getElementById('qr-code-canvas');
                const downloadBtn = document.getElementById('download-qr-btn');
                QRCode.toCanvas(qrCanvas, data.shortUrl, { width: 300 }, function (error) {
                    if (error) console.error(error);
                    downloadBtn.href = qrCanvas.toDataURL('image/png');
                });

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
if (copyBtn) {
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
