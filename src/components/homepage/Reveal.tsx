"use client";

import { type ElementType, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type RevealProps<T extends ElementType> = {
  as?: T;
  children: React.ReactNode;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function Reveal<T extends ElementType = "div">({
  as,
  children,
  className,
  ...props
}: RevealProps<T>) {
  const Component = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <Component
      className={cn(
        "translate-y-6 opacity-0 transition duration-500",
        visible && "translate-y-0 opacity-100",
        className,
      )}
      ref={ref}
      {...props}
    >
      {children}
    </Component>
  );
}
