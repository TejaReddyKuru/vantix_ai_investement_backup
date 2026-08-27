"use client"

import { useMemo, useState } from "react"
import { Filter, Flame, Plus, Search, Sparkles, Users } from "lucide-react"
import { Community, CommunityCategory } from "./types"
import CommunityItem from "./CommunityItem"

type CommunityListProps = {
  communities: Community[]
  activeCommunityId: string
  onSelectCommunity: (id: string) => void
}

const CATEGORY_TABS: { label: string; value: CommunityCategory }[] = [
  { label: "All", value: "All" },
  { label: "General", value: "General" },
  { label: "Stocks", value: "Stocks" },
  { label: "Crypto", value: "Crypto" },
  { label: "Strategies", value: "Strategies" },
  { label: "Beginners", value: "Beginners" },
  { label: "News", value: "News" },
  { label: "Portfolio", value: "Portfolio" },
]

export default function CommunityList({
  communities,
  activeCommunityId,
  onSelectCommunity,
}: CommunityListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CommunityCategory>("All")

  const filteredCommunities = useMemo(() => {
    return communities.filter((community) => {
      const matchesSearch =
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.latestMessage.text.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === "All" || community.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [communities, searchQuery, selectedCategory])

  const pinnedCommunities = useMemo(
    () => filteredCommunities.filter((c) => c.isPinned),
    [filteredCommunities]
  )

  const otherCommunities = useMemo(
    () => filteredCommunities.filter((c) => !c.isPinned),
    [filteredCommunities]
  )

  return (
    <aside className="flex h-full w-full flex-col border-r border-[#DDDCD0] bg-[#F7F6E8]/70">
      {/* Header */}
      <div className="border-b border-[#DDDCD0] bg-[#F7F6E8] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F2D1F] text-white shadow-sm">
              <Users size={17} />
            </div>

            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-[#171717]">
                Community Hub
              </h1>
              <p className="text-[10px] font-semibold text-[#8A897F]">
                {communities.length} Active Financial Channels
              </p>
            </div>
          </div>

          <span className="flex items-center gap-1 rounded-full bg-[#E8F2EA] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#18794E]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#18794E]" />
            Live
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative mt-3.5">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A897F]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels, topics, messages..."
            className="h-9 w-full rounded-xl border border-[#D8D7CA] bg-white pl-9 pr-3 text-xs font-medium text-[#171717] outline-none transition-all placeholder:text-[#9A998F] focus:border-[#0F2D1F] focus:ring-2 focus:ring-[#0F2D1F]/15"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#8A897F] hover:text-[#171717]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedCategory(tab.value)}
                className={[
                  "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold transition-all duration-200",
                  isSelected
                    ? "bg-[#0F2D1F] text-white shadow-sm"
                    : "bg-white/70 text-[#6B6B63] hover:bg-white hover:text-[#171717]",
                ].join(" ")}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Community Items List */}
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {pinnedCommunities.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 px-3 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#8A897F]">
              <Sparkles size={11} className="text-[#18794E]" />
              Featured Channels
            </div>
            <div className="space-y-1">
              {pinnedCommunities.map((community) => (
                <CommunityItem
                  key={community.id}
                  community={community}
                  isActive={community.id === activeCommunityId}
                  onClick={() => onSelectCommunity(community.id)}
                />
              ))}
            </div>
          </div>
        )}

        {otherCommunities.length > 0 && (
          <div>
            <div className="mb-1.5 px-3 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#8A897F]">
              All Discussions
            </div>
            <div className="space-y-1">
              {otherCommunities.map((community) => (
                <CommunityItem
                  key={community.id}
                  community={community}
                  isActive={community.id === activeCommunityId}
                  onClick={() => onSelectCommunity(community.id)}
                />
              ))}
            </div>
          </div>
        )}

        {filteredCommunities.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F2EA] text-[#0F2D1F]">
              <Search size={20} />
            </div>
            <p className="mt-3 text-xs font-bold text-[#171717]">
              No channels found
            </p>
            <p className="mt-1 text-[10px] text-[#8A897F]">
              Try adjusting your search query or category filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("All")
              }}
              className="mt-3 rounded-lg bg-[#0F2D1F] px-3 py-1.5 text-[10px] font-bold text-white shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
