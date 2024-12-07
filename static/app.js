class MediaIndexer {
    constructor() {
        this.authenticated = false;
        this.isPlaying = false; // New property to track play state
        this.autoplayTimer = null; // New property for image autoplay
        this.videoEndedListener = null; // New property for video event listener
        this.setupLogin();
    }

    setupLogin() {
        const loginButton = document.getElementById('login-button');
        const passwordInput = document.getElementById('password-input');
        const loginError = document.getElementById('login-error');

        loginButton.addEventListener('click', () => this.attemptLogin());
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.attemptLogin();
            }
        });
    }

    async attemptLogin() {
        const passwordInput = document.getElementById('password-input');
        const loginError = document.getElementById('login-error');
        
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: passwordInput.value
                })
            });

            if (response.ok) {
                this.authenticated = true;
                document.getElementById('login-overlay').classList.add('hidden');
                document.getElementById('main-content').classList.remove('hidden');
                this.initializeApp();
            } else {
                loginError.style.display = 'block';
                passwordInput.value = '';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.style.display = 'block';
        }
    }

    initializeApp() {
        this.mediaList = [];
        this.currentIndex = 0;
        this.currentMedia = null;
        this.initializeElements();
        this.bindEvents();
        this.loadFilters();
    }

    initializeElements() {
        // Filters
        this.ratingFilter = document.getElementById('rating-filter');
        this.nicknameFilter = document.getElementById('nickname-filter');
        this.categoryFilter = document.getElementById('category-filter');
        this.typeFilter = document.getElementById('type-filter');

        // Containers and navigation
        this.mediaContainer = document.getElementById('media-container');
        this.progressLabel = document.getElementById('progress-label');
        this.prevButton = document.getElementById('prev-button');
        this.nextButton = document.getElementById('next-button');
        this.playButton = document.getElementById('play-button'); // New Play button element
    }

    bindEvents() {
        // Filter change events
        [this.ratingFilter, this.nicknameFilter, this.categoryFilter, this.typeFilter].forEach(filter => {
            filter.addEventListener('change', () => this.applyFilters());
        });

        // Navigation buttons
        this.prevButton.addEventListener('click', () => this.prevMedia());
        this.nextButton.addEventListener('click', () => this.nextMedia());

        // Play button
        this.playButton.addEventListener('click', () => this.togglePlayback());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.prevMedia();
                    break;
                case 'ArrowRight':
                    this.nextMedia();
                    break;
                case ' ':
                    this.toggleVideo();
                    e.preventDefault();
                    break;
            }
        });
    }

    async loadFilters() {
        try {
            const response = await fetch('/api/media');
            if (response.status === 401) {
                // Handle unauthorized access
                window.location.reload();
                return;
            }
            const data = await response.json();
            
            // Collect unique values
            const nicknames = new Set();
            const categories = new Set();

            Object.values(data).forEach(item => {
                if (item.nickname) nicknames.add(item.nickname);
                if (item.category) categories.add(item.category);
            });

            // Populate filter dropdowns
            this.populateSelect(this.nicknameFilter, Array.from(nicknames).sort());
            this.populateSelect(this.categoryFilter, Array.from(categories).sort());

            // Initial media load
            this.applyFilters();
        } catch (error) {
            console.error('Error loading filters:', error);
        }
    }

    populateSelect(select, items) {
        const currentSelection = Array.from(select.selectedOptions).map(opt => opt.value);
        select.innerHTML = '';
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            option.selected = currentSelection.includes(item);
            select.appendChild(option);
        });
    }

    async applyFilters() {
        const params = new URLSearchParams();
        
        Array.from(this.ratingFilter.selectedOptions).forEach(opt => params.append('rating', opt.value));
        Array.from(this.nicknameFilter.selectedOptions).forEach(opt => params.append('nickname', opt.value));
        Array.from(this.categoryFilter.selectedOptions).forEach(opt => params.append('category', opt.value));
        Array.from(this.typeFilter.selectedOptions).forEach(opt => params.append('type', opt.value));

        try {
            const response = await fetch(`/api/media/filtered?${params}`);
            this.mediaList = await response.json();
            this.currentIndex = 0;
            this.displayCurrentMedia();
        } catch (error) {
            console.error('Error applying filters:', error);
        }
    }

    async displayCurrentMedia() {
        // Clean up any existing autoplay to prevent conflicts
        this.cleanUpAutoplay();

        if (this.mediaList.length === 0) {
            this.mediaContainer.innerHTML = 'No media to display';
            this.progressLabel.textContent = 'No file loaded.';
            return;
        }

        const currentPath = this.mediaList[this.currentIndex];
        this.currentMedia = currentPath;

        try {
            const response = await fetch('/api/media');
            const allMedia = await response.json();
            const mediaInfo = allMedia[currentPath];

            this.mediaContainer.innerHTML = '';
            
            if (mediaInfo.type === 'image') {
                const img = document.createElement('img');
                img.src = `/api/media/${currentPath}`;
                this.mediaContainer.appendChild(img);
            } else if (mediaInfo.type === 'video') {
                const video = document.createElement('video');
                video.src = `/api/media/${currentPath}`;
                video.controls = true;
                video.autoplay = true;
                video.loop = false; // Change to false to handle 'ended' properly
                video.playsInline = true; // Prevent fullscreen on mobile
                video.setAttribute('playsinline', ''); // For iOS
                video.setAttribute('webkit-playsinline', ''); // For iOS
                this.mediaContainer.appendChild(video);
            }

            // Update progress label
            this.progressLabel.textContent = 
                `${currentPath}\n${mediaInfo.nickname}; ${mediaInfo.category}\n` +
                `(${this.currentIndex + 1}/${this.mediaList.length})`;

            // If autoplay is active, set up the next action
            if (this.isPlaying) {
                this.setupAutoplay(mediaInfo.type, mediaInfo);
            }
        } catch (error) {
            console.error('Error displaying media:', error);
        }
    }

    toggleVideo() {
        const video = this.mediaContainer.querySelector('video');
        if (video) {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        }
    }

    prevMedia() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.displayCurrentMedia();
        }
    }

    nextMedia() {
        if (this.currentIndex < this.mediaList.length - 1) {
            this.currentIndex++;
            this.displayCurrentMedia();
        }
    }

    togglePlayback() {
        if (this.isPlaying) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }

    startPlayback() {
        if (this.isPlaying) return; // Already playing

        this.isPlaying = true;
        this.playButton.textContent = 'Pause';
        this.playButton.classList.add('active');

        const currentPath = this.mediaList[this.currentIndex];
        fetch('/api/media')
            .then(response => response.json())
            .then(allMedia => {
                const mediaInfo = allMedia[currentPath];
                this.setupAutoplay(mediaInfo.type, mediaInfo);
            })
            .catch(error => {
                console.error('Error starting playback:', error);
            });
    }

    stopPlayback() {
        if (!this.isPlaying) return; // Already stopped

        this.isPlaying = false;
        this.playButton.textContent = 'Play';
        this.playButton.classList.remove('active');

        this.cleanUpAutoplay();
    }

    setupAutoplay(type, mediaInfo) {
        if (type === 'image') {
            // Set a 5-second interval to move to the next media
            this.autoplayTimer = setInterval(() => {
                this.nextMedia();
            }, 5000);
        } else if (type === 'video') {
            const video = this.mediaContainer.querySelector('video');
            if (video) {
                // Add an event listener to move to the next media when video ends
                this.videoEndedListener = () => {
                    this.nextMedia();
                };
                video.addEventListener('ended', this.videoEndedListener);
            }
        }
    }

    cleanUpAutoplay() {
        // Clear image autoplay timer
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }

        // Remove video 'ended' event listener
        if (this.videoEndedListener) {
            const video = this.mediaContainer.querySelector('video');
            if (video) {
                video.removeEventListener('ended', this.videoEndedListener);
            }
            this.videoEndedListener = null;
        }
    }

    // error handling for 401 responses to all fetch calls
    async fetchWithAuth(url, options = {}) {
        const response = await fetch(url, options);
        if (response.status === 401) {
            window.location.reload();
            return null;
        }
        return response;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new MediaIndexer();
});