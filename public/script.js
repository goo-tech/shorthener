document.addEventListener('DOMContentLoaded', () => {
    const shortenForm = document.getElementById('shorten-form');
    const longUrlInput = document.getElementById('long-url');
    const resultDiv = document.getElementById('result');
    const shortUrlLink = document.getElementById('short-url');
    const copyBtn = document.getElementById('copy-btn');
    const copyFeedback = document.getElementById('copy-feedback');

    shortenForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const longUrl = longUrlInput.value;
        const shortenButton = this.querySelector('button');

        // Nonaktifkan tombol dan tampilkan status loading
        shortenButton.disabled = true;
        shortenButton.textContent = 'Memproses...';
        resultDiv.classList.add('hidden'); // Sembunyikan hasil lama

        try {
            // PENTING: URL ini akan kita ganti nanti dengan URL Vercel kita yang sebenarnya
            const apiUrl = '/api/shorten'; // Menggunakan path relatif untuk development dan production

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ longUrl: longUrl })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Terjadi kesalahan pada server.');
            }

            const data = await response.json();
            shortUrlLink.href = data.shortUrl;
            shortUrlLink.textContent = data.shortUrl;
            resultDiv.classList.remove('hidden');

        } catch (error) {
            alert(`Gagal memendekkan URL: ${error.message}`);
        } finally {
            // Aktifkan kembali tombol
            shortenButton.disabled = false;
            shortenButton.textContent = 'Pendekkan';
        }
    });

    copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(shortUrlLink.href).then(() => {
            copyFeedback.classList.remove('hidden');
            setTimeout(() => {
                copyFeedback.classList.add('hidden');
            }, 2000); // Sembunyikan pesan setelah 2 detik
        }).catch(err => {
            console.error('Gagal menyalin teks: ', err);
            alert('Gagal menyalin URL.');
        });
    });
});
