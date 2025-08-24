/**
 * Universal Assessment & Quiz System for Vihaan's Learning Platform
 * Provides comprehensive assessment tools with immediate feedback
 * Compatible with all subjects and learning modules
 */

class AssessmentSystem {
    constructor(options = {}) {
        this.options = {
            containerId: 'assessment-container',
            autoSave: true,
            showProgress: true,
            immediateResults: true,
            detailedExplanations: true,
            accessibility: true,
            touchFriendly: true,
            animations: true,
            soundEffects: false,
            timedMode: false,
            randomizeQuestions: false,
            randomizeOptions: false,
            allowReview: true,
            passingScore: 70,
            debugMode: false,
            ...options
        };

        this.currentAssessment = null;
        this.currentQuestionIndex = 0;
        this.responses = {};
        this.startTime = null;
        this.questionStartTime = null;
        this.timeSpent = {};
        this.callbacks = new Map();
        this.progressData = {
            correct: 0,
            incorrect: 0,
            totalQuestions: 0,
            timeElapsed: 0
        };

        this.init();
    }

    init() {
        this.createContainer();
        this.setupEventListeners();
        this.log('Assessment System initialized');
    }

    createContainer() {
        let container = document.getElementById(this.options.containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = this.options.containerId;
            container.className = 'assessment-system-container';
            document.body.appendChild(container);
        }
        this.container = container;
    }

    setupEventListeners() {
        // Keyboard navigation
        if (this.options.accessibility) {
            document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
        }

        // Auto-save on visibility change
        if (this.options.autoSave) {
            document.addEventListener('visibilitychange', this.autoSave.bind(this));
            window.addEventListener('beforeunload', this.autoSave.bind(this));
        }
    }

    // Main assessment methods
    loadAssessment(assessmentData) {
        this.currentAssessment = this.processAssessmentData(assessmentData);
        this.responses = {};
        this.timeSpent = {};
        this.progressData = {
            correct: 0,
            incorrect: 0,
            totalQuestions: this.currentAssessment.questions.length,
            timeElapsed: 0
        };

        if (this.options.randomizeQuestions) {
            this.shuffleArray(this.currentAssessment.questions);
        }

        this.startTime = new Date();
        this.currentQuestionIndex = 0;
        this.renderAssessment();
        this.fireCallback('assessmentLoaded', this.currentAssessment);
    }

    processAssessmentData(data) {
        const processed = {
            id: data.id || 'assessment_' + Date.now(),
            title: data.title || 'Assessment',
            description: data.description || '',
            subject: data.subject || 'general',
            difficulty: data.difficulty || 'medium',
            estimatedTime: data.estimatedTime || 15,
            passingScore: data.passingScore || this.options.passingScore,
            questions: data.questions.map((q, index) => this.processQuestion(q, index))
        };

        return processed;
    }

    processQuestion(questionData, index) {
        const question = {
            id: questionData.id || `q_${index}`,
            type: questionData.type || 'multiple-choice',
            question: questionData.question,
            options: questionData.options || [],
            correctAnswer: questionData.correctAnswer,
            explanation: questionData.explanation || '',
            difficulty: questionData.difficulty || 'medium',
            topic: questionData.topic || '',
            points: questionData.points || 1,
            timeLimit: questionData.timeLimit || 0,
            hints: questionData.hints || [],
            multimedia: questionData.multimedia || null
        };

        // Randomize options if enabled
        if (this.options.randomizeOptions && question.type === 'multiple-choice') {
            const correctIndex = question.options.findIndex(opt => opt.correct);
            this.shuffleArray(question.options);
            question.correctAnswer = question.options.findIndex(opt => opt.correct);
        }

        return question;
    }

