/**
 * Universal Drag & Drop Utility System for Vihaan's Learning Platform
 * Provides touch-friendly, accessible drag-and-drop functionality
 * Compatible with all subjects and interactive activities
 */

class UniversalDragDrop {
    constructor(options = {}) {
        this.options = {
            dragSelector: '.draggable',
            dropSelector: '.drop-zone',
            draggingClass: 'is-dragging',
            dragOverClass: 'drag-over',
            validDropClass: 'valid-drop',
            invalidDropClass: 'invalid-drop',
            touchSupport: true,
            visualFeedback: true,
            snapBack: true,
            hapticFeedback: true,
            audioFeedback: false,
            accessibility: true,
            debugMode: false,
            ...options
        };

        this.activeElement = null;
        this.dragStartPosition = { x: 0, y: 0 };
        this.touchOffset = { x: 0, y: 0 };
        this.validationRules = new Map();
        this.callbacks = new Map();
        this.dragCounter = 0;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAccessibility();
        this.log('Universal Drag & Drop initialized');
    }

    setupEventListeners() {
        // Mouse events
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Touch events for mobile support
        if (this.options.touchSupport) {
            document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        }

        // Drag events (HTML5 fallback)
        document.addEventListener('dragstart', this.handleDragStart.bind(this));
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));
        document.addEventListener('dragend', this.handleDragEnd.bind(this));

        // Keyboard events for accessibility
        if (this.options.accessibility) {
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
        }
    }

    setupAccessibility() {
        if (!this.options.accessibility) return;

        // Add ARIA labels and keyboard support to draggable elements
        document.querySelectorAll(this.options.dragSelector).forEach(element => {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
            if (!element.hasAttribute('aria-label')) {
                element.setAttribute('aria-label', 'Draggable item. Press space to pick up.');
            }
            element.setAttribute('role', 'button');
        });

        // Add ARIA labels to drop zones
        document.querySelectorAll(this.options.dropSelector).forEach(element => {
            if (!element.hasAttribute('aria-label')) {
                element.setAttribute('aria-label', 'Drop zone');
            }
            element.setAttribute('role', 'region');
            element.setAttribute('aria-dropeffect', 'move');
        });
    }

    // Mouse event handlers
    handleMouseDown(e) {
        const draggable = e.target.closest(this.options.dragSelector);
        if (!draggable) return;

        this.startDrag(draggable, e.clientX, e.clientY);
        e.preventDefault();
    }

    handleMouseMove(e) {
        if (!this.activeElement) return;
        this.updateDragPosition(e.clientX, e.clientY);
        this.updateDropZoneStates(e.clientX, e.clientY);
    }

    handleMouseUp(e) {
        if (!this.activeElement) return;
        this.completeDrag(e.clientX, e.clientY);
    }

    // Touch event handlers
    handleTouchStart(e) {
        const draggable = e.target.closest(this.options.dragSelector);
        if (!draggable) return;

        const touch = e.touches[0];
        this.startDrag(draggable, touch.clientX, touch.clientY);
        e.preventDefault();
    }

    handleTouchMove(e) {
        if (!this.activeElement) return;
        const touch = e.touches[0];
        this.updateDragPosition(touch.clientX, touch.clientY);
        this.updateDropZoneStates(touch.clientX, touch.clientY);
        e.preventDefault();
    }

    handleTouchEnd(e) {
        if (!this.activeElement) return;
        const touch = e.changedTouches[0];
        this.completeDrag(touch.clientX, touch.clientY);
    }

    // HTML5 Drag API handlers (fallback)
    handleDragStart(e) {
        const draggable = e.target.closest(this.options.dragSelector);
        if (!draggable) return;
        
        this.activeElement = draggable;
        draggable.classList.add(this.options.draggingClass);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', draggable.outerHTML);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDrop(e) {
        e.preventDefault();
        const dropzone = e.target.closest(this.options.dropSelector);
        if (dropzone && this.activeElement) {
            this.handleSuccessfulDrop(dropzone);
        }
    }

    handleDragEnd(e) {
        if (this.activeElement) {
            this.cleanupDrag();
        }
    }

    // Keyboard event handlers for accessibility
    handleKeyDown(e) {
        const element = e.target.closest(this.options.dragSelector);
        if (!element) return;

        switch (e.key) {
            case ' ':
            case 'Enter':
                e.preventDefault();
                if (this.activeElement === element) {
                    this.dropWithKeyboard();
                } else {
                    this.pickupWithKeyboard(element);
                }
                break;
            case 'Escape':
                if (this.activeElement) {
                    this.cancelDrag();
                }
                break;
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                if (this.activeElement) {
                    e.preventDefault();
                    this.navigateWithKeyboard(e.key);
                }
                break;
        }
    }

    // Core drag functionality
    startDrag(element, x, y) {
        this.activeElement = element;
        this.dragStartPosition = { x, y };
        
        // Store original position for snap-back
        const rect = element.getBoundingClientRect();
        this.originalPosition = {
            x: rect.left,
            y: rect.top,
            parent: element.parentNode
        };

        // Add visual feedback
        element.classList.add(this.options.draggingClass);
        
        // Create visual feedback clone
        if (this.options.visualFeedback) {
            this.createDragClone(element, x, y);
        }

        // Haptic feedback (mobile)
        if (this.options.hapticFeedback && navigator.vibrate) {
            navigator.vibrate(50);
        }

        // Audio feedback
        if (this.options.audioFeedback) {
            this.playSound('pickup');
        }

        // Fire callback
        this.fireCallback('dragStart', { element, x, y });

        this.log('Drag started', element);
    }

    updateDragPosition(x, y) {
        if (!this.dragClone) return;

        const deltaX = x - this.dragStartPosition.x;
        const deltaY = y - this.dragStartPosition.y;

        this.dragClone.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }

    updateDropZoneStates(x, y) {
        const elementBelow = document.elementFromPoint(x, y);
        const dropzone = elementBelow ? elementBelow.closest(this.options.dropSelector) : null;

        // Reset all drop zones
        document.querySelectorAll(this.options.dropSelector).forEach(zone => {
            zone.classList.remove(this.options.dragOverClass, this.options.validDropClass, this.options.invalidDropClass);
        });

        if (dropzone) {
            dropzone.classList.add(this.options.dragOverClass);
            
            // Check if drop is valid
            if (this.isValidDrop(this.activeElement, dropzone)) {
                dropzone.classList.add(this.options.validDropClass);
            } else {
                dropzone.classList.add(this.options.invalidDropClass);
            }
        }
    }

    completeDrag(x, y) {
        const elementBelow = document.elementFromPoint(x, y);
        const dropzone = elementBelow ? elementBelow.closest(this.options.dropSelector) : null;

        if (dropzone && this.isValidDrop(this.activeElement, dropzone)) {
            this.handleSuccessfulDrop(dropzone);
        } else {
            this.handleFailedDrop();
        }

        this.cleanupDrag();
    }

    handleSuccessfulDrop(dropzone) {
        // Haptic feedback
        if (this.options.hapticFeedback && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }

        // Audio feedback
        if (this.options.audioFeedback) {
            this.playSound('drop');
        }

        // Move element to drop zone
        dropzone.appendChild(this.activeElement);

        // Fire callback
        this.fireCallback('dropSuccess', {
            element: this.activeElement,
            dropzone: dropzone,
            originalParent: this.originalPosition.parent
        });

        this.log('Successful drop', this.activeElement, dropzone);

        // Update accessibility
        this.announceToScreenReader(`Item dropped successfully in ${dropzone.getAttribute('aria-label') || 'drop zone'}`);
    }

    handleFailedDrop() {
        if (this.options.snapBack) {
            this.snapBack();
        }

        // Audio feedback
        if (this.options.audioFeedback) {
            this.playSound('error');
        }

        // Fire callback
        this.fireCallback('dropFail', {
            element: this.activeElement,
            originalParent: this.originalPosition.parent
        });

        this.announceToScreenReader('Drop failed. Item returned to original position.');
    }

    snapBack() {
        if (!this.activeElement || !this.originalPosition) return;

        // Animate snap back
        this.activeElement.style.transition = 'transform 0.3s ease-out';
        this.activeElement.style.transform = 'translate(0, 0)';

        setTimeout(() => {
            if (this.activeElement) {
                this.activeElement.style.transition = '';
                this.activeElement.style.transform = '';
            }
        }, 300);
    }

    cleanupDrag() {
        if (this.activeElement) {
            this.activeElement.classList.remove(this.options.draggingClass);
            this.activeElement.style.transform = '';
            this.activeElement.style.transition = '';
        }

        // Remove drag clone
        if (this.dragClone) {
            this.dragClone.remove();
            this.dragClone = null;
        }

        // Reset drop zones
        document.querySelectorAll(this.options.dropSelector).forEach(zone => {
            zone.classList.remove(
                this.options.dragOverClass,
                this.options.validDropClass,
                this.options.invalidDropClass
            );
        });

        this.activeElement = null;
        this.originalPosition = null;
        this.dragStartPosition = { x: 0, y: 0 };
    }

    // Keyboard accessibility methods
    pickupWithKeyboard(element) {
        this.activeElement = element;
        element.classList.add(this.options.draggingClass);
        element.setAttribute('aria-label', 'Item picked up. Use arrow keys to navigate, space to drop, escape to cancel.');
        
        this.announceToScreenReader('Item picked up. Use arrow keys to navigate to drop zone, then press space to drop.');
        
        // Fire callback
        this.fireCallback('keyboardPickup', { element });
    }

    dropWithKeyboard() {
        const focusedDropzone = document.activeElement.closest(this.options.dropSelector);
        if (focusedDropzone && this.isValidDrop(this.activeElement, focusedDropzone)) {
            this.handleSuccessfulDrop(focusedDropzone);
        } else {
            this.handleFailedDrop();
        }
        this.cleanupKeyboardDrag();
    }

    navigateWithKeyboard(direction) {
        const dropzones = Array.from(document.querySelectorAll(this.options.dropSelector));
        const currentIndex = dropzones.findIndex(zone => zone === document.activeElement);
        let nextIndex;

        switch (direction) {
            case 'ArrowUp':
            case 'ArrowLeft':
                nextIndex = currentIndex > 0 ? currentIndex - 1 : dropzones.length - 1;
                break;
            case 'ArrowDown':
            case 'ArrowRight':
                nextIndex = currentIndex < dropzones.length - 1 ? currentIndex + 1 : 0;
                break;
        }

        if (nextIndex !== undefined && dropzones[nextIndex]) {
            dropzones[nextIndex].focus();
            this.announceToScreenReader(`Navigated to ${dropzones[nextIndex].getAttribute('aria-label')}`);
        }
    }

    cancelDrag() {
        if (this.activeElement) {
            this.handleFailedDrop();
            this.cleanupKeyboardDrag();
            this.announceToScreenReader('Drag cancelled. Item returned to original position.');
        }
    }

    cleanupKeyboardDrag() {
        if (this.activeElement) {
            this.activeElement.classList.remove(this.options.draggingClass);
            this.activeElement.setAttribute('aria-label', 'Draggable item. Press space to pick up.');
        }
        this.activeElement = null;
    }

    // Visual feedback methods
    createDragClone(element, x, y) {
        this.dragClone = element.cloneNode(true);
        this.dragClone.classList.add('drag-clone');
        
        // Style the clone
        Object.assign(this.dragClone.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            transform: `translate(${x - element.offsetWidth/2}px, ${y - element.offsetHeight/2}px)`,
            pointerEvents: 'none',
            zIndex: '1000',
            opacity: '0.8',
            transition: 'none'
        });

        document.body.appendChild(this.dragClone);
    }

    // Validation system
    setValidationRule(dragSelector, dropSelector, validatorFn) {
        const key = `${dragSelector}:${dropSelector}`;
        this.validationRules.set(key, validatorFn);
        this.log('Validation rule set', key);
    }

    isValidDrop(dragElement, dropElement) {
        // Check for data attribute rules first
        const allowedTypes = dropElement.dataset.allowTypes;
        const dragType = dragElement.dataset.type;

        if (allowedTypes && dragType) {
            const allowed = allowedTypes.split(',').map(type => type.trim());
            if (!allowed.includes(dragType)) {
                return false;
            }
        }

        // Check custom validation rules
        for (const [key, validator] of this.validationRules) {
            const [dragSel, dropSel] = key.split(':');
            if (dragElement.matches(dragSel) && dropElement.matches(dropSel)) {
                return validator(dragElement, dropElement);
            }
        }

        return true;
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
                    console.error(`Error in drag-drop callback for ${event}:`, error);
                }
            });
        }
    }

    // Audio feedback
    playSound(type) {
        if (!this.options.audioFeedback) return;

        const frequencies = {
            pickup: 800,
            drop: 1000,
            error: 400
        };

        if (window.AudioContext || window.webkitAudioContext) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(frequencies[type] || 600, audioContext.currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        }
    }

    // Screen reader announcements
    announceToScreenReader(message) {
        if (!this.options.accessibility) return;

        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'screen-reader-only';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Utility methods
    log(...args) {
        if (this.options.debugMode) {
            console.log('[Universal DragDrop]', ...args);
        }
    }

    destroy() {
        // Remove all event listeners and cleanup
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        
        if (this.options.touchSupport) {
            document.removeEventListener('touchstart', this.handleTouchStart);
            document.removeEventListener('touchmove', this.handleTouchMove);
            document.removeEventListener('touchend', this.handleTouchEnd);
        }

        this.cleanupDrag();
        this.validationRules.clear();
        this.callbacks.clear();

        this.log('Universal Drag & Drop destroyed');
    }
}

