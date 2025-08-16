/**
 * Tests for accessibility utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  announceToScreenReader,
  FocusManager,
  prefersReducedMotion,
  prefersHighContrast,
  generateAccessibilityId,
  validateColorContrast,
  KeyboardNavigation,
  ScreenReader,
  TouchAccessibility,
  FormAccessibility
} from './accessibilityUtils';

describe('Accessibility Utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('announceToScreenReader', () => {
    it('creates and removes announcement element', () => {
      vi.useFakeTimers();
      
      announceToScreenReader('Test announcement');
      
      const announcement = document.querySelector('[aria-live="polite"]');
      expect(announcement).toBeTruthy();
      expect(announcement?.textContent).toBe('Test announcement');
      expect(announcement?.className).toBe('sr-only');
      
      vi.advanceTimersByTime(1000);
      
      const removedAnnouncement = document.querySelector('[aria-live="polite"]');
      expect(removedAnnouncement).toBeFalsy();
      
      vi.useRealTimers();
    });

    it('supports assertive priority', () => {
      announceToScreenReader('Urgent message', 'assertive');
      
      const announcement = document.querySelector('[aria-live="assertive"]');
      expect(announcement).toBeTruthy();
      expect(announcement?.getAttribute('aria-atomic')).toBe('true');
    });
  });

  describe('FocusManager', () => {
    let focusManager: FocusManager;
    let container: HTMLElement;

    beforeEach(() => {
      focusManager = new FocusManager();
      container = document.createElement('div');
      container.innerHTML = `
        <button id="btn1">Button 1</button>
        <input id="input1" type="text" />
        <select id="select1">
          <option>Option 1</option>
        </select>
        <button id="btn2" disabled>Disabled Button</button>
        <button id="btn3">Button 3</button>
      `;
      document.body.appendChild(container);
    });

    it('traps focus within container', () => {
      const firstButton = document.getElementById('btn1') as HTMLButtonElement;
      const spy = vi.spyOn(firstButton, 'focus');
      
      focusManager.trapFocus(container);
      
      expect(spy).toHaveBeenCalled();
    });

    it('handles tab navigation correctly', () => {
      focusManager.trapFocus(container);
      
      const input = document.getElementById('input1') as HTMLInputElement;
      input.focus();
      
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      Object.defineProperty(tabEvent, 'preventDefault', { value: vi.fn() });
      
      container.dispatchEvent(tabEvent);
      
      expect(tabEvent.preventDefault).toHaveBeenCalled();
    });

    it('releases focus and returns to previous element', () => {
      const previousElement = document.createElement('button');
      document.body.appendChild(previousElement);
      previousElement.focus();
      
      const spy = vi.spyOn(previousElement, 'focus');
      
      focusManager.trapFocus(container);
      focusManager.releaseFocus();
      
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Media Query Utilities', () => {
    it('detects reduced motion preference', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      expect(prefersReducedMotion()).toBe(true);
    });

    it('detects high contrast preference', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      expect(prefersHighContrast()).toBe(true);
    });
  });

  describe('generateAccessibilityId', () => {
    it('generates unique IDs with prefix', () => {
      const id1 = generateAccessibilityId('test');
      const id2 = generateAccessibilityId('test');
      
      expect(id1).toMatch(/^test-[a-z0-9]+$/);
      expect(id2).toMatch(/^test-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('uses default prefix when none provided', () => {
      const id = generateAccessibilityId();
      expect(id).toMatch(/^a11y-[a-z0-9]+$/);
    });
  });

  describe('validateColorContrast', () => {
    it('validates WCAG AA compliant colors', () => {
      // High contrast - should pass
      expect(validateColorContrast('#000000', '#ffffff')).toBe(true);
      
      // Low contrast - should fail
      expect(validateColorContrast('#cccccc', '#ffffff')).toBe(false);
      
      // Medium contrast - should pass
      expect(validateColorContrast('#2563eb', '#ffffff')).toBe(true);
    });

    it('handles hex colors correctly', () => {
      expect(validateColorContrast('#333333', '#ffffff')).toBe(true);
      expect(validateColorContrast('#777777', '#ffffff')).toBe(false);
    });
  });

  describe('KeyboardNavigation', () => {
    let items: HTMLElement[];
    let mockCallback: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      items = [
        document.createElement('button'),
        document.createElement('button'),
        document.createElement('button')
      ];
      items.forEach((item, index) => {
        item.id = `item-${index}`;
        document.body.appendChild(item);
      });
      mockCallback = vi.fn();
    });

    it('handles arrow down navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      
      KeyboardNavigation.handleArrowNavigation(event, items, 0, mockCallback);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(1);
    });

    it('handles arrow up navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      
      KeyboardNavigation.handleArrowNavigation(event, items, 1, mockCallback);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(0);
    });

    it('wraps navigation at boundaries', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      
      KeyboardNavigation.handleArrowNavigation(event, items, 2, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(0);
    });

    it('handles Home and End keys', () => {
      const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
      Object.defineProperty(homeEvent, 'preventDefault', { value: vi.fn() });
      
      KeyboardNavigation.handleArrowNavigation(homeEvent, items, 1, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(0);
      
      const endEvent = new KeyboardEvent('keydown', { key: 'End' });
      Object.defineProperty(endEvent, 'preventDefault', { value: vi.fn() });
      
      KeyboardNavigation.handleArrowNavigation(endEvent, items, 1, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(2);
    });

    it('handles Enter and Space activation', () => {
      const mockActivation = vi.fn();
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      Object.defineProperty(enterEvent, 'preventDefault', { value: vi.fn() });
      
      KeyboardNavigation.handleActivation(enterEvent, mockActivation);
      
      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(mockActivation).toHaveBeenCalled();
      
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      Object.defineProperty(spaceEvent, 'preventDefault', { value: vi.fn() });
      
      KeyboardNavigation.handleActivation(spaceEvent, mockActivation);
      
      expect(spaceEvent.preventDefault).toHaveBeenCalled();
      expect(mockActivation).toHaveBeenCalledTimes(2);
    });
  });

  describe('ScreenReader', () => {
    it('creates and manages live regions', () => {
      const liveRegion = ScreenReader.createLiveRegion('test-region');
      
      expect(liveRegion.id).toBe('test-region');
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
      expect(liveRegion.className).toBe('sr-only');
    });

    it('updates live region content', () => {
      ScreenReader.createLiveRegion('update-region');
      ScreenReader.updateLiveRegion('update-region', 'Updated message');
      
      const region = document.getElementById('update-region');
      expect(region?.textContent).toBe('Updated message');
    });

    it('removes live regions', () => {
      ScreenReader.createLiveRegion('remove-region');
      expect(document.getElementById('remove-region')).toBeTruthy();
      
      ScreenReader.removeLiveRegion('remove-region');
      expect(document.getElementById('remove-region')).toBeFalsy();
    });

    it('reuses existing live regions', () => {
      const region1 = ScreenReader.createLiveRegion('reuse-region');
      const region2 = ScreenReader.createLiveRegion('reuse-region');
      
      expect(region1).toBe(region2);
    });
  });

  describe('TouchAccessibility', () => {
    it('detects touch devices', () => {
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        value: {},
        writable: true
      });
      
      expect(TouchAccessibility.isTouchDevice()).toBe(true);
    });

    it('ensures minimum touch target size', () => {
      const element = document.createElement('button');
      element.style.width = '20px';
      element.style.height = '20px';
      document.body.appendChild(element);
      
      TouchAccessibility.ensureMinimumTouchTarget(element);
      
      expect(element.style.minWidth).toBe('44px');
      expect(element.style.minHeight).toBe('44px');
      expect(element.style.display).toBe('inline-flex');
    });
  });

  describe('FormAccessibility', () => {
    it('associates form controls with labels', () => {
      const input = document.createElement('input');
      const label = document.createElement('label');
      
      FormAccessibility.associateFormControl(input, label);
      
      expect(input.id).toBeTruthy();
      expect(label.getAttribute('for')).toBe(input.id);
      expect(input.getAttribute('aria-invalid')).toBe('false');
    });

    it('associates form controls with error messages', () => {
      const input = document.createElement('input');
      const label = document.createElement('label');
      const error = document.createElement('div');
      
      FormAccessibility.associateFormControl(input, label, error);
      
      expect(error.id).toBeTruthy();
      expect(input.getAttribute('aria-describedby')).toBe(error.id);
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('validates form accessibility', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.id = 'test-input';
      input.required = true;
      form.appendChild(input);
      
      const issues = FormAccessibility.validateFormAccessibility(form);
      
      expect(issues).toContain('Input test-input is missing a label');
      expect(issues).toContain('Required input test-input is missing aria-required');
    });

    it('passes validation for properly labeled forms', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      const label = document.createElement('label');
      
      input.id = 'proper-input';
      input.setAttribute('aria-required', 'true');
      label.setAttribute('for', 'proper-input');
      
      form.appendChild(input);
      form.appendChild(label);
      
      const issues = FormAccessibility.validateFormAccessibility(form);
      
      expect(issues).toHaveLength(0);
    });
  });
});