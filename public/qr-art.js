// QR Art Generator Functionality
class QRArtGenerator {
    constructor() {
        this.currentShortCode = '';
        this.currentArtisticQrUrl = '';
        this.currentArtKey = '';
        this.initializeEvents();
    }

    initializeEvents() {
        const generateBtn = document.getElementById('generate-qr-art-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateQRArt());
        }

        const promptInput = document.getElementById('qr-art-prompt');
        if (promptInput) {
            promptInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.generateQRArt();
                }
            });

            // Contoh prompt otomatis
            promptInput.addEventListener('focus', () => {
                if (!promptInput.value) {
                    promptInput.placeholder = "contoh: beautiful landscape with mountains, digital art style...";
                }
            });
        }

        // Share QR Art button
        const shareQrArtBtn = document.getElementById('share-qr-art-btn');
        if (shareQrArtBtn) {
            shareQrArtBtn.addEventListener('click', () => this.shareQRArt());
        }

        // Download QR Art button
        const downloadQrArtBtn = document.getElementById('download-qr-art-btn');
        if (downloadQrArtBtn) {
            downloadQrArtBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.downloadQRArt();
            });
        }
    }

    showQRArtSection(shortCode) {
        this.currentShortCode = shortCode;
        const qrArtSection = document.getElementById('qr-art-section');
        if (qrArtSection) {
            qrArtSection.classList.remove('hidden');
            // Scroll ke section QR Art
            setTimeout(() => {
                qrArtSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
        }
    }

    async generateQRArt() {
        const promptInput = document.getElementById('qr-art-prompt');
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            this.showError('Masukkan prompt untuk membuat QR code artistik');
            promptInput.focus();
            return;
        }

        if (prompt.length < 10) {
            this.showError('Prompt harus lebih dari 10 karakter untuk hasil yang optimal');
            return;
        }

        if (prompt.length > 200) {
            this.showError('Prompt terlalu panjang. Maksimal 200 karakter.');
            return;
        }

        this.showLoading();
        this.hideError();
        this.hideResult();
        this.hideFallback();

        try {
            const response = await fetch('/api/generate-qr-art', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shortCode: this.currentShortCode,
                    prompt: prompt
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.fallback) {
                    throw new Error(data.error || 'Gagal membuat QR art, menggunakan mode fallback');
                } else {
                    throw new Error(data.error || 'Terjadi kesalahan saat generating QR art');
                }
            }

            // Tampilkan hasil
            this.showResult(data.artisticQrDataUrl, prompt);
            this.currentArtKey = data.artKey;

            // Tampilkan fallback notice jika ada
            if (data.fallback) {
                this.showFallback();
            }
            
        } catch (error) {
            console.error('QR Art Generation Error:', error);
            
            if (error.message.includes('fallback')) {
                this.showFallback();
                // Tetap lanjut dengan QR code biasa yang distyle
                this.generateFallbackQR();
            } else {
                this.showError(error.message);
            }
        } finally {
            this.hideLoading();
        }
    }

    async generateFallbackQR() {
        try {
            // Generate styled QR code sebagai fallback
            const styledQrUrl = `/${this.currentShortCode}/qr/styled`;
            const response = await fetch(styledQrUrl);
            
            if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onload = () => {
                    this.showResult(reader.result, document.getElementById('qr-art-prompt').value + ' (Fallback)');
                };
                reader.readAsDataURL(blob);
            }
        } catch (error) {
            console.error('Fallback QR generation failed:', error);
            this.showError('Gagal menghasilkan QR code. Silakan coba lagi.');
        }
    }

    showLoading() {
        const loading = document.getElementById('qr-art-loading');
        const generateBtn = document.getElementById('generate-qr-art-btn');
        
        if (loading) loading.classList.remove('hidden');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';
            generateBtn.style.opacity = '0.7';
        }
    }

    hideLoading() {
        const loading = document.getElementById('qr-art-loading');
        const generateBtn = document.getElementById('generate-qr-art-btn');
        
        if (loading) loading.classList.add('hidden');
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate QR Art';
            generateBtn.style.opacity = '1';
        }
    }

    showResult(artisticQrDataUrl, prompt) {
        this.currentArtisticQrUrl = artisticQrDataUrl;
        
        const result = document.getElementById('qr-art-result');
        const qrArtImage = document.getElementById('qr-art-image');
        const usedPrompt = document.getElementById('used-prompt');
        const downloadBtn = document.getElementById('download-qr-art-btn');
        
        if (result) result.classList.remove('hidden');
        if (qrArtImage) {
            qrArtImage.src = artisticQrDataUrl;
            qrArtImage.onload = () => {
                // Smooth appearance
                qrArtImage.style.opacity = '0';
                qrArtImage.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    qrArtImage.style.opacity = '1';
                }, 100);
            };
        }
        if (usedPrompt) usedPrompt.textContent = prompt;
        if (downloadBtn) downloadBtn.href = artisticQrDataUrl;
        
        // Scroll ke hasil
        setTimeout(() => {
            result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 500);
    }

    hideResult() {
        const result = document.getElementById('qr-art-result');
        if (result) result.classList.add('hidden');
    }

    showFallback() {
        const fallback = document.getElementById('qr-art-fallback');
        if (fallback) fallback.classList.remove('hidden');
    }

    hideFallback() {
        const fallback = document.getElementById('qr-art-fallback');
        if (fallback) fallback.classList.add('hidden');
    }

    showError(message) {
        const errorDiv = document.getElementById('qr-art-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
            
            // Auto hide error after 5 seconds
            setTimeout(() => {
                this.hideError();
            }, 5000);
        }
    }

    hideError() {
        const errorDiv = document.getElementById('qr-art-error');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }

    downloadQRArt() {
        if (!this.currentArtisticQrUrl) return;

        try {
            const link = document.createElement('a');
            link.href = this.currentArtisticQrUrl;
            link.download = `qr-art-${this.currentShortCode}-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show success feedback
            const originalText = document.getElementById('download-qr-art-btn').textContent;
            document.getElementById('download-qr-art-btn').textContent = '✅ Terunduh!';
            setTimeout(() => {
                document.getElementById('download-qr-art-btn').textContent = originalText;
            }, 2000);
        } catch (error) {
            console.error('Download failed:', error);
            this.showError('Gagal mengunduh gambar');
        }
    }

    async shareQRArt() {
        if (!this.currentArtisticQrUrl) return;

        try {
            // Convert data URL to blob
            const response = await fetch(this.currentArtisticQrUrl);
            const blob = await response.blob();
            const file = new File([blob], `qr-art-${this.currentShortCode}.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'QR Code Artistik',
                    text: 'Lihat QR code artistik yang saya buat! Scan untuk membuka link.'
                });
            } else {
                // Fallback: download
                this.downloadQRArt();
            }
        } catch (error) {
            console.error('Error sharing QR art:', error);
            // Fallback to download
            this.downloadQRArt();
        }
    }

    // Method untuk preset prompts
    suggestPrompt(prompt) {
        const promptInput = document.getElementById('qr-art-prompt');
        if (promptInput) {
            promptInput.value = prompt;
            promptInput.focus();
        }
    }
}

