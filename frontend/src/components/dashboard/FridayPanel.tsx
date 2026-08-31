"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowUp,
  Bot,
  Bookmark,
  Check,
  Clock,
  Copy,
  Edit2,
  History,
  Pencil,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";
import { useWorkspace } from "./WorkspaceContext";
import { useMarketSnapshot } from "@/hooks/useMarketSnapshot";
import { useUnifiedAnalysis } from "@/hooks/useTerminalAccount";
import { backendError } from "@/hooks/useWorkspaceData";
import { type MarketCoin } from "@/lib/market-data";
import { terminalSymbolForId } from "@/lib/asset-directory";
import { otherMentionedAsset, questionIntent, type EvidenceIntent } from "@/lib/agent-evidence";
import { type Unified } from "@/lib/terminal-account";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/client";
import AHNAHologram from "@/components/ahna/AHNAHologram";
import type { AHNAAnalysisResponse } from "@/lib/ahna-types";
import "./ahna-chat-v2.css";

export interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  intent?: EvidenceIntent;
  data?: Unified;
  coin?: MarketCoin;
  symbol: string;
  structuredAnalysis?: AHNAAnalysisResponse;
  pinned?: boolean;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  symbol: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  messages: Message[];
}

const STORAGE_KEY = "vantix_ahna_chat_sessions_v2";

const QUICK_PROMPTS = [
  "Current market sentiment",
  "Evaluate trade setup & risk",
  "Summarize breaking catalysts",
  "Key support & resistance levels",
];

