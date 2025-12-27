// web/src/components/SlayerBadge.tsx
import React from "react";

export default function SlayerBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full border border-token" title="Meets Bull Slayer criteria">
      BULL SLAYER
    </span>
  );
}
