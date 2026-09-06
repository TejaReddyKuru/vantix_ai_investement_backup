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
  const [error, setError] = useState(false);
  const markSrc = inverted
    ? "/branding/coincrest-mark-white.png"
    : "/branding/coincrest-mark.png";

  if (error) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-[#2F78B7] font-black text-white ${className}`}
        aria-hidden="true"
      >
        CC
      </span>
    );
  }

  return (
    <span
      className={`relative inline-flex shrink-0 ${className}`}
      aria-hidden="true"
    >
      <Image
        src={markSrc}
        alt=""
        fill
        priority={priority}
        unoptimized
        sizes="96px"
        onError={() => setError(true)}
        className="object-contain"
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
  className = "",
}: {
  inverted?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const logoSrc = inverted ? "/logo-white.png" : "/logo.png";

  if (error) {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-2 ${className}`}
        aria-label="CoinCrest"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2F78B7] text-xs font-black text-white">
          CC
        </span>
        <span
          className={`font-black tracking-tight ${
            compact ? "text-[15px]" : "text-[18px]"
          } ${inverted ? "text-white" : "text-[#07111F]"}`}
        >
          COINCREST
        </span>
      </span>
    );
  }

  return (
    <span
      className={`relative inline-flex shrink-0 items-center ${
        compact ? "h-7 w-36" : "h-8 w-44 sm:h-9 sm:w-48"
      } ${className}`}
      aria-label="CoinCrest"
    >
      <Image
        src={logoSrc}
        alt="CoinCrest"
        fill
        priority
        unoptimized
        sizes="(max-width: 768px) 160px, 220px"
        onError={() => setError(true)}
        className="object-contain object-left"
      />
    </span>
  );
}