// Initialize QR Art Generator ketika DOM siap
document.addEventListener('DOMContentLoaded', () => {
    window.qrArtGenerator = new QRArtGenerator();
    
    // Add some interactive features
    const promptInput = document.getElementById('qr-art-prompt');
    if (promptInput) {
        // Character counter
        const updateCounter = () => {
            const counter = document.getElementById('qr-art-char-counter') || (() => {
                const counter = document.createElement('div');
                counter.id = 'qr-art-char-counter';
                counter.style.fontSize = '0.8rem';
                counter.style.color = 'var(--text-color-secondary)';
                counter.style.textAlign = 'right';
                counter.style.marginTop = '0.25rem';
                promptInput.parentNode.appendChild(counter);
                return counter;
            })();
            
            const length = promptInput.value.length;
            counter.textContent = `${length}/200 karakter`;
            counter.style.color = length > 190 ? '#dc3545' : 'var(--text-color-secondary)';
        };

        promptInput.addEventListener('input', updateCounter);
        updateCounter();
    }
});

// Function untuk dipanggil dari script.js utama
function initializeQRArt(shortCode) {
    if (window.qrArtGenerator) {
        window.qrArtGenerator.showQRArtSection(shortCode);
        
        // Focus pada prompt input
        setTimeout(() => {
            const promptInput = document.getElementById('qr-art-prompt');
            if (promptInput) {
                promptInput.focus();
            }
        }, 500);
    }
}

// Export untuk penggunaan global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QRArtGenerator, initializeQRArt };
}