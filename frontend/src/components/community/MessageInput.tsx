"use client"

import { useEffect, useRef, useState } from "react"
import {
  BarChart2,
  FileUp,
  Image as ImageIcon,
  Paperclip,
  Send,
  Smile,
  Sparkles,
  X,
} from "lucide-react"
import { Message } from "./types"

type MessageInputProps = {
  onSendMessage: (
    content: string,
    attachments?: { type: "chart" | "image" | "link"; title: string; subtitle: string }[]
  ) => void
  communityName: string
  replyingTo?: Message | null
  onCancelReply?: () => void
}

const EMOJIS = ["👍", "🚀", "🔥", "📈", "🎯", "🧠", "🤝", "⚡", "💎", "📊", "💡", "👏"]

export default function MessageInput({
  onSendMessage,
  communityName,
  replyingTo,
  onCancelReply,
}: MessageInputProps) {
  const [text, setText] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    if (!text.trim()) return

    onSendMessage(text.trim())
    setText("")
    setShowEmojiPicker(false)
    setShowAttachMenu(false)

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInsertEmoji(emoji: string) {
    setText((prev) => prev + emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  function handleAttachChart() {
    onSendMessage(text.trim() || `Sharing latest technical analysis for #${communityName}`, [
      {
        type: "chart",
        title: `${communityName} — Market Analysis Chart`,
        subtitle: "Technical structure & key support zones",
      },
    ])
    setText("")
    setShowAttachMenu(false)
  }

  function handleAutoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  return (
    <div className="relative border-t border-[#DDDCD0] bg-white p-3 sm:p-4">
      {/* Replying Banner */}
      {replyingTo && (
        <div className="mb-2.5 flex items-center justify-between rounded-xl border border-[#D5E2D8] bg-[#E8F2EA]/70 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#0F2D1F]">
              Replying to {replyingTo.senderName}:
            </span>
            <span className="line-clamp-1 text-[#607367]">
              {replyingTo.content}
            </span>
          </div>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="text-[#8A897F] hover:text-[#171717]"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-4 mb-2 z-30 flex flex-wrap gap-1.5 rounded-2xl border border-[#DDDCD0] bg-white p-3 shadow-xl sm:w-72">
          <div className="mb-1 w-full text-[10px] font-extrabold uppercase tracking-wider text-[#8A897F]">
            Quick Emojis
          </div>
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleInsertEmoji(emoji)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-transform hover:scale-125 hover:bg-[#E8F2EA]"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Attachment Menu Popover */}
      {showAttachMenu && (
        <div className="absolute bottom-full left-12 mb-2 z-30 w-56 rounded-2xl border border-[#DDDCD0] bg-white p-2 shadow-xl">
          <div className="px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-[#8A897F]">
            Share to #{communityName}
          </div>
          <button
            type="button"
            onClick={handleAttachChart}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-[#171717] transition-colors hover:bg-[#E8F2EA] hover:text-[#0F2D1F]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0F2D1F] text-white">
              <BarChart2 size={14} />
            </div>
            <span>Attach Chart Snapshot</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setText((prev) => prev + " [Analysis Attached] ")
              setShowAttachMenu(false)
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-[#171717] transition-colors hover:bg-[#E8F2EA] hover:text-[#0F2D1F]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#18794E] text-white">
              <ImageIcon size={14} />
            </div>
            <span>Attach Image</span>
          </button>
        </div>
      )}

      {/* Main Composer Box */}
      <div className="flex items-end gap-2 rounded-2xl border border-[#DDDCD0] bg-[#FAFAF7] p-1.5 focus-within:border-[#0F2D1F] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0F2D1F]/10">
        {/* Attachment Toggle */}
        <button
          type="button"
          onClick={() => {
            setShowAttachMenu((prev) => !prev)
            setShowEmojiPicker(false)
          }}
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
            showAttachMenu
              ? "bg-[#0F2D1F] text-white"
              : "text-[#66665F] hover:bg-[#E8F2EA] hover:text-[#0F2D1F]",
          ].join(" ")}
          title="Attach chart or media"
        >
          <Paperclip size={17} />
        </button>

        {/* Emoji Toggle */}
        <button
          type="button"
          onClick={() => {
            setShowEmojiPicker((prev) => !prev)
            setShowAttachMenu(false)
          }}
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
            showEmojiPicker
              ? "bg-[#0F2D1F] text-white"
              : "text-[#66665F] hover:bg-[#E8F2EA] hover:text-[#0F2D1F]",
          ].join(" ")}
          title="Insert reaction"
        >
          <Smile size={17} />
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleAutoResize}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${communityName}... (Press Enter to send)`}
          className="max-h-32 min-h-[36px] w-full resize-none bg-transparent px-2 py-2 text-xs font-medium text-[#171717] outline-none placeholder:text-[#9A998F]"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
            text.trim()
              ? "bg-[#0F2D1F] text-white shadow-[0_4px_12px_rgba(15,45,31,0.2)] hover:scale-105 active:scale-95"
              : "bg-[#E5E5DC] text-[#9A998F] cursor-not-allowed",
          ].join(" ")}
          title="Send message"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
