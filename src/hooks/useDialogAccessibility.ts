import { useEffect, useId, useRef, RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled]):not([aria-hidden="true"])',
  'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"])',
  'select:not([disabled]):not([aria-hidden="true"])',
  'textarea:not([disabled]):not([aria-hidden="true"])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
].join(',');

// Track open modal stack so Escape closes only the topmost open dialog
const openDialogStack: string[] = [];

interface UseDialogAccessibilityOptions {
  isOpen: boolean;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export function useDialogAccessibility<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  initialFocusRef,
}: UseDialogAccessibilityOptions): RefObject<T | null> {
  const dialogRef = useRef<T | null>(null);
  const dialogId = useId();
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    openDialogStack.push(dialogId);

    const focusTimer = window.setTimeout(() => {
      const container = dialogRef.current;
      if (!container) return;

      if (initialFocusRef?.current && container.contains(initialFocusRef.current)) {
        initialFocusRef.current.focus();
        return;
      }

      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null || el.getClientRects().length > 0
      );

      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        if (!container.hasAttribute('tabindex')) {
          container.setAttribute('tabindex', '-1');
        }
        container.focus();
      }
    }, 30);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (openDialogStack[openDialogStack.length - 1] !== dialogId) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab') {
        const container = dialogRef.current;
        if (!container) return;

        const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
          (el) => el.offsetParent !== null || el.getClientRects().length > 0
        );

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (!active || active === first || !container.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (!active || active === last || !container.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown, true);
      const idx = openDialogStack.lastIndexOf(dialogId);
      if (idx !== -1) {
        openDialogStack.splice(idx, 1);
      }

      const prev = previousActiveElementRef.current;
      if (prev && typeof prev.focus === 'function' && document.contains(prev)) {
        window.setTimeout(() => {
          try {
            prev.focus();
          } catch {}
        }, 0);
      }
    };
  }, [isOpen, dialogId, initialFocusRef]);

  return dialogRef;
}
