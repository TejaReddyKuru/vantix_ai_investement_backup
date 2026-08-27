"use client"

import { useMemo, useState } from "react"
import {
  INITIAL_COMMUNITIES,
  INITIAL_MEMBERS,
  INITIAL_MESSAGES,
} from "./mockData"
import { Community, Member, Message } from "./types"
import CommunityList from "./CommunityList"
import ChatHeader from "./ChatHeader"
import MessageList from "./MessageList"
import MessageInput from "./MessageInput"
import CommunityInfo from "./CommunityInfo"

export default function CommunityView() {
  const [communities, setCommunities] = useState<Community[]>(INITIAL_COMMUNITIES)
  const [activeCommunityId, setActiveCommunityId] = useState<string>("general-discussion")
  const [messagesState, setMessagesState] = useState<Record<string, Message[]>>(INITIAL_MESSAGES)
  const [membersState] = useState<Record<string, Member[]>>(INITIAL_MEMBERS)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [mobileView, setMobileView] = useState<"list" | "chat">("list")
  const [chatSearchQuery, setChatSearchQuery] = useState("")
  const [isChatSearching, setIsChatSearching] = useState(false)
  const [showPinnedBanner, setShowPinnedBanner] = useState(true)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [mutedChannels, setMutedChannels] = useState<Record<string, boolean>>({})

  // Active community details
  const activeCommunity = useMemo(() => {
    return (
      communities.find((c) => c.id === activeCommunityId) || communities[0]
    )
  }, [communities, activeCommunityId])

  // Active messages list
  const currentMessages = useMemo(() => {
    return messagesState[activeCommunityId] || []
  }, [messagesState, activeCommunityId])

  // Active community members
  const currentMembers = useMemo(() => {
    return (
      membersState[activeCommunityId] ||
      membersState["general-discussion"] ||
      []
    )
  }, [membersState, activeCommunityId])

  // Has pinned message
  const hasPinnedMessage = useMemo(() => {
    return currentMessages.some((m) => m.isPinned)
  }, [currentMessages])

  // Select community
  function handleSelectCommunity(id: string) {
    setActiveCommunityId(id)
    setMobileView("chat")
    setReplyingTo(null)
    setChatSearchQuery("")
    setIsChatSearching(false)
    setShowPinnedBanner(true)

    // Mark as read in local state
    setCommunities((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    )
  }

  // Create new community
  function handleCreateCommunity(newCommunity: Community) {
    setCommunities((prev) => [...prev, newCommunity])
    // Initialize empty message list for the new channel
    setMessagesState((prev) => ({
      ...prev,
      [newCommunity.id]: [],
    }))
    // Auto-navigate to the new channel
    setActiveCommunityId(newCommunity.id)
    setMobileView("chat")
    setShowPinnedBanner(false)
  }

  // Send new message
  function handleSendMessage(
    content: string,
    attachments?: { type: "chart" | "image" | "link"; title: string; subtitle: string }[]
  ) {
    const now = new Date()
    const timeString = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      communityId: activeCommunityId,
      senderId: "u_self",
      senderName: "Vish Sai (You)",
      senderAvatar: "VS",
      senderRole: "Admin",
      content,
      timestamp: timeString,
      date: "Today",
      isCurrentUser: true,
      reactions: [],
      attachments,
      replyTo: replyingTo
        ? {
            senderName: replyingTo.senderName,
            content: replyingTo.content,
          }
        : undefined,
    }

    setMessagesState((prev) => ({
      ...prev,
      [activeCommunityId]: [...(prev[activeCommunityId] || []), newMessage],
    }))

    // Update community latest preview
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === activeCommunityId
          ? {
              ...c,
              latestMessage: {
                text: content,
                senderName: "You",
                time: timeString,
              },
            }
          : c
      )
    )

    setReplyingTo(null)
  }

  // Toggle emoji reaction
  function handleReact(messageId: string, emoji: string) {
    setMessagesState((prev) => {
      const channelMessages = prev[activeCommunityId] || []
      const updated = channelMessages.map((msg) => {
        if (msg.id !== messageId) return msg

        const existingReactionIndex = msg.reactions.findIndex(
          (r) => r.emoji === emoji
        )

        let newReactions = [...msg.reactions]

        if (existingReactionIndex >= 0) {
          const current = newReactions[existingReactionIndex]
          if (current.hasReacted) {
            // Un-react
            if (current.count <= 1) {
              newReactions.splice(existingReactionIndex, 1)
            } else {
              newReactions[existingReactionIndex] = {
                ...current,
                count: current.count - 1,
                hasReacted: false,
              }
            }
          } else {
            // Up-vote
            newReactions[existingReactionIndex] = {
              ...current,
              count: current.count + 1,
              hasReacted: true,
            }
          }
        } else {
          // Add new reaction
          newReactions.push({
            emoji,
            count: 1,
            hasReacted: true,
          })
        }

        return {
          ...msg,
          reactions: newReactions,
        }
      })

      return {
        ...prev,
        [activeCommunityId]: updated,
      }
    })
  }

  // Toggle channel mute
  function handleToggleMute() {
    setMutedChannels((prev) => ({
      ...prev,
      [activeCommunityId]: !prev[activeCommunityId],
    }))
  }

  return (
    <div className="relative flex h-[calc(100vh-140px)] min-h-[580px] w-full overflow-hidden rounded-2xl border border-[#DDDCD0] bg-white shadow-[0_8px_30px_rgba(23,23,23,0.03)]">
      {/* 1. LEFT PANE: Community / Channels List */}
      <div
        className={[
          "h-full w-full md:w-[320px] lg:w-[340px] xl:w-[360px] shrink-0",
          mobileView === "list" ? "block" : "hidden md:block",
        ].join(" ")}
      >
        <CommunityList
          communities={communities}
          activeCommunityId={activeCommunityId}
          onSelectCommunity={handleSelectCommunity}
          onCreateCommunity={handleCreateCommunity}
        />
      </div>

      {/* 2. MIDDLE PANE: Active Chat Conversation */}
      <div
        className={[
          "flex h-full min-w-0 flex-1 flex-col bg-white",
          mobileView === "chat" ? "flex" : "hidden md:flex",
        ].join(" ")}
      >
        <ChatHeader
          community={activeCommunity}
          isInfoOpen={isInfoOpen}
          onToggleInfo={() => setIsInfoOpen((prev) => !prev)}
          onBack={() => setMobileView("list")}
          chatSearchQuery={chatSearchQuery}
          onChatSearchChange={setChatSearchQuery}
          isChatSearching={isChatSearching}
          onToggleChatSearch={() => {
            setIsChatSearching((prev) => !prev)
            setChatSearchQuery("")
          }}
          isMuted={Boolean(mutedChannels[activeCommunityId])}
          onToggleMute={handleToggleMute}
          hasPinnedMessage={hasPinnedMessage}
          showPinnedBanner={showPinnedBanner}
          onTogglePinnedBanner={() => setShowPinnedBanner((prev) => !prev)}
        />

        <MessageList
          messages={currentMessages}
          onReact={handleReact}
          onReply={(msg) => setReplyingTo(msg)}
          searchQuery={chatSearchQuery}
          showPinnedBanner={showPinnedBanner}
          onClosePinnedBanner={() => setShowPinnedBanner(false)}
        />

        <MessageInput
          communityName={activeCommunity.name}
          onSendMessage={handleSendMessage}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>

      {/* 3. RIGHT PANE: Community Info Details */}
      {isInfoOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[340px] md:relative md:inset-auto md:w-[320px] lg:w-[340px] shrink-0 shadow-xl md:shadow-none animate-in slide-in-from-right-4 duration-200">
          <CommunityInfo
            community={activeCommunity}
            members={currentMembers}
            onClose={() => setIsInfoOpen(false)}
            isMuted={Boolean(mutedChannels[activeCommunityId])}
            onToggleMute={handleToggleMute}
          />
        </div>
      )}
    </div>
  )
}
