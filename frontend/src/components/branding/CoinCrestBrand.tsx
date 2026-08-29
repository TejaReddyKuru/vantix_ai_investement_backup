"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const crestStyles: React.CSSProperties[] = [
  { fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic" },
  { fontFamily: "Arial Black, Arial, sans-serif", letterSpacing: "-0.08em" },
  {
    fontFamily: "'Courier New', monospace",
    fontWeight: 900,
    letterSpacing: "-0.06em",
  },
  {
    fontFamily: "Impact, Haettenschweiler, sans-serif",
    letterSpacing: "-0.045em",
  },
];

type MarkProps = {
  className?: string;
  inverted?: boolean;
  priority?: boolean;
};

export function CoinCrestMark({
  className = "h-11 w-11",
  inverted = false,
  priority = false,
}: MarkProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 ${className}`}
      aria-hidden="true"
    >
      <Image
        src="/branding/coincrest-mark.png"
        alt=""
        fill
        priority={priority}
        sizes="96px"
        className={`object-contain ${inverted ? "brightness-0 invert" : ""}`}
      />
    </span>
  );
}

type WordmarkProps = {
  className?: string;
  inverted?: boolean;
};

export function CoinCrestWordmark({
  className = "text-[18px]",
  inverted = false,
}: WordmarkProps) {
  const [styleIndex, setStyleIndex] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;
    const update = () => {
      window.clearInterval(timer);
      if (media.matches) setStyleIndex(0);
      else
        timer = window.setInterval(
          () => setStyleIndex((current) => (current + 1) % crestStyles.length),
          5000,
        );
    };
    update();
    media.addEventListener("change", update);
    return () => {
      window.clearInterval(timer);
      media.removeEventListener("change", update);
    };
  }, []);

  return (
    <span
      className={`inline-flex items-baseline font-black tracking-[-0.055em] ${className} ${
        inverted ? "text-white" : "text-black"
      }`}
      aria-label="CoinCrest"
    >
      <span>COIN</span>
      <span
        className="ml-[0.03em] inline-block text-[#2F78B7] transition-all duration-700"
        style={crestStyles[styleIndex]}
      >
        CREST
      </span>
    </span>
  );
}

export default function CoinCrestBrand({
  inverted = false,
  compact = false,
}: {
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      <CoinCrestMark
        className={compact ? "h-9 w-9" : "h-11 w-11"}
        inverted={inverted}
        priority
      />
      <CoinCrestWordmark
        className={compact ? "text-[16px]" : "text-[19px]"}
        inverted={inverted}
      />
    </span>
  );
}
