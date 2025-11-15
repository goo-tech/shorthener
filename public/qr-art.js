// QR Art Generator Functionality
class QRArtGenerator {
    constructor() {
        this.currentShortCode = '';
        this.currentArtisticQrUrl = '';
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
        }

        // Share QR Art button
        const shareQrArtBtn = document.getElementById('share-qr-art-btn');
        if (shareQrArtBtn) {
            shareQrArtBtn.addEventListener('click', () => this.shareQRArt());
        }
    }

    showQRArtSection(shortCode) {
        this.currentShortCode = shortCode;
        const qrArtSection = document.getElementById('qr-art-section');
        if (qrArtSection) {
            qrArtSection.classList.remove('hidden');
        }
    }

    async generateQRArt() {
        const promptInput = document.getElementById('qr-art-prompt');
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            this.showError('Masukkan prompt untuk membuat QR code artistik');
            return;
        }

        if (prompt.length < 10) {
            this.showError('Prompt harus lebih dari 10 karakter');
            return;
        }

        this.showLoading();
        this.hideError();
        this.hideResult();

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
                    throw new Error(data.error || 'Gagal membuat QR art');
                } else {
                    throw new Error(data.error || 'Terjadi kesalahan');
                }
            }

            this.showResult(data.artisticQrDataUrl, prompt);
            
        } catch (error) {
            console.error('QR Art Generation Error:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        const loading = document.getElementById('qr-art-loading');
        const generateBtn = document.getElementById('generate-qr-art-btn');
        
        if (loading) loading.classList.remove('hidden');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';
        }
    }

    hideLoading() {
        const loading = document.getElementById('qr-art-loading');
        const generateBtn = document.getElementById('generate-qr-art-btn');
        
        if (loading) loading.classList.add('hidden');
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate QR Art';
        }
    }

    showResult(artisticQrDataUrl, prompt) {
        this.currentArtisticQrUrl = artisticQrDataUrl;
        
        const result = document.getElementById('qr-art-result');
        const qrArtImage = document.getElementById('qr-art-image');
        const usedPrompt = document.getElementById('used-prompt');
        const downloadBtn = document.getElementById('download-qr-art-btn');
        
        if (result) result.classList.remove('hidden');
        if (qrArtImage) qrArtImage.src = artisticQrDataUrl;
        if (usedPrompt) usedPrompt.textContent = prompt;
        if (downloadBtn) downloadBtn.href = artisticQrDataUrl;
        
        // Scroll ke hasil
        result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    hideResult() {
        const result = document.getElementById('qr-art-result');
        if (result) result.classList.add('hidden');
    }

    showError(message) {
        const errorDiv = document.getElementById('qr-art-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }

    hideError() {
        const errorDiv = document.getElementById('qr-art-error');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }

    async shareQRArt() {
        if (!this.currentArtisticQrUrl) return;

        try {
            // Convert data URL to blob
            const response = await fetch(this.currentArtisticQrUrl);
            const blob = await response.blob();
            const file = new File([blob], 'qr-art.png', { type: 'image/png' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'QR Code Artistik',
                    text: 'Lihat QR code artistik yang saya buat!'
                });
            } else {
                // Fallback: download
                const link = document.createElement('a');
                link.href = this.currentArtisticQrUrl;
                link.download = 'qr-art.png';
                link.click();
            }
        } catch (error) {
            console.error('Error sharing QR art:', error);
            // Fallback to download
            const link = document.createElement('a');
            link.href = this.currentArtisticQrUrl;
            link.download = 'qr-art.png';
            link.click();
        }
    }
}

// Initialize QR Art Generator ketika DOM siap
document.addEventListener('DOMContentLoaded', () => {
    window.qrArtGenerator = new QRArtGenerator();
});

// Function untuk dipanggil dari script.js utama
function initializeQRArt(shortCode) {
    if (window.qrArtGenerator) {
        window.qrArtGenerator.showQRArtSection(shortCode);
    }
}