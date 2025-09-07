document.getElementById('shorten-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const longUrlInput = document.getElementById('long-url').value; // Ganti nama variabel agar lebih jelas
    const resultDiv = document.getElementById('result');
    const shortUrlLink = document.getElementById('short-url');
    const shortenButton = event.target.querySelector('button');

    // Tampilkan status loading
    shortenButton.textContent = 'Shortening...';
    shortenButton.disabled = true;

    // Ganti URL dengan URL Vercel Anda yang sebenarnya dan perbaiki endpoint
    const response = await fetch('https://shorthener.vercel.app/api/shorten', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        // Perbaiki nama properti dari 'url' menjadi 'longUrl'
        body: JSON.stringify({ longUrl: longUrlInput })
    });
    
    // Kembalikan tombol ke kondisi semula
    shortenButton.textContent = 'Shorten';
    shortenButton.disabled = false;

    if (response.ok) {
        const data = await response.json();
        shortUrlLink.href = data.shortUrl;
        shortUrlLink.textContent = data.shortUrl;
        resultDiv.classList.remove('hidden');
    } else {
        const errorData = await response.json();
        // Tampilkan pesan error yang lebih spesifik dari server jika ada
        alert(`Failed to shorten URL: ${errorData.error || 'Please try again.'}`);
    }
});

document.getElementById('copy-btn').addEventListener('click', function() {
    const shortUrl = document.getElementById('short-url').textContent;
    navigator.clipboard.writeText(shortUrl).then(() => {
        alert('Copied to clipboard!');
    });
});