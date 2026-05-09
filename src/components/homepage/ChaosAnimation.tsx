"use client";

import { useEffect, useRef } from "react";

type ChaosAnimationProps = {
  icons: ReadonlyArray<string>;
};

type IconState = {
  element: HTMLSpanElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  spin: number;
};

export function ChaosAnimation({ icons }: ChaosAnimationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iconRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    const host = containerRef.current;

    if (!host) {
      return;
    }

    const container = host;

    const motion = {
      mouseX: null as number | null,
      mouseY: null as number | null,
    };

    const iconState: IconState[] = iconRefs.current
      .filter((icon): icon is HTMLSpanElement => Boolean(icon))
      .map((element) => {
        const size = Math.max(element.offsetWidth, element.offsetHeight);

        return {
          element,
          x: 0,
          y: 0,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          size,
          phase: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.9,
        };
      });

    function randomizePositions() {
      const bounds = container.getBoundingClientRect();

      iconState.forEach((icon) => {
        icon.x = Math.random() * Math.max(bounds.width - icon.size, 1);
        icon.y = Math.random() * Math.max(bounds.height - icon.size, 1);
      });
    }

    randomizePositions();

    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      motion.mouseX = event.clientX - rect.left;
      motion.mouseY = event.clientY - rect.top;
    };

    const onMouseLeave = () => {
      motion.mouseX = null;
      motion.mouseY = null;
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    const resizeObserver = new ResizeObserver(() => {
      const bounds = container.getBoundingClientRect();

      iconState.forEach((icon) => {
        icon.x = Math.min(icon.x, Math.max(bounds.width - icon.size, 0));
        icon.y = Math.min(icon.y, Math.max(bounds.height - icon.size, 0));
      });
    });

    resizeObserver.observe(container);

    let frameId = 0;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const delta = Math.min((now - lastTime) / 16.67, 2);
      lastTime = now;

      const rect = container.getBoundingClientRect();

      iconState.forEach((icon, index) => {
        icon.x += icon.vx * delta;
        icon.y += icon.vy * delta;

        if (icon.x <= 0 || icon.x >= rect.width - icon.size) {
          icon.vx *= -1;
          icon.x = Math.max(0, Math.min(icon.x, Math.max(rect.width - icon.size, 0)));
        }

        if (icon.y <= 0 || icon.y >= rect.height - icon.size) {
          icon.vy *= -1;
          icon.y = Math.max(0, Math.min(icon.y, Math.max(rect.height - icon.size, 0)));
        }

        if (motion.mouseX !== null && motion.mouseY !== null) {
          const centerX = icon.x + icon.size / 2;
          const centerY = icon.y + icon.size / 2;
          const dx = centerX - motion.mouseX;
          const dy = centerY - motion.mouseY;
          const distance = Math.hypot(dx, dy);

          if (distance < 96 && distance > 0.001) {
            const force = (96 - distance) / 96;
            icon.vx += (dx / distance) * force * 0.16;
            icon.vy += (dy / distance) * force * 0.16;
          }
        }

        icon.vx *= 0.995;
        icon.vy *= 0.995;

        icon.phase += 0.04 * delta;
        const wobble = Math.sin(icon.phase + index) * 3;
        const scale = 1 + Math.sin(icon.phase * 0.65) * 0.05;

        icon.element.style.transform = `translate(${icon.x}px, ${icon.y}px) rotate(${wobble + icon.spin * now * 0.01}deg) scale(${scale})`;
      });

      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      aria-label="Animated chaos of scattered tools"
      className="relative h-64 overflow-hidden rounded-2xl border border-dashed border-white/20"
      ref={containerRef}
    >
      {icons.map((icon, index) => (
        <span
          className="pointer-events-none absolute left-0 top-0 inline-flex h-10 w-12 items-center justify-center rounded-xl border border-white/25 bg-white/10 font-mono text-[11px] font-semibold text-zinc-100"
          key={`${icon}-${index}`}
          ref={(element) => {
            iconRefs.current[index] = element;
          }}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}
