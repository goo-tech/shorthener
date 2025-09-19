function initializeShareButtons(shortUrl) {
    const shareLinkBtn = document.getElementById('share-link-btn');
    const shareQrBtn = document.getElementById('share-qr-btn');

    // Jika browser tidak mendukung Web Share API, jangan lakukan apa-apa.
    if (!navigator.share) {
        return;
    }

    // Jika didukung, tampilkan tombol-tombol yang relevan.
    shareLinkBtn.classList.remove('hidden');
    shareQrBtn.classList.remove('hidden');

    // Tambahkan event listener untuk membagikan tautan.
    shareLinkBtn.onclick = () => {
        navigator.share({
            title: 'URL Pendek',
            text: `Ini URL pendek yang baru saja saya buat: ${shortUrl}`,
            url: shortUrl
        }).catch(err => console.error("Gagal membagikan tautan:", err));
    };

    // Tambahkan event listener untuk membagikan gambar QR code.
    shareQrBtn.onclick = async () => {
        try {
            const qrCodeImageUrl = `${shortUrl}/qr`;
            const response = await fetch(qrCodeImageUrl);
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
            alert("Gagal membagikan gambar QR code.");
        }
    };
}

