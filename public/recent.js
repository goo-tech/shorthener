async function loadRecentUrls() {
    try {
        const response = await fetch('/api/recent');
        const listElement = document.getElementById('recent-links-list');
        
        if (!response.ok) {
            listElement.innerHTML = '<li class="error-placeholder">Gagal memuat data.</li>';
            return;
        }

        const data = await response.json();

        if (data.recentUrls && data.recentUrls.length > 0) {
            listElement.innerHTML = ''; // Kosongkan daftar
            data.recentUrls.forEach(item => {
                const li = document.createElement('li');
                
                const link = document.createElement('a');
                link.href = item.shortUrl;
                link.textContent = item.shortUrl.replace(/^https?:\/\//, '');
                link.target = '_blank';
                
                const title = document.createElement('span');
                title.className = 'link-title';
                title.textContent = item.title;
                
                li.appendChild(link);
                li.appendChild(title);
                listElement.appendChild(li);
            });
        } else {
            listElement.innerHTML = '<li>Belum ada URL yang dipendekkan.</li>';
        }
    } catch (error) {
        console.error('Gagal memuat URL terbaru:', error);
        document.getElementById('recent-links-list').innerHTML = '<li class="error-placeholder">Terjadi kesalahan jaringan.</li>';
    }
}

// Logika untuk menu hamburger (disalin dari script.js untuk konsistensi)
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");

    if(hamburger) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navLinks.classList.toggle("active");
        });
    }
    
    // Panggil fungsi untuk memuat URL terbaru
    loadRecentUrls();
});