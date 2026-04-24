import { useEffect, useRef } from 'react';

/**
 * Custom hook to trap focus within a modal/dialog
 * Prevents tabbing outside of the modal and returns focus to trigger on close
 * 
 * @param isOpen - Whether the modal is currently open
 * @returns ref - Ref to attach to the modal container
 * 
 * @example
 * const modalRef = useFocusTrap(isModalOpen);
 * return <div ref={modalRef}>...</div>
 */
export function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Store the element that had focus before opening the modal
    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Find all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      if (!container) return [];

      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ];

      const elements = container.querySelectorAll<HTMLElement>(
        focusableSelectors.join(',')
      );

      return Array.from(elements).filter(
        (element) =>
          !element.hasAttribute('disabled') &&
          element.offsetParent !== null // Element is visible
      );
    };

    // Focus the first focusable element
    const focusFirstElement = () => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    };

    // Handle tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab: move focus to last element if on first
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // Tab: move focus to first element if on last
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    // Focus first element when modal opens
    setTimeout(focusFirstElement, 10);

    // Add event listener for tab key
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup: return focus to previous element and remove listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      if (previousFocusRef.current && !isOpen) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  return containerRef;
}
