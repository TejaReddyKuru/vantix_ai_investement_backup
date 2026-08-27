"use client"

import {
  Bell,
  BellOff,
  ChevronLeft,
  Info,
  Pin,
  Search,
  Users,
  X,
} from "lucide-react"
import { Community } from "./types"
import CommunityIcon from "./CommunityIcon"

type ChatHeaderProps = {
  community: Community
  isInfoOpen: boolean
  onToggleInfo: () => void
  onBack: () => void
  chatSearchQuery: string
  onChatSearchChange: (query: string) => void
  isChatSearching: boolean
  onToggleChatSearch: () => void
  isMuted: boolean
  onToggleMute: () => void
  hasPinnedMessage: boolean
  showPinnedBanner: boolean
  onTogglePinnedBanner: () => void
}

export default function ChatHeader({
  community,
  isInfoOpen,
  onToggleInfo,
  onBack,
  chatSearchQuery,
  onChatSearchChange,
  isChatSearching,
  onToggleChatSearch,
  isMuted,
  onToggleMute,
  hasPinnedMessage,
  showPinnedBanner,
  onTogglePinnedBanner,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#DDDCD0] bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Back (Mobile) & Channel Info */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DDDCD0] bg-[#F7F6E8] text-[#171717] transition-colors hover:bg-white md:hidden"
            aria-label="Back to communities list"
          >
            <ChevronLeft size={19} />
          </button>

          {/* Avatar / Icon */}
          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
              community.avatarBg,
              community.iconColor,
            ].join(" ")}
          >
            <CommunityIcon name={community.icon} size={19} strokeWidth={2.2} />
          </div>

          {/* Title & Online Presence */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-extrabold tracking-tight text-[#171717]">
                {community.name}
              </h2>
              <span className="hidden rounded-full bg-[#E8F2EA] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-[#18794E] sm:inline-flex">
                {community.category}
              </span>
            </div>

            <div className="mt-0.5 flex items-center gap-2 text-[10px] font-medium text-[#8A897F]">
              <span className="flex items-center gap-1 font-semibold text-[#18794E]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#18794E]/40" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#18794E]" />
                </span>
                {community.onlineCount.toLocaleString()} online
              </span>
              <span>·</span>
              <span>{community.memberCount.toLocaleString()} members</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Chat Search Toggle */}
          {isChatSearching ? (
            <div className="relative flex items-center">
              <input
                type="text"
                value={chatSearchQuery}
                onChange={(e) => onChatSearchChange(e.target.value)}
                placeholder="Search messages..."
                autoFocus
                className="h-8.5 w-36 rounded-lg border border-[#0F2D1F] bg-[#FAFAF7] px-2.5 text-xs font-medium text-[#171717] outline-none sm:w-52"
              />
              <button
                type="button"
                onClick={onToggleChatSearch}
                className="absolute right-2 text-[#8A897F] hover:text-[#171717]"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onToggleChatSearch}
              title="Search messages in this channel"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DDDCD0] bg-[#FAFAF7] text-[#55554E] transition-all hover:border-[#0F2D1F]/30 hover:bg-white hover:text-[#0F2D1F]"
            >
              <Search size={16} />
            </button>
          )}

          {/* Pinned Message Toggle */}
          {hasPinnedMessage && (
            <button
              type="button"
              onClick={onTogglePinnedBanner}
              title="Toggle pinned announcement"
              className={[
                "flex h-9 w-9 items-center justify-center rounded-xl border transition-all",
                showPinnedBanner
                  ? "border-[#0F2D1F] bg-[#E8F2EA] text-[#0F2D1F]"
                  : "border-[#DDDCD0] bg-[#FAFAF7] text-[#55554E] hover:bg-white hover:text-[#0F2D1F]",
              ].join(" ")}
            >
              <Pin size={15} className="rotate-45" />
            </button>
          )}

          {/* Notification Mute Toggle */}
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? "Unmute notifications" : "Mute notifications"}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-xl border transition-all",
              isMuted
                ? "border-[#D8D7CA] bg-[#F3F0E5] text-[#8A897F]"
                : "border-[#DDDCD0] bg-[#FAFAF7] text-[#55554E] hover:bg-white hover:text-[#0F2D1F]",
            ].join(" ")}
          >
            {isMuted ? <BellOff size={15} /> : <Bell size={15} />}
          </button>

          {/* Info Panel Button */}
          <button
            type="button"
            onClick={onToggleInfo}
            title="Channel details & rules"
            className={[
              "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition-all",
              isInfoOpen
                ? "border-[#0F2D1F] bg-[#0F2D1F] text-white shadow-sm"
                : "border-[#DDDCD0] bg-[#FAFAF7] text-[#34342F] hover:border-[#0F2D1F]/30 hover:bg-white hover:text-[#0F2D1F]",
            ].join(" ")}
          >
            <Info size={15} />
            <span className="hidden sm:inline">Channel Info</span>
          </button>
        </div>
      </div>
    </header>
  )
}