    renderAssessment() {
        if (!this.currentAssessment) return;

        this.container.innerHTML = `
            <div class="assessment-header">
                <h2 class="assessment-title">${this.currentAssessment.title}</h2>
                <div class="assessment-info">
                    <span class="subject-badge" data-subject="${this.currentAssessment.subject}">
                        ${this.currentAssessment.subject.charAt(0).toUpperCase() + this.currentAssessment.subject.slice(1)}
                    </span>
                    <span class="difficulty-badge" data-difficulty="${this.currentAssessment.difficulty}">
                        ${this.currentAssessment.difficulty}
                    </span>
                    <span class="time-estimate">
                        ⏱️ ${this.currentAssessment.estimatedTime} min
                    </span>
                </div>
                ${this.currentAssessment.description ? `<p class="assessment-description">${this.currentAssessment.description}</p>` : ''}
            </div>
            
            ${this.options.showProgress ? this.renderProgressBar() : ''}
            
            <div class="question-container" id="question-container">
                ${this.renderCurrentQuestion()}
            </div>
            
            <div class="assessment-controls">
                <button id="prev-question" class="btn btn-secondary" ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>
                    ← Previous
                </button>
                <button id="next-question" class="btn btn-primary">
                    ${this.currentQuestionIndex === this.currentAssessment.questions.length - 1 ? 'Finish Assessment' : 'Next →'}
                </button>
            </div>
            
            ${this.options.timedMode && this.currentAssessment.questions[this.currentQuestionIndex].timeLimit > 0 ? 
                '<div class="question-timer" id="question-timer"></div>' : ''}
        `;

        this.setupQuestionEventListeners();
        this.questionStartTime = new Date();

        if (this.options.timedMode && this.currentAssessment.questions[this.currentQuestionIndex].timeLimit > 0) {
            this.startQuestionTimer();
        }
    }

    renderProgressBar() {
        const progress = ((this.currentQuestionIndex + 1) / this.currentAssessment.questions.length) * 100;
        
        return `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">
                    Question ${this.currentQuestionIndex + 1} of ${this.currentAssessment.questions.length}
                </div>
            </div>
        `;
    }

    renderCurrentQuestion() {
        const question = this.currentAssessment.questions[this.currentQuestionIndex];
        const savedResponse = this.responses[question.id];

        let questionHTML = `
            <div class="question-header">
                <div class="question-meta">
                    <span class="question-number">Question ${this.currentQuestionIndex + 1}</span>
                    ${question.points > 1 ? `<span class="points">(${question.points} points)</span>` : ''}
                    ${question.topic ? `<span class="topic-tag">${question.topic}</span>` : ''}
                </div>
            </div>
            
            <div class="question-content">
                ${question.multimedia ? this.renderMultimedia(question.multimedia) : ''}
                <h3 class="question-text">${question.question}</h3>
                
                <div class="question-input" data-question-id="${question.id}">
                    ${this.renderQuestionInput(question, savedResponse)}
                </div>
                
                ${question.hints && question.hints.length > 0 ? this.renderHints(question.hints) : ''}
            </div>
        `;

        return questionHTML;
    }

    renderQuestionInput(question, savedResponse) {
        switch (question.type) {
            case 'multiple-choice':
                return this.renderMultipleChoice(question, savedResponse);
            case 'multiple-select':
                return this.renderMultipleSelect(question, savedResponse);
            case 'true-false':
                return this.renderTrueFalse(question, savedResponse);
            case 'fill-blank':
                return this.renderFillBlank(question, savedResponse);
            case 'short-answer':
                return this.renderShortAnswer(question, savedResponse);
            case 'matching':
                return this.renderMatching(question, savedResponse);
            case 'ordering':
                return this.renderOrdering(question, savedResponse);
            case 'drag-drop':
                return this.renderDragDrop(question, savedResponse);
            default:
                return '<p>Unsupported question type</p>';
        }
    }

    renderMultipleChoice(question, savedResponse) {
        return question.options.map((option, index) => `
            <div class="option-item ${this.options.touchFriendly ? 'touch-friendly' : ''}">
                <input 
                    type="radio" 
                    id="option_${index}" 
                    name="question_${question.id}" 
                    value="${index}"
                    ${savedResponse === index ? 'checked' : ''}
                    class="option-input"
                >
                <label for="option_${index}" class="option-label">
                    <span class="option-marker">${String.fromCharCode(65 + index)}</span>
                    <span class="option-text">${option.text || option}</span>
                </label>
            </div>
        `).join('');
    }

    renderMultipleSelect(question, savedResponse) {
        const responses = savedResponse || [];
        return question.options.map((option, index) => `
            <div class="option-item ${this.options.touchFriendly ? 'touch-friendly' : ''}">
                <input 
                    type="checkbox" 
                    id="option_${index}" 
                    name="question_${question.id}" 
                    value="${index}"
                    ${responses.includes(index) ? 'checked' : ''}
                    class="option-input"
                >
                <label for="option_${index}" class="option-label">
                    <span class="option-marker">☐</span>
                    <span class="option-text">${option.text || option}</span>
                </label>
            </div>
        `).join('');
    }

