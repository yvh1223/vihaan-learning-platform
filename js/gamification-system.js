/**
 * Universal Gamification System for Vihaan's Learning Platform
 * Provides points, badges, achievements, and competitive elements
 * Designed for educational engagement and motivation
 */

class GamificationSystem {
    constructor(options = {}) {
        this.options = {
            pointsEnabled: true,
            badgesEnabled: true,
            achievementsEnabled: true,
            leaderboardEnabled: false, // Single-user platform
            dailyChallengesEnabled: true,
            streaksEnabled: true,
            celebrationsEnabled: true,
            soundEffects: true,
            animations: true,
            persistence: true,
            encouragementMessages: true,
            difficultyScaling: true,
            parentReporting: true,
            debugMode: false,
            ...options
        };

        this.userData = {
            totalPoints: 0,
            dailyPoints: 0,
            weeklyPoints: 0,
            level: 1,
            experience: 0,
            badges: [],
            achievements: [],
            streaks: {
                daily: 0,
                weekly: 0,
                longest: 0
            },
            stats: {
                questionsAnswered: 0,
                correctAnswers: 0,
                chaptersCompleted: 0,
                timeSpent: 0,
                lastActive: null,
                joinDate: new Date()
            },
            preferences: {
                soundEnabled: true,
                animationsEnabled: true,
                celebrationsEnabled: true
            }
        };

        this.badges = new Map();
        this.achievements = new Map();
        this.pointRules = new Map();
        this.callbacks = new Map();
        this.dailyChallenge = null;
        this.celebrationQueue = [];
        this.isInitialized = false;

        this.init();
    }

    async init() {
        await this.loadUserData();
        this.setupBadges();
        this.setupAchievements();
        this.setupPointRules();
        this.setupUI();
        this.setupEventListeners();
        this.checkDailyReset();
        this.generateDailyChallenge();
        this.updateUI();
        
        this.isInitialized = true;
        this.log('Gamification System initialized');
        this.fireCallback('systemInitialized', this.getUserData());
    }

