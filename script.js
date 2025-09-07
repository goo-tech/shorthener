document.getElementById('shorten-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const longUrl = document.getElementById('long-url').value;
    const resultDiv = document.getElementById('result');
    const shortUrlLink = document.getElementById('short-url');

    // Ini adalah contoh FAKE API call. Ganti dengan URL API Anda yang sebenarnya.
    const response = await fetch('https://shortener.vercel.app/shorten', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: longUrl })
    });

    if (response.ok) {
        const data = await response.json();
        shortUrlLink.href = data.shortUrl;
        shortUrlLink.textContent = data.shortUrl;
        resultDiv.classList.remove('hidden');
    } else {
        alert('Failed to shorten URL. Please try again.');
    }
});

document.getElementById('copy-btn').addEventListener('click', function() {
    const shortUrl = document.getElementById('short-url').textContent;
    navigator.clipboard.writeText(shortUrl).then(() => {
        alert('Copied to clipboard!');
    });
});