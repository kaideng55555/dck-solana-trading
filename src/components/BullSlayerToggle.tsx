// web/src/components/BullSlayerToggle.tsx
import React from "react";

type Props = {
  enabled: boolean;
  onToggle: (next: boolean) => void;
};

export default function BullSlayerToggle({ enabled, onToggle }: Props) {
  return (
    <button
      className="btn"
      aria-pressed={enabled}
      title="Aggressive preset: LP locked, renounced, swappable, new, trending"
      onClick={() => onToggle(!enabled)}
    >
      {enabled ? "Bull Slayer: ON" : "Bull Slayer Mode"}
    </button>
  );
}
