/**
 * Accessibility testing utilities for automated a11y validation
 * Helps ensure WCAG compliance during development and testing
 */

export interface AccessibilityIssue {
  element: HTMLElement;
  type: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
}

export interface AccessibilityTestResult {
  passed: boolean;
  issues: AccessibilityIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

/**
 * Comprehensive accessibility testing suite
 */
export class AccessibilityTester {
  private issues: AccessibilityIssue[] = [];

  /**
   * Run all accessibility tests on a container element
   */
  test(container: HTMLElement = document.body): AccessibilityTestResult {
    this.issues = [];

    // Run all test categories
    this.testColorContrast(container);
    this.testKeyboardNavigation(container);
    this.testAriaLabels(container);
    this.testFormAccessibility(container);
    this.testHeadingStructure(container);
    this.testImageAccessibility(container);
    this.testFocusManagement(container);
    this.testLiveRegions(container);

    const summary = this.issues.reduce(
      (acc, issue) => {
        acc[issue.type === 'error' ? 'errors' : issue.type === 'warning' ? 'warnings' : 'info']++;
        return acc;
      },
      { errors: 0, warnings: 0, info: 0 }
    );

    return {
      passed: summary.errors === 0,
      issues: this.issues,
      summary
    };
  }

  private addIssue(
    element: HTMLElement,
    type: AccessibilityIssue['type'],
    rule: string,
    message: string,
    wcagLevel: AccessibilityIssue['wcagLevel'] = 'AA'
  ) {
    this.issues.push({ element, type, rule, message, wcagLevel });
  }

