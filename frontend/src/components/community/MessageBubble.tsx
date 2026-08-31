"use client";

import { useState } from "react";
import {
  BarChart3,
  Bookmark,
  CheckCheck,
  CornerDownRight,
  Flag,
  Heart,
  MessageSquare,
  Pin,
  Share2,
  SmilePlus,
  Sparkles,
  ThumbsUp,
  UserCheck,
} from "lucide-react";
import { Message } from "./types";

const QUICK_REACTIONS = ["👍", "🚀", "🔥", "📈", "🎯"];

type MessageBubbleProps = {
  message: Message;
  onReact: (messageId: string, emoji: string) => void;
  onReply?: (message: Message) => void;
  onBookmark?: (messageId: string) => void;
  onShare?: (message: Message) => void;
};

function renderFormattedContent(content: string, isCurrentUser: boolean) {
  // Highlight tickers like $BTC, $ETH, $NVDA, $SOL
  const parts = content.split(/(\$[A-Z]{2,6}\b)/g);

  return parts.map((part, index) => {
    if (part.startsWith("$") && part.length >= 3) {
      return (
        <span
          key={index}
          className={[
            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-black tracking-wide mx-0.5",
            isCurrentUser
              ? "bg-white/20 text-[#38BDF8] border border-white/20"
              : "bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30",
          ].join(" ")}
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export default function MessageBubble({
  message,
  onReact,
  onReply,
  onBookmark,
  onShare,
}: MessageBubbleProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const isMe = message.isCurrentUser;

  const handleShare = () => {
    if (onShare) {
      onShare(message);
    } else {
      navigator.clipboard.writeText(`VANTIX Trader Insight from ${message.senderName}: "${message.content}"`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    if (onBookmark) {
      onBookmark(message.id);
    }
  };

  return (
    <div
      className={[
        "group relative flex w-full gap-3 py-1.5",
        isMe ? "justify-end" : "justify-start",
      ].join(" ")}
    >
      {/* Sender Avatar */}
      {!isMe && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2F78B7] to-[#15466C] text-xs font-black text-white shadow-md border border-white/10 mt-0.5">
          {message.senderAvatar || message.senderName?.slice(0, 2).toUpperCase() || "VX"}
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={[
          "relative max-w-[85%] sm:max-w-[72%] md:max-w-[65%]",
          isMe ? "items-end" : "items-start",
        ].join(" ")}
      >
        {/* Sender Info Bar */}
        {!isMe && (
          <div className="mb-1.5 flex items-center gap-2 px-1">
            <span className="text-[12.5px] font-black text-white">
              {message.senderName}
            </span>

            {message.senderRole && (
              <span className="rounded-md bg-[#70C891]/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#70C891] border border-[#70C891]/30">
                {message.senderRole}
              </span>
            )}

            {message.isPinned && (
              <span className="flex items-center gap-1 rounded-md bg-[#F59E0B]/20 px-1.5 py-0.5 text-[9px] font-black text-[#F59E0B] border border-[#F59E0B]/30">
                <Pin size={10} className="rotate-45" />
                Pinned
              </span>
            )}
          </div>
        )}

        {/* Replying quote snippet if any */}
        {message.replyTo && (
          <div
            className={[
              "mb-1.5 rounded-xl p-2.5 text-[11px] leading-relaxed border-l-3 flex items-start gap-2",
              isMe
                ? "bg-white/10 border-[#38BDF8] text-white/80"
                : "bg-black/30 border-[#2F78B7] text-white/70",
            ].join(" ")}
          >
            <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-[#38BDF8] mt-0.5" />
            <div className="min-w-0">
              <div className="font-extrabold text-[#38BDF8]">{message.replyTo.senderName}</div>
              <div className="truncate text-white/60">{message.replyTo.content}</div>
            </div>
          </div>
        )}

        {/* Chat Bubble Card */}
        <div
          className={[
            "relative rounded-2xl px-4 py-3.5 shadow-lg backdrop-blur-md transition-all border",
            isMe
              ? "rounded-tr-sm bg-gradient-to-br from-[#1E6091] to-[#15466C] text-white border-white/20"
              : "rounded-tl-sm bg-[#0C1726] text-[#F1F5F9] border-white/10",
          ].join(" ")}
        >
          {/* Message Text */}
          <div className="text-[13px] leading-relaxed break-words font-medium">
            {renderFormattedContent(message.content, isMe)}
          </div>

          {/* Attachment Preview (e.g. Chart Signal Snapshot) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map((att, i) => (
                <div
                  key={i}
                  className={[
                    "flex items-center gap-3 rounded-xl p-2.5 transition-colors border",
                    isMe
                      ? "bg-white/10 text-white border-white/20"
                      : "bg-black/40 text-white border-white/10",
                  ].join(" ")}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2F78B7]/30 text-[#38BDF8]">
                    <BarChart3 size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-black">{att.title}</div>
                    <div className="truncate text-[10.5px] text-white/60">{att.subtitle}</div>
                  </div>

                  <span className="rounded-md bg-[#70C891]/20 px-2 py-0.5 text-[9px] font-black uppercase text-[#70C891] border border-[#70C891]/30">
                    Live Data
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Timestamp & Status Indicator */}
          <div
            className={[
              "mt-2 flex items-center justify-between gap-1.5 text-[10px] font-bold border-t border-white/10 pt-1.5",
              isMe ? "text-white/60" : "text-white/40",
            ].join(" ")}
          >
            <div className="flex items-center gap-2">
              <span>{message.timestamp}</span>
              {isBookmarked && (
                <span className="flex items-center gap-0.5 text-[#F59E0B]">
                  <Bookmark className="h-3 w-3 fill-[#F59E0B]" />
                  <span>Saved</span>
                </span>
              )}
            </div>
            {isMe && <CheckCheck size={13} className="text-[#70C891]" />}
          </div>
        </div>

        {/* Reaction Badges Below Bubble */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={[
              "mt-1.5 flex flex-wrap gap-1.5",
              isMe ? "justify-end" : "justify-start",
            ].join(" ")}
          >
            {message.reactions.map((reaction, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onReact(message.id, reaction.emoji)}
                className={[
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-all hover:scale-105",
                  reaction.hasReacted
                    ? "border-[#38BDF8] bg-[#38BDF8]/20 text-[#38BDF8] shadow-sm"
                    : "border-white/15 bg-black/40 text-white/80 hover:bg-white/10",
                ].join(" ")}
              >
                <span>{reaction.emoji}</span>
                <span className="text-[10px] tabular-nums font-black">
                  {reaction.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Action Bar: Reactions, Reply, Share, Bookmark */}
        <div
          className={[
            "absolute top-0 hidden items-center gap-1 rounded-xl border border-white/15 bg-[#0C1726] p-1 shadow-2xl group-hover:flex z-20 backdrop-blur-lg",
            isMe ? "right-full mr-2" : "left-full ml-2",
          ].join(" ")}
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(message.id, emoji)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-xs transition-transform hover:scale-125 hover:bg-white/10"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}

          <div className="h-4 w-px bg-white/15 mx-0.5" />

          {onReply && (
            <button
              type="button"
              onClick={() => onReply(message)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
              title="Reply to post"
            >
              <MessageSquare size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={toggleBookmark}
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              isBookmarked ? "text-[#F59E0B] bg-[#F59E0B]/20" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
            title="Bookmark post"
          >
            <Bookmark size={13} className={isBookmarked ? "fill-[#F59E0B]" : ""} />
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
            title={copiedShare ? "Copied link!" : "Share insight"}
          >
            <Share2 size={13} />
          </button>

          <button
            type="button"
            onClick={() => alert("Report submitted to community moderation.")}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-red-500/20 hover:text-red-400"
            title="Report post"
          >
            <Flag size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
