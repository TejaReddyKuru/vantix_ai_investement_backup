"use client"

import { Pin } from "lucide-react"
import { Community } from "./types"
import CommunityIcon from "./CommunityIcon"

type CommunityItemProps = {
  community: Community
  isActive: boolean
  onClick: () => void
}

export default function CommunityItem({
  community,
  isActive,
  onClick,
}: CommunityItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative flex w-full items-center gap-3.5 rounded-2xl p-3.5 text-left transition-all duration-200",
        isActive
          ? "bg-[#0F2D1F] text-white shadow-[0_8px_24px_rgba(15,45,31,0.12)]"
          : "text-[#171717] hover:bg-white/80 hover:shadow-sm",
      ].join(" ")}
    >
      {/* Active Indicator Bar */}
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-7 w-[3.5px] -translate-y-1/2 rounded-r-full bg-[#D8E9DD]"
        />
      )}

      {/* Avatar / Icon Container */}
      <div className="relative shrink-0">
        <div
          className={[
            "flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
            isActive
              ? "bg-white/15 text-white"
              : `${community.avatarBg} ${community.iconColor} shadow-sm`,
          ].join(" ")}
        >
          <CommunityIcon
            name={community.icon}
            size={20}
            strokeWidth={isActive ? 2.2 : 1.9}
          />
        </div>

        {/* Online Dot */}
        <span
          aria-hidden="true"
          className={[
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2",
            isActive ? "border-[#0F2D1F] bg-[#65C18C]" : "border-[#F7F6E8] bg-[#18794E]",
          ].join(" ")}
        />
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={[
                "truncate text-[13px] font-extrabold tracking-tight",
                isActive ? "text-white" : "text-[#171717]",
              ].join(" ")}
            >
              {community.name}
            </span>

            {community.isPinned && (
              <Pin
                size={11}
                className={[
                  "shrink-0 rotate-45",
                  isActive ? "text-[#D8E9DD]" : "text-[#8A897F]",
                ].join(" ")}
              />
            )}
          </div>

          <span
            className={[
              "shrink-0 text-[10px] font-semibold tabular-nums",
              isActive ? "text-white/70" : "text-[#8A897F]",
            ].join(" ")}
          >
            {community.latestMessage.time}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <p
            className={[
              "truncate text-[11px] font-medium leading-4",
              isActive ? "text-white/75" : "text-[#77776F]",
            ].join(" ")}
          >
            <span className="font-semibold">{community.latestMessage.senderName}: </span>
            {community.latestMessage.text}
          </p>

          {community.unreadCount > 0 && !isActive && (
            <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-md bg-[#18794E] px-1.5 text-[9px] font-extrabold text-white shadow-sm">
              {community.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