    renderTrueFalse(question, savedResponse) {
        return `
            <div class="true-false-container">
                <div class="option-item ${this.options.touchFriendly ? 'touch-friendly' : ''}">
                    <input 
                        type="radio" 
                        id="true_option" 
                        name="question_${question.id}" 
                        value="true"
                        ${savedResponse === 'true' ? 'checked' : ''}
                        class="option-input"
                    >
                    <label for="true_option" class="option-label true-option">
                        <span class="option-marker">✓</span>
                        <span class="option-text">True</span>
                    </label>
                </div>
                
                <div class="option-item ${this.options.touchFriendly ? 'touch-friendly' : ''}">
                    <input 
                        type="radio" 
                        id="false_option" 
                        name="question_${question.id}" 
                        value="false"
                        ${savedResponse === 'false' ? 'checked' : ''}
                        class="option-input"
                    >
                    <label for="false_option" class="option-label false-option">
                        <span class="option-marker">✗</span>
                        <span class="option-text">False</span>
                    </label>
                </div>
            </div>
        `;
    }

    renderFillBlank(question, savedResponse) {
        const blanks = question.question.match(/_+/g) || ['_____'];
        const responses = savedResponse || [];
        
        let questionWithBlanks = question.question;
        blanks.forEach((blank, index) => {
            const input = `<input 
                type="text" 
                class="fill-blank-input" 
                data-blank-index="${index}"
                value="${responses[index] || ''}"
                placeholder="Your answer"
            >`;
            questionWithBlanks = questionWithBlanks.replace(blank, input);
        });

        return `<div class="fill-blank-container">${questionWithBlanks}</div>`;
    }

    renderShortAnswer(question, savedResponse) {
        return `
            <div class="short-answer-container">
                <textarea 
                    class="short-answer-input" 
                    placeholder="Type your answer here..."
                    rows="4"
                >${savedResponse || ''}</textarea>
                <div class="character-count">
                    <span id="char-count">${(savedResponse || '').length}</span> characters
                </div>
            </div>
        `;
    }

