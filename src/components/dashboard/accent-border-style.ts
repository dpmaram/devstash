import type { CSSProperties } from "react";

export function getAccentBorderStyle(accentColor: string): CSSProperties {
  return {
    borderLeftColor: accentColor,
  };
}
