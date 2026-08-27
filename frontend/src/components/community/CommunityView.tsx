"use client"

import { useMemo, useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { apiClient } from "../../lib/client"
import { Community, Member, Message } from "./types"
import CommunityList from "./CommunityList"
import ChatHeader from "./ChatHeader"
import MessageList from "./MessageList"
import MessageInput from "./MessageInput"
import CommunityInfo from "./CommunityInfo"

export default function CommunityView() {
  const { token, logout } = useAuth()
  const [communities, setCommunities] = useState<Community[]>([])
  const [activeCommunityId, setActiveCommunityId] = useState<string>("")
  const [messagesState, setMessagesState] = useState<Record<string, Message[]>>({})
  const [membersState] = useState<Record<string, Member[]>>({})
  const [loading, setLoading] = useState(true)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [mobileView, setMobileView] = useState<"list" | "chat">("list")
  const [chatSearchQuery, setChatSearchQuery] = useState("")
  const [isChatSearching, setIsChatSearching] = useState(false)
  const [showPinnedBanner, setShowPinnedBanner] = useState(true)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [mutedChannels, setMutedChannels] = useState<Record<string, boolean>>({})

  // Load communities on mount
  useEffect(() => {
    async function loadCommunities() {
      if (!token) return
      try {
        const res = await apiClient.get("/api/v1/communities", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        setCommunities(res.data)
        if (res.data.length > 0) {
          setActiveCommunityId(res.data[0].slug)
        }
      } catch (err: any) {
        console.error("Error loading communities", err)
        if (err.response?.status === 401) {
          logout()
        }
      } finally {
        setLoading(false)
      }
    }
    loadCommunities()
  }, [token])

  // Establish WS connection and load history on active channel change
  useEffect(() => {
    if (!activeCommunityId || !token) return

    async function loadHistory() {
      try {
        const res = await apiClient.get(`/api/v1/communities/${activeCommunityId}/messages`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        setMessagesState(prev => ({
          ...prev,
          [activeCommunityId]: res.data
        }))
      } catch (err: any) {
        console.error("Error loading messages", err)
        if (err.response?.status === 401) {
          logout()
        }
      }
    }
    loadHistory()

    const baseURL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(/^http/, "ws")
    const wsUrl = `${baseURL}/api/v1/communities/${activeCommunityId}/ws?token=${token}`
    const ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "new_message") {
          const newMsg = data.message
          if (newMsg.communityId === activeCommunityId) {
            setMessagesState(prev => {
              const current = prev[activeCommunityId] || []
              if (current.some(m => m.id === newMsg.id)) {
                return prev
              }
              return {
                ...prev,
                [activeCommunityId]: [...current, newMsg]
              }
            })
          }
        }
      } catch (e) {
        console.error("Error parsing WS event", e)
      }
    }

    ws.onerror = (err) => {
      console.error("WS connection error", err)
    }

    return () => {
      ws.close()
    }
  }, [activeCommunityId, token])

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
  async function handleCreateCommunity(newCommunity: Community) {
    if (!token) return
    try {
      const res = await apiClient.post("/api/v1/communities", {
        name: newCommunity.name,
        category: newCommunity.category,
        description: newCommunity.description,
        icon: newCommunity.icon,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const created = res.data
      setCommunities((prev) => [...prev, created])
      setMessagesState((prev) => ({
        ...prev,
        [created.id]: [],
      }))
      setActiveCommunityId(created.id)
      setMobileView("chat")
      setShowPinnedBanner(false)
    } catch (err) {
      console.error("Error creating community", err)
    }
  }

  // Send new message
  async function handleSendMessage(
    content: string,
    attachments?: { type: "chart" | "image" | "link"; title: string; subtitle: string }[]
  ) {
    if (!content.trim() || !token) return

    const payload = {
      content,
      reply_to_name: replyingTo ? replyingTo.senderName : null,
      reply_to_content: replyingTo ? replyingTo.content : null
    }

    try {
      await apiClient.post(`/api/v1/communities/${activeCommunityId}/messages`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    } catch (err) {
      console.error("Error sending message", err)
    }

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

  if (loading || !activeCommunity) {
    return (
      <div className="flex h-[calc(100vh-140px)] min-h-[580px] w-full items-center justify-center rounded-2xl border border-[#DDDCD0] bg-white">
        <div className="text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0F2D1F] border-t-transparent mx-auto"></div>
          <p className="mt-3 text-[10px] font-extrabold uppercase tracking-wider text-[#8A897F]">Loading channels</p>
        </div>
      </div>
    )
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
