document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navLinks.classList.toggle("active");
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    
    const destinationUrl = urlParams.get('url');
    const title = urlParams.get('title');
    const description = urlParams.get('description');
    const qrCodeDataUri = urlParams.get('qr');
    const imageUrl = urlParams.get('image');
    const shortUrl = urlParams.get('surl');

    const titleElement = document.getElementById('page-title');
    const descriptionElement = document.getElementById('page-description');
    const destinationElement = document.getElementById('destination-url');
    const manualLink = document.getElementById('manual-link');
    const countdownElement = document.getElementById('countdown');
    const previewImage = document.getElementById('preview-image');
    const shareQrBtnTransit = document.getElementById('share-qr-btn-transit');
    const transitShareActions = document.getElementById('transit-share-actions');

    if (destinationUrl) {
        document.title = title || 'Mengalihkan Anda...';
        
        let metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && description) {
            metaDescription.setAttribute('content', description);
        }

        let metaOgImage = document.querySelector('meta[property="og:image"]');
        if (metaOgImage && qrCodeDataUri) {
            metaOgImage.setAttribute('content', qrCodeDataUri);
        }

        if(titleElement) titleElement.textContent = title || 'Judul Tidak Tersedia';
        if(descriptionElement) descriptionElement.textContent = description || '';
        if(destinationElement) destinationElement.textContent = destinationUrl;
        if(manualLink) manualLink.href = destinationUrl;

        if (previewImage) {
            if (imageUrl) {
                previewImage.src = imageUrl;
                previewImage.classList.remove('hidden');
            } 
            else if (qrCodeDataUri) {
                previewImage.src = qrCodeDataUri;
                previewImage.classList.remove('hidden');
            }
        }

        if (navigator.share && shortUrl && shareQrBtnTransit && transitShareActions) {
            transitShareActions.classList.remove('hidden');
            shareQrBtnTransit.addEventListener('click', async () => {
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
                    alert("Gagal membagikan gambar QR code.");
                }
            });
        }

        let seconds = 15;
        if(countdownElement) {
            countdownElement.textContent = seconds;

            setTimeout(() => {
                window.location.href = destinationUrl;
            }, 15000);

            const interval = setInterval(() => {
                seconds--;
                if (seconds >= 0) {
                    countdownElement.textContent = seconds;
                } else {
                    clearInterval(interval);
                }
            }, 1000);
        }

    } else {
        if(titleElement) titleElement.textContent = 'URL Tujuan Tidak Valid';
        if(destinationElement) destinationElement.textContent = 'URL tujuan tidak ditemukan.';
        const countdownContainer = document.querySelector('.countdown');
        if(countdownContainer) countdownContainer.style.display = 'none';
    }
});