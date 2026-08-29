"use client";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { BookOpenCheck, ChevronDown, Hash, Info, LockKeyhole, Megaphone, Menu, MessageSquare, PencilLine, Save, Scale, Search, ShieldCheck, UsersRound, X } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useAuth } from "@/context/AuthContext";
import { ASSETS } from "@/lib/market-data";
import { COMMUNITY_CHANNELS, parseCommunityDraft, type CommunityChannel } from "@/lib/community-channels";

function DraftComposer({ channel, userId }: { channel: CommunityChannel; userId: string }) {
  const [draft, setDraft] = useState(() => parseCommunityDraft(null, channel.asset));
  const [ready, setReady] = useState(false), [notice, setNotice] = useState("");
  const storageKey = `coincrest:community-draft:v6:${encodeURIComponent(userId)}:${channel.id}`;
  useEffect(() => {
    try { setDraft(parseCommunityDraft(JSON.parse(localStorage.getItem(storageKey) ?? "null"), channel.asset)); }
    catch { setNotice("Saved draft could not be read. You can still write in this session."); }
    setReady(true);
  }, [storageKey, channel.asset]);
  function save() {
    const saved = { ...draft, savedAt: new Date().toISOString() };
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); setDraft(saved); setNotice("Saved on this device. Nothing was published."); }
    catch { setNotice("Browser storage is unavailable. Your draft is only kept in this open page."); }
  }
  return <form className="cc-chat-composer" onSubmit={event => { event.preventDefault(); save(); }}>
    <div className="cc-composer-heading"><PencilLine size={14}/><strong>Private draft</strong><span>#{channel.name} · not published</span></div>
    <details className="cc-trade-idea-fields"><summary>Trade idea details <ChevronDown size={13}/></summary><div><label>Asset<select value={draft.asset} onChange={event => setDraft(value => ({ ...value, asset: event.target.value }))}>{ASSETS.filter(asset => asset.symbol !== "USDT").map(asset => <option key={asset.symbol} value={asset.symbol}>{asset.symbol} · {asset.name}</option>)}</select></label><label>Idea title<input maxLength={120} value={draft.title} placeholder="Summarize your thesis" onChange={event => setDraft(value => ({ ...value, title: event.target.value }))}/></label></div></details>
    <textarea aria-label={`Draft for ${channel.name}`} maxLength={5000} value={draft.thesis} onChange={event => setDraft(value => ({ ...value, thesis: event.target.value }))} placeholder="Write your perspective. Include evidence, risk, and what would change your mind."/>
    <footer><small>{draft.thesis.length}/5,000 · {draft.savedAt ? "A saved draft exists on this device" : "Only visible to you"}</small><button className="cc-button" type="submit" disabled={!ready || !userId || (!draft.thesis.trim() && !draft.title.trim())}><Save size={13}/>Save draft</button><button className="cc-button cc-button-primary" type="button" disabled title="Identity, storage, and moderation services must be connected before publishing"><LockKeyhole size={13}/>Publish unavailable</button></footer>
    {notice && <p className="cc-draft-notice" role="status">{notice}</p>}
  </form>;
}

