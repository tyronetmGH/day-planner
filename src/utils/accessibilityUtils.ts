/**
 * Accessibility utilities for the Day Planner application
 * Ensures WCAG AA compliance and enhanced keyboard navigation
 */

/**
 * Announces a message to screen readers
 * @param message - The message to announce
 * @param priority - The priority level (polite or assertive)
 */
export const announceToScreenReader = (
  message: string, 
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove the announcement after a short delay
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Manages focus for modal dialogs and forms
 */
export class FocusManager {
  private focusableElements: HTMLElement[] = [];
  private previousFocus: HTMLElement | null = null;
  
  /**
   * Traps focus within a container element
   * @param container - The container element to trap focus within
   */
  trapFocus(container: HTMLElement): void {
    this.previousFocus = document.activeElement as HTMLElement;
    this.focusableElements = this.getFocusableElements(container);
    
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
    
    container.addEventListener('keydown', this.handleKeyDown);
  }
  
  /**
   * Releases focus trap and returns focus to previous element
   */
  releaseFocus(): void {
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
    
    document.removeEventListener('keydown', this.handleKeyDown);
    this.focusableElements = [];
    this.previousFocus = null;
  }
  
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(focusableSelectors));
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;
    
    const currentIndex = this.focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (event.shiftKey) {
      // Shift + Tab (backward)
      const previousIndex = currentIndex <= 0 ? this.focusableElements.length - 1 : currentIndex - 1;
      this.focusableElements[previousIndex].focus();
    } else {
      // Tab (forward)
      const nextIndex = currentIndex >= this.focusableElements.length - 1 ? 0 : currentIndex + 1;
      this.focusableElements[nextIndex].focus();
    }
    
    event.preventDefault();
  };
}

/**
 * Checks if the user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Checks if the user prefers high contrast
 */
export const prefersHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Generates a unique ID for accessibility attributes
 * @param prefix - Optional prefix for the ID
 */
export const generateAccessibilityId = (prefix: string = 'a11y'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validates color contrast ratio for WCAG AA compliance
 * @param foreground - Foreground color in hex format
 * @param background - Background color in hex format
 * @returns Whether the contrast ratio meets WCAG AA standards (4.5:1)
 */
export const validateColorContrast = (foreground: string, background: string): boolean => {
  const getLuminance = (color: string): number => {
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return ratio >= 4.5; // WCAG AA standard
};

/**
 * Keyboard navigation helper
 */
export const KeyboardNavigation = {
  /**
   * Handles arrow key navigation in lists
   * @param event - The keyboard event
   * @param items - Array of focusable items
   * @param currentIndex - Current focused item index
   * @param onNavigate - Callback when navigation occurs
   */
  handleArrowNavigation: (
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onNavigate: (newIndex: number) => void
  ): void => {
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = items.length - 1;
        break;
      default:
        return;
    }
    
    event.preventDefault();
    onNavigate(newIndex);
    items[newIndex].focus();
  },
  
  /**
   * Handles Enter and Space key activation
   * @param event - The keyboard event
   * @param callback - Function to call on activation
   */
  handleActivation: (event: KeyboardEvent, callback: () => void): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  }
};

/**
 * Screen reader utilities
 */
export const ScreenReader = {
  /**
   * Creates a live region for dynamic content updates
   * @param id - Unique ID for the live region
   * @param priority - Live region priority
   */
  createLiveRegion: (id: string, priority: 'polite' | 'assertive' = 'polite'): HTMLElement => {
    let liveRegion = document.getElementById(id);
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = id;
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
    
    return liveRegion;
  },
  
  /**
   * Updates a live region with new content
   * @param id - Live region ID
   * @param message - Message to announce
   */
  updateLiveRegion: (id: string, message: string): void => {
    const liveRegion = document.getElementById(id);
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  },
  
  /**
   * Removes a live region
   * @param id - Live region ID to remove
   */
  removeLiveRegion: (id: string): void => {
    const liveRegion = document.getElementById(id);
    if (liveRegion) {
      document.body.removeChild(liveRegion);
    }
  }
};

/**
 * Touch accessibility helpers
 */
export const TouchAccessibility = {
  /**
   * Checks if the device supports touch
   */
  isTouchDevice: (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  /**
   * Ensures minimum touch target size (44px x 44px)
   * @param element - Element to check
   */
  ensureMinimumTouchTarget: (element: HTMLElement): void => {
    const rect = element.getBoundingClientRect();
    const minSize = 44;
    
    if (rect.width < minSize || rect.height < minSize) {
      element.style.minWidth = `${minSize}px`;
      element.style.minHeight = `${minSize}px`;
      element.style.display = 'inline-flex';
      element.style.alignItems = 'center';
      element.style.justifyContent = 'center';
    }
  }
};

/**
 * Form accessibility helpers
 */
export const FormAccessibility = {
  /**
   * Associates form controls with their labels and error messages
   * @param input - The input element
   * @param label - The label element
   * @param errorElement - Optional error message element
   */
  associateFormControl: (
    input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    label: HTMLLabelElement,
    errorElement?: HTMLElement
  ): void => {
    const inputId = input.id || generateAccessibilityId('input');
    const labelId = generateAccessibilityId('label');
    
    input.id = inputId;
    label.id = labelId;
    label.setAttribute('for', inputId);
    
    if (errorElement) {
      const errorId = generateAccessibilityId('error');
      errorElement.id = errorId;
      input.setAttribute('aria-describedby', errorId);
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.setAttribute('aria-invalid', 'false');
    }
  },
  
  /**
   * Validates form accessibility
   * @param form - The form element to validate
   * @returns Array of accessibility issues found
   */
  validateFormAccessibility: (form: HTMLFormElement): string[] => {
    const issues: string[] = [];
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach((input) => {
      const inputElement = input as HTMLInputElement;
      const label = form.querySelector(`label[for="${inputElement.id}"]`);
      
      if (!label && !inputElement.getAttribute('aria-label')) {
        issues.push(`Input ${inputElement.id || inputElement.name} is missing a label`);
      }
      
      if (inputElement.required && !inputElement.getAttribute('aria-required')) {
        issues.push(`Required input ${inputElement.id || inputElement.name} is missing aria-required`);
      }
    });
    
    return issues;
  }
};