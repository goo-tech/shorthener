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

            // Tambahkan pengecekan jika fetch gambar gagal
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
            // Berikan pesan error yang lebih jelas kepada pengguna
            console.error("Gagal membagikan QR code:", err);
            alert("Gagal membagikan gambar QR code. Silakan coba unduh dan bagikan secara manual.");
        }
    });
}
