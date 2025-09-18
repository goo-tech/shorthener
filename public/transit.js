document.addEventListener('DOMContentLoaded', () => {
    // Logika untuk tombol hamburger menu agar berfungsi di halaman ini
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");
    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navLinks.classList.toggle("active");
        });
    }

    // Logika inti untuk halaman transit
    const urlParams = new URLSearchParams(window.location.search);
    
    const destinationUrl = urlParams.get('url');
    const title = urlParams.get('title');
    const description = urlParams.get('description');
    const qrCodeDataUri = urlParams.get('qr');

    const titleElement = document.getElementById('page-title');
    const descriptionElement = document.getElementById('page-description');
    const destinationElement = document.getElementById('destination-url');
    const manualLink = document.getElementById('manual-link');
    const countdownElement = document.getElementById('countdown');

    if (destinationUrl) {
        // Perbarui meta tag untuk SEO dan pratinjau media sosial
        if (qrCodeDataUri) {
            let metaOgImage = document.querySelector('meta[property="og:image"]');
            if (metaOgImage) metaOgImage.setAttribute('content', qrCodeDataUri);
        }
        if (title) {
            document.title = title;
        }
        if (description) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', description);
        }

        // Tampilkan konten di halaman
        titleElement.textContent = title || 'Judul Tidak Tersedia';
        descriptionElement.textContent = description || 'Deskripsi tidak tersedia.';
        destinationElement.textContent = destinationUrl;
        manualLink.href = destinationUrl;

        // Logika hitung mundur dan pengalihan
        let seconds = 15;
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
    } else {
        // Penanganan jika parameter URL tidak ditemukan
        titleElement.textContent = 'URL Tujuan Tidak Valid';
        destinationElement.textContent = 'URL tujuan tidak ditemukan.';
        if (document.querySelector('.countdown')) {
            document.querySelector('.countdown').style.display = 'none';
        }
    }
});