    // Data Persistence
    async loadUserData() {
        if (!this.options.persistence) return;

        try {
            const savedData = localStorage.getItem('gamification_user_data');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                this.userData = { ...this.userData, ...parsed };
                
                // Convert date strings back to Date objects
                this.userData.stats.lastActive = this.userData.stats.lastActive ? new Date(this.userData.stats.lastActive) : null;
                this.userData.stats.joinDate = new Date(this.userData.stats.joinDate);
            }
        } catch (error) {
            this.log('Error loading user data:', error);
        }
    }

    saveUserData() {
        if (!this.options.persistence) return;

        try {
            const dataToSave = { ...this.userData };
            dataToSave.stats.lastActive = new Date();
            localStorage.setItem('gamification_user_data', JSON.stringify(dataToSave));
        } catch (error) {
            this.log('Error saving user data:', error);
        }
    }

    // Badge System
    setupBadges() {
        const badgeDefinitions = [
            // Learning Badges
            {
                id: 'first_steps',
                name: 'First Steps',
                description: 'Complete your first lesson',
                icon: '👶',
                rarity: 'common',
                criteria: { chaptersCompleted: 1 }
            },
            {
                id: 'math_master',
                name: 'Math Master',
                description: 'Complete all Mathematics chapters',
                icon: '🔢',
                rarity: 'rare',
                criteria: { subject: 'mathematics', chaptersCompleted: 4 }
            },
            {
                id: 'science_explorer',
                name: 'Science Explorer',
                description: 'Complete all Science chapters',
                icon: '🔬',
                rarity: 'rare',
                criteria: { subject: 'science', chaptersCompleted: 5 }
            },
            {
                id: 'word_wizard',
                name: 'Word Wizard',
                description: 'Complete all English chapters',
                icon: '📚',
                rarity: 'rare',
                criteria: { subject: 'english', chaptersCompleted: 4 }
            },
            {
                id: 'history_buff',
                name: 'History Buff',
                description: 'Complete all Social Studies chapters',
                icon: '🏛️',
                rarity: 'rare',
                criteria: { subject: 'social-studies', chaptersCompleted: 4 }
            },
            
            // Achievement Badges
            {
                id: 'perfect_score',
                name: 'Perfect Score',
                description: 'Score 100% on any quiz',
                icon: '🎯',
                rarity: 'uncommon',
                criteria: { perfectScore: true }
            },
            {
                id: 'speed_demon',
                name: 'Speed Demon',
                description: 'Complete a quiz in under 2 minutes',
                icon: '⚡',
                rarity: 'uncommon',
                criteria: { fastCompletion: 120 }
            },
            {
                id: 'persistent_learner',
                name: 'Persistent Learner',
                description: 'Study for 7 days in a row',
                icon: '🔥',
                rarity: 'rare',
                criteria: { dailyStreak: 7 }
            },
            {
                id: 'knowledge_seeker',
                name: 'Knowledge Seeker',
                description: 'Answer 500 questions correctly',
                icon: '🎓',
                rarity: 'epic',
                criteria: { correctAnswers: 500 }
            },
            {
                id: 'completionist',
                name: 'Completionist',
                description: 'Complete all subjects with 90%+ average',
                icon: '🏆',
                rarity: 'legendary',
                criteria: { allSubjectsComplete: true, averageScore: 90 }
            },

            // Engagement Badges
            {
                id: 'early_bird',
                name: 'Early Bird',
                description: 'Study before 8 AM',
                icon: '🌅',
                rarity: 'common',
                criteria: { studyTime: 'morning' }
            },
            {
                id: 'night_owl',
                name: 'Night Owl',
                description: 'Study after 8 PM',
                icon: '🦉',
                rarity: 'common',
                criteria: { studyTime: 'evening' }
            },
            {
                id: 'marathon_runner',
                name: 'Marathon Runner',
                description: 'Study for 2+ hours in one session',
                icon: '🏃‍♂️',
                rarity: 'uncommon',
                criteria: { sessionLength: 7200000 } // 2 hours in ms
            }
        ];

        badgeDefinitions.forEach(badge => {
            this.badges.set(badge.id, badge);
        });
    }

    // Achievement System
    setupAchievements() {
        const achievementDefinitions = [
            {
                id: 'first_hundred',
                name: 'First Hundred',
                description: 'Earn your first 100 points',
                points: 10,
                criteria: { totalPoints: 100 }
            },
            {
                id: 'point_collector',
                name: 'Point Collector',
                description: 'Earn 1,000 total points',
                points: 50,
                criteria: { totalPoints: 1000 }
            },
            {
                id: 'dedication_award',
                name: 'Dedication Award',
                description: 'Study for 30 days (not consecutive)',
                points: 100,
                criteria: { studyDays: 30 }
            },
            {
                id: 'accuracy_expert',
                name: 'Accuracy Expert',
                description: 'Maintain 90%+ accuracy over 100 questions',
                points: 75,
                criteria: { accuracyRate: 90, minimumQuestions: 100 }
            },
            {
                id: 'time_master',
                name: 'Time Master',
                description: 'Spend 50 hours learning',
                points: 200,
                criteria: { timeSpent: 180000000 } // 50 hours in ms
            }
        ];

        achievementDefinitions.forEach(achievement => {
            this.achievements.set(achievement.id, achievement);
        });
    }

    // Point Rules System
    setupPointRules() {
        const pointRules = [
            { action: 'correct_answer', points: 10, description: 'Correct answer' },
            { action: 'perfect_quiz', points: 50, description: 'Perfect quiz score' },
            { action: 'chapter_complete', points: 100, description: 'Chapter completed' },
            { action: 'subject_complete', points: 500, description: 'Subject completed' },
            { action: 'daily_goal', points: 25, description: 'Daily goal achieved' },
            { action: 'streak_bonus', points: 15, description: 'Daily streak bonus' },
            { action: 'first_try', points: 5, description: 'First try correct' },
            { action: 'speed_bonus', points: 20, description: 'Fast completion bonus' },
            { action: 'comeback', points: 30, description: 'Returning after absence' }
        ];

        pointRules.forEach(rule => {
            this.pointRules.set(rule.action, rule);
        });
    }

    // UI Setup
    setupUI() {
        this.createGameUI();
        this.createCelebrationSystem();
    }

    createGameUI() {
        // Create main gamification UI
        const gameUI = document.createElement('div');
        gameUI.id = 'gamification-ui';
        gameUI.className = 'gamification-ui';
        gameUI.innerHTML = `
            <div class="game-header">
                <div class="user-info">
                    <div class="user-avatar">
                        <span class="avatar-icon">🎓</span>
                        <div class="level-badge">Lv.${this.userData.level}</div>
                    </div>
                    <div class="user-details">
                        <div class="user-name">Vihaan</div>
                        <div class="experience-bar">
                            <div class="xp-fill" style="width: ${this.getExperiencePercentage()}%"></div>
                            <span class="xp-text">${this.userData.experience} XP</span>
                        </div>
                    </div>
                </div>
                
                <div class="points-display">
                    <div class="points-today">
                        <span class="points-label">Today</span>
                        <span class="points-value">${this.userData.dailyPoints}</span>
                    </div>
                    <div class="points-total">
                        <span class="points-label">Total</span>
                        <span class="points-value">${this.userData.totalPoints}</span>
                    </div>
                </div>
            </div>

            <div class="game-stats">
                <div class="stat-item">
                    <div class="stat-icon">🔥</div>
                    <div class="stat-value">${this.userData.streaks.daily}</div>
                    <div class="stat-label">Day Streak</div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value">${this.getAccuracyRate()}%</div>
                    <div class="stat-label">Accuracy</div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-icon">🏅</div>
                    <div class="stat-value">${this.userData.badges.length}</div>
                    <div class="stat-label">Badges</div>
                </div>
            </div>

            <div class="daily-challenge" id="daily-challenge">
                ${this.renderDailyChallenge()}
            </div>

            <div class="recent-badges" id="recent-badges">
                ${this.renderRecentBadges()}
            </div>

            <button class="toggle-ui-btn" onclick="document.getElementById('gamification-ui').classList.toggle('collapsed')">
                <span class="expand-icon">◀</span>
                <span class="collapse-icon">▶</span>
            </button>
        `;

        // Add to page
        document.body.appendChild(gameUI);
    }

    renderDailyChallenge() {
        if (!this.dailyChallenge) return '<p>Loading daily challenge...</p>';

        const progress = this.getDailyChallengeProgress();
        const isComplete = progress.current >= progress.target;

        return `
            <div class="challenge-header">
                <h4>🎯 Daily Challenge</h4>
                <div class="challenge-status ${isComplete ? 'complete' : ''}">
                    ${isComplete ? '✅ Complete!' : `${progress.current}/${progress.target}`}
                </div>
            </div>
            
            <div class="challenge-description">
                ${this.dailyChallenge.description}
            </div>
            
            <div class="challenge-reward">
                Reward: ${this.dailyChallenge.reward} points
            </div>
            
            <div class="challenge-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(progress.current / progress.target) * 100}%"></div>
                </div>
            </div>
        `;
    }

    renderRecentBadges() {
        const recentBadges = this.userData.badges.slice(-3);
        
        if (recentBadges.length === 0) {
            return '<p class="no-badges">Complete activities to earn your first badge!</p>';
        }

        return `
            <div class="badges-header">
                <h4>🏅 Recent Badges</h4>
                <button onclick="window.gamificationSystem.showAllBadges()">View All</button>
            </div>
            <div class="badge-list">
                ${recentBadges.map(badgeId => {
                    const badge = this.badges.get(badgeId);
                    return badge ? `
                        <div class="badge-item ${badge.rarity}">
                            <span class="badge-icon">${badge.icon}</span>
                            <span class="badge-name">${badge.name}</span>
                        </div>
                    ` : '';
                }).join('')}
            </div>
        `;
    }

    createCelebrationSystem() {
        const celebrationContainer = document.createElement('div');
        celebrationContainer.id = 'celebration-container';
        celebrationContainer.className = 'celebration-container';
        document.body.appendChild(celebrationContainer);
    }

    // Event Listeners
    setupEventListeners() {
        // Listen for quiz completions
        document.addEventListener('quizCompleted', (event) => {
            this.handleQuizCompletion(event.detail);
        });

        // Listen for chapter completions
        document.addEventListener('chapterCompleted', (event) => {
            this.handleChapterCompletion(event.detail);
        });

        // Listen for correct answers
        document.addEventListener('correctAnswer', (event) => {
            this.handleCorrectAnswer(event.detail);
        });

        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.handleReturn();
            }
        });

        // Auto-save periodically
        setInterval(() => this.saveUserData(), 30000);
    }

    // Event Handlers
    handleQuizCompletion(data) {
        const { score, totalQuestions, timeSpent, subject } = data;
        const percentage = (score / totalQuestions) * 100;

        // Award points based on performance
        let points = 0;
        
        if (percentage === 100) {
            points += this.awardPoints('perfect_quiz');
            this.checkBadgeCriteria('perfect_score', { perfectScore: true });
        }

        if (timeSpent < 120000) { // 2 minutes
            points += this.awardPoints('speed_bonus');
            this.checkBadgeCriteria('speed_demon', { fastCompletion: timeSpent / 1000 });
        }

        // Update stats
        this.userData.stats.questionsAnswered += totalQuestions;
        this.userData.stats.correctAnswers += score;
        this.userData.stats.timeSpent += timeSpent;

        // Check achievements
        this.checkAllCriteria();

        // Update daily challenge
        this.updateDailyChallengeProgress('quiz_completed', { score, percentage, subject });

        this.saveUserData();
        this.updateUI();

        // Celebrate if significant achievement
        if (percentage >= 90) {
            this.celebrate('great_job', { score: percentage });
        }
    }

    handleChapterCompletion(data) {
        const { subject, chapter } = data;
        
        this.awardPoints('chapter_complete');
        this.userData.stats.chaptersCompleted++;

        // Check for subject completion
        this.checkSubjectCompletion(subject);

        // Update badges
        this.checkBadgeCriteria('first_steps', { chaptersCompleted: this.userData.stats.chaptersCompleted });

        // Check subject-specific badges
        const subjectChapters = this.getSubjectChapterCount(subject);
        this.checkBadgeCriteria(`${subject.replace('-', '_')}_master`, { 
            subject: subject, 
            chaptersCompleted: subjectChapters 
        });

        this.updateDailyChallengeProgress('chapter_completed', { subject });

        this.celebrate('chapter_complete', { subject, chapter });
        
        this.checkAllCriteria();
        this.saveUserData();
        this.updateUI();
    }

    handleCorrectAnswer(data) {
        const { isFirstTry, timeToAnswer } = data;

        let points = this.awardPoints('correct_answer');
        
        if (isFirstTry) {
            points += this.awardPoints('first_try');
        }

        // Award bonus for quick answers (under 10 seconds)
        if (timeToAnswer < 10000) {
            points += 5;
        }

        this.updateDailyChallengeProgress('correct_answer', data);
        
        this.saveUserData();
        this.updateUI();
    }

    handleReturn() {
        const now = new Date();
        const lastActive = this.userData.stats.lastActive;
        
        if (!lastActive) {
            this.userData.stats.lastActive = now;
            return;
        }

        const timeDiff = now - new Date(lastActive);
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        if (daysDiff >= 1) {
            // Award comeback points if returning after absence
            if (daysDiff > 1) {
                this.awardPoints('comeback');
                this.celebrate('welcome_back', { daysAway: daysDiff });
            }

            // Update streak
            if (daysDiff === 1) {
                this.userData.streaks.daily++;
                if (this.userData.streaks.daily > this.userData.streaks.longest) {
                    this.userData.streaks.longest = this.userData.streaks.daily;
                }
                this.awardPoints('streak_bonus');
            } else {
                this.userData.streaks.daily = 1; // Reset streak
            }

            this.checkBadgeCriteria('persistent_learner', { dailyStreak: this.userData.streaks.daily });

            this.resetDailyData();
        }

        this.userData.stats.lastActive = now;
        this.saveUserData();
        this.updateUI();
    }

    // Point System
    awardPoints(action, multiplier = 1) {
        const rule = this.pointRules.get(action);
        if (!rule) {
            this.log('Unknown point action:', action);
            return 0;
        }

        const points = Math.floor(rule.points * multiplier);
        this.userData.totalPoints += points;
        this.userData.dailyPoints += points;
        this.userData.experience += points;

        // Check for level up
        this.checkLevelUp();

        // Show point notification
        this.showPointNotification(points, rule.description);

        this.fireCallback('pointsAwarded', { action, points, totalPoints: this.userData.totalPoints });

        return points;
    }

    checkLevelUp() {
        const newLevel = Math.floor(this.userData.experience / 1000) + 1;
        
        if (newLevel > this.userData.level) {
            const oldLevel = this.userData.level;
            this.userData.level = newLevel;
            
            this.celebrate('level_up', { oldLevel, newLevel: this.userData.level });
            this.fireCallback('levelUp', { oldLevel, newLevel: this.userData.level });
        }
    }

    showPointNotification(points, description) {
        if (!this.options.animations) return;

        const notification = document.createElement('div');
        notification.className = 'point-notification';
        notification.innerHTML = `
            <span class="points">+${points}</span>
            <span class="description">${description}</span>
        `;

        document.body.appendChild(notification);

        // Animate
        notification.style.animation = 'pointPop 2s ease-out forwards';

        setTimeout(() => {
            notification.remove();
        }, 2000);
    }

    // Badge System Methods
    checkBadgeCriteria(badgeId, criteria) {
        if (this.userData.badges.includes(badgeId)) return false;

        const badge = this.badges.get(badgeId);
        if (!badge) return false;

        let eligible = true;

        // Check each criterion
        for (const [key, value] of Object.entries(badge.criteria)) {
            switch (key) {
                case 'chaptersCompleted':
                    if (badge.criteria.subject) {
                        const subjectChapters = this.getSubjectChapterCount(badge.criteria.subject);
                        if (subjectChapters < value) eligible = false;
                    } else {
                        if (this.userData.stats.chaptersCompleted < value) eligible = false;
                    }
                    break;
                case 'correctAnswers':
                    if (this.userData.stats.correctAnswers < value) eligible = false;
                    break;
                case 'totalPoints':
                    if (this.userData.totalPoints < value) eligible = false;
                    break;
                case 'dailyStreak':
                    if (this.userData.streaks.daily < value) eligible = false;
                    break;
                case 'perfectScore':
                    if (!criteria.perfectScore) eligible = false;
                    break;
                case 'fastCompletion':
                    if (!criteria.fastCompletion || criteria.fastCompletion > value) eligible = false;
                    break;
                case 'studyTime':
                    const hour = new Date().getHours();
                    if (value === 'morning' && hour >= 8) eligible = false;
                    if (value === 'evening' && hour < 20) eligible = false;
                    break;
                default:
                    // Custom criteria from event data
                    if (criteria[key] === undefined || criteria[key] < value) eligible = false;
            }
        }

        if (eligible) {
            this.awardBadge(badgeId);
            return true;
        }

        return false;
    }

    awardBadge(badgeId) {
        if (this.userData.badges.includes(badgeId)) return;

        const badge = this.badges.get(badgeId);
        if (!badge) return;

        this.userData.badges.push(badgeId);
        
        // Award bonus points based on rarity
        const bonusPoints = this.getBadgeBonus(badge.rarity);
        if (bonusPoints > 0) {
            this.userData.totalPoints += bonusPoints;
            this.userData.experience += bonusPoints;
        }

        this.celebrate('badge_earned', badge);
        this.fireCallback('badgeEarned', badge);

        this.saveUserData();
        this.updateUI();
    }

    getBadgeBonus(rarity) {
        const bonuses = {
            common: 25,
            uncommon: 50,
            rare: 100,
            epic: 200,
            legendary: 500
        };
        return bonuses[rarity] || 0;
    }

    // Achievement System Methods
    checkAllCriteria() {
        // Check achievements
        for (const [achievementId, achievement] of this.achievements) {
            if (!this.userData.achievements.includes(achievementId)) {
                this.checkAchievementCriteria(achievementId);
            }
        }

        // Check badges
        for (const [badgeId, badge] of this.badges) {
            if (!this.userData.badges.includes(badgeId)) {
                this.checkBadgeCriteria(badgeId, {});
            }
        }
    }

    checkAchievementCriteria(achievementId) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || this.userData.achievements.includes(achievementId)) return;

        let eligible = true;

        for (const [key, value] of Object.entries(achievement.criteria)) {
            switch (key) {
                case 'totalPoints':
                    if (this.userData.totalPoints < value) eligible = false;
                    break;
                case 'accuracyRate':
                    if (this.getAccuracyRate() < value) eligible = false;
                    break;
                case 'minimumQuestions':
                    if (this.userData.stats.questionsAnswered < value) eligible = false;
                    break;
                case 'timeSpent':
                    if (this.userData.stats.timeSpent < value) eligible = false;
                    break;
                case 'studyDays':
                    // This would need to be tracked separately
                    break;
            }
        }

        if (eligible) {
            this.awardAchievement(achievementId);
        }
    }

    awardAchievement(achievementId) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || this.userData.achievements.includes(achievementId)) return;

        this.userData.achievements.push(achievementId);
        this.userData.totalPoints += achievement.points;
        this.userData.experience += achievement.points;

        this.celebrate('achievement_unlocked', achievement);
        this.fireCallback('achievementUnlocked', achievement);

        this.saveUserData();
        this.updateUI();
    }

    // Daily Challenge System
    generateDailyChallenge() {
        const challenges = [
            {
                type: 'quiz_score',
                description: 'Score 80% or higher on 3 quizzes',
                target: 3,
                reward: 100,
                check: (progress, data) => {
                    if (data.percentage >= 80) {
                        return progress.current + 1;
                    }
                    return progress.current;
                }
            },
            {
                type: 'correct_answers',
                description: 'Answer 25 questions correctly',
                target: 25,
                reward: 75,
                check: (progress, data) => progress.current + 1
            },
            {
                type: 'chapter_complete',
                description: 'Complete 2 chapters',
                target: 2,
                reward: 150,
                check: (progress, data) => progress.current + 1
            },
            {
                type: 'perfect_quiz',
                description: 'Get a perfect score on any quiz',
                target: 1,
                reward: 200,
                check: (progress, data) => {
                    if (data.percentage === 100) {
                        return progress.current + 1;
                    }
                    return progress.current;
                }
            }
        ];

        // Select random challenge
        const challenge = challenges[Math.floor(Math.random() * challenges.length)];
        
        this.dailyChallenge = {
            ...challenge,
            id: `daily_${new Date().toDateString()}`,
            progress: { current: 0, target: challenge.target }
        };

        // Load saved progress if exists
        const savedProgress = localStorage.getItem(`daily_challenge_${this.dailyChallenge.id}`);
        if (savedProgress) {
            this.dailyChallenge.progress = JSON.parse(savedProgress);
        }
    }

    updateDailyChallengeProgress(eventType, data) {
        if (!this.dailyChallenge || !this.dailyChallenge.check) return;

        const currentProgress = this.dailyChallenge.progress.current;
        
        let newProgress = currentProgress;
        switch (eventType) {
            case 'quiz_completed':
                if (this.dailyChallenge.type === 'quiz_score' || this.dailyChallenge.type === 'perfect_quiz') {
                    newProgress = this.dailyChallenge.check(this.dailyChallenge.progress, data);
                }
                break;
            case 'correct_answer':
                if (this.dailyChallenge.type === 'correct_answers') {
                    newProgress = this.dailyChallenge.check(this.dailyChallenge.progress, data);
                }
                break;
            case 'chapter_completed':
                if (this.dailyChallenge.type === 'chapter_complete') {
                    newProgress = this.dailyChallenge.check(this.dailyChallenge.progress, data);
                }
                break;
        }

        // Update progress
        this.dailyChallenge.progress.current = Math.min(newProgress, this.dailyChallenge.progress.target);

        // Save progress
        localStorage.setItem(`daily_challenge_${this.dailyChallenge.id}`, JSON.stringify(this.dailyChallenge.progress));

        // Check completion
        if (this.dailyChallenge.progress.current >= this.dailyChallenge.progress.target) {
            this.completeDailyChallenge();
        }

        this.updateUI();
    }

    completeDailyChallenge() {
        if (!this.dailyChallenge) return;

        this.userData.totalPoints += this.dailyChallenge.reward;
        this.userData.dailyPoints += this.dailyChallenge.reward;
        this.userData.experience += this.dailyChallenge.reward;

        this.celebrate('daily_challenge_complete', this.dailyChallenge);
        
        // Mark as completed
        this.dailyChallenge.completed = true;
        
        this.saveUserData();
        this.updateUI();
    }

    getDailyChallengeProgress() {
        return this.dailyChallenge?.progress || { current: 0, target: 1 };
    }

    // Celebration System
    celebrate(type, data = {}) {
        if (!this.options.celebrationsEnabled) return;

        const celebrations = {
            level_up: {
                title: `🎉 Level Up!`,
                message: `You reached Level ${data.newLevel}!`,
                animation: 'levelUp',
                sound: 'success',
                duration: 3000
            },
            badge_earned: {
                title: `🏅 Badge Earned!`,
                message: `${data.icon} ${data.name}`,
                animation: 'badgeEarn',
                sound: 'badge',
                duration: 4000
            },
            achievement_unlocked: {
                title: `🏆 Achievement Unlocked!`,
                message: `${data.name} (+${data.points} points)`,
                animation: 'achievement',
                sound: 'achievement',
                duration: 4000
            },
            perfect_score: {
                title: `🎯 Perfect Score!`,
                message: `Amazing work! You got 100%!`,
                animation: 'perfect',
                sound: 'perfect',
                duration: 3000
            },
            great_job: {
                title: `⭐ Great Job!`,
                message: `You scored ${Math.round(data.score)}%!`,
                animation: 'success',
                sound: 'good',
                duration: 2000
            },
            chapter_complete: {
                title: `📚 Chapter Complete!`,
                message: `You finished ${data.subject} Chapter ${data.chapter}!`,
                animation: 'complete',
                sound: 'complete',
                duration: 2500
            },
            daily_challenge_complete: {
                title: `🎯 Daily Challenge Complete!`,
                message: `+${data.reward} bonus points!`,
                animation: 'challenge',
                sound: 'bonus',
                duration: 3000
            },
            welcome_back: {
                title: `👋 Welcome Back!`,
                message: `You were away for ${data.daysAway} day${data.daysAway > 1 ? 's' : ''}`,
                animation: 'welcome',
                sound: 'welcome',
                duration: 2500
            }
        };

        const celebration = celebrations[type];
        if (!celebration) return;

        this.showCelebration(celebration);
        
        if (this.options.soundEffects) {
            this.playSound(celebration.sound);
        }
    }

    showCelebration(celebration) {
        const container = document.getElementById('celebration-container');
        if (!container) return;

        const celebrationEl = document.createElement('div');
        celebrationEl.className = `celebration-modal ${celebration.animation}`;
        celebrationEl.innerHTML = `
            <div class="celebration-content">
                <h3 class="celebration-title">${celebration.title}</h3>
                <p class="celebration-message">${celebration.message}</p>
            </div>
            <div class="celebration-particles"></div>
        `;

        container.appendChild(celebrationEl);

        // Auto-remove
        setTimeout(() => {
            celebrationEl.remove();
        }, celebration.duration);

        // Add particles effect
        if (this.options.animations) {
            this.createParticles(celebrationEl.querySelector('.celebration-particles'));
        }
    }

    createParticles(container) {
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 2 + 's';
            particle.style.animationDuration = (2 + Math.random() * 3) + 's';
            container.appendChild(particle);
        }
    }

    playSound(type) {
        if (!this.userData.preferences.soundEnabled) return;

        // Create audio context if needed
        if (!window.AudioContext && !window.webkitAudioContext) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const frequencies = {
            success: [523, 659, 784], // C, E, G
            perfect: [523, 659, 784, 1047], // C, E, G, C
            badge: [440, 523, 659], // A, C, E
            achievement: [392, 523, 659, 784], // G, C, E, G
            complete: [523, 587, 659], // C, D, E
            bonus: [659, 784, 880], // E, G, A
            good: [523, 659], // C, E
            welcome: [392, 523, 659] // G, C, E
        };

        const freq = frequencies[type] || [523];
        
        freq.forEach((f, index) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(f, audioContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }, index * 150);
        });
    }

    // UI Update Methods
    updateUI() {
        this.updateGameHeader();
        this.updateGameStats();
        this.updateDailyChallengeUI();
        this.updateRecentBadges();
    }

    updateGameHeader() {
        const levelBadge = document.querySelector('.level-badge');
        const xpFill = document.querySelector('.xp-fill');
        const xpText = document.querySelector('.xp-text');
        const pointsToday = document.querySelector('.points-today .points-value');
        const pointsTotal = document.querySelector('.points-total .points-value');

        if (levelBadge) levelBadge.textContent = `Lv.${this.userData.level}`;
        if (xpFill) xpFill.style.width = this.getExperiencePercentage() + '%';
        if (xpText) xpText.textContent = `${this.userData.experience} XP`;
        if (pointsToday) pointsToday.textContent = this.userData.dailyPoints;
        if (pointsTotal) pointsTotal.textContent = this.userData.totalPoints;
    }

    updateGameStats() {
        const streakValue = document.querySelector('.stat-item .stat-value');
        const accuracyValue = document.querySelectorAll('.stat-item .stat-value')[1];
        const badgesValue = document.querySelectorAll('.stat-item .stat-value')[2];

        if (streakValue) streakValue.textContent = this.userData.streaks.daily;
        if (accuracyValue) accuracyValue.textContent = this.getAccuracyRate() + '%';
        if (badgesValue) badgesValue.textContent = this.userData.badges.length;
    }

    updateDailyChallengeUI() {
        const challengeContainer = document.getElementById('daily-challenge');
        if (challengeContainer) {
            challengeContainer.innerHTML = this.renderDailyChallenge();
        }
    }

    updateRecentBadges() {
        const badgesContainer = document.getElementById('recent-badges');
        if (badgesContainer) {
            badgesContainer.innerHTML = this.renderRecentBadges();
        }
    }

    // Utility Methods
    getExperiencePercentage() {
        const currentLevelXP = (this.userData.level - 1) * 1000;
        const nextLevelXP = this.userData.level * 1000;
        const progress = this.userData.experience - currentLevelXP;
        const maxProgress = nextLevelXP - currentLevelXP;
        return Math.min((progress / maxProgress) * 100, 100);
    }

    getAccuracyRate() {
        if (this.userData.stats.questionsAnswered === 0) return 0;
        return Math.round((this.userData.stats.correctAnswers / this.userData.stats.questionsAnswered) * 100);
    }

    getSubjectChapterCount(subject) {
        // This would need to be connected to actual chapter completion tracking
        // For now, return a placeholder based on saved data
        const key = `${subject}_chapters_completed`;
        return parseInt(localStorage.getItem(key) || '0');
    }

    checkSubjectCompletion(subject) {
        const totalChapters = {
            'mathematics': 4,
            'science': 5,
            'english': 4,
            'social-studies': 4
        };

        const completed = this.getSubjectChapterCount(subject);
        const total = totalChapters[subject] || 0;

        if (completed >= total) {
            this.awardPoints('subject_complete');
            this.celebrate('subject_complete', { subject });
        }
    }

    resetDailyData() {
        this.userData.dailyPoints = 0;
        this.generateDailyChallenge();
    }

    checkDailyReset() {
        const today = new Date().toDateString();
        const lastReset = localStorage.getItem('last_daily_reset');

        if (lastReset !== today) {
            this.resetDailyData();
            localStorage.setItem('last_daily_reset', today);
        }
    }

    // Public API Methods
    showAllBadges() {
        // Create modal showing all badges
        const modal = document.createElement('div');
        modal.className = 'badges-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <h2>🏅 All Badges</h2>
                <div class="all-badges-grid">
                    ${Array.from(this.badges.entries()).map(([id, badge]) => {
                        const earned = this.userData.badges.includes(id);
                        return `
                            <div class="badge-card ${earned ? 'earned' : 'locked'} ${badge.rarity}">
                                <div class="badge-icon ${earned ? '' : 'grayscale'}">${badge.icon}</div>
                                <div class="badge-name">${badge.name}</div>
                                <div class="badge-description">${badge.description}</div>
                                <div class="badge-rarity">${badge.rarity}</div>
                                ${earned ? '<div class="badge-earned-indicator">✓</div>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                <button onclick="this.closest('.badges-modal').remove()">Close</button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    getUserData() {
        return { ...this.userData };
    }

    resetUserData() {
        this.userData = {
            totalPoints: 0,
            dailyPoints: 0,
            weeklyPoints: 0,
            level: 1,
            experience: 0,
            badges: [],
            achievements: [],
            streaks: { daily: 0, weekly: 0, longest: 0 },
            stats: {
                questionsAnswered: 0,
                correctAnswers: 0,
                chaptersCompleted: 0,
                timeSpent: 0,
                lastActive: null,
                joinDate: new Date()
            },
            preferences: {
                soundEnabled: true,
                animationsEnabled: true,
                celebrationsEnabled: true
            }
        };

        this.saveUserData();
        this.updateUI();
    }

    // Callback System
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
                    console.error(`Error in gamification callback for ${event}:`, error);
                }
            });
        }
    }

    log(...args) {
        if (this.options.debugMode) {
            console.log('[Gamification System]', ...args);
        }
    }

    destroy() {
        this.saveUserData();
        
        // Remove UI elements
        const gameUI = document.getElementById('gamification-ui');
        const celebrationContainer = document.getElementById('celebration-container');
        
        if (gameUI) gameUI.remove();
        if (celebrationContainer) celebrationContainer.remove();
        
        // Clear callbacks
        this.callbacks.clear();
        
        this.log('Gamification System destroyed');
    }
}

// CSS for gamification system
const gamificationCSS = `
.gamification-ui {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 320px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    padding: 20px;
    color: white;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: all 0.3s ease;
}

.gamification-ui.collapsed {
    transform: translateX(280px);
}

.toggle-ui-btn {
    position: absolute;
    left: -15px;
    top: 50%;
    transform: translateY(-50%);
    width: 30px;
    height: 60px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 15px 0 0 15px;
    color: white;
    cursor: pointer;
    backdrop-filter: blur(10px);
}

.gamification-ui.collapsed .expand-icon {
    display: none;
}

.gamification-ui:not(.collapsed) .collapse-icon {
    display: none;
}

.game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 15px;
}

.user-avatar {
    position: relative;
}

.avatar-icon {
    font-size: 3em;
    display: block;
}

.level-badge {
    position: absolute;
    bottom: -5px;
    right: -10px;
    background: #FFD700;
    color: #333;
    border-radius: 12px;
    padding: 2px 8px;
    font-size: 0.8em;
    font-weight: bold;
}

.user-details {
    flex: 1;
}

.user-name {
    font-weight: bold;
    font-size: 1.2em;
    margin-bottom: 5px;
}

.experience-bar {
    position: relative;
    background: rgba(255, 255, 255, 0.2);
    height: 20px;
    border-radius: 10px;
    overflow: hidden;
}

.xp-fill {
    background: linear-gradient(90deg, #FFD700, #FFA500);
    height: 100%;
    transition: width 0.5s ease;
}

.xp-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.8em;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.points-display {
    text-align: right;
}

.points-today,
.points-total {
    margin-bottom: 5px;
}

.points-label {
    display: block;
    font-size: 0.8em;
    opacity: 0.8;
}

.points-value {
    display: block;
    font-size: 1.5em;
    font-weight: bold;
}

.game-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    margin-bottom: 20px;
}

.stat-item {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 15px;
    text-align: center;
    backdrop-filter: blur(10px);
}

.stat-icon {
    font-size: 1.5em;
    margin-bottom: 5px;
}

.stat-value {
    font-size: 1.3em;
    font-weight: bold;
    display: block;
}

.stat-label {
    font-size: 0.8em;
    opacity: 0.8;
    margin-top: 2px;
}

.daily-challenge {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    padding: 15px;
    margin-bottom: 20px;
    backdrop-filter: blur(10px);
}

.challenge-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.challenge-header h4 {
    margin: 0;
}

.challenge-status {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8em;
}

.challenge-status.complete {
    background: #28a745;
}

.challenge-description {
    margin: 10px 0;
    line-height: 1.4;
}

.challenge-reward {
    font-size: 0.9em;
    opacity: 0.9;
    margin-bottom: 10px;
}

.challenge-progress .progress-bar {
    background: rgba(255, 255, 255, 0.2);
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
}

.challenge-progress .progress-fill {
    background: linear-gradient(90deg, #28a745, #20c997);
    height: 100%;
    transition: width 0.5s ease;
}

.recent-badges {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    padding: 15px;
    backdrop-filter: blur(10px);
}

.badges-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.badges-header h4 {
    margin: 0;
}

.badges-header button {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 0.8em;
    cursor: pointer;
}

.badge-list {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.badge-item {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9em;
    backdrop-filter: blur(5px);
}

.badge-item.common { border-left: 3px solid #6c757d; }
.badge-item.uncommon { border-left: 3px solid #28a745; }
.badge-item.rare { border-left: 3px solid #007bff; }
.badge-item.epic { border-left: 3px solid #6f42c1; }
.badge-item.legendary { border-left: 3px solid #ffc107; }

.no-badges {
    text-align: center;
    opacity: 0.7;
    font-size: 0.9em;
    margin: 10px 0;
}

.point-notification {
    position: fixed;
    top: 100px;
    right: 50px;
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    padding: 15px 20px;
    border-radius: 25px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    z-index: 1001;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: bold;
}

.points {
    font-size: 1.2em;
    color: #FFD700;
}

@keyframes pointPop {
    0% {
        transform: translateX(100px) scale(0.5);
        opacity: 0;
    }
    20% {
        transform: translateX(0) scale(1.1);
        opacity: 1;
    }
    80% {
        transform: translateX(0) scale(1);
        opacity: 1;
    }
    100% {
        transform: translateX(100px) scale(0.8);
        opacity: 0;
    }
}

.celebration-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1002;
}

.celebration-modal {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 30px;
    border-radius: 20px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    pointer-events: auto;
}

.celebration-title {
    font-size: 2em;
    margin-bottom: 15px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.celebration-message {
    font-size: 1.2em;
    margin-bottom: 0;
    opacity: 0.9;
}

.celebration-particles {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    overflow: hidden;
    border-radius: 20px;
}

.particle {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #FFD700;
    border-radius: 50%;
    animation: particleFall linear infinite;
}

@keyframes particleFall {
    0% {
        transform: translateY(-20px) rotate(0deg);
        opacity: 1;
    }
    100% {
        transform: translateY(200px) rotate(360deg);
        opacity: 0;
    }
}

.celebration-modal.levelUp {
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: #333;
}

.celebration-modal.badgeEarn {
    background: linear-gradient(135deg, #28a745, #20c997);
}

.celebration-modal.achievement {
    background: linear-gradient(135deg, #6f42c1, #e83e8c);
}

.badges-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1003;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    cursor: pointer;
}

.modal-content {
    position: relative;
    background: white;
    border-radius: 20px;
    padding: 30px;
    max-width: 800px;
    max-height: 80vh;
    overflow-y: auto;
    color: #333;
}

.modal-content h2 {
    margin-bottom: 20px;
    text-align: center;
}

.all-badges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.badge-card {
    border: 2px solid #ddd;
    border-radius: 15px;
    padding: 15px;
    text-align: center;
    transition: all 0.3s ease;
    position: relative;
}

.badge-card.earned {
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    border-color: #28a745;
}

.badge-card.locked {
    opacity: 0.6;
    background: #f8f9fa;
}

.badge-card.common { border-color: #6c757d; }
.badge-card.uncommon { border-color: #28a745; }
.badge-card.rare { border-color: #007bff; }
.badge-card.epic { border-color: #6f42c1; }
.badge-card.legendary { border-color: #ffc107; }

.badge-card .badge-icon {
    font-size: 3em;
    margin-bottom: 10px;
    display: block;
}

.badge-card .badge-icon.grayscale {
    filter: grayscale(100%);
}

.badge-card .badge-name {
    font-weight: bold;
    margin-bottom: 8px;
}

.badge-card .badge-description {
    font-size: 0.9em;
    color: #666;
    margin-bottom: 8px;
    line-height: 1.3;
}

.badge-card .badge-rarity {
    font-size: 0.8em;
    text-transform: uppercase;
    font-weight: bold;
    opacity: 0.7;
}

.badge-earned-indicator {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #28a745;
    color: white;
    border-radius: 50%;
    width: 25px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9em;
}

@media (max-width: 768px) {
    .gamification-ui {
        position: relative;
        top: auto;
        right: auto;
        width: 100%;
        margin: 10px;
        border-radius: 15px;
    }
    
    .gamification-ui.collapsed {
        transform: none;
        height: 60px;
        overflow: hidden;
    }
    
    .toggle-ui-btn {
        position: absolute;
        right: 15px;
        top: 15px;
        left: auto;
        transform: none;
        width: 40px;
        height: 30px;
        border-radius: 15px;
    }
    
    .game-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
    }
    
    .game-stats {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .point-notification {
        right: 20px;
        top: 80px;
    }
    
    .modal-content {
        margin: 20px;
        max-width: none;
        max-height: calc(100vh - 40px);
    }
    
    .all-badges-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }
}
`;

// Inject CSS
if (!document.getElementById('gamification-system-styles')) {
    const style = document.createElement('style');
    style.id = 'gamification-system-styles';
    style.textContent = gamificationCSS;
    document.head.appendChild(style);
}

// Export for use
window.GamificationSystem = GamificationSystem;

console.log('🎮 Universal Gamification System loaded successfully');