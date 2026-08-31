"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUp, RefreshCw, Sparkles, Trash2, X } from "lucide-react";
import { useWorkspace } from "./WorkspaceContext";
import { useMarketSnapshot } from "@/hooks/useMarketSnapshot";
import { useUnifiedAnalysis } from "@/hooks/useTerminalAccount";
import { backendError } from "@/hooks/useWorkspaceData";
import { type MarketCoin } from "@/lib/market-data";
import { terminalSymbolForId } from "@/lib/asset-directory";
import { evidenceReply, otherMentionedAsset, questionIntent, type EvidenceIntent } from "@/lib/agent-evidence";
import { type Unified } from "@/lib/terminal-account";
import BriefCard from "@/components/intelligence/BriefCard";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/client";
import AHNAHologram from "@/components/ahna/AHNAHologram";
import type { AHNAAnalysisResponse } from "@/lib/ahna-types";

type Message = { id: number; question: string; reply: string; intent: EvidenceIntent; data?: Unified; coin?: MarketCoin; symbol: string; structuredAnalysis?: AHNAAnalysisResponse };

export default function FridayPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mobile, setMobile] = useState(false), [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { activeSymbol, activeCoinId, setLatestAhnaAnalysis } = useWorkspace();
  const connected = Boolean(activeCoinId && terminalSymbolForId(activeCoinId));
  const market = useMarketSnapshot(open), analysis = useUnifiedAnalysis(`${activeSymbol}USDT`, "1h", false, open && connected);
  const analysisData = connected ? analysis.data : undefined;
  const coin = market.data?.coins.find(c => c.id === activeCoinId);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { const media = matchMedia("(max-width: 767px)"); const update = () => setMobile(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  useEffect(() => { setMessages([]); setDraft(""); }, [activeSymbol, activeCoinId]);
  useEffect(() => { if (messages.length) end.current?.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }, [messages.length]);
  const { token } = useAuth();

  async function ask(question: string) {
    if (!question.trim()) return;
    const otherAsset = otherMentionedAsset(question, activeSymbol);
    const intent = !connected || otherAsset ? "unsupported" : questionIntent(question);
    
    if (!connected) {
      const reply = `Agent analysis for ${activeSymbol} (${activeCoinId ?? "unknown asset"}) is not connected yet. I won’t substitute another coin’s results.`;
      setMessages(old => [...old.slice(-7), { id: Date.now(), question: question.trim().slice(0, 1500), reply, intent, data: analysisData, coin, symbol: activeSymbol }]); 
      setDraft("");
      return;
    }
    if (otherAsset) {
      const reply = terminalSymbolForId(otherAsset.id) ? `This panel is using ${activeSymbol}. Select ${otherAsset.symbol} in the workstation or Intelligence page before asking for its analysis.` : `This panel is using ${activeSymbol}. You can search ${otherAsset.name} on Markets, but its agent analysis is not connected to the current workstation.`;
      setMessages(old => [...old.slice(-7), { id: Date.now(), question: question.trim().slice(0, 1500), reply, intent, data: analysisData, coin, symbol: activeSymbol }]); 
      setDraft("");
      return;
    }

    const msgId = Date.now();
    setMessages(old => [...old.slice(-7), { id: msgId, question: question.trim().slice(0, 1500), reply: "Synthesizing AI intelligence...", intent, data: analysisData, coin, symbol: activeSymbol }]);
    setDraft("");

    try {
      const response = await apiClient.post("/api/v1/ahna/analyze", { symbol: activeSymbol, question }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      if (setLatestAhnaAnalysis && data) {
        setLatestAhnaAnalysis(activeSymbol, data);
      }
      const aiReply = data.summary ? `${data.summary}\n\nDecision: ${data.decision} (${Math.round(data.confidence)}%)\n\n` + (data.reasoning || []).map((r: string) => `• ${r}`).join("\n") : "Analysis complete.";
      setMessages(old => old.map(m => m.id === msgId ? { ...m, reply: aiReply, structuredAnalysis: data } : m));
    } catch (e) {
      console.error("AHNA Error:", e);
      setMessages(old => old.map(m => m.id === msgId ? { ...m, reply: "Analysis failed to complete. Please ensure backend services are running." } : m));
    }
  }

  async function simplifyReply(id: number, text: string) {
    setMessages(old => old.map(m => m.id === id ? { ...m, reply: "Simplifying..." } : m));
    try {
      const response = await apiClient.post("/api/v1/ahna/analyze", { symbol: activeSymbol, question: `Explain this very simply in 2 sentences: ${text}`.slice(0, 1500) }, { headers: { Authorization: `Bearer ${token}` } });
      const data = response.data;
      const aiReply = data.summary ? `${data.summary}\n\nDecision: ${data.decision} (${Math.round(data.confidence)}%)\n\n` + (data.reasoning || []).map((r: string) => `• ${r}`).join("\n") : "Simplification complete.";
      setMessages(old => old.map(m => m.id === id ? { ...m, reply: aiReply, structuredAnalysis: data } : m));
    } catch (e) {
      console.error("AHNA Error:", e);
      setMessages(old => old.map(m => m.id === id ? { ...m, reply: "Simplification failed." } : m));
    }
  }
  function submit(event: FormEvent) { event.preventDefault(); void ask(draft); }
  return <Dialog.Root open={open} onOpenChange={value => { if (!value) onClose(); }} modal={mobile}><Dialog.Portal>{mobile && <Dialog.Overlay className="cc-mobile-backdrop"/>}<Dialog.Content id="cc-ahna-panel" className="cc-dialog cc-ahna-panel cc-ahna-v4" onInteractOutside={event => { if (!mobile) event.preventDefault(); }} onCloseAutoFocus={event => { event.preventDefault(); document.querySelector<HTMLButtonElement>("[aria-controls='cc-ahna-panel']")?.focus(); }}>
    <div className="cc-panel-heading"><div className="cc-inline"><span className="cc-ahna-symbol"><Sparkles size={20}/></span><div><Dialog.Title>AHNA</Dialog.Title><span className="cc-muted">Your research copilot</span></div></div><div className="cc-inline"><button className="cc-icon-button" type="button" onClick={() => setMessages([])} disabled={!messages.length} aria-label="Clear this session’s questions"><Trash2 size={16}/></button><Dialog.Close className="cc-panel-close" aria-label="Close AHNA"><X size={18}/></Dialog.Close></div></div>
    <Dialog.Description className="cc-ahna-mode">AI mode · connected to AHNA Synthesis API. Evidence responses from returned data. No order execution.</Dialog.Description>
    <div className="cc-ahna-context"><span>{activeSymbol} · {connected ? "1h analysis" : "not connected"}</span><button type="button" disabled={!connected || analysis.isFetching} onClick={() => { void analysis.refetch(); void market.refetch(); }}><RefreshCw size={13}/>{analysis.isFetching ? "Fetching…" : "Refresh evidence"}</button></div>
    <div className="cc-ahna-content"><div className="cc-ahna-welcome"><span className="cc-eyebrow">A clearer view of your market</span><h2>Ask. Inspect. Decide.</h2><p>Explore the market brief, news and risk evidence for <strong>{activeSymbol}</strong>.</p></div>
      {((connected && analysis.isError) || market.isError) && <p className="cc-data-warning" role="status">{connected && analysis.isError ? backendError(analysis.error) : "Market quote refresh failed."} Last returned information may be stale.</p>}
      <div className="cc-question-chips">{["Market brief", "News impact", "Risk check", "Explain the evidence"].map(q => <button type="button" key={q} onClick={() => ask(q)}>{q}</button>)}</div>
      {!messages.length && <BriefCard symbol={activeSymbol} coin={coin} data={analysisData}/>}
      <div className="cc-chat-messages" aria-live="polite" aria-relevant="additions">
        {messages.map(message => (
          <article className="cc-chat-exchange" key={message.id}>
            <p className="cc-chat-question">{message.question}</p>
            <div className="cc-chat-answer">
              <span className="cc-eyebrow">AHNA · evidence response · {message.symbol}</span>
              {message.intent !== "unsupported" && <div style={{ marginBottom: '16px', marginTop: '8px' }}><BriefCard symbol={message.symbol} coin={message.coin} data={message.data} intent={message.intent}/></div>}
              {message.structuredAnalysis?.instruction ? (
                <AHNAHologram analysis={message.structuredAnalysis} />
              ) : (
                <p>{message.reply}</p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
                <small className="cc-chat-snapshot-note" style={{ margin: 0, padding: 0, border: 'none' }}>Reply uses the evidence available when asked. Refresh and ask again for an updated brief.</small>
                {!message.structuredAnalysis?.instruction && <button type="button" className="cc-button cc-button-primary" style={{ fontSize: '10px', padding: '6px 10px', minHeight: 'auto', borderRadius: 'var(--radius-sm)' }} onClick={() => simplifyReply(message.id, message.reply)}>Simplify</button>}
              </div>
            </div>
          </article>
        ))}
      </div>
      <div ref={end}/>
    </div>
    <form className="cc-composer" onSubmit={submit}><label htmlFor="cc-ahna-question">Ask about the selected market</label><textarea id="cc-ahna-question" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Explain the news impact or review the risk…" maxLength={1500} rows={2}/><div className="cc-composer-footer"><small>Session-only · supported research prompts</small><button type="submit" className="cc-send-question" disabled={!draft.trim()} aria-label="Get an evidence-based response"><ArrowUp size={18}/></button></div></form>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
