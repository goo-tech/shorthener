document.getElementById('shorten-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const longUrl = document.getElementById('long-url').value;
    const resultDiv = document.getElementById('result');
    const shortUrlLink = document.getElementById('short-url');
    const errorMessageDiv = document.getElementById('error-message');
    const shortenButton = event.target.querySelector('button');

    // Reset UI
    resultDiv.classList.add('hidden');
    errorMessageDiv.classList.add('hidden');
    shortenButton.textContent = 'Memendekkan...';
    shortenButton.disabled = true;

    try {
        // Ganti dengan URL /api/shorten saja. Browser akan otomatis menggunakan domain yang sama.
        const response = await fetch('/api/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ longUrl: longUrl })
        });

        const data = await response.json();

        if (response.ok) {
            shortUrlLink.href = data.shortUrl;
            shortUrlLink.textContent = data.shortUrl;
            resultDiv.classList.remove('hidden');
        } else {
            // Tampilkan pesan error dari server
            throw new Error(data.error || 'Terjadi kesalahan.');
        }

    } catch (error) {
        errorMessageDiv.textContent = error.message;
        errorMessageDiv.classList.remove('hidden');
    } finally {
        // Kembalikan tombol ke keadaan semula
        shortenButton.textContent = 'Pendekkan';
        shortenButton.disabled = false;
    }
});

document.getElementById('copy-btn').addEventListener('click', function() {
    const shortUrl = document.getElementById('short-url').textContent;
    navigator.clipboard.writeText(shortUrl).then(() => {
        alert('URL pendek berhasil disalin!');
    });
});
