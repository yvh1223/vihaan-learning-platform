/**
 * Universal Multimedia Integration System for Vihaan's Learning Platform
 * Provides audio, video, animation, and accessibility support
 * Optimized for educational content with progressive loading
 */

class MultimediaSystem {
    constructor(options = {}) {
        this.options = {
            autoplay: false,
            preload: 'metadata',
            lazyLoading: true,
            accessibility: true,
            subtitles: true,
            audioNarration: false,
            animations: true,
            touchControls: true,
            keyboardControls: true,
            qualitySelection: true,
            analytics: true,
            caching: true,
            progressiveLoading: true,
            mobileOptimization: true,
            debugMode: false,
            ...options
        };

        this.mediaElements = new Map();
        this.loadQueue = [];
        this.isLoading = false;
        this.observers = new Map();
        this.analytics = {
            views: 0,
            completions: 0,
            interactions: 0,
            errors: 0
        };
        this.audioContext = null;
        this.currentNarration = null;
        this.callbacks = new Map();

        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.setupAudioContext();
        this.setupGlobalControls();
        this.setupAccessibility();
        this.log('Multimedia System initialized');
    }

    // Lazy Loading Setup
    setupLazyLoading() {
        if (!this.options.lazyLoading || !('IntersectionObserver' in window)) {
            return;
        }

        const observerOptions = {
            rootMargin: '50px 0px',
            threshold: 0.1
        };

        const mediaObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadMedia(entry.target);
                    mediaObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        this.observers.set('media', mediaObserver);
        
        // Observe all media elements with data-src
        this.observeMediaElements();
    }

    observeMediaElements() {
        const lazyElements = document.querySelectorAll('[data-src], [data-video-src], [data-audio-src]');
        const observer = this.observers.get('media');
        
        if (observer) {
            lazyElements.forEach(element => observer.observe(element));
        }
    }