// CSS for drag and drop visual feedback
const dragDropCSS = `
.is-dragging {
    opacity: 0.5;
    transform: scale(0.95);
    transition: all 0.2s ease;
}

.drag-clone {
    box-shadow: 0 8px 16px rgba(0,0,0,0.3);
    transform: scale(1.05);
    border-radius: 8px;
}

.drop-zone {
    transition: all 0.3s ease;
    position: relative;
}

.drop-zone.drag-over {
    transform: scale(1.02);
}

.drop-zone.valid-drop {
    background-color: rgba(40, 167, 69, 0.1);
    border: 2px dashed #28a745;
}

.drop-zone.invalid-drop {
    background-color: rgba(220, 53, 69, 0.1);
    border: 2px dashed #dc3545;
}

.screen-reader-only {
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
}

/* Touch-friendly drag handles */
.draggable {
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.draggable:active {
    cursor: grabbing;
}

.draggable:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
}

/* Mobile touch improvements */
@media (hover: none) {
    .draggable {
        cursor: default;
    }
    
    .drop-zone {
        min-height: 60px; /* Larger touch targets */
    }
}
`;

// Inject CSS
if (!document.getElementById('drag-drop-styles')) {
    const style = document.createElement('style');
    style.id = 'drag-drop-styles';
    style.textContent = dragDropCSS;
    document.head.appendChild(style);
}

// Export for use in modules or global access
window.UniversalDragDrop = UniversalDragDrop;

// Auto-initialize if elements exist
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.draggable') && document.querySelector('.drop-zone')) {
        window.dragDropSystem = new UniversalDragDrop({
            debugMode: false,
            visualFeedback: true,
            hapticFeedback: true,
            accessibility: true
        });

        console.log('🎯 Universal Drag & Drop System initialized automatically');
    }
});