    renderMatching(question, savedResponse) {
        const responses = savedResponse || {};
        
        return `
            <div class="matching-container">
                <div class="matching-column left-column">
                    <h4>Match these items:</h4>
                    ${question.leftItems.map((item, index) => `
                        <div class="matching-item draggable" data-type="left" data-index="${index}">
                            ${item}
                        </div>
                    `).join('')}
                </div>
                
                <div class="matching-column right-column">
                    <h4>With these options:</h4>
                    ${question.rightItems.map((item, index) => `
                        <div class="matching-item drop-zone" data-type="right" data-index="${index}" data-allow-types="left">
                            <div class="match-target">${item}</div>
                            <div class="match-slot">Drop here</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderDragDrop(question, savedResponse) {
        return `
            <div class="drag-drop-question">
                <div class="drag-items">
                    <h4>Available items:</h4>
                    <div class="drag-source">
                        ${question.dragItems.map((item, index) => `
                            <div class="draggable drag-item" data-type="${item.type || 'item'}" data-index="${index}">
                                ${item.text || item}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="drop-zones">
                    <h4>${question.dropPrompt || 'Drop items in the correct zones:'}</h4>
                    ${question.dropZones.map((zone, index) => `
                        <div class="drop-zone" data-allow-types="${zone.allowedTypes || 'item'}" data-index="${index}">
                            <div class="drop-label">${zone.label}</div>
                            <div class="drop-area">Drop here</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderMultimedia(multimedia) {
        if (!multimedia) return '';

        let mediaHTML = '';
        
        if (multimedia.image) {
            mediaHTML += `
                <div class="question-image">
                    <img src="${multimedia.image.src}" alt="${multimedia.image.alt || 'Question image'}" loading="lazy">
                    ${multimedia.image.caption ? `<p class="image-caption">${multimedia.image.caption}</p>` : ''}
                </div>
            `;
        }

        if (multimedia.audio) {
            mediaHTML += `
                <div class="question-audio">
                    <audio controls>
                        <source src="${multimedia.audio.src}" type="${multimedia.audio.type || 'audio/mpeg'}">
                        Your browser does not support the audio element.
                    </audio>
                    ${multimedia.audio.transcript ? `<p class="audio-transcript">${multimedia.audio.transcript}</p>` : ''}
                </div>
            `;
        }

        if (multimedia.video) {
            mediaHTML += `
                <div class="question-video">
                    <video controls ${multimedia.video.poster ? `poster="${multimedia.video.poster}"` : ''}>
                        <source src="${multimedia.video.src}" type="${multimedia.video.type || 'video/mp4'}">
                        Your browser does not support the video element.
                    </video>
                    ${multimedia.video.caption ? `<p class="video-caption">${multimedia.video.caption}</p>` : ''}
                </div>
            `;
        }

        return mediaHTML;
    }

    renderHints(hints) {
        return `
            <div class="hints-container">
                <button class="hint-button" onclick="this.parentElement.querySelector('.hints-list').style.display = this.parentElement.querySelector('.hints-list').style.display === 'none' ? 'block' : 'none'">
                    💡 Show Hints (${hints.length})
                </button>
                <div class="hints-list" style="display: none;">
                    ${hints.map((hint, index) => `
                        <div class="hint-item">
                            <strong>Hint ${index + 1}:</strong> ${hint}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    setupQuestionEventListeners() {
        // Navigation buttons
        const prevBtn = document.getElementById('prev-question');
        const nextBtn = document.getElementById('next-question');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousQuestion());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentQuestionIndex === this.currentAssessment.questions.length - 1) {
                    this.finishAssessment();
                } else {
                    this.nextQuestion();
                }
            });
        }

        // Auto-save responses
        const questionContainer = document.getElementById('question-container');
        if (questionContainer) {
            questionContainer.addEventListener('change', this.handleResponseChange.bind(this));
            questionContainer.addEventListener('input', this.handleResponseChange.bind(this));
        }

        // Character counter for text inputs
        const textInputs = document.querySelectorAll('.short-answer-input, .fill-blank-input');
        textInputs.forEach(input => {
            input.addEventListener('input', this.updateCharacterCount.bind(this));
        });
    }

    handleResponseChange(event) {
        const question = this.currentAssessment.questions[this.currentQuestionIndex];
        const questionId = question.id;
        
        let response;
        
        switch (question.type) {
            case 'multiple-choice':
            case 'true-false':
                const selectedOption = document.querySelector(`input[name="question_${questionId}"]:checked`);
                response = selectedOption ? selectedOption.value : null;
                break;
                
            case 'multiple-select':
                const selectedOptions = document.querySelectorAll(`input[name="question_${questionId}"]:checked`);
                response = Array.from(selectedOptions).map(option => option.value);
                break;
                
            case 'fill-blank':
                const blanks = document.querySelectorAll('.fill-blank-input');
                response = Array.from(blanks).map(blank => blank.value);
                break;
                
            case 'short-answer':
                const textarea = document.querySelector('.short-answer-input');
                response = textarea ? textarea.value : '';
                break;
                
            default:
                response = event.target.value;
        }

        this.responses[questionId] = response;
        this.fireCallback('responseChanged', { questionId, response, question });

        if (this.options.autoSave) {
            this.autoSave();
        }
    }

    updateCharacterCount(event) {
        const charCountElement = document.getElementById('char-count');
        if (charCountElement) {
            charCountElement.textContent = event.target.value.length;
        }
    }

    // Navigation methods
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentAssessment.questions.length - 1) {
            this.saveQuestionTime();
            this.currentQuestionIndex++;
            this.renderAssessment();
            this.fireCallback('questionChanged', { 
                index: this.currentQuestionIndex, 
                direction: 'next' 
            });
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.saveQuestionTime();
            this.currentQuestionIndex--;
            this.renderAssessment();
            this.fireCallback('questionChanged', { 
                index: this.currentQuestionIndex, 
                direction: 'previous' 
            });
        }
    }

    goToQuestion(index) {
        if (index >= 0 && index < this.currentAssessment.questions.length) {
            this.saveQuestionTime();
            this.currentQuestionIndex = index;
            this.renderAssessment();
            this.fireCallback('questionChanged', { 
                index: this.currentQuestionIndex, 
                direction: 'jump' 
            });
        }
    }

    saveQuestionTime() {
        if (this.questionStartTime) {
            const questionId = this.currentAssessment.questions[this.currentQuestionIndex].id;
            const timeSpent = new Date() - this.questionStartTime;
            this.timeSpent[questionId] = (this.timeSpent[questionId] || 0) + timeSpent;
        }
    }

    // Assessment completion
    finishAssessment() {
        this.saveQuestionTime();
        const results = this.calculateResults();
        this.renderResults(results);
        this.fireCallback('assessmentCompleted', results);
    }

    calculateResults() {
        const results = {
            assessmentId: this.currentAssessment.id,
            totalQuestions: this.currentAssessment.questions.length,
            responses: { ...this.responses },
            score: 0,
            maxScore: 0,
            percentage: 0,
            passed: false,
            timeElapsed: new Date() - this.startTime,
            questionTimes: { ...this.timeSpent },
            detailedResults: []
        };

        this.currentAssessment.questions.forEach(question => {
            const response = this.responses[question.id];
            const questionResult = this.evaluateQuestion(question, response);
            
            results.detailedResults.push(questionResult);
            results.score += questionResult.pointsEarned;
            results.maxScore += question.points;
        });

        results.percentage = Math.round((results.score / results.maxScore) * 100);
        results.passed = results.percentage >= this.currentAssessment.passingScore;

        return results;
    }

    evaluateQuestion(question, response) {
        const result = {
            questionId: question.id,
            question: question.question,
            response: response,
            correct: false,
            pointsEarned: 0,
            maxPoints: question.points,
            explanation: question.explanation,
            timeSpent: this.timeSpent[question.id] || 0
        };

        switch (question.type) {
            case 'multiple-choice':
            case 'true-false':
                result.correct = response == question.correctAnswer;
                break;
                
            case 'multiple-select':
                const correctAnswers = question.correctAnswer || [];
                const userAnswers = response || [];
                result.correct = this.arraysEqual(correctAnswers.sort(), userAnswers.sort());
                break;
                
            case 'fill-blank':
                const correctBlanks = question.correctAnswer || [];
                const userBlanks = response || [];
                result.correct = this.evaluateFillBlanks(correctBlanks, userBlanks);
                break;
                
            case 'short-answer':
                result.correct = this.evaluateShortAnswer(question.correctAnswer, response);
                break;
                
            default:
                result.correct = false;
        }

        if (result.correct) {
            result.pointsEarned = question.points;
        } else if (question.partialCredit) {
            result.pointsEarned = this.calculatePartialCredit(question, response);
        }

        return result;
    }

    evaluateFillBlanks(correct, user) {
        if (!correct || !user || correct.length !== user.length) return false;
        
        return correct.every((answer, index) => {
            const userAnswer = (user[index] || '').toLowerCase().trim();
            const correctAnswer = answer.toLowerCase().trim();
            
            // Allow for multiple correct answers separated by |
            const acceptableAnswers = correctAnswer.split('|').map(a => a.trim());
            return acceptableAnswers.includes(userAnswer);
        });
    }

    evaluateShortAnswer(correct, user) {
        if (!correct || !user) return false;
        
        const userAnswer = user.toLowerCase().trim();
        const correctAnswer = correct.toLowerCase().trim();
        
        // Simple keyword matching for now
        const keywords = correctAnswer.split(' ').filter(word => word.length > 2);
        const userWords = userAnswer.split(' ');
        
        let matchCount = 0;
        keywords.forEach(keyword => {
            if (userWords.some(word => word.includes(keyword))) {
                matchCount++;
            }
        });
        
        return matchCount / keywords.length >= 0.6; // 60% keyword match
    }

    calculatePartialCredit(question, response) {
        // Implement partial credit logic based on question type
        return 0;
    }

    renderResults(results) {
        const passed = results.passed;
        const scoreClass = passed ? 'success' : 'needs-improvement';
        
        this.container.innerHTML = `
            <div class="assessment-results">
                <div class="results-header ${scoreClass}">
                    <div class="results-icon">
                        ${passed ? '🎉' : '📚'}
                    </div>
                    <h2 class="results-title">
                        ${passed ? 'Congratulations!' : 'Keep Learning!'}
                    </h2>
                    <div class="score-display">
                        <div class="score-percentage">${results.percentage}%</div>
                        <div class="score-fraction">${results.score} / ${results.maxScore} points</div>
                    </div>
                    <div class="pass-status">
                        ${passed ? '✅ Passed' : `❌ Needs ${this.currentAssessment.passingScore}% to pass`}
                    </div>
                </div>
                
                <div class="results-summary">
                    <div class="summary-stats">
                        <div class="stat-item">
                            <div class="stat-value">${results.totalQuestions}</div>
                            <div class="stat-label">Total Questions</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${this.formatTime(results.timeElapsed)}</div>
                            <div class="stat-label">Time Spent</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${results.detailedResults.filter(r => r.correct).length}</div>
                            <div class="stat-label">Correct</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${results.detailedResults.filter(r => !r.correct).length}</div>
                            <div class="stat-label">Incorrect</div>
                        </div>
                    </div>
                </div>
                
                ${this.options.allowReview ? this.renderReviewSection(results) : ''}
                
                <div class="results-actions">
                    <button class="btn btn-primary" onclick="location.reload()">Take Again</button>
                    <button class="btn btn-secondary" onclick="window.history.back()">Return to Lessons</button>
                </div>
            </div>
        `;
    }

    renderReviewSection(results) {
        return `
            <div class="review-section">
                <h3>Question Review</h3>
                <div class="question-review-list">
                    ${results.detailedResults.map((result, index) => `
                        <div class="review-item ${result.correct ? 'correct' : 'incorrect'}">
                            <div class="review-header">
                                <span class="question-number">Q${index + 1}</span>
                                <span class="result-icon">${result.correct ? '✅' : '❌'}</span>
                                <span class="points">${result.pointsEarned}/${result.maxPoints} pts</span>
                            </div>
                            <div class="review-content">
                                <p class="review-question">${result.question}</p>
                                <div class="review-response">
                                    <strong>Your answer:</strong> ${this.formatResponse(result.response)}
                                </div>
                                ${!result.correct && result.explanation ? `
                                    <div class="review-explanation">
                                        <strong>Explanation:</strong> ${result.explanation}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Utility methods
    formatResponse(response) {
        if (Array.isArray(response)) {
            return response.join(', ');
        }
        return response || 'No response';
    }

    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    arraysEqual(a, b) {
        return a.length === b.length && a.every((val, i) => val == b[i]);
    }

    // Auto-save functionality
    autoSave() {
        if (!this.currentAssessment) return;
        
        const saveData = {
            assessmentId: this.currentAssessment.id,
            currentQuestionIndex: this.currentQuestionIndex,
            responses: this.responses,
            timeSpent: this.timeSpent,
            startTime: this.startTime,
            lastSaved: new Date()
        };

        localStorage.setItem(`assessment_save_${this.currentAssessment.id}`, JSON.stringify(saveData));
        this.log('Progress auto-saved');
    }

    loadSavedProgress(assessmentId) {
        const saveKey = `assessment_save_${assessmentId}`;
        const savedData = localStorage.getItem(saveKey);
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.currentQuestionIndex = data.currentQuestionIndex || 0;
                this.responses = data.responses || {};
                this.timeSpent = data.timeSpent || {};
                this.startTime = new Date(data.startTime);
                this.log('Saved progress loaded');
                return true;
            } catch (error) {
                this.log('Error loading saved progress:', error);
            }
        }
        return false;
    }

    clearSavedProgress(assessmentId) {
        const saveKey = `assessment_save_${assessmentId}`;
        localStorage.removeItem(saveKey);
    }

    // Timer functionality
    startQuestionTimer() {
        const question = this.currentAssessment.questions[this.currentQuestionIndex];
        if (!question.timeLimit) return;

        const timerElement = document.getElementById('question-timer');
        if (!timerElement) return;

        let timeRemaining = question.timeLimit;
        
        const updateTimer = () => {
            if (timeRemaining <= 0) {
                this.handleTimeUp();
                return;
            }

            timerElement.innerHTML = `
                <div class="timer-display ${timeRemaining <= 30 ? 'warning' : ''}">
                    ⏰ ${this.formatTime(timeRemaining * 1000)} remaining
                </div>
            `;

            timeRemaining--;
            setTimeout(updateTimer, 1000);
        };

        updateTimer();
    }

    handleTimeUp() {
        // Auto-advance to next question when time is up
        if (this.currentQuestionIndex < this.currentAssessment.questions.length - 1) {
            this.nextQuestion();
        } else {
            this.finishAssessment();
        }
    }

    // Keyboard navigation
    handleKeyboardNavigation(event) {
        if (!this.currentAssessment) return;

        const activeElement = document.activeElement;
        
        switch (event.key) {
            case 'ArrowLeft':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.previousQuestion();
                }
                break;
                
            case 'ArrowRight':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.nextQuestion();
                }
                break;
                
            case 'Enter':
                if (activeElement && activeElement.matches('.option-label')) {
                    activeElement.click();
                }
                break;
        }
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
                    console.error(`Error in assessment callback for ${event}:`, error);
                }
            });
        }
    }

