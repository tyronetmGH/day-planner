/**
 * Custom hook for keyboard navigation support
 * Provides comprehensive keyboard accessibility for interactive elements
 */

import { useEffect, useCallback, useRef } from 'react';
import { KeyboardNavigation } from '../utils/accessibilityUtils';

interface UseKeyboardNavigationOptions {
  /** Array of focusable elements or refs */
  items: (HTMLElement | React.RefObject<HTMLElement>)[];
  /** Current focused item index */
  currentIndex: number;
  /** Callback when navigation occurs */
  onNavigate: (newIndex: number) => void;
  /** Callback when item is activated (Enter/Space) */
  onActivate?: (index: number) => void;
  /** Enable arrow key navigation */
  enableArrowKeys?: boolean;
  /** Enable Home/End navigation */
  enableHomeEnd?: boolean;
  /** Enable Enter/Space activation */
  enableActivation?: boolean;
  /** Container element to attach listeners to */
  container?: HTMLElement | React.RefObject<HTMLElement>;
}

export const useKeyboardNavigation = ({
  items,
  currentIndex,
  onNavigate,
  onActivate,
  enableArrowKeys = true,
  enableHomeEnd = true,
  enableActivation = true,
  container
}: UseKeyboardNavigationOptions) => {
  const containerRef = useRef<HTMLElement | null>(null);

  // Get actual HTML elements from items array
  const getElements = useCallback((): HTMLElement[] => {
    return items
      .map(item => {
        if ('current' in item) {
          return item.current;
        }
        return item;
      })
      .filter((el): el is HTMLElement => el !== null);
  }, [items]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: Event) => {
    const keyboardEvent = event as KeyboardEvent;
    const elements = getElements();
    if (elements.length === 0) return;

    // Arrow key navigation
    if (enableArrowKeys && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(keyboardEvent.key)) {
      KeyboardNavigation.handleArrowNavigation(keyboardEvent, elements, currentIndex, onNavigate);
      return;
    }

    // Home/End navigation
    if (enableHomeEnd && ['Home', 'End'].includes(keyboardEvent.key)) {
      KeyboardNavigation.handleArrowNavigation(keyboardEvent, elements, currentIndex, onNavigate);
      return;
    }

    // Enter/Space activation
    if (enableActivation && onActivate && ['Enter', ' '].includes(keyboardEvent.key)) {
      KeyboardNavigation.handleActivation(event, () => onActivate(currentIndex));
      return;
    }
  }, [currentIndex, onNavigate, onActivate, enableArrowKeys, enableHomeEnd, enableActivation, getElements]);

  // Focus current item
  const focusCurrentItem = useCallback(() => {
    const elements = getElements();
    const currentElement = elements[currentIndex];
    if (currentElement) {
      currentElement.focus();
    }
  }, [currentIndex, getElements]);

  // Set up event listeners
  useEffect(() => {
    const targetElement = container 
      ? ('current' in container ? container.current : container)
      : containerRef.current || document;

    if (targetElement) {
      targetElement.addEventListener('keydown', handleKeyDown);
      return () => {
        targetElement.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, container]);

  // Focus current item when index changes
  useEffect(() => {
    focusCurrentItem();
  }, [currentIndex, focusCurrentItem]);

  return {
    containerRef,
    focusCurrentItem,
    getElements
  };
};

/**
 * Hook for managing roving tabindex pattern
 * Useful for toolbars, menus, and other composite widgets
 */
export const useRovingTabIndex = (
  items: (HTMLElement | React.RefObject<HTMLElement>)[],
  currentIndex: number = 0
) => {
  useEffect(() => {
    const elements = items
      .map(item => ('current' in item ? item.current : item))
      .filter((el): el is HTMLElement => el !== null);

    elements.forEach((element, index) => {
      if (index === currentIndex) {
        element.setAttribute('tabindex', '0');
        element.setAttribute('aria-selected', 'true');
      } else {
        element.setAttribute('tabindex', '-1');
        element.setAttribute('aria-selected', 'false');
      }
    });
  }, [items, currentIndex]);
};

/**
 * Hook for managing focus trap in modals and dialogs
 */
export const useFocusTrap = (
  isActive: boolean,
  containerRef: React.RefObject<HTMLElement>
) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element when trap becomes active
    firstElement?.focus();

    container.addEventListener('keydown', handleTabKey);
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive, containerRef]);
};

/**
 * Hook for managing escape key handling
 */
export const useEscapeKey = (
  callback: () => void,
  isActive: boolean = true
) => {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [callback, isActive]);
};