  /**
   * Test color contrast ratios
   */
  private testColorContrast(container: HTMLElement) {
    const textElements = container.querySelectorAll('*');
    
    textElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      const styles = window.getComputedStyle(htmlElement);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Skip elements without text content
      if (!htmlElement.textContent?.trim()) return;
      
      // Skip transparent backgrounds
      if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') return;
      
      try {
        const contrast = this.calculateContrastRatio(color, backgroundColor);
        const fontSize = parseFloat(styles.fontSize);
        const fontWeight = styles.fontWeight;
        
        // WCAG AA requirements
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
        const requiredRatio = isLargeText ? 3 : 4.5;
        
        if (contrast < requiredRatio) {
          this.addIssue(
            htmlElement,
            'error',
            'color-contrast',
            `Insufficient color contrast ratio: ${contrast.toFixed(2)}:1 (required: ${requiredRatio}:1)`,
            'AA'
          );
        }
      } catch (error) {
        // Skip elements where contrast cannot be calculated
      }
    });
  }

  /**
   * Test keyboard navigation
   */
  private testKeyboardNavigation(container: HTMLElement) {
    const interactiveElements = container.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );

    interactiveElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      
      // Check if element is focusable
      if (htmlElement.tabIndex < 0 && !htmlElement.hasAttribute('tabindex')) {
        this.addIssue(
          htmlElement,
          'warning',
          'keyboard-navigation',
          'Interactive element may not be keyboard accessible',
          'A'
        );
      }

      // Check for focus indicators
      const styles = window.getComputedStyle(htmlElement, ':focus');
      if (styles.outline === 'none' && !styles.boxShadow && !styles.border) {
        this.addIssue(
          htmlElement,
          'error',
          'focus-indicator',
          'Interactive element lacks visible focus indicator',
          'AA'
        );
      }
    });
  }

  /**
   * Test ARIA labels and attributes
   */
  private testAriaLabels(container: HTMLElement) {
    // Test buttons without accessible names
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      const accessibleName = this.getAccessibleName(button);
      if (!accessibleName) {
        this.addIssue(
          button,
          'error',
          'button-name',
          'Button lacks accessible name (aria-label, aria-labelledby, or text content)',
          'A'
        );
      }
    });

    // Test images without alt text
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      if (!img.hasAttribute('alt')) {
        this.addIssue(
          img,
          'error',
          'image-alt',
          'Image lacks alt attribute',
          'A'
        );
      }
    });

    // Test form controls without labels
    const formControls = container.querySelectorAll('input, select, textarea');
    formControls.forEach(control => {
      const htmlControl = control as HTMLInputElement;
      if (htmlControl.type === 'hidden') return;
      
      const hasLabel = this.hasAssociatedLabel(htmlControl);
      const hasAriaLabel = htmlControl.hasAttribute('aria-label') || htmlControl.hasAttribute('aria-labelledby');
      
      if (!hasLabel && !hasAriaLabel) {
        this.addIssue(
          htmlControl,
          'error',
          'form-label',
          'Form control lacks associated label',
          'A'
        );
      }
    });
  }

  /**
   * Test form accessibility
   */
  private testFormAccessibility(container: HTMLElement) {
    const forms = container.querySelectorAll('form');
    
    forms.forEach(form => {
      // Check for form validation
      const requiredFields = form.querySelectorAll('[required]');
      requiredFields.forEach(field => {
        const htmlField = field as HTMLInputElement;
        if (!htmlField.hasAttribute('aria-required')) {
          this.addIssue(
            htmlField,
            'warning',
            'required-field',
            'Required field should have aria-required="true"',
            'AA'
          );
        }
      });

      // Check for error message associations
      const errorMessages = form.querySelectorAll('[role="alert"], .error, .field-error');
      errorMessages.forEach(error => {
        const htmlError = error as HTMLElement;
        const associatedField = this.findAssociatedField(form, htmlError);
        if (associatedField && !associatedField.hasAttribute('aria-describedby')) {
          this.addIssue(
            associatedField,
            'warning',
            'error-association',
            'Error message not properly associated with form field',
            'AA'
          );
        }
      });
    });
  }

  /**
   * Test heading structure
   */
  private testHeadingStructure(container: HTMLElement) {
    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    
    if (headings.length === 0) return;

    let previousLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (previousLevel > 0 && level > previousLevel + 1) {
        this.addIssue(
          heading,
          'warning',
          'heading-structure',
          `Heading level skipped (h${previousLevel} to h${level})`,
          'AA'
        );
      }
      
      previousLevel = level;
    });

    // Check for multiple h1 elements
    const h1Elements = container.querySelectorAll('h1');
    if (h1Elements.length > 1) {
      h1Elements.forEach((h1, index) => {
        if (index > 0) {
          this.addIssue(
            h1,
            'warning',
            'multiple-h1',
            'Multiple h1 elements found - consider using h2-h6 for subsections',
            'AA'
          );
        }
      });
    }
  }

  /**
   * Test image accessibility
   */
  private testImageAccessibility(container: HTMLElement) {
    const images = container.querySelectorAll('img');
    
    images.forEach(img => {
      const alt = img.getAttribute('alt');
      
      if (alt === null) {
        this.addIssue(
          img,
          'error',
          'image-alt-missing',
          'Image missing alt attribute',
          'A'
        );
      } else if (alt === img.src || alt.includes('image') || alt.includes('picture')) {
        this.addIssue(
          img,
          'warning',
          'image-alt-quality',
          'Alt text appears to be non-descriptive',
          'A'
        );
      }
    });
  }

  /**
   * Test focus management
   */
  private testFocusManagement(container: HTMLElement) {
    const modals = container.querySelectorAll('[role="dialog"], [role="alertdialog"]');
    
    modals.forEach(modal => {
      const htmlModal = modal as HTMLElement;
      
      // Check for aria-modal
      if (!htmlModal.hasAttribute('aria-modal')) {
        this.addIssue(
          htmlModal,
          'warning',
          'modal-aria',
          'Modal dialog should have aria-modal="true"',
          'AA'
        );
      }

      // Check for aria-labelledby or aria-label
      if (!htmlModal.hasAttribute('aria-labelledby') && !htmlModal.hasAttribute('aria-label')) {
        this.addIssue(
          htmlModal,
          'error',
          'modal-label',
          'Modal dialog lacks accessible name',
          'A'
        );
      }
    });
  }

  /**
   * Test live regions
   */
  private testLiveRegions(container: HTMLElement) {
    const liveRegions = container.querySelectorAll('[aria-live]');
    
    liveRegions.forEach(region => {
      const htmlRegion = region as HTMLElement;
      const liveValue = htmlRegion.getAttribute('aria-live');
      
      if (liveValue && !['polite', 'assertive', 'off'].includes(liveValue)) {
        this.addIssue(
          htmlRegion,
          'error',
          'live-region-value',
          'Invalid aria-live value. Must be "polite", "assertive", or "off"',
          'A'
        );
      }
    });
  }

  /**
   * Helper methods
   */
  private calculateContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);
    
    const l1 = this.getLuminance(rgb1);
    const l2 = this.getLuminance(rgb2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  private parseColor(color: string): [number, number, number] {
    // Simple RGB parsing - in a real implementation, you'd want more robust color parsing
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    throw new Error('Unable to parse color');
  }

  private getLuminance([r, g, b]: [number, number, number]): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  private getAccessibleName(element: HTMLElement): string {
    // Check aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel.trim();

    // Check aria-labelledby
    const ariaLabelledby = element.getAttribute('aria-labelledby');
    if (ariaLabelledby) {
      const labelElement = document.getElementById(ariaLabelledby);
      if (labelElement) return labelElement.textContent?.trim() || '';
    }

    // Check text content
    return element.textContent?.trim() || '';
  }

  private hasAssociatedLabel(control: HTMLInputElement): boolean {
    // Check for label with for attribute
    const labels = document.querySelectorAll(`label[for="${control.id}"]`);
    if (labels.length > 0) return true;

    // Check if control is inside a label
    const parentLabel = control.closest('label');
    return !!parentLabel;
  }

  private findAssociatedField(form: HTMLFormElement, errorElement: HTMLElement): HTMLInputElement | null {
    const errorId = errorElement.id;
    if (!errorId) return null;

    const field = form.querySelector(`[aria-describedby*="${errorId}"]`) as HTMLInputElement;
    return field;
  }
}

/**
 * Quick accessibility test function
 */
export const testAccessibility = (container?: HTMLElement): AccessibilityTestResult => {
  const tester = new AccessibilityTester();
  return tester.test(container);
};

/**
 * Assert accessibility compliance in tests
 */
export const expectAccessible = (container?: HTMLElement): void => {
  const result = testAccessibility(container);
  
  if (!result.passed) {
    const errorMessages = result.issues
      .filter(issue => issue.type === 'error')
      .map(issue => `${issue.rule}: ${issue.message}`)
      .join('\n');
    
    throw new Error(`Accessibility violations found:\n${errorMessages}`);
  }
};