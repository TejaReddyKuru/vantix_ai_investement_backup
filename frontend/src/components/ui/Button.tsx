"use client"

import React from "react"
import clsx from "clsx"

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
}

export default function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C8E6C9]",
        "disabled:pointer-events-none disabled:opacity-50",

        size === "sm" && "min-h-9 px-4 text-xs",
        size === "md" && "min-h-11 px-5 text-sm",
        size === "lg" && "min-h-12 px-6 text-sm",

        variant === "primary" &&
          "bg-[#111111] text-white hover:-translate-y-0.5 hover:shadow-lg",

        variant === "secondary" &&
          "border border-[#E2E1D5] bg-white text-[#171717] hover:bg-[#FAFAF7]",

        variant === "ghost" &&
          "bg-transparent text-[#6B6B63] hover:bg-[#E8F5E9] hover:text-[#171717]",

        variant === "danger" &&
          "bg-[#DC2626] text-white hover:-translate-y-0.5 hover:shadow-lg",

        className
      )}
    />
  )
}
