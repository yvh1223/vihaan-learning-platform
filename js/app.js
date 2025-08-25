/**
 * Main Application JavaScript
 * Vihaan's 5th Grade Learning Platform
 */

class LearningApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.theme = localStorage.getItem('theme') || 'light';
        this.studentData = this.loadStudentData();
        
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    setupApp() {
        this.setupEventListeners();
        this.initializeTheme();
        this.hideLoadingScreen();
        this.updateDashboardStats();
        this.setupNavigation();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Mobile menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Subject cards
        document.querySelectorAll('.subject-card').forEach(card => {
            card.addEventListener('click', (e) => this.handleSubjectSelection(e));
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
    }

    handleNavigation(e) {
        const href = e.currentTarget.getAttribute('href') || '';
        if (!href.startsWith('#')) {
            // External or non-hash link: allow normal navigation
            return;
        }
        e.preventDefault();
        const target = href.substring(1);
        this.navigateToSection(target);
    }

    navigateToSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('main > section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href') || '';
            link.classList.remove('active');
            if (href === `#${sectionId}`) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            } else if (href.startsWith('#')) {
                link.removeAttribute('aria-current');
            }
        });

        this.currentSection = sectionId;

        // Update URL without page reload
        history.pushState({ section: sectionId }, '', `#${sectionId}`);
    }

    handleSubjectSelection(e) {
        const card = e.currentTarget;
        const subject = card.dataset.subject;
        
        // Add visual feedback
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);

        // Navigate to subject (will be implemented in later epics)
        console.log(`Navigating to ${subject} - Implementation in Epic 3-6`);
        
        // Show placeholder message
        this.showNotification(`${subject.charAt(0).toUpperCase() + subject.slice(1)} module will be available in Epic 3-6!`, 'info');
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.theme);
        
        // Update theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = this.theme === 'light' ? '🌙' : '☀️';
        }
    }

    initializeTheme() {
        this.applyTheme();
        
        // Set initial theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = this.theme === 'light' ? '🌙' : '☀️';
        }
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        
        setTimeout(() => {
            if (loadingScreen) loadingScreen.style.display = 'none';
            if (app) app.style.display = 'block';
        }, 1000); // Show loading for 1 second
    }

    toggleMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        if (navMenu) {
            navMenu.classList.toggle('active');
        }
    }

    updateDashboardStats() {
        const stats = {
            lessonsCompleted: this.studentData.lessonsCompleted || 0,
            achievementsEarned: this.studentData.achievementsEarned || 0,
            learningStreak: this.studentData.learningStreak || 0,
            timeSpent: this.studentData.timeSpent || 0
        };

        // Update DOM elements
        const lessonsEl = document.getElementById('lessons-completed');
        const achievementsEl = document.getElementById('achievements-earned');
        const streakEl = document.getElementById('learning-streak');
        const timeEl = document.getElementById('time-spent');

        if (lessonsEl) lessonsEl.textContent = stats.lessonsCompleted;
        if (achievementsEl) achievementsEl.textContent = stats.achievementsEarned;
        if (streakEl) streakEl.textContent = stats.learningStreak;
        if (timeEl) timeEl.textContent = `${stats.timeSpent} min`;

        // Animate numbers (simple version)
        this.animateNumbers();
    }

    animateNumbers() {
        document.querySelectorAll('.stat-number').forEach(el => {
            const target = parseInt(el.textContent) || 0;
            let current = 0;
            const increment = target / 20;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                
                if (el.id === 'time-spent') {
                    el.textContent = `${Math.floor(current)} min`;
                } else {
                    el.textContent = Math.floor(current);
                }
            }, 50);
        });
    }

    setupNavigation() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.section) {
                this.navigateToSection(e.state.section);
            }
        });

        // Handle initial hash in URL
        const hash = window.location.hash.substring(1);
        if (hash && document.getElementById(hash)) {
            this.navigateToSection(hash);
        }
    }

    handleKeyboardNavigation(e) {
        // ESC key closes mobile menu
        if (e.key === 'Escape') {
            const navMenu = document.getElementById('nav-menu');
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
            }
        }

        // Arrow keys for navigation (accessibility)
        if (e.altKey) {
            const sections = ['dashboard', 'progress', 'achievements', 'help'];
            const currentIndex = sections.indexOf(this.currentSection);
            
            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                this.navigateToSection(sections[currentIndex - 1]);
            } else if (e.key === 'ArrowRight' && currentIndex < sections.length - 1) {
                this.navigateToSection(sections[currentIndex + 1]);
            }
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" aria-label="Close notification">&times;</button>
            </div>
        `;

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    background: var(--bg-card);
                    border: 1px solid var(--bg-accent);
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-lg);
                    padding: var(--spacing-md);
                    max-width: 300px;
                    animation: slideIn 0.3s ease-out;
                }
                .notification-info { border-left: 4px solid var(--primary-color); }
                .notification-success { border-left: 4px solid var(--success-color); }
                .notification-warning { border-left: 4px solid var(--warning-color); }
                .notification-error { border-left: 4px solid var(--danger-color); }
                .notification-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: var(--spacing-md);
                }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: var(--font-size-lg);
                    cursor: pointer;
                    color: var(--text-secondary);
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        // Add to DOM
        document.body.appendChild(notification);

        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.remove();
            });
        }

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    loadStudentData() {
        // Load from localStorage (will be replaced with Supabase in Epic 8)
        const defaultData = {
            lessonsCompleted: 0,
            achievementsEarned: 0,
            learningStreak: 0,
            timeSpent: 0,
            currentProgress: {
                mathematics: 0,
                science: 0,
                english: 0,
                'social-studies': 0
            }
        };

        try {
            const saved = localStorage.getItem('studentData');
            return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
        } catch (error) {
            console.warn('Failed to load student data:', error);
            return defaultData;
        }
    }

    saveStudentData() {
        try {
            localStorage.setItem('studentData', JSON.stringify(this.studentData));
        } catch (error) {
            console.warn('Failed to save student data:', error);
        }
    }

    // Utility method for updating progress
    updateProgress(subject, progress) {
        if (this.studentData.currentProgress) {
            this.studentData.currentProgress[subject] = progress;
            
            // Update UI
            const card = document.querySelector(`[data-subject="${subject}"]`);
            if (card) {
                const progressFill = card.querySelector('.progress-fill');
                const progressText = card.querySelector('.progress-text');
                
                if (progressFill) progressFill.style.width = `${progress}%`;
                if (progressText) progressText.textContent = `${progress}% Complete`;
            }
            
            this.saveStudentData();
        }
    }
}

// Initialize app when page loads
const learningApp = new LearningApp();

// Export for potential use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LearningApp;
}