    // Utility methods
    log(...args) {
        if (this.options.debugMode) {
            console.log('[Assessment System]', ...args);
        }
    }

    destroy() {
        this.autoSave();
        this.callbacks.clear();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.log('Assessment System destroyed');
    }
}

// CSS for assessment system
const assessmentCSS = `
.assessment-system-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.assessment-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    border-radius: 15px;
    margin-bottom: 30px;
    text-align: center;
}

.assessment-title {
    margin: 0 0 15px 0;
    font-size: 2em;
    font-weight: bold;
}

.assessment-info {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-bottom: 15px;
    flex-wrap: wrap;
}

.subject-badge,
.difficulty-badge,
.time-estimate {
    background: rgba(255, 255, 255, 0.2);
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 0.9em;
    backdrop-filter: blur(10px);
}

.assessment-description {
    margin: 15px 0 0 0;
    opacity: 0.9;
    line-height: 1.6;
}

.progress-container {
    margin-bottom: 30px;
    text-align: center;
}

.progress-bar {
    background: #e9ecef;
    height: 8px;
    border-radius: 4px;
    margin-bottom: 10px;
    overflow: hidden;
}

.progress-fill {
    background: linear-gradient(90deg, #28a745, #20c997);
    height: 100%;
    transition: width 0.3s ease;
}

.progress-text {
    color: #6c757d;
    font-size: 0.9em;
}

.question-container {
    background: white;
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border: 1px solid #e9ecef;
}

.question-header {
    margin-bottom: 20px;
}

.question-meta {
    display: flex;
    gap: 15px;
    align-items: center;
    margin-bottom: 10px;
}

.question-number {
    background: #007bff;
    color: white;
    padding: 5px 12px;
    border-radius: 15px;
    font-weight: bold;
    font-size: 0.9em;
}

.points {
    color: #6c757d;
    font-size: 0.9em;
}

.topic-tag {
    background: #e9ecef;
    color: #495057;
    padding: 4px 8px;
    border-radius: 10px;
    font-size: 0.8em;
}

.question-text {
    font-size: 1.2em;
    line-height: 1.6;
    margin: 20px 0;
    color: #333;
}

.option-item {
    margin-bottom: 15px;
    transition: all 0.3s ease;
}

.option-item.touch-friendly {
    min-height: 50px;
}

.option-input {
    display: none;
}

.option-label {
    display: flex;
    align-items: center;
    padding: 15px 20px;
    border: 2px solid #e9ecef;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #fff;
}

.option-label:hover {
    border-color: #007bff;
    background: #f8f9ff;
}

.option-input:checked + .option-label {
    border-color: #007bff;
    background: linear-gradient(135deg, #e3f2fd, #f8f9ff);
}

.option-marker {
    background: #6c757d;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    font-weight: bold;
    font-size: 0.9em;
    flex-shrink: 0;
}

.option-input:checked + .option-label .option-marker {
    background: #007bff;
}

.option-text {
    flex: 1;
    line-height: 1.5;
}

.true-false-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    max-width: 400px;
    margin: 20px auto;
}

.true-option .option-marker {
    background: #28a745;
}

.false-option .option-marker {
    background: #dc3545;
}

.fill-blank-input,
.short-answer-input {
    border: 2px solid #e9ecef;
    border-radius: 5px;
    padding: 10px 15px;
    font-size: 1em;
    transition: border-color 0.3s ease;
}

.fill-blank-input:focus,
.short-answer-input:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.short-answer-input {
    width: 100%;
    resize: vertical;
    font-family: inherit;
}

.character-count {
    text-align: right;
    margin-top: 10px;
    color: #6c757d;
    font-size: 0.9em;
}

.matching-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin: 20px 0;
}

.matching-column h4 {
    margin-bottom: 15px;
    color: #495057;
}

.matching-item {
    padding: 15px;
    margin-bottom: 10px;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.matching-item.draggable {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    cursor: grab;
}

.matching-item.drop-zone {
    border: 2px dashed #dee2e6;
    min-height: 60px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.hints-container {
    margin-top: 20px;
    border-top: 1px solid #e9ecef;
    padding-top: 20px;
}

.hint-button {
    background: #ffc107;
    color: #212529;
    border: none;
    padding: 10px 20px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.9em;
    font-weight: bold;
}

.hints-list {
    margin-top: 15px;
    padding: 15px;
    background: #fff3cd;
    border-radius: 8px;
    border: 1px solid #ffeaa7;
}

.hint-item {
    margin-bottom: 10px;
    line-height: 1.5;
}

.assessment-controls {
    display: flex;
    justify-content: space-between;
    gap: 15px;
}

.btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-block;
    text-align: center;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-primary {
    background: #007bff;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: #0056b3;
    transform: translateY(-2px);
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn-secondary:hover:not(:disabled) {
    background: #545b62;
    transform: translateY(-2px);
}

.question-timer {
    text-align: center;
    margin-top: 20px;
}

.timer-display {
    background: #fff3cd;
    color: #856404;
    padding: 10px 20px;
    border-radius: 20px;
    font-weight: bold;
    display: inline-block;
}

.timer-display.warning {
    background: #f8d7da;
    color: #721c24;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.assessment-results {
    text-align: center;
}

.results-header {
    padding: 40px;
    border-radius: 15px;
    margin-bottom: 30px;
}

.results-header.success {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
}

.results-header.needs-improvement {
    background: linear-gradient(135deg, #ffc107, #fd7e14);
    color: #212529;
}

.results-icon {
    font-size: 4em;
    margin-bottom: 20px;
}

.results-title {
    font-size: 2.5em;
    margin-bottom: 20px;
    font-weight: bold;
}

.score-display {
    margin-bottom: 20px;
}

.score-percentage {
    font-size: 3em;
    font-weight: bold;
    margin-bottom: 10px;
}

.score-fraction {
    font-size: 1.2em;
    opacity: 0.9;
}

.pass-status {
    font-size: 1.3em;
    font-weight: bold;
    margin-bottom: 20px;
}

.results-summary {
    background: white;
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
}

.stat-item {
    text-align: center;
    padding: 20px;
    border-radius: 10px;
    background: #f8f9fa;
}

.stat-value {
    font-size: 2em;
    font-weight: bold;
    color: #007bff;
    margin-bottom: 5px;
}

.stat-label {
    color: #6c757d;
    font-size: 0.9em;
}

.review-section {
    background: white;
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    text-align: left;
}

.review-section h3 {
    margin-bottom: 20px;
    color: #333;
}

.review-item {
    border: 1px solid #e9ecef;
    border-radius: 8px;
    margin-bottom: 15px;
    overflow: hidden;
}

.review-item.correct {
    border-left: 4px solid #28a745;
}

.review-item.incorrect {
    border-left: 4px solid #dc3545;
}

.review-header {
    background: #f8f9fa;
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
}

.review-content {
    padding: 20px;
}

.review-question {
    margin-bottom: 15px;
    font-weight: 500;
}

.review-response,
.review-explanation {
    margin-bottom: 10px;
    line-height: 1.5;
}

.review-explanation {
    background: #e3f2fd;
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid #2196f3;
}

.results-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
}

@media (max-width: 768px) {
    .assessment-system-container {
        padding: 15px;
    }
    
    .question-container {
        padding: 20px;
    }
    
    .true-false-container {
        grid-template-columns: 1fr;
        max-width: none;
    }
    
    .matching-container {
        grid-template-columns: 1fr;
    }
    
    .assessment-info {
        flex-direction: column;
        align-items: center;
    }
    
    .summary-stats {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .results-actions {
        flex-direction: column;
    }
}
`;

// Inject CSS
if (!document.getElementById('assessment-system-styles')) {
    const style = document.createElement('style');
    style.id = 'assessment-system-styles';
    style.textContent = assessmentCSS;
    document.head.appendChild(style);
}

// Export for use
window.AssessmentSystem = AssessmentSystem;

console.log('🎯 Universal Assessment System loaded successfully');