function CommunityContent() {
  const { user } = useAuth();
  const [channelId, setChannelId] = useState<string>("market-chat");
  const [query, setQuery] = useState("");
  const [infoOpen, setInfoOpen] = useState(false), [channelsOpen, setChannelsOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(true), [feed, setFeed] = useState<"Latest" | "Following">("Latest");
  const channel = COMMUNITY_CHANNELS.find(item => item.id === channelId) ?? COMMUNITY_CHANNELS[1];
  const filtered = COMMUNITY_CHANNELS.filter(item => `${item.name} ${item.group} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  const channelList = <>
    <div className="cc-community-brand"><MessageSquare size={19}/><div><strong>CoinCrest Community</strong><small>Ideas, with evidence</small></div></div>
    <label className="cc-channel-search"><Search size={14}/><input aria-label="Find a community channel" placeholder="Find a channel" value={query} onChange={event => setQuery(event.target.value)}/></label>
    <nav className="cc-channel-list" aria-label="Community channels">{["Start here", "Markets", "Learning"].map(group => <div key={group}><h2>{group}</h2>{filtered.filter(item => item.group === group).map(item => <button key={item.id} aria-current={channel.id === item.id ? "page" : undefined} onClick={() => { setChannelId(item.id); setChannelsOpen(false); }}>{item.readOnly ? <Megaphone size={16}/> : <Hash size={16}/>}<span>{item.name}</span>{item.readOnly && <LockKeyhole size={11}/>}</button>)}</div>)}{!filtered.length && <p className="cc-no-channels">No channels match this search.</p>}</nav>
    <div className="cc-community-self"><span>{(user?.display_name || user?.email || "You").slice(0, 1).toUpperCase()}</span><div><strong>{user?.display_name || "Your workspace"}</strong><small>Private draft mode</small></div><ShieldCheck size={16}/></div>
  </>;
  return <div className={`cc-community-v6${infoOpen ? " cc-community-info-open" : ""}`}>
    <aside className="cc-community-channels">{channelList}</aside>
    <Dialog.Root open={channelsOpen} onOpenChange={setChannelsOpen}><Dialog.Portal><Dialog.Overlay className="cc-mobile-backdrop"/><Dialog.Content className="cc-dialog cc-channel-drawer"><Dialog.Title className="cc-sr-only">Community channels</Dialog.Title><Dialog.Description className="cc-sr-only">Choose a market or learning discussion.</Dialog.Description><Dialog.Close className="cc-icon-button cc-channel-drawer-close" aria-label="Close channel list"><X size={18}/></Dialog.Close>{channelList}</Dialog.Content></Dialog.Portal></Dialog.Root>
    <section className="cc-community-conversation" aria-label={`Channel ${channel.name}`}>
      <header className="cc-channel-header"><button className="cc-icon-button cc-channel-menu" aria-label="Open channel list" onClick={() => setChannelsOpen(true)}><Menu size={18}/></button>{channel.readOnly ? <Megaphone size={22}/> : <Hash size={24}/>}<div><h1>{channel.name}</h1><p>{channel.description}</p></div><button className={`cc-icon-button${infoOpen ? " is-active" : ""}`} aria-label={infoOpen ? "Close channel information" : "Open channel information"} aria-expanded={infoOpen} onClick={() => setInfoOpen(value => !value)}><Info size={18}/></button></header>
      <div className="cc-community-service"><span><i/>Community preview · live service not connected</span><div className="cc-community-feed-switch" role="group" aria-label="Community feed">{(["Latest", "Following"] as const).map(value => <button key={value} aria-pressed={feed === value} onClick={() => setFeed(value)}>{value}</button>)}</div></div>
      <div className="cc-conversation-scroll"><div className="cc-channel-welcome"><span className="cc-channel-welcome-mark">{feed === "Following" ? <UsersRound size={32}/> : <Hash size={36}/>}</span><small>COINCREST / {channel.group.toUpperCase()}</small><h2>{feed === "Following" ? "Your followed conversations belong here." : `Welcome to #${channel.name}`}</h2><p>{feed === "Following" ? "Following traders and their posts will become available when the Community service is connected." : channel.description}</p><div className="cc-community-honest-state"><LockKeyhole size={16}/><p>No live messages, online members, or reactions are available yet. {channel.readOnly ? "Team announcements will appear here once connected." : "You can prepare a private draft below; it is not sent to other traders."}</p></div></div></div>
      <div className="cc-composer-toggle-row"><span>{channel.readOnly ? "Team announcements · read-only channel" : "A useful idea includes evidence and invalidation."}</span>{!channel.readOnly && <button onClick={() => setComposerOpen(value => !value)} aria-expanded={composerOpen} aria-controls="community-draft"><PencilLine size={13}/>{composerOpen ? "Collapse draft" : "Open draft"}</button>}</div>
      <div id="community-draft" hidden={channel.readOnly || !composerOpen}>{COMMUNITY_CHANNELS.filter(item => !item.readOnly).map(item => <div key={`${user?.id}:${item.id}`} hidden={item.id !== channel.id}><DraftComposer channel={item} userId={user?.id ?? ""}/></div>)}</div>
    </section>
    {infoOpen && <aside className="cc-community-info" aria-label="Channel information"><header><strong>Channel information</strong><button className="cc-icon-button" aria-label="Close channel information" onClick={() => setInfoOpen(false)}><X size={16}/></button></header><section><span className="cc-eyebrow">About this channel</span><h2>#{channel.name}</h2><p>{channel.description}</p></section><section><h3><UsersRound size={16}/>Members</h3><p>Member lists and presence require the Community backend. No online status is simulated.</p></section><section><h3><ShieldCheck size={16}/>Community standard</h3><ul><li><BookOpenCheck size={16}/><div><strong>Sources beside the thesis</strong><p>Link the evidence and include its timestamp.</p></div></li><li><Scale size={16}/><div><strong>Risk beside conviction</strong><p>Explain uncertainty and what would invalidate the idea.</p></div></li><li><ShieldCheck size={16}/><div><strong>Moderation before publishing</strong><p>Reporting, verified identity, and clear rules must be connected before messages go live.</p></div></li></ul></section><p className="cc-community-disclaimer">Community opinions are not market data or financial advice.</p></aside>}
  </div>;
}
export default function CommunityPage() { return <DashboardShell><CommunityContent/></DashboardShell>; }
