"use client"

import { useEffect, useMemo, useRef } from "react"
import { Pin, Search, ShieldCheck, Sparkles, X } from "lucide-react"
import { Message } from "./types"
import MessageBubble from "./MessageBubble"

type MessageListProps = {
  messages: Message[]
  onReact: (messageId: string, emoji: string) => void
  onReply?: (message: Message) => void
  searchQuery: string
  showPinnedBanner: boolean
  onClosePinnedBanner: () => void
}

export default function MessageList({
  messages,
  onReact,
  onReply,
  searchQuery,
  showPinnedBanner,
  onClosePinnedBanner,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Filter messages based on chat search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages
    const q = searchQuery.toLowerCase()
    return messages.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q)
    )
  }, [messages, searchQuery])

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; items: Message[] }[] = []
    let currentDate = ""

    filteredMessages.forEach((msg) => {
      if (msg.date !== currentDate) {
        currentDate = msg.date
        groups.push({ date: msg.date, items: [msg] })
      } else {
        groups[groups.length - 1].items.push(msg)
      }
    })

    return groups
  }, [filteredMessages])

  const pinnedMessage = useMemo(
    () => messages.find((m) => m.isPinned),
    [messages]
  )

  // Auto-scroll to bottom on message count change
  useEffect(() => {
    if (!searchQuery) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages.length, searchQuery])

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-[#F7F6E8]/30 px-4 py-4 sm:px-6 sm:py-6">
      {/* Pinned Message Alert Banner */}
      {pinnedMessage && showPinnedBanner && (
        <div className="sticky top-0 z-10 mb-4 rounded-xl border border-[#D5E2D8] bg-white p-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F2EA] text-[#0F2D1F]">
                <Pin size={14} className="rotate-45" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#18794E]">
                    Pinned Announcement
                  </span>
                  <span className="text-[10px] text-[#8A897F]">
                    by {pinnedMessage.senderName}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs font-medium text-[#171717]">
                  {pinnedMessage.content}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClosePinnedBanner}
              className="text-[#8A897F] hover:text-[#171717]"
              title="Dismiss announcement banner"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Security & Moderation Notice */}
      <div className="mx-auto mb-6 flex max-w-md items-center justify-center gap-2 rounded-xl bg-white/70 px-3.5 py-1.5 text-center text-[10px] font-semibold text-[#8A897F] shadow-sm">
        <ShieldCheck size={13} className="text-[#18794E]" />
        <span>End-to-end moderated community. Follow community guidelines.</span>
      </div>

      {/* Grouped Message Stream */}
      {groupedMessages.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-3">
          {/* Date Separator Pill */}
          <div className="my-4 flex items-center justify-center">
            <span className="rounded-md border border-[#DDDCD0] bg-white px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8A897F] shadow-sm">
              {group.date}
            </span>
          </div>

          {/* Messages in this date block */}
          {group.items.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onReact={onReact}
              onReply={onReply}
            />
          ))}
        </div>
      ))}

      {/* Empty Search Result */}
      {filteredMessages.length === 0 && searchQuery && (
        <div className="my-auto flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F2EA] text-[#0F2D1F]">
            <Search size={20} />
          </div>
          <p className="mt-3 text-xs font-bold text-[#171717]">
            No messages matching &ldquo;{searchQuery}&rdquo;
          </p>
          <p className="mt-1 text-[10px] text-[#8A897F]">
            Try searching for another keyword or ticker symbol.
          </p>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  )
}
