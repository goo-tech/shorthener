async function loadPostsFeed(limit = 5) {
    const listElement = document.getElementById('posts-feed-list');
    if (!listElement) return;

    try {
        const response = await fetch('https://gootech.my.id/rss.xml');
        if (!response.ok) throw new Error('Gagal memuat RSS feed');
        
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const entries = xml.querySelectorAll('item');
        
        const items = Array.from(entries).slice(0, limit).map(item => ({
            title: item.querySelector('title')?.textContent || '',
            link: item.querySelector('link')?.textContent || '#',
            pubDate: new Date(item.querySelector('pubDate')?.textContent || '').toLocaleDateString('id-ID', {
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            }),
            description: item.querySelector('description')?.textContent || ''
        }));

        if (items.length > 0) {
            listElement.innerHTML = '';
            items.forEach(({ title, link, pubDate, description }) => {
                const li = document.createElement('li');
                
                const linkEl = document.createElement('a');
                linkEl.href = link;
                linkEl.textContent = title;
                linkEl.target = '_blank';
                linkEl.className = 'post-title';
                
                const dateEl = document.createElement('span');
                dateEl.className = 'post-date';
                dateEl.textContent = pubDate;
                
                const descEl = document.createElement('p');
                descEl.className = 'post-description';
                // Bersihkan HTML dari description dan potong teks
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = description;
                let cleanDesc = tempDiv.textContent || tempDiv.innerText || '';
                cleanDesc = cleanDesc.length > 150 ? cleanDesc.substring(0, 150) + '...' : cleanDesc;
                descEl.textContent = cleanDesc;
                
                li.appendChild(linkEl);
                li.appendChild(dateEl);
                li.appendChild(descEl);
                listElement.appendChild(li);
            });
        } else {
            listElement.innerHTML = '<li>Belum ada posts.</li>';
        }
    } catch (error) {
        console.error('Gagal memuat posts:', error);
        listElement.innerHTML = '<li class="error-placeholder">Gagal memuat posts terbaru.</li>';
    }
}

// Untuk halaman posts.html dengan load more functionality
let allPosts = [];
let visiblePosts = 0;

async function loadAllPosts() {
    const listElement = document.getElementById('posts-list');
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (!listElement) return;

    try {
        const response = await fetch('https://gootech.my.id/rss.xml');
        if (!response.ok) throw new Error('Gagal memuat RSS feed');
        
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const entries = xml.querySelectorAll('item');
        
        allPosts = Array.from(entries).map(item => ({
            title: item.querySelector('title')?.textContent || '',
            link: item.querySelector('link')?.textContent || '#',
            pubDate: new Date(item.querySelector('pubDate')?.textContent || '').toLocaleDateString('id-ID', {
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            }),
            description: item.querySelector('description')?.textContent || ''
        }));

        if (allPosts.length > 0) {
            listElement.innerHTML = '';
            renderPosts(6); // Tampilkan 6 posts pertama
            
            if (loadMoreBtn && allPosts.length > 6) {
                loadMoreBtn.classList.remove('hidden');
            }
        } else {
            listElement.innerHTML = '<li>Belum ada posts.</li>';
        }
    } catch (error) {
        console.error('Gagal memuat posts:', error);
        listElement.innerHTML = '<li class="error-placeholder">Gagal memuat posts.</li>';
    }
}

function renderPosts(count) {
    const listElement = document.getElementById('posts-list');
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (!listElement) return;

    const postsToShow = allPosts.slice(visiblePosts, visiblePosts + count);
    
    postsToShow.forEach(({ title, link, pubDate, description }) => {
        const li = document.createElement('li');
        
        const linkEl = document.createElement('a');
        linkEl.href = link;
        linkEl.textContent = title;
        linkEl.target = '_blank';
        linkEl.className = 'post-title';
        
        const dateEl = document.createElement('span');
        dateEl.className = 'post-date';
        dateEl.textContent = pubDate;
        
        const descEl = document.createElement('p');
        descEl.className = 'post-description';
        // Bersihkan HTML dari description
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = description;
        let cleanDesc = tempDiv.textContent || tempDiv.innerText || '';
        cleanDesc = cleanDesc.length > 200 ? cleanDesc.substring(0, 200) + '...' : cleanDesc;
        descEl.textContent = cleanDesc;
        
        li.appendChild(linkEl);
        li.appendChild(dateEl);
        li.appendChild(descEl);
        listElement.appendChild(li);
    });

    visiblePosts += count;
    
    // Sembunyikan tombol load more jika sudah menampilkan semua posts
    if (loadMoreBtn && visiblePosts >= allPosts.length) {
        loadMoreBtn.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");

    if(hamburger) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navLinks.classList.toggle("active");
        });
    }

    // Deteksi halaman mana yang sedang aktif
    if (document.getElementById('posts-feed-list')) {
        // Halaman index - load 5 posts
        loadPostsFeed(5);
    } else if (document.getElementById('posts-list') && document.getElementById('load-more-btn')) {
        // Halaman posts dengan load more
        loadAllPosts();
        
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                renderPosts(6);
            });
        }
    } else if (document.getElementById('posts-list')) {
        // Halaman posts tanpa load more (fallback)
        loadPostsFeed(10);
    }
});