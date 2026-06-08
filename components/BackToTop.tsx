"use client";

import { useEffect, useRef, useState } from "react";

interface BackToTopProps {
  /** Scroll distance (px) past which the button appears. */
  threshold?: number;
  /**
   * `id` of the element to move focus to after scrolling (e.g. the page
   * heading). Keeps keyboard/screen-reader focus from being lost when the
   * button unmounts at the top.
   */
  focusTargetId?: string;
}

/**
 * Floating "back to top" button. Appears once the user has scrolled past
 * `threshold` and scrolls the window back to the top on click, honouring the
 * user's reduced-motion preference.
 */
export const BackToTop = ({ threshold = 400, focusTargetId }: BackToTopProps) => {
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);

  useEffect(() => {
    const update = () => {
      const next = window.scrollY > threshold;
      if (visibleRef.current !== next) {
        visibleRef.current = next;
        setVisible(next);
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);

  if (!visible) {
    return null;
  }

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });

    // Move focus without a second scroll jump; the window scroll above handles
    // the visual move.
    if (focusTargetId) {
      document.getElementById(focusTargetId)?.focus({ preventScroll: true });
    }
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className="back-to-top"
    >
      ↑ Top
    </button>
  );
};
