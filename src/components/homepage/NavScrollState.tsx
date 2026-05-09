"use client";

import { useEffect } from "react";

type NavScrollStateProps = {
  targetId: string;
};

const scrolledClasses = [
  "bg-[#080d18]/90",
  "border-white/10",
  "backdrop-blur-xl",
] as const;

export function NavScrollState({ targetId }: NavScrollStateProps) {
  useEffect(() => {
    const element = document.getElementById(targetId);

    if (!element) {
      return;
    }

    const onScroll = () => {
      const isScrolled = window.scrollY > 24;

      scrolledClasses.forEach((className) => {
        if (isScrolled) {
          element.classList.add(className);
        } else {
          element.classList.remove(className);
        }
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, [targetId]);

  return null;
}
