import { useState, useEffect, useCallback } from "react";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";

export interface UseGuideNavigatorOptions {
  stepsCount: number;
  onClose: () => void;
  opened?: boolean;
}

export function useGuideNavigator({ stepsCount, onClose, opened = true }: UseGuideNavigatorOptions) {
  const [slideIndex, setSlideIndex] = useState(0);
  const reduceMotion = usePrefersReducedMotion();

  const reset = useCallback(() => {
    setSlideIndex(0);
  }, []);

  const goBack = useCallback(() => {
    if (slideIndex === 0) {
      onClose();
    } else {
      setSlideIndex((i) => i - 1);
    }
  }, [slideIndex, onClose]);

  const goNext = useCallback(() => {
    if (slideIndex === stepsCount - 1) {
      onClose();
    } else {
      setSlideIndex((i) => i + 1);
    }
  }, [slideIndex, stepsCount, onClose]);

  useEffect(() => {
    if (opened) {
      setSlideIndex(0);
    }
  }, [opened]);

  useEffect(() => {
    if (!opened || stepsCount === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goBack();
      }
      if (e.key === "ArrowRight") {
        goNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [opened, stepsCount, goBack, goNext]);

  return {
    slideIndex,
    setSlideIndex,
    isFirst: slideIndex === 0,
    isLast: slideIndex === stepsCount - 1,
    goBack,
    goNext,
    reduceMotion,
    reset,
  };
}