    // Audio Context Setup
    setupAudioContext() {
        if (!this.options.audioNarration) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.log('Audio context initialized');
        } catch (error) {
            this.log('Audio context initialization failed:', error);
        }
    }

    // Media Loading Methods
    loadMedia(element) {
        const type = this.getMediaType(element);
        
        switch (type) {
            case 'image':
                return this.loadImage(element);
            case 'video':
                return this.loadVideo(element);
            case 'audio':
                return this.loadAudio(element);
            case 'animation':
                return this.loadAnimation(element);
            default:
                this.log('Unknown media type for element:', element);
        }
    }

    getMediaType(element) {
        if (element.hasAttribute('data-src') && (element.tagName === 'IMG' || element.hasAttribute('data-image'))) {
            return 'image';
        }
        if (element.hasAttribute('data-video-src') || element.tagName === 'VIDEO') {
            return 'video';
        }
        if (element.hasAttribute('data-audio-src') || element.tagName === 'AUDIO') {
            return 'audio';
        }
        if (element.hasAttribute('data-animation') || element.classList.contains('animation-element')) {
            return 'animation';
        }
        return 'unknown';
    }

    // Image Loading
    async loadImage(element) {
        const src = element.dataset.src;
        if (!src) return;

        try {
            // Show loading indicator
            this.showLoadingIndicator(element);

            // Create new image for preloading
            const img = new Image();
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = src;
            });

            // Apply loaded image
            if (element.tagName === 'IMG') {
                element.src = src;
            } else {
                element.style.backgroundImage = `url(${src})`;
            }

            // Remove loading indicator
            this.hideLoadingIndicator(element);

            // Add loaded class for animations
            element.classList.add('media-loaded');
            
            // Setup image interactions
            this.setupImageInteractions(element);

            this.fireCallback('imageLoaded', { element, src });
            this.analytics.views++;

        } catch (error) {
            this.handleMediaError(element, 'image', error);
            this.analytics.errors++;
        }
    }

    setupImageInteractions(element) {
        // Add click to zoom functionality
        if (element.hasAttribute('data-zoomable')) {
            element.addEventListener('click', () => this.showImageModal(element));
            element.style.cursor = 'zoom-in';
            element.setAttribute('aria-label', 'Click to enlarge image');
        }

        // Add alt text if missing
        if (!element.alt && element.hasAttribute('data-alt')) {
            element.alt = element.getAttribute('data-alt');
        }
    }

    showImageModal(image) {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="image-modal-content">
                <button class="image-modal-close" onclick="this.closest('.image-modal').remove()">×</button>
                <img src="${image.src}" alt="${image.alt}" class="image-modal-image">
                <div class="image-modal-caption">${image.alt || ''}</div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Keyboard controls
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);

        // Focus management
        modal.querySelector('.image-modal-close').focus();
    }

    // Video Loading and Setup
    async loadVideo(element) {
        const src = element.dataset.videoSrc || element.dataset.src;
        if (!src) return;

        try {
            this.showLoadingIndicator(element);

            // Create video element if needed
            if (element.tagName !== 'VIDEO') {
                const video = document.createElement('video');
                this.copyAttributes(element, video);
                element.parentNode.replaceChild(video, element);
                element = video;
            }

            // Set video source
            element.src = src;
            element.preload = this.options.preload;
            
            // Setup video controls and features
            this.setupVideoControls(element);
            this.setupVideoAccessibility(element);
            this.setupVideoAnalytics(element);

            // Register video element
            const videoId = this.generateMediaId(element);
            this.mediaElements.set(videoId, {
                type: 'video',
                element: element,
                src: src,
                loaded: true
            });

            this.hideLoadingIndicator(element);
            element.classList.add('media-loaded');

            this.fireCallback('videoLoaded', { element, src });
            this.analytics.views++;

        } catch (error) {
            this.handleMediaError(element, 'video', error);
            this.analytics.errors++;
        }
    }

    setupVideoControls(video) {
        // Add custom controls wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'video-wrapper';
        video.parentNode.insertBefore(wrapper, video);
        wrapper.appendChild(video);

        // Add custom control overlay
        const controls = document.createElement('div');
        controls.className = 'video-custom-controls';
        controls.innerHTML = `
            <div class="video-progress-container">
                <div class="video-progress-bar">
                    <div class="video-progress-fill"></div>
                    <div class="video-progress-handle"></div>
                </div>
                <div class="video-time">
                    <span class="current-time">0:00</span> / <span class="total-time">0:00</span>
                </div>
            </div>
            
            <div class="video-button-row">
                <button class="play-pause-btn" aria-label="Play/Pause">
                    <span class="play-icon">▶</span>
                    <span class="pause-icon" style="display: none;">⏸</span>
                </button>
                
                <button class="mute-btn" aria-label="Mute/Unmute">
                    <span class="volume-icon">🔊</span>
                    <span class="mute-icon" style="display: none;">🔇</span>
                </button>
                
                <div class="volume-container">
                    <input type="range" class="volume-slider" min="0" max="1" step="0.1" value="1">
                </div>
                
                ${this.options.qualitySelection ? `
                    <select class="quality-selector">
                        <option value="auto">Auto</option>
                        <option value="1080p">1080p</option>
                        <option value="720p">720p</option>
                        <option value="480p">480p</option>
                    </select>
                ` : ''}
                
                <button class="fullscreen-btn" aria-label="Fullscreen">⛶</button>
            </div>
        `;

        wrapper.appendChild(controls);

        // Setup control interactions
        this.setupVideoControlInteractions(video, controls);
    }

    setupVideoControlInteractions(video, controls) {
        const playPauseBtn = controls.querySelector('.play-pause-btn');
        const muteBtn = controls.querySelector('.mute-btn');
        const volumeSlider = controls.querySelector('.volume-slider');
        const progressBar = controls.querySelector('.video-progress-bar');
        const progressFill = controls.querySelector('.video-progress-fill');
        const currentTimeEl = controls.querySelector('.current-time');
        const totalTimeEl = controls.querySelector('.total-time');
        const fullscreenBtn = controls.querySelector('.fullscreen-btn');

        // Play/Pause
        playPauseBtn.addEventListener('click', () => {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        });

        video.addEventListener('play', () => {
            playPauseBtn.querySelector('.play-icon').style.display = 'none';
            playPauseBtn.querySelector('.pause-icon').style.display = 'inline';
        });

        video.addEventListener('pause', () => {
            playPauseBtn.querySelector('.play-icon').style.display = 'inline';
            playPauseBtn.querySelector('.pause-icon').style.display = 'none';
        });

        // Volume controls
        muteBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            this.updateVolumeDisplay(muteBtn, volumeSlider, video);
        });

        volumeSlider.addEventListener('input', () => {
            video.volume = volumeSlider.value;
            video.muted = volumeSlider.value === '0';
            this.updateVolumeDisplay(muteBtn, volumeSlider, video);
        });

        // Progress bar
        video.addEventListener('timeupdate', () => {
            if (video.duration) {
                const progress = (video.currentTime / video.duration) * 100;
                progressFill.style.width = progress + '%';
                currentTimeEl.textContent = this.formatTime(video.currentTime);
            }
        });

        video.addEventListener('loadedmetadata', () => {
            totalTimeEl.textContent = this.formatTime(video.duration);
        });

        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            video.currentTime = pos * video.duration;
        });

        // Fullscreen
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen(video.closest('.video-wrapper'));
            });
        }

        // Keyboard controls
        if (this.options.keyboardControls) {
            video.addEventListener('keydown', (e) => this.handleVideoKeydown(e, video));
            video.setAttribute('tabindex', '0');
        }
    }

    updateVolumeDisplay(muteBtn, volumeSlider, video) {
        const volumeIcon = muteBtn.querySelector('.volume-icon');
        const muteIcon = muteBtn.querySelector('.mute-icon');

        if (video.muted || video.volume === 0) {
            volumeIcon.style.display = 'none';
            muteIcon.style.display = 'inline';
            volumeSlider.value = 0;
        } else {
            volumeIcon.style.display = 'inline';
            muteIcon.style.display = 'none';
            volumeSlider.value = video.volume;
        }
    }

    handleVideoKeydown(e, video) {
        switch (e.key) {
            case ' ':
                e.preventDefault();
                if (video.paused) video.play();
                else video.pause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                video.currentTime = Math.max(0, video.currentTime - 10);
                break;
            case 'ArrowRight':
                e.preventDefault();
                video.currentTime = Math.min(video.duration, video.currentTime + 10);
                break;
            case 'ArrowUp':
                e.preventDefault();
                video.volume = Math.min(1, video.volume + 0.1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                video.volume = Math.max(0, video.volume - 0.1);
                break;
            case 'm':
                e.preventDefault();
                video.muted = !video.muted;
                break;
            case 'f':
                e.preventDefault();
                this.toggleFullscreen(video.closest('.video-wrapper'));
                break;
        }
    }

    // Audio Loading and Setup
    async loadAudio(element) {
        const src = element.dataset.audioSrc || element.dataset.src;
        if (!src) return;

        try {
            this.showLoadingIndicator(element);

            // Create audio element if needed
            if (element.tagName !== 'AUDIO') {
                const audio = document.createElement('audio');
                this.copyAttributes(element, audio);
                element.parentNode.replaceChild(audio, element);
                element = audio;
            }

            element.src = src;
            element.preload = this.options.preload;
            
            this.setupAudioControls(element);
            this.setupAudioAccessibility(element);

            const audioId = this.generateMediaId(element);
            this.mediaElements.set(audioId, {
                type: 'audio',
                element: element,
                src: src,
                loaded: true
            });

            this.hideLoadingIndicator(element);
            element.classList.add('media-loaded');

            this.fireCallback('audioLoaded', { element, src });

        } catch (error) {
            this.handleMediaError(element, 'audio', error);
            this.analytics.errors++;
        }
    }

    setupAudioControls(audio) {
        const wrapper = document.createElement('div');
        wrapper.className = 'audio-wrapper';
        audio.parentNode.insertBefore(wrapper, audio);
        wrapper.appendChild(audio);

        const controls = document.createElement('div');
        controls.className = 'audio-custom-controls';
        controls.innerHTML = `
            <button class="audio-play-btn" aria-label="Play/Pause">
                <span class="play-icon">▶</span>
                <span class="pause-icon" style="display: none;">⏸</span>
            </button>
            
            <div class="audio-progress">
                <div class="audio-progress-bar">
                    <div class="audio-progress-fill"></div>
                </div>
                <div class="audio-time">
                    <span class="current">0:00</span> / <span class="total">0:00</span>
                </div>
            </div>
            
            <div class="audio-volume">
                <button class="audio-mute-btn" aria-label="Mute">🔊</button>
                <input type="range" class="audio-volume-slider" min="0" max="1" step="0.1" value="1">
            </div>
        `;

        wrapper.appendChild(controls);
        this.setupAudioControlInteractions(audio, controls);
    }

    setupAudioControlInteractions(audio, controls) {
        const playBtn = controls.querySelector('.audio-play-btn');
        const muteBtn = controls.querySelector('.audio-mute-btn');
        const volumeSlider = controls.querySelector('.audio-volume-slider');
        const progressBar = controls.querySelector('.audio-progress-bar');
        const progressFill = controls.querySelector('.audio-progress-fill');
        const currentTime = controls.querySelector('.current');
        const totalTime = controls.querySelector('.total');

        playBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
            } else {
                audio.pause();
            }
        });

        audio.addEventListener('play', () => {
            playBtn.querySelector('.play-icon').style.display = 'none';
            playBtn.querySelector('.pause-icon').style.display = 'inline';
        });

        audio.addEventListener('pause', () => {
            playBtn.querySelector('.play-icon').style.display = 'inline';
            playBtn.querySelector('.pause-icon').style.display = 'none';
        });

        audio.addEventListener('timeupdate', () => {
            if (audio.duration) {
                const progress = (audio.currentTime / audio.duration) * 100;
                progressFill.style.width = progress + '%';
                currentTime.textContent = this.formatTime(audio.currentTime);
            }
        });

        audio.addEventListener('loadedmetadata', () => {
            totalTime.textContent = this.formatTime(audio.duration);
        });

        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            audio.currentTime = pos * audio.duration;
        });

        muteBtn.addEventListener('click', () => {
            audio.muted = !audio.muted;
            muteBtn.textContent = audio.muted ? '🔇' : '🔊';
        });

        volumeSlider.addEventListener('input', () => {
            audio.volume = volumeSlider.value;
        });
    }

    // Animation Loading
    async loadAnimation(element) {
        try {
            this.showLoadingIndicator(element);

            const animationType = element.dataset.animation;
            const animationData = JSON.parse(element.dataset.animationData || '{}');

            switch (animationType) {
                case 'fade-in':
                    this.animateFadeIn(element, animationData);
                    break;
                case 'slide-in':
                    this.animateSlideIn(element, animationData);
                    break;
                case 'scale-in':
                    this.animateScaleIn(element, animationData);
                    break;
                case 'typewriter':
                    await this.animateTypewriter(element, animationData);
                    break;
                case 'counter':
                    await this.animateCounter(element, animationData);
                    break;
                default:
                    this.log('Unknown animation type:', animationType);
            }

            this.hideLoadingIndicator(element);
            element.classList.add('animation-loaded');

            this.fireCallback('animationLoaded', { element, type: animationType });

        } catch (error) {
            this.handleMediaError(element, 'animation', error);
        }
    }

    animateFadeIn(element, options = {}) {
        const duration = options.duration || 1000;
        const delay = options.delay || 0;

        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.opacity = '1';
        }, delay);
    }

    animateSlideIn(element, options = {}) {
        const direction = options.direction || 'left';
        const duration = options.duration || 1000;
        const delay = options.delay || 0;
        const distance = options.distance || '50px';

        const transforms = {
            left: `translateX(-${distance})`,
            right: `translateX(${distance})`,
            up: `translateY(-${distance})`,
            down: `translateY(${distance})`
        };

        element.style.transform = transforms[direction];
        element.style.transition = `transform ${duration}ms ease-out`;
        
        setTimeout(() => {
            element.style.transform = 'translate(0, 0)';
        }, delay);
    }

    animateScaleIn(element, options = {}) {
        const duration = options.duration || 600;
        const delay = options.delay || 0;
        const startScale = options.startScale || 0.5;

        element.style.transform = `scale(${startScale})`;
        element.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, delay);
    }

    async animateTypewriter(element, options = {}) {
        const text = element.textContent || element.dataset.text || '';
        const speed = options.speed || 50;
        const cursor = options.cursor !== false;
        
        element.textContent = '';
        
        if (cursor) {
            element.classList.add('typewriter-cursor');
        }

        for (let i = 0; i <= text.length; i++) {
            await new Promise(resolve => {
                setTimeout(() => {
                    element.textContent = text.slice(0, i);
                    resolve();
                }, speed);
            });
        }

        if (cursor) {
            setTimeout(() => {
                element.classList.remove('typewriter-cursor');
            }, 2000);
        }
    }

    async animateCounter(element, options = {}) {
        const target = options.target || parseFloat(element.textContent) || 100;
        const duration = options.duration || 2000;
        const decimals = options.decimals || 0;
        const prefix = options.prefix || '';
        const suffix = options.suffix || '';

        const startTime = performance.now();
        const startValue = 0;

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (target - startValue) * easeOutCubic;
            
            element.textContent = prefix + currentValue.toFixed(decimals) + suffix;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };

        requestAnimationFrame(updateCounter);
    }

    // Audio Narration System
    async startNarration(text, options = {}) {
        if (!this.options.audioNarration || !('speechSynthesis' in window)) {
            this.log('Speech synthesis not available');
            return;
        }

        // Stop current narration
        this.stopNarration();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || 0.9;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 0.8;

        if (options.voice) {
            const voices = speechSynthesis.getVoices();
            const selectedVoice = voices.find(voice => voice.name.includes(options.voice));
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }

        utterance.onstart = () => {
            this.currentNarration = utterance;
            this.fireCallback('narrationStarted', { text, options });
        };

        utterance.onend = () => {
            this.currentNarration = null;
            this.fireCallback('narrationEnded', { text, options });
        };

        utterance.onerror = (error) => {
            this.log('Narration error:', error);
            this.currentNarration = null;
        };

        speechSynthesis.speak(utterance);
        return utterance;
    }

    stopNarration() {
        if (this.currentNarration) {
            speechSynthesis.cancel();
            this.currentNarration = null;
        }
    }

    // Accessibility Setup
    setupVideoAccessibility(video) {
        // Add subtitles support
        if (this.options.subtitles && video.dataset.subtitles) {
            this.loadSubtitles(video, video.dataset.subtitles);
        }

        // Add ARIA labels
        if (!video.hasAttribute('aria-label')) {
            video.setAttribute('aria-label', 'Educational video content');
        }

        // Add describedby if transcript available
        if (video.dataset.transcript) {
            const transcriptId = 'transcript_' + this.generateMediaId(video);
            video.setAttribute('aria-describedby', transcriptId);
            this.createTranscriptElement(video, transcriptId);
        }
    }

    setupAudioAccessibility(audio) {
        if (!audio.hasAttribute('aria-label')) {
            audio.setAttribute('aria-label', 'Educational audio content');
        }

        if (audio.dataset.transcript) {
            const transcriptId = 'transcript_' + this.generateMediaId(audio);
            audio.setAttribute('aria-describedby', transcriptId);
            this.createTranscriptElement(audio, transcriptId);
        }
    }

    loadSubtitles(video, subtitleUrl) {
        fetch(subtitleUrl)
            .then(response => response.text())
            .then(vttContent => {
                const track = document.createElement('track');
                track.kind = 'subtitles';
                track.label = 'English';
                track.srclang = 'en';
                track.default = true;
                
                const blob = new Blob([vttContent], { type: 'text/vtt' });
                track.src = URL.createObjectURL(blob);
                
                video.appendChild(track);
            })
            .catch(error => this.log('Subtitle loading failed:', error));
    }

    createTranscriptElement(media, transcriptId) {
        const transcript = document.createElement('details');
        transcript.id = transcriptId;
        transcript.className = 'media-transcript';
        transcript.innerHTML = `
            <summary>Transcript</summary>
            <div class="transcript-content">${media.dataset.transcript}</div>
        `;
        
        media.parentNode.insertBefore(transcript, media.nextSibling);
    }

    // Global Controls Setup
    setupGlobalControls() {
        // Create global media control panel
        if (this.options.touchControls || this.options.keyboardControls) {
            this.createGlobalControlPanel();
        }

        // Global keyboard shortcuts
        if (this.options.keyboardControls) {
            document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
        }
    }

    createGlobalControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'global-media-controls';
        panel.className = 'global-media-controls';
        panel.innerHTML = `
            <button class="global-control-btn" id="pause-all-media" title="Pause All Media">⏸️</button>
            <button class="global-control-btn" id="mute-all-media" title="Mute All Media">🔇</button>
            <button class="global-control-btn" id="toggle-captions" title="Toggle Captions">CC</button>
            ${this.options.audioNarration ? '<button class="global-control-btn" id="start-narration" title="Start Narration">🎙️</button>' : ''}
        `;

        document.body.appendChild(panel);

        // Setup global control interactions
        document.getElementById('pause-all-media')?.addEventListener('click', () => this.pauseAllMedia());
        document.getElementById('mute-all-media')?.addEventListener('click', () => this.muteAllMedia());
        document.getElementById('toggle-captions')?.addEventListener('click', () => this.toggleAllCaptions());
        document.getElementById('start-narration')?.addEventListener('click', () => this.startPageNarration());
    }

    handleGlobalKeydown(event) {
        // Global media keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'p':
                    event.preventDefault();
                    this.pauseAllMedia();
                    break;
                case 'm':
                    event.preventDefault();
                    this.muteAllMedia();
                    break;
            }
        }
    }

    // Global Media Controls
    pauseAllMedia() {
        document.querySelectorAll('video, audio').forEach(media => {
            if (!media.paused) {
                media.pause();
            }
        });
        this.fireCallback('allMediaPaused');
    }

    muteAllMedia() {
        document.querySelectorAll('video, audio').forEach(media => {
            media.muted = !media.muted;
        });
        this.fireCallback('allMediaMuted');
    }

    toggleAllCaptions() {
        document.querySelectorAll('video').forEach(video => {
            const tracks = video.textTracks;
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                if (track.kind === 'subtitles' || track.kind === 'captions') {
                    track.mode = track.mode === 'showing' ? 'hidden' : 'showing';
                }
            }
        });
        this.fireCallback('captionsToggled');
    }

    startPageNarration() {
        const content = document.querySelector('main')?.textContent || document.body.textContent;
        if (content) {
            this.startNarration(content, { rate: 0.8 });
        }
    }

    // Utility Methods
    showLoadingIndicator(element) {
        const indicator = document.createElement('div');
        indicator.className = 'media-loading-indicator';
        indicator.innerHTML = '<div class="loading-spinner"></div>';
        
        element.style.position = 'relative';
        element.appendChild(indicator);
    }

    hideLoadingIndicator(element) {
        const indicator = element.querySelector('.media-loading-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    handleMediaError(element, type, error) {
        this.log(`${type} loading error:`, error);
        
        const errorElement = document.createElement('div');
        errorElement.className = 'media-error';
        errorElement.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-message">Unable to load ${type}</div>
            <button class="retry-btn" onclick="this.closest('.media-error').remove(); window.multimediaSystem.loadMedia(this.closest('*').previousElementSibling || this.closest('*').parentNode);">Retry</button>
        `;

        element.parentNode.insertBefore(errorElement, element.nextSibling);
    }

    copyAttributes(from, to) {
        Array.from(from.attributes).forEach(attr => {
            if (attr.name !== 'data-src' && attr.name !== 'data-video-src' && attr.name !== 'data-audio-src') {
                to.setAttribute(attr.name, attr.value);
            }
        });
    }

    generateMediaId(element) {
        return element.id || 'media_' + Math.random().toString(36).substr(2, 9);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    toggleFullscreen(element) {
        if (!document.fullscreenElement) {
            element.requestFullscreen?.() || 
            element.webkitRequestFullscreen?.() || 
            element.msRequestFullscreen?.();
        } else {
            document.exitFullscreen?.() || 
            document.webkitExitFullscreen?.() || 
            document.msExitFullscreen?.();
        }
    }

    setupAccessibility() {
        // Add skip links for media content
        this.addSkipLinks();
        
        // Setup focus management
        this.setupFocusManagement();
        
        // Add media descriptions
        this.addMediaDescriptions();
    }

    addSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.className = 'media-skip-links';
        skipLinks.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#media-content" class="skip-link">Skip to media content</a>
        `;
        
        document.body.insertBefore(skipLinks, document.body.firstChild);
    }

    setupFocusManagement() {
        // Ensure all interactive media elements are keyboard accessible
        document.querySelectorAll('video, audio, [data-zoomable]').forEach(element => {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
        });
    }

    addMediaDescriptions() {
        // Add descriptions for screen readers
        document.querySelectorAll('video, audio').forEach(media => {
            if (!media.hasAttribute('aria-describedby') && media.dataset.description) {
                const descId = 'desc_' + this.generateMediaId(media);
                const description = document.createElement('div');
                description.id = descId;
                description.className = 'media-description visually-hidden';
                description.textContent = media.dataset.description;
                
                media.setAttribute('aria-describedby', descId);
                media.parentNode.insertBefore(description, media.nextSibling);
            }
        });
    }

    // Callback system
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    off(event, callback) {
        if (this.callbacks.has(event)) {
            const callbacks = this.callbacks.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    fireCallback(event, data) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in multimedia callback for ${event}:`, error);
                }
            });
        }
    }

    // Public API methods
    loadAllMedia() {
        document.querySelectorAll('[data-src], [data-video-src], [data-audio-src], [data-animation]').forEach(element => {
            this.loadMedia(element);
        });
    }

    refreshObservers() {
        this.observeMediaElements();
    }

    getAnalytics() {
        return { ...this.analytics };
    }

    resetAnalytics() {
        this.analytics = {
            views: 0,
            completions: 0,
            interactions: 0,
            errors: 0
        };
    }

    log(...args) {
        if (this.options.debugMode) {
            console.log('[Multimedia System]', ...args);
        }
    }

    destroy() {
        // Clean up observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();

        // Stop any playing media
        this.pauseAllMedia();
        this.stopNarration();

        // Clear callbacks
        this.callbacks.clear();

        // Remove global controls
        const globalControls = document.getElementById('global-media-controls');
        if (globalControls) {
            globalControls.remove();
        }

        this.log('Multimedia System destroyed');
    }
}

// CSS for multimedia system
const multimediaCSS = `
.media-loading-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20px;
    border-radius: 8px;
    z-index: 100;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.media-error {
    background: #f8d7da;
    color: #721c24;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    margin: 10px 0;
}

.error-icon {
    font-size: 2em;
    margin-bottom: 10px;
}

.retry-btn {
    background: #dc3545;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
}

.video-wrapper,
.audio-wrapper {
    position: relative;
    display: inline-block;
    width: 100%;
}

.video-custom-controls,
.audio-custom-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
    color: white;
    padding: 15px;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.video-wrapper:hover .video-custom-controls,
.audio-wrapper:hover .audio-custom-controls {
    opacity: 1;
}

.video-progress-container,
.audio-progress {
    margin-bottom: 10px;
}

.video-progress-bar,
.audio-progress-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    cursor: pointer;
    margin-bottom: 8px;
}

.video-progress-fill,
.audio-progress-fill {
    height: 100%;
    background: #007bff;
    border-radius: 3px;
    transition: width 0.1s ease;
}

.video-button-row {
    display: flex;
    align-items: center;
    gap: 15px;
}

.video-custom-controls button,
.audio-custom-controls button {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1.2em;
    padding: 8px;
    border-radius: 4px;
    transition: background 0.3s ease;
}

.video-custom-controls button:hover,
.audio-custom-controls button:hover {
    background: rgba(255, 255, 255, 0.2);
}

.volume-container {
    display: flex;
    align-items: center;
    gap: 10px;
}

.volume-slider,
.audio-volume-slider {
    width: 80px;
}

.quality-selector {
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    padding: 4px 8px;
}

.global-media-controls {
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    gap: 10px;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.8);
    padding: 10px;
    border-radius: 25px;
    backdrop-filter: blur(10px);
}

.global-control-btn {
    background: none;
    border: none;
    color: white;
    font-size: 1.2em;
    padding: 10px 12px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
}

.global-control-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
}

