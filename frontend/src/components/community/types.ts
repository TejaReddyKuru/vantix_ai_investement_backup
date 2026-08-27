export type CommunityCategory =
  | "All"
  | "General"
  | "Beginners"
  | "Stocks"
  | "Crypto"
  | "News"
  | "Strategies"
  | "Portfolio"

export type MemberRole = "Admin" | "Moderator" | "Pro Analyst" | "Top Contributor" | "Member"

export type Member = {
  id: string
  name: string
  handle: string
  avatar: string
  role: MemberRole
  isOnline: boolean
  badgeColor?: string
  joinedDate: string
}

export type CommunityRule = {
  id: number
  title: string
  description: string
}

export type Attachment = {
  type: "chart" | "image" | "link"
  url?: string
  title?: string
  subtitle?: string
}

export type Reaction = {
  emoji: string
  count: number
  hasReacted: boolean
}

export type Message = {
  id: string
  communityId: string
  senderId: string
  senderName: string
  senderAvatar: string
  senderRole?: MemberRole
  content: string
  timestamp: string
  date: string
  isCurrentUser: boolean
  reactions: Reaction[]
  attachments?: Attachment[]
  isPinned?: boolean
  replyTo?: {
    senderName: string
    content: string
  }
}

export type Community = {
  id: string
  name: string
  slug: string
  category: CommunityCategory
  description: string
  icon: string
  avatarBg: string
  iconColor: string
  memberCount: number
  onlineCount: number
  unreadCount: number
  latestMessage: {
    text: string
    senderName: string
    time: string
  }
  rules: CommunityRule[]
  moderators: string[]
  isPinned?: boolean
  isMuted?: boolean
}