// Formats raw text into structured headings, bullets, and highlights
function FormattedAiResponse({ content }: { content: string }) {
  const lines = content.split("\n").filter((l) => l.trim().length > 0);

  return (
    <div className="cc-ai-formatted-body">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Check if it's a decision header
        if (trimmed.startsWith("Decision:")) {
          const isBuy = trimmed.includes("BUY");
          const isSell = trimmed.includes("SELL");
          return (
            <div key={idx} className="cc-ai-header">
              <span>{trimmed}</span>
              <span
                className={`cc-ai-badge ${
                  isBuy ? "buy" : isSell ? "sell" : "wait"
                }`}
              >
                {isBuy ? "BUY SIGNAL" : isSell ? "SELL SIGNAL" : "WAIT / MONITOR"}
              </span>
            </div>
          );
        }

        // Bullet points
        if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
          const itemText = trimmed.replace(/^[•\-*]\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-2 text-[12.5px] text-white/85">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#38BDF8]" />
              <span>{itemText}</span>
            </div>
          );
        }

        // Numbered list items
        if (/^\d+\./.test(trimmed)) {
          return (
            <div key={idx} className="flex items-start gap-2 text-[12.5px] text-white/85">
              <span className="font-bold text-[#FFEA93]">{trimmed.slice(0, 2)}</span>
              <span>{trimmed.slice(2).trim()}</span>
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-[13px] leading-relaxed text-white/90">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default function FridayPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mobile, setMobile] = useState(false);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [filterPinnedOnly, setFilterPinnedOnly] = useState(false);

  // Editing state for user messages
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");

  // Multi-session state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");

  const { activeSymbol, activeCoinId, setLatestAhnaAnalysis } = useWorkspace();
  const connected = Boolean(activeCoinId && terminalSymbolForId(activeCoinId));
  const market = useMarketSnapshot(open);
  const analysis = useUnifiedAnalysis(`${activeSymbol}USDT`, "1h", false, open && connected);
  const analysisData = connected ? analysis.data : undefined;
  const coin = market.data?.coins.find((c) => c.id === activeCoinId);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { token } = useAuth();

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to load AHNA chat history:", e);
    }

    // Default initial session
    const initialSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: `${activeSymbol} Research Session`,
      symbol: activeSymbol,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      messages: [],
    };
    setSessions([initialSession]);
    setCurrentSessionId(initialSession.id);
  }, []);

  // Save sessions to localStorage on update
  useEffect(() => {
    if (sessions.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      } catch (e) {
        console.warn("Failed to persist AHNA chat history:", e);
      }
    }
  }, [sessions]);

  // Current session & messages
  const activeSession = sessions.find((s) => s.id === currentSessionId) ?? sessions[0];
  const currentMessages = activeSession?.messages ?? [];

  useEffect(() => {
    const media = matchMedia("(max-width: 767px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Auto-scroll on new messages or loading state
  useEffect(() => {
    if (currentMessages.length || isLoading) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages.length, isLoading]);

  const updateCurrentMessages = (newMessages: Message[], newTitle?: string) => {
    setSessions((old) =>
      old.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            title: newTitle || (s.messages.length === 0 && newMessages.length > 0 ? newMessages[0].content.slice(0, 36) : s.title),
            messages: newMessages,
            updatedAt: Date.now(),
          };
        }
        return s;
      })
    );
  };

  // Start New Chat Session
  const createNewChat = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: `${activeSymbol} Market Inquiry`,
      symbol: activeSymbol,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      messages: [],
    };
    setSessions((old) => [newSession, ...old]);
    setCurrentSessionId(newSession.id);
    setShowHistory(false);
    setFilterPinnedOnly(false);
  };

  // Toggle Session Pin
  const toggleSessionPin = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((old) =>
      old.map((s) => (s.id === sessionId ? { ...s, pinned: !s.pinned } : s))
    );
  };

  // Delete Individual Session
  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = sessions.filter((s) => s.id !== sessionId);
    if (remaining.length === 0) {
      const fresh: ChatSession = {
        id: `session_${Date.now()}`,
        title: `${activeSymbol} Research Session`,
        symbol: activeSymbol,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pinned: false,
        messages: [],
      };
      setSessions([fresh]);
      setCurrentSessionId(fresh.id);
    } else {
      setSessions(remaining);
      if (currentSessionId === sessionId) {
        setCurrentSessionId(remaining[0].id);
      }
    }
  };

  // Clear All Sessions History
  const clearAllHistory = () => {
    if (confirm("Are you sure you want to clear all chat history?")) {
      const fresh: ChatSession = {
        id: `session_${Date.now()}`,
        title: `${activeSymbol} Research Session`,
        symbol: activeSymbol,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pinned: false,
        messages: [],
      };
      setSessions([fresh]);
      setCurrentSessionId(fresh.id);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Toggle Pin on Individual Message
  const toggleMessagePin = (messageId: number) => {
    const updated = currentMessages.map((m) =>
      m.id === messageId ? { ...m, pinned: !m.pinned } : m
    );
    updateCurrentMessages(updated);
  };

  // Delete Individual Message
  const deleteMessage = (messageId: number) => {
    const updated = currentMessages.filter((m) => m.id !== messageId);
    updateCurrentMessages(updated);
  };

  // Start Editing a User Message
  const startEditing = (msg: Message) => {
    setEditingMsgId(msg.id);
    setEditDraft(msg.content);
  };

  // Save Edited User Message and Re-trigger AI analysis
  const saveAndReask = async (msgId: number) => {
    if (!editDraft.trim() || isLoading) return;
    const updatedText = editDraft.trim().slice(0, 1500);

    // Update user message content
    const updated = currentMessages.map((m) =>
      m.id === msgId ? { ...m, content: updatedText } : m
    );
    updateCurrentMessages(updated);
    setEditingMsgId(null);

    // Re-ask
    await ask(updatedText, true);
  };

  const copyToClipboard = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  async function ask(question: string, isReask = false) {
    if (!question.trim() || isLoading) return;
    const cleanQuestion = question.trim().slice(0, 1500);

    const userMsgId = Date.now();
    const assistantMsgId = userMsgId + 1;

    let updatedMessages = currentMessages;
    if (!isReask) {
      updatedMessages = [
        ...currentMessages,
        {
          id: userMsgId,
          role: "user",
          content: cleanQuestion,
          symbol: activeSymbol,
          timestamp: Date.now(),
        },
      ];
      updateCurrentMessages(updatedMessages);
    }

    setDraft("");
    setIsLoading(true);

    const otherAsset = otherMentionedAsset(cleanQuestion, activeSymbol);
    const intent = !connected || otherAsset ? "unsupported" : questionIntent(cleanQuestion);

    if (!connected) {
      setIsLoading(false);
      updateCurrentMessages([
        ...updatedMessages,
        {
          id: assistantMsgId,
          role: "assistant",
          content: `Agent analysis for ${activeSymbol} is not connected yet. Please select an active market pair in the workspace.`,
          intent,
          symbol: activeSymbol,
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    if (otherAsset) {
      setIsLoading(false);
      updateCurrentMessages([
        ...updatedMessages,
        {
          id: assistantMsgId,
          role: "assistant",
          content: `This terminal is currently focused on ${activeSymbol}. Switch active symbol to ${otherAsset.symbol} to analyze its data.`,
          intent,
          symbol: activeSymbol,
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    try {
      const response = await apiClient.post(
        "/api/v1/ahna/analyze",
        { symbol: activeSymbol, question: cleanQuestion },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;
      if (setLatestAhnaAnalysis && data) {
        setLatestAhnaAnalysis(activeSymbol, data);
      }

      let aiReply = "Analysis completed.";
      if (data.summary) {
        aiReply = `${data.summary}\n\nDecision: ${data.decision} (${Math.round(data.confidence)}%)\n\n` +
          (data.reasoning || []).map((r: string) => `• ${r}`).join("\n");
      }

      updateCurrentMessages([
        ...updatedMessages,
        {
          id: assistantMsgId,
          role: "assistant",
          content: aiReply,
          intent,
          data: analysisData,
          coin,
          symbol: activeSymbol,
          structuredAnalysis: data,
          timestamp: Date.now(),
        },
      ]);
    } catch (e) {
      console.error("AHNA Error:", e);
      updateCurrentMessages([
        ...updatedMessages,
        {
          id: assistantMsgId,
          role: "assistant",
          content: "Analysis pipeline failed to complete. Please ensure backend services are connected.",
          intent,
          symbol: activeSymbol,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function simplifyReply(id: number, text: string) {
    setIsLoading(true);
    try {
      const response = await apiClient.post(
        "/api/v1/ahna/analyze",
        { symbol: activeSymbol, question: `Explain this very simply in 2 sentences: ${text}`.slice(0, 1500) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data;
      const simplifiedText = data.summary
        ? `${data.summary}\n\nDecision: ${data.decision} (${Math.round(data.confidence)}%)\n\n` +
          (data.reasoning || []).map((r: string) => `• ${r}`).join("\n")
        : "Simplification completed.";

      const updated = currentMessages.map((m) =>
        m.id === id
          ? { ...m, content: simplifiedText, structuredAnalysis: data }
          : m
      );
      updateCurrentMessages(updated);
    } catch (e) {
      console.error("AHNA Simplification Error:", e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void ask(draft);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(draft);
  };

  // Filtered messages (e.g. pinned only)
  const displayedMessages = filterPinnedOnly
    ? currentMessages.filter((m) => m.pinned)
    : currentMessages;

  // Filtered sessions for History Drawer
  const filteredSessions = sessions
    .filter((s) => {
      if (!historySearch.trim()) return true;
      const q = historySearch.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.symbol.toLowerCase().includes(q);
    })
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);

  const pinnedCount = currentMessages.filter((m) => m.pinned).length;

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()} modal={mobile}>
      <Dialog.Portal>
        {mobile && <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />}
        <Dialog.Content
          id="cc-ahna-panel"
          className="cc-ahna-chat-modal"
          onInteractOutside={(e) => !mobile && e.preventDefault()}
        >
          {/* Header */}
          <div className="cc-chat-header">
            <div className="cc-chat-header-brand">
              <span className="cc-chat-avatar-lg">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="cc-chat-brand-meta">
                <Dialog.Title className="flex items-center gap-2">
                  <span>AHNA Copilot</span>
                  <span className="cc-chat-online-pill">
                    <span className="cc-chat-online-dot" />
                    Online
                  </span>
                </Dialog.Title>
                <p>Multi-Agent Financial Intelligence</p>
              </div>
            </div>

            <div className="cc-chat-header-actions">
              <button
                type="button"
                className="cc-chat-action-btn"
                onClick={createNewChat}
                title="New chat session"
              >
                <Plus className="h-4 w-4" />
              </button>

              <button
                type="button"
                className={`cc-chat-action-btn ${showHistory ? "active" : ""}`}
                onClick={() => setShowHistory(!showHistory)}
                title="View chat history"
              >
                <History className="h-4 w-4" />
              </button>

              <Dialog.Close className="cc-chat-action-btn" title="Close">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
          </div>

          {/* Context Sub-Bar */}
          <div className="cc-chat-context-bar">
            <div className="flex items-center gap-2">
              <span>
                Market: <strong className="text-white">{activeSymbol}/USDT</strong>
              </span>
              {pinnedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterPinnedOnly(!filterPinnedOnly)}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    filterPinnedOnly ? "bg-[#F59E0B] text-black" : "bg-[#F59E0B]/20 text-[#F59E0B]"
                  }`}
                >
                  📌 {pinnedCount} Pinned
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={!connected || analysis.isFetching}
              onClick={() => {
                void analysis.refetch();
                void market.refetch();
              }}
            >
              <RefreshCw className={`h-3 w-3 ${analysis.isFetching ? "animate-spin" : ""}`} />
              <span>{analysis.isFetching ? "Syncing..." : "Sync Evidence"}</span>
            </button>
          </div>

          {/* History Drawer Overlay */}
          {showHistory && (
            <div className="cc-history-drawer">
              <div className="cc-history-header">
                <div className="flex items-center gap-2 text-[14px] font-bold text-white">
                  <History className="h-4 w-4 text-[#38BDF8]" />
                  <span>Conversation History</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearAllHistory}
                    className="text-[11px] font-bold text-red-400 hover:underline"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className="cc-chat-action-btn"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="cc-history-search-box">
                <input
                  type="text"
                  placeholder="Search past conversations..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="cc-history-search-input"
                />
              </div>

              <div className="cc-history-list">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => {
                      setCurrentSessionId(session.id);
                      setShowHistory(false);
                    }}
                    className={`cc-history-item ${
                      session.id === currentSessionId ? "is-active" : ""
                    } ${session.pinned ? "is-pinned" : ""}`}
                  >
                    <div className="cc-history-item-meta">
                      <div className="cc-history-item-title">
                        {session.pinned && <Pin className="h-3 w-3 text-[#F59E0B] fill-[#F59E0B]" />}
                        <span>{session.title}</span>
                      </div>
                      <div className="cc-history-item-date">
                        {new Date(session.updatedAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })} · {session.messages.length} messages
                      </div>
                    </div>

                    <div className="cc-history-item-actions">
                      <button
                        type="button"
                        onClick={(e) => toggleSessionPin(session.id, e)}
                        className={`p-1 text-white/50 hover:text-white ${session.pinned ? "text-[#F59E0B]" : ""}`}
                        title={session.pinned ? "Unpin session" : "Pin session to top"}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => deleteSession(session.id, e)}
                        className="p-1 text-white/40 hover:text-red-400"
                        title="Delete chat session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scrollable Chat Area */}
          <div className="cc-chat-scroll-area">
            {/* Filter Pinned Banner */}
            {filterPinnedOnly && (
              <div className="cc-pinned-filter-bar">
                <span>Showing Pinned Messages Only ({displayedMessages.length})</span>
                <button
                  type="button"
                  onClick={() => setFilterPinnedOnly(false)}
                  className="text-[11px] underline text-white"
                >
                  View All Messages
                </button>
              </div>
            )}

            {/* Quick Prompt Chips */}
            {!filterPinnedOnly && (
              <div>
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Suggested Financial Prompts
                </span>
                <div className="cc-chat-quick-prompts">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => ask(prompt)}
                      className="cc-quick-prompt-btn"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State Welcome */}
            {!displayedMessages.length && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2F78B7]/20 text-[#38BDF8]">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-[15px] font-black text-white">Ask AHNA Anything</h3>
                <p className="mt-1 text-[12px] text-white/60">
                  AHNA coordinates 5 specialized agents to analyze market technicals, news catalysts, sentiment, and risk guardrails for <strong>{activeSymbol}</strong>.
                </p>
              </div>
            )}

            {/* Messages Stream */}
            {displayedMessages.map((message) => {
              const isUser = message.role === "user";
              const isEditing = editingMsgId === message.id;

              if (isUser) {
                return (
                  <div key={message.id} className="cc-message-row user group">
                    {isEditing ? (
                      <div className="cc-edit-box">
                        <textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          className="cc-edit-textarea"
                          rows={3}
                        />
                        <div className="cc-edit-actions">
                          <button
                            type="button"
                            onClick={() => setEditingMsgId(null)}
                            className="cc-btn-sm-cancel"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveAndReask(message.id)}
                            className="cc-btn-sm-save"
                          >
                            Save &amp; Submit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`cc-user-bubble ${message.pinned ? "is-pinned" : ""}`}>
                        {message.pinned && (
                          <span className="cc-pin-badge">
                            <Pin className="h-3 w-3 fill-[#F59E0B]" />
                            Pinned
                          </span>
                        )}
                        <p>{message.content}</p>

                        {/* Hover Action Bar for User Message */}
                        <div className="mt-2 flex items-center justify-end gap-2 border-t border-white/10 pt-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => startEditing(message)}
                            className="text-[10.5px] font-bold text-white/70 hover:text-white flex items-center gap-1"
                            title="Edit question"
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleMessagePin(message.id)}
                            className={`text-[10.5px] font-bold flex items-center gap-1 ${
                              message.pinned ? "text-[#F59E0B]" : "text-white/70 hover:text-white"
                            }`}
                            title={message.pinned ? "Unpin message" : "Pin message"}
                          >
                            <Pin className="h-3 w-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteMessage(message.id)}
                            className="text-[10.5px] font-bold text-white/50 hover:text-red-400 flex items-center gap-1"
                            title="Delete message"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={message.id} className="cc-message-row assistant">
                  <div className="cc-assistant-bubble">
                    <div className="flex items-start gap-2.5">
                      <span className="cc-assistant-avatar">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <div className={`cc-assistant-card flex-1 ${message.pinned ? "is-pinned" : ""}`}>
                        {message.pinned && (
                          <span className="cc-pin-badge">
                            <Pin className="h-3 w-3 fill-[#F59E0B]" />
                            Pinned Analysis
                          </span>
                        )}

                        {message.structuredAnalysis?.instruction ? (
                          <AHNAHologram analysis={message.structuredAnalysis} />
                        ) : (
                          <FormattedAiResponse content={message.content} />
                        )}

                        {/* Footer & Actions */}
                        <div className="cc-msg-footer">
                          <span className="cc-msg-meta">AHNA Evidence Synthesis</span>
                          <div className="cc-msg-actions">
                            <button
                              type="button"
                              onClick={() => toggleMessagePin(message.id)}
                              className={`cc-msg-action-btn ${message.pinned ? "pinned" : ""}`}
                              title={message.pinned ? "Unpin analysis" : "Pin analysis"}
                            >
                              <Pin className="h-3 w-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => copyToClipboard(message.id, message.content)}
                              className="cc-msg-action-btn flex items-center gap-1"
                              title="Copy response"
                            >
                              {copiedId === message.id ? (
                                <>
                                  <Check className="h-3 w-3 text-[#70C891]" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            {!message.structuredAnalysis?.instruction && (
                              <button
                                type="button"
                                onClick={() => simplifyReply(message.id, message.content)}
                                className="cc-msg-action-btn"
                                title="Summarize in 2 sentences"
                              >
                                Simplify
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => deleteMessage(message.id)}
                              className="cc-msg-action-btn text-white/50 hover:text-red-400"
                              title="Delete exchange"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="cc-message-row assistant">
                <div className="cc-typing-indicator">
                  <div className="cc-bouncing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>AHNA is synthesizing 5 specialist agents...</span>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Fixed Composer Bottom */}
          <form className="cc-chat-composer" onSubmit={submit}>
            <div className="cc-composer-box">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask AHNA about ${activeSymbol} (e.g., trend, risk, sentiment)...`}
                rows={2}
                maxLength={1500}
                className="cc-composer-textarea"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!draft.trim() || isLoading}
                className="cc-composer-send-btn"
                title="Send message"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <div className="cc-composer-disclaimer">
              <span>Press Enter to send · Shift+Enter for new line</span>
              <span>Evidence-based decision support</span>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
