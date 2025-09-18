document.addEventListener('DOMContentLoaded', () => {
    // Logika hamburger juga berlaku di halaman transit
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navLinks.classList.toggle("active");
        });
    }

    // Logika spesifik untuk halaman transit
    const urlParams = new URLSearchParams(window.location.search);
    
    const destinationUrl = urlParams.get('url');
    const title = urlParams.get('title');
    const description = urlParams.get('description');
    const qrCodeDataUri = urlParams.get('qr');
    const imageUrl = urlParams.get('image');

    const titleElement = document.getElementById('page-title');
    const descriptionElement = document.getElementById('page-description');
    const destinationElement = document.getElementById('destination-url');
    const manualLink = document.getElementById('manual-link');
    const countdownElement = document.getElementById('countdown');
    const previewImage = document.getElementById('preview-image');

    if (destinationUrl) {
        // Perbarui meta tag secara dinamis
        document.title = title || 'Mengalihkan Anda...';
        let metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', description || 'Anda sedang dialihkan ke halaman tujuan.');
        let metaOgImage = document.querySelector('meta[property="og:image"]');
        if (metaOgImage && qrCodeDataUri) metaOgImage.setAttribute('content', qrCodeDataUri);
        
        // Tampilkan gambar pratinjau jika ada
        if (imageUrl && previewImage) {
            previewImage.src = imageUrl;
            previewImage.classList.remove('hidden');
        }

        if(titleElement) titleElement.textContent = title || 'Judul Tidak Tersedia';
        if(descriptionElement) descriptionElement.textContent = description || '';
        if(destinationElement) destinationElement.textContent = destinationUrl;
        if(manualLink) manualLink.href = destinationUrl;

        let seconds = 15;
        if (countdownElement) {
            countdownElement.textContent = seconds;

            setTimeout(() => {
                window.location.href = destinationUrl;
            }, 15000);

            const interval = setInterval(() => {
                seconds--;
                if (seconds >= 0) {
                    countdownElement.textContent = seconds;
                }
                if (seconds < 0) {
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


