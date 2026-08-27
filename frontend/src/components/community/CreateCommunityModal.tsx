"use client"

import { useState } from "react"
import {
  Coins,
  GraduationCap,
  MessageSquare,
  Newspaper,
  PieChart,
  Plus,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react"
import { Community, CommunityCategory } from "./types"
import CommunityIcon from "./CommunityIcon"

type CreateCommunityModalProps = {
  isOpen: boolean
  onClose: () => void
  onCreate: (newCommunity: Community) => void
}

const CATEGORIES: CommunityCategory[] = [
  "General",
  "Stocks",
  "Crypto",
  "Strategies",
  "Beginners",
  "News",
  "Portfolio",
]

const ICONS = [
  { name: "MessageSquare", label: "Chat" },
  { name: "TrendingUp", label: "Stocks" },
  { name: "Coins", label: "Crypto" },
  { name: "Sparkles", label: "Strategy" },
  { name: "GraduationCap", label: "Education" },
  { name: "Newspaper", label: "News" },
  { name: "PieChart", label: "Portfolio" },
]

export default function CreateCommunityModal({
  isOpen,
  onClose,
  onCreate,
}: CreateCommunityModalProps) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState<CommunityCategory>("General")
  const [description, setDescription] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("MessageSquare")
  const [ruleText, setRuleText] = useState("")

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    const newCommunity: Community = {
      id: `comm-${Date.now()}`,
      name: name.trim(),
      slug: slug || `channel-${Date.now()}`,
      category,
      description: description.trim() || `Official discussion space for ${name.trim()}.`,
      icon: selectedIcon,
      avatarBg: "bg-[#0F2D1F]",
      iconColor: "text-[#D8E9DD]",
      memberCount: 1,
      onlineCount: 1,
      unreadCount: 0,
      latestMessage: {
        text: "Channel created. Welcome to the discussion!",
        senderName: "You",
        time: timeStr,
      },
      rules: [
        {
          id: 1,
          title: "Respect and Civility",
          description: "Maintain a respectful, professional tone in all discussions.",
        },
        ...(ruleText.trim()
          ? [
              {
                id: 2,
                title: "Channel Specific Guideline",
                description: ruleText.trim(),
              },
            ]
          : []),
      ],
      moderators: ["Vish Sai (You)"],
      isPinned: false,
    }

    onCreate(newCommunity)
    setName("")
    setDescription("")
    setRuleText("")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0F2D1F]/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[#DDDCD0] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E1D5] bg-[#F7F6E8] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F2D1F] text-white shadow-xs">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight text-[#171717]">
                Create New Community
              </h3>
              <p className="text-[10px] font-semibold text-[#8A897F]">
                Start a dedicated discussion channel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8A897F] hover:bg-white hover:text-[#171717]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Community Name */}
          <div>
            <label className="mb-1.5 block text-xs font-extrabold text-[#171717]">
              Community Name <span className="text-[#18794E]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Options Traders, Macro Insights, Dividend Growth"
              className="h-10 w-full rounded-xl border border-[#DDDCD0] bg-[#FAFAF7] px-3.5 text-xs font-medium text-[#171717] outline-none transition-all focus:border-[#0F2D1F] focus:bg-white focus:ring-2 focus:ring-[#0F2D1F]/10"
            />
          </div>

          {/* Category & Icon Picker */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Category */}
            <div>
              <label className="mb-1.5 block text-xs font-extrabold text-[#171717]">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CommunityCategory)}
                className="h-10 w-full rounded-xl border border-[#DDDCD0] bg-[#FAFAF7] px-3 text-xs font-semibold text-[#171717] outline-none focus:border-[#0F2D1F] focus:bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Icon */}
            <div>
              <label className="mb-1.5 block text-xs font-extrabold text-[#171717]">
                Channel Icon
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {ICONS.map((ico) => (
                  <button
                    key={ico.name}
                    type="button"
                    onClick={() => setSelectedIcon(ico.name)}
                    className={[
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all",
                      selectedIcon === ico.name
                        ? "border-[#0F2D1F] bg-[#0F2D1F] text-white shadow-xs"
                        : "border-[#DDDCD0] bg-[#FAFAF7] text-[#66665F] hover:bg-white",
                    ].join(" ")}
                    title={ico.label}
                  >
                    <CommunityIcon name={ico.name} size={16} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-extrabold text-[#171717]">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel about? Share the main focus or discussion topics."
              className="w-full resize-none rounded-xl border border-[#DDDCD0] bg-[#FAFAF7] p-3 text-xs font-medium text-[#171717] outline-none transition-all focus:border-[#0F2D1F] focus:bg-white focus:ring-2 focus:ring-[#0F2D1F]/10"
            />
          </div>

          {/* Optional Rule */}
          <div>
            <label className="mb-1.5 block text-xs font-extrabold text-[#171717]">
              Primary Guideline / Rule (Optional)
            </label>
            <input
              type="text"
              value={ruleText}
              onChange={(e) => setRuleText(e.target.value)}
              placeholder="e.g. Always back technical trade ideas with chart evidence"
              className="h-10 w-full rounded-xl border border-[#DDDCD0] bg-[#FAFAF7] px-3.5 text-xs font-medium text-[#171717] outline-none transition-all focus:border-[#0F2D1F] focus:bg-white focus:ring-2 focus:ring-[#0F2D1F]/10"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E1D5]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#DDDCD0] bg-white px-4 py-2 text-xs font-bold text-[#66665F] transition-colors hover:bg-[#FAFAF7] hover:text-[#171717]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={[
                "flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-extrabold text-white shadow-sm transition-all",
                name.trim()
                  ? "bg-[#0F2D1F] hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                  : "bg-[#D8D7CA] text-[#8A897F] cursor-not-allowed",
              ].join(" ")}
            >
              <Plus size={15} />
              Create Community
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
