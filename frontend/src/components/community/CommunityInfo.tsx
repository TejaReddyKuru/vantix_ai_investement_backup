"use client"

import { useState } from "react"
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Info,
  Lock,
  Pin,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react"
import { Community, Member } from "./types"
import CommunityIcon from "./CommunityIcon"

type CommunityInfoProps = {
  community: Community
  members: Member[]
  onClose: () => void
  isMuted: boolean
  onToggleMute: () => void
}

export default function CommunityInfo({
  community,
  members,
  onClose,
  isMuted,
  onToggleMute,
}: CommunityInfoProps) {
  const [activeTab, setActiveTab] = useState<"about" | "members" | "rules">("about")

  return (
    <aside className="flex h-full w-full flex-col border-l border-[#DDDCD0] bg-white">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#DDDCD0] px-5">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-[#0F2D1F]" />
          <h3 className="text-xs font-extrabold tracking-tight text-[#171717]">
            Channel Details
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8A897F] transition-colors hover:bg-[#F7F6E8] hover:text-[#171717]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Hero Banner & Community Identity */}
      <div className="border-b border-[#DDDCD0] bg-[#F7F6E8]/70 p-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F2D1F] text-white shadow-[0_8px_20px_rgba(15,45,31,0.16)]">
          <CommunityIcon name={community.icon} size={28} strokeWidth={2.2} />
        </div>

        <h4 className="mt-3 text-base font-extrabold tracking-tight text-[#171717]">
          {community.name}
        </h4>

        <div className="mt-1 flex items-center justify-center gap-2 text-[10px] font-bold text-[#8A897F]">
          <span className="rounded-full bg-[#E8F2EA] px-2.5 py-0.5 text-[9px] uppercase tracking-wide text-[#18794E]">
            {community.category}
          </span>
          <span>·</span>
          <span>Public Community</span>
        </div>

        {/* Quick Stat Tiles */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-[#DDDCD0] bg-white p-2.5 text-center">
            <div className="text-sm font-extrabold text-[#171717]">
              {community.memberCount.toLocaleString()}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#8A897F]">
              Members
            </div>
          </div>

          <div className="rounded-xl border border-[#D5E2D8] bg-[#E8F2EA] p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-extrabold text-[#18794E]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#18794E]" />
              {community.onlineCount.toLocaleString()}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#607367]">
              Online Now
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#DDDCD0] bg-[#FAFAF7]">
        <button
          type="button"
          onClick={() => setActiveTab("about")}
          className={[
            "flex-1 py-2.5 text-[11px] font-extrabold transition-colors",
            activeTab === "about"
              ? "border-b-2 border-[#0F2D1F] bg-white text-[#0F2D1F]"
              : "text-[#8A897F] hover:text-[#171717]",
          ].join(" ")}
        >
          About
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={[
            "flex-1 py-2.5 text-[11px] font-extrabold transition-colors",
            activeTab === "members"
              ? "border-b-2 border-[#0F2D1F] bg-white text-[#0F2D1F]"
              : "text-[#8A897F] hover:text-[#171717]",
          ].join(" ")}
        >
          Members ({members.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={[
            "flex-1 py-2.5 text-[11px] font-extrabold transition-colors",
            activeTab === "rules"
              ? "border-b-2 border-[#0F2D1F] bg-white text-[#0F2D1F]"
              : "text-[#8A897F] hover:text-[#171717]",
          ].join(" ")}
        >
          Rules ({community.rules.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ABOUT TAB */}
        {activeTab === "about" && (
          <>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#8A897F]">
                Description
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#55554E]">
                {community.description}
              </p>
            </div>

            {/* Notification Controls */}
            <div className="rounded-2xl border border-[#DDDCD0] bg-[#FAFAF7] p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-extrabold text-[#171717]">
                    Notifications
                  </div>
                  <div className="text-[10px] text-[#8A897F]">
                    {isMuted ? "Muted for this channel" : "All messages active"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onToggleMute}
                  className={[
                    "rounded-xl px-3 py-1.5 text-[10px] font-extrabold transition-colors",
                    isMuted
                      ? "bg-[#E8F2EA] text-[#0F2D1F]"
                      : "bg-[#0F2D1F] text-white",
                  ].join(" ")}
                >
                  {isMuted ? "Unmute" : "Mute"}
                </button>
              </div>
            </div>

            {/* Moderation Team */}
            <div>
              <div className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#8A897F]">
                Moderation Team
              </div>
              <div className="space-y-1.5">
                {community.moderators.map((mod) => (
                  <div
                    key={mod}
                    className="flex items-center gap-2 rounded-xl border border-[#DDDCD0] bg-white px-3 py-2 text-xs font-bold text-[#171717]"
                  >
                    <ShieldCheck size={14} className="text-[#18794E]" />
                    <span>{mod}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="flex items-start gap-2.5 rounded-2xl border border-[#D5E2D8] bg-[#E8F2EA]/60 p-3">
              <Shield size={16} className="shrink-0 text-[#18794E]" />
              <div className="text-[10px] leading-4 text-[#607367]">
                <strong className="font-extrabold text-[#0F2D1F]">
                  Protected Investment Channel.
                </strong>{" "}
                All participants agree to abide by ethical financial discourse
                and transparency.
              </div>
            </div>
          </>
        )}

        {/* MEMBERS TAB */}
        {activeTab === "members" && (
          <div className="space-y-2">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#8A897F]">
              Active Roster
            </div>
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-xl border border-[#DDDCD0] bg-white p-2.5 transition-colors hover:bg-[#FAFAF7]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F2D1F] text-[11px] font-extrabold text-white">
                      {member.avatar}
                    </div>
                    {member.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#18794E]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-xs font-extrabold text-[#171717]">
                      {member.name}
                    </div>
                    <div className="text-[9px] text-[#8A897F]">
                      {member.handle}
                    </div>
                  </div>
                </div>

                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide",
                    member.badgeColor || "bg-[#F3F0E5] text-[#55554E]",
                  ].join(" ")}
                >
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* RULES TAB */}
        {activeTab === "rules" && (
          <div className="space-y-3">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#8A897F]">
              Official Channel Guidelines
            </div>
            {community.rules.map((rule, idx) => (
              <div
                key={rule.id}
                className="rounded-2xl border border-[#DDDCD0] bg-white p-3.5"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0F2D1F] text-[9px] font-extrabold text-white">
                    {idx + 1}
                  </span>
                  <h5 className="text-xs font-extrabold text-[#171717]">
                    {rule.title}
                  </h5>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#66665F] pl-7">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
