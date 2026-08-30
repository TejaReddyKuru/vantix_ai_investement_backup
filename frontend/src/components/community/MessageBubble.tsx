"use client"

import { useState } from "react"
import {
  BarChart3,
  Check,
  CheckCheck,
  ExternalLink,
  MessageSquare,
  Pin,
  SmilePlus,
  Sparkles,
} from "lucide-react"
import { Message, Reaction } from "./types"

const QUICK_REACTIONS = ["👍", "🚀", "🔥", "📈", "🎯"]

type MessageBubbleProps = {
  message: Message
  onReact: (messageId: string, emoji: string) => void
  onReply?: (message: Message) => void
}

function renderFormattedContent(content: string, isCurrentUser: boolean) {
  // Split on ticker symbols like $BTC, $NVDA, $ETH, $SOL
  const parts = content.split(/(\$[A-Z]{2,6}\b)/g)

  return parts.map((part, index) => {
    if (part.startsWith("$") && part.length >= 3) {
      return (
        <span
          key={index}
          className={[
            "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-extrabold tracking-wide",
            isCurrentUser
              ? "bg-white/20 text-[#D8E9DD]"
              : "bg-[#E8F2EA] text-[#0F2D1F] ring-1 ring-[#18794E]/20",
          ].join(" ")}
        >
          {part}
        </span>
      )
    }
    return <span key={index}>{part}</span>
  })
}

export default function MessageBubble({
  message,
  onReact,
  onReply,
}: MessageBubbleProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const isMe = message.isCurrentUser

  return (
    <div
      className={[
        "group relative flex w-full gap-3 py-1",
        isMe ? "justify-end" : "justify-start",
      ].join(" ")}
    >
      {/* Sender Avatar (Only for other users) */}
      {!isMe && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0F2D1F] text-xs font-extrabold text-white shadow-sm">
          {message.senderAvatar}
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={[
          "relative max-w-[82%] sm:max-w-[70%] md:max-w-[62%]",
          isMe ? "items-end" : "items-start",
        ].join(" ")}
      >
        {/* Sender Info Bar (Only for other users) */}
        {!isMe && (
          <div className="mb-1 flex items-center gap-2 px-1">
            <span className="text-xs font-extrabold text-[#171717]">
              {message.senderName}
            </span>

            {message.senderRole && (
              <span className="rounded-md bg-[#E8F2EA] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-[#18794E]">
                {message.senderRole}
              </span>
            )}

            {message.isPinned && (
              <span className="flex items-center gap-1 rounded-md bg-[#F7F6E8] px-1.5 py-0.5 text-[8px] font-bold text-[#8A897F]">
                <Pin size={10} className="rotate-45 text-[#18794E]" />
                Pinned
              </span>
            )}
          </div>
        )}

        {/* Replying quote snippet if any */}
        {message.replyTo && (
          <div
            className={[
              "mb-1 rounded-xl p-2 text-[10px] leading-4 border-l-2",
              isMe
                ? "bg-white/10 border-white/40 text-white/80"
                : "bg-[#FAFAF7] border-[#0F2D1F] text-[#66665F]",
            ].join(" ")}
          >
            <div className="font-bold">{message.replyTo.senderName}</div>
            <div className="truncate">{message.replyTo.content}</div>
          </div>
        )}

        {/* The Chat Bubble Card */}
        <div
          className={[
            "relative rounded-2xl px-4 py-3 shadow-[0_2px_8px_rgba(15,45,31,0.04)] transition-all",
            isMe
              ? "rounded-tr-sm bg-[#0F2D1F] text-[#F4F3EE]"
              : "rounded-tl-sm border border-[#E2E1D5] bg-white text-[#171717]",
          ].join(" ")}
        >
          {/* Message Text */}
          <div className="text-[13px] leading-relaxed break-words font-medium">
            {renderFormattedContent(message.content, isMe)}
          </div>

          {/* Attachment Preview (e.g. Chart Signal Snapshot) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2.5 space-y-2">
              {message.attachments.map((att, i) => (
                <div
                  key={i}
                  className={[
                    "flex items-center gap-3 rounded-xl p-2.5 transition-colors",
                    isMe
                      ? "bg-white/10 text-white"
                      : "border border-[#DCE7DE] bg-[#FAFAF7] text-[#171717]",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      isMe ? "bg-white/20 text-[#D8E9DD]" : "bg-[#E8F2EA] text-[#0F2D1F]",
                    ].join(" ")}
                  >
                    <BarChart3 size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-extrabold">{att.title}</div>
                    <div
                      className={[
                        "truncate text-[10px]",
                        isMe ? "text-white/70" : "text-[#8A897F]",
                      ].join(" ")}
                    >
                      {att.subtitle}
                    </div>
                  </div>

                  <span className="rounded-md bg-black/10 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wide">
                    Live
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Timestamp & Status Indicator */}
          <div
            className={[
              "mt-1.5 flex items-center justify-end gap-1.5 text-[9px] font-semibold",
              isMe ? "text-white/60" : "text-[#9A998F]",
            ].join(" ")}
          >
            <span>{message.timestamp}</span>
            {isMe && <CheckCheck size={13} className="text-[#A8D2B5]" />}
          </div>
        </div>

        {/* Reaction Badges Below Bubble */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={[
              "mt-1 flex flex-wrap gap-1",
              isMe ? "justify-end" : "justify-start",
            ].join(" ")}
          >
            {message.reactions.map((reaction, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onReact(message.id, reaction.emoji)}
                className={[
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold transition-all hover:scale-105",
                  reaction.hasReacted
                    ? "border-[#0F2D1F] bg-[#E8F2EA] text-[#0F2D1F] shadow-sm"
                    : "border-[#E2E1D5] bg-white text-[#55554E] hover:bg-[#FAFAF7]",
                ].join(" ")}
              >
                <span>{reaction.emoji}</span>
                <span className="text-[9px] tabular-nums font-extrabold">
                  {reaction.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Hover Action Bar: Quick Reactions & Reply */}
        <div
          className={[
            "absolute top-0 hidden items-center gap-1 rounded-xl border border-[#DDDCD0] bg-white p-1 shadow-md group-hover:flex z-10",
            isMe ? "right-full mr-2" : "left-full ml-2",
          ].join(" ")}
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(message.id, emoji)}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-xs transition-transform hover:scale-125 hover:bg-[#E8F2EA]"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}

          {onReply && (
            <button
              type="button"
              onClick={() => onReply(message)}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-[#55554E] hover:bg-[#E8F2EA] hover:text-[#0F2D1F]"
              title="Reply"
            >
              <MessageSquare size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
