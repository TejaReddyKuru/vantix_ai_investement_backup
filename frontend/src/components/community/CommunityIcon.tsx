"use client"

import {
  Coins,
  GraduationCap,
  MessageSquare,
  Newspaper,
  PieChart,
  Sparkles,
  TrendingUp,
} from "lucide-react"

type CommunityIconProps = {
  name: string
  size?: number
  strokeWidth?: number
  className?: string
}

export default function CommunityIcon({
  name,
  size = 19,
  strokeWidth = 2,
  className,
}: CommunityIconProps) {
  switch (name) {
    case "GraduationCap":
      return <GraduationCap size={size} strokeWidth={strokeWidth} className={className} />
    case "TrendingUp":
      return <TrendingUp size={size} strokeWidth={strokeWidth} className={className} />
    case "Coins":
      return <Coins size={size} strokeWidth={strokeWidth} className={className} />
    case "Newspaper":
      return <Newspaper size={size} strokeWidth={strokeWidth} className={className} />
    case "Sparkles":
      return <Sparkles size={size} strokeWidth={strokeWidth} className={className} />
    case "PieChart":
      return <PieChart size={size} strokeWidth={strokeWidth} className={className} />
    case "MessageSquare":
    default:
      return <MessageSquare size={size} strokeWidth={strokeWidth} className={className} />
  }
}
