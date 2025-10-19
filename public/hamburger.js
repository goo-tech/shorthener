// hamburger.js - Script khusus untuk menu hamburger
function initializeHamburgerMenu() {
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");

    if (hamburger && navLinks) {
        // Hapus event listener sebelumnya jika ada
        const newHamburger = hamburger.cloneNode(true);
        const newNavLinks = navLinks.cloneNode(true);
        
        hamburger.parentNode.replaceChild(newHamburger, hamburger);
        navLinks.parentNode.replaceChild(newNavLinks, navLinks);

        // Tambahkan event listener baru
        newHamburger.addEventListener("click", () => {
            newHamburger.classList.toggle("active");
            newNavLinks.classList.toggle("active");
        });

        // Close menu ketika klik di luar
        document.addEventListener('click', (e) => {
            if (!newHamburger.contains(e.target) && !newNavLinks.contains(e.target)) {
                newHamburger.classList.remove("active");
                newNavLinks.classList.remove("active");
            }
        });
    }
}

// Initialize ketika DOM siap
document.addEventListener('DOMContentLoaded', initializeHamburgerMenu);