.image-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.image-modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    cursor: zoom-out;
}

.image-modal-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    background: white;
    border-radius: 8px;
    overflow: hidden;
}

.image-modal-close {
    position: absolute;
    top: 10px;
    right: 15px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    font-size: 2em;
    cursor: pointer;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    z-index: 1001;
}

.image-modal-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
}

.image-modal-caption {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 15px;
    text-align: center;
}

.media-transcript {
    margin: 10px 0;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.media-transcript summary {
    background: #f8f9fa;
    padding: 10px;
    cursor: pointer;
    font-weight: bold;
}

.transcript-content {
    padding: 15px;
    line-height: 1.6;
}

.typewriter-cursor::after {
    content: '|';
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
}

.media-skip-links {
    position: absolute;
    top: -40px;
    left: 6px;
    z-index: 1000;
}

.skip-link {
    position: absolute;
    left: -10000px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
}

.skip-link:focus {
    position: static;
    width: auto;
    height: auto;
    background: #007bff;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    text-decoration: none;
}

.visually-hidden {
    position: absolute !important;
    clip: rect(1px, 1px, 1px, 1px);
    padding: 0 !important;
    border: 0 !important;
    height: 1px !important;
    width: 1px !important;
    overflow: hidden;
}

@media (max-width: 768px) {
    .video-button-row {
        flex-wrap: wrap;
        gap: 10px;
    }
    
    .volume-container {
        flex: 1;
    }
    
    .global-media-controls {
        bottom: 10px;
        right: 10px;
        padding: 8px;
    }
    
    .global-control-btn {
        padding: 8px 10px;
        font-size: 1em;
    }
    
    .image-modal-content {
        max-width: 95vw;
        max-height: 95vh;
    }
}
`;

// Inject CSS
if (!document.getElementById('multimedia-system-styles')) {
    const style = document.createElement('style');
    style.id = 'multimedia-system-styles';
    style.textContent = multimediaCSS;
    document.head.appendChild(style);
}

// Export for use
window.MultimediaSystem = MultimediaSystem;

console.log('🎬 Universal Multimedia System loaded successfully');