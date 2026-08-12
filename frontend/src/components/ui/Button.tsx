"use client"

import React from 'react'
import clsx from 'clsx'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'neutral'
}

export default function Button({ variant = 'primary', className, ...props }: Props) {
  return (
    <button
      {...props}
      className={clsx(
        'button inline-flex items-center justify-center font-medium transition focus:ring-2',
        variant === 'primary' && 'bg-[var(--accent)] text-white hover:brightness-110',
        variant === 'ghost' && 'bg-transparent text-[var(--fg-1)] hover:bg-neutral-800',
        variant === 'neutral' && 'bg-neutral-800 text-white',
        className
      )}
    />
  )
}
