// src/components/LoadingScreen.jsx
import React from "react";

export default function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
      <div className="text-4xl font-bold text-pink-400 animate-neon">
        Loading DCK$ Tools…
      </div>
    </div>
  );
}
