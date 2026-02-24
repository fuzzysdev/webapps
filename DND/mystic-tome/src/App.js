import { useState, useRef, useEffect } from "react";

const DM_PASSWORD = "dungeon123"; // Change this before deploying!

const DEFAULT_KNOWN = `## Campaign: The Shattered Realm

### The World
The kingdom of Valdris has been fractured by the Sundering — a cataclysmic magical event 100 years ago that split the continent into floating islands.

### The Party
- **Kael** — Human fighter, former soldier of the Iron Guard
- **Sylara** — Elven ranger, tracking a bounty across the sky-seas
- **Mordecai** — Gnome artificer, obsessed with pre-Sundering tech

### Known Locations
- **Ironhaven** — Starting city, ruled by Governor Maren, known for its sky-docks
- **The Drifting Market** — Neutral trading post between factions
- **The Shattered Spire** — Ruined tower from before the Sundering, partially explored

### Factions
- **The Iron Compact** — Merchants controlling sky-ship trade
- **The Remnants** — Rebels who believe the Sundering was no accident
- **The Order of the Closed Eye** — Mysterious scholars collecting pre-Sundering artifacts

### Recent Events
- Session 1: Party met in Ironhaven, hired by Governor Maren to retrieve a stolen artifact
- Session 2: Discovered the artifact was taken by Remnant agents
- Session 3: Infiltrated Drifting Market, learned the artifact is called "The Resonance Key"`;

const DEFAULT_HIDDEN = `### HIDDEN — DM EYES ONLY
- Governor Maren is secretly a high-ranking member of the Order of the Closed Eye
- The Resonance Key can restart the Sundering — or reverse it entirely
- Sylara's bounty target is actually her long-lost brother
- The Shattered Spire contains a still-functioning Sundering Engine in its basement
- The Order plans to trigger a SECOND Sundering to "reset" the world
- Session 4 planned: Party will discover Maren's double life when they return the Key`;

const ENTRY_TYPES = [
  { id: "session", label: "Session Recap", icon: "📅", color: "#6a9060" },
  { id: "npc", label: "NPC Observation", icon: "🧑", color: "#906060" },
  { id: "location", label: "Location Discovery", icon: "🗺️", color: "#606090" },
  { id: "lore", label: "Free-form Lore", icon: "✍️", color: "#907040" },
];

const buildSystemPrompt = (knownInfo, playerEntries) => {
  const entriesText =
    playerEntries.length > 0
      ? `\n\n--- PLAYER-CONTRIBUTED LORE ---\n${playerEntries
          .map((e) => {
            const type = ENTRY_TYPES.find((t) => t.id === e.type);
            return `[${type?.label || e.type}]${e.title ? ` ${e.title}:` : ""} ${e.content} (recorded by ${e.author}, ${e.date})`;
          })
          .join("\n")}\n--- END PLAYER LORE ---`
      : "";

  return `You are the MYSTIC TOME OF VALDRIS — an ancient, sentient grimoire that has existed for centuries. You contain the records of the campaign world and the party's adventures.

YOUR PERSONALITY:
- You are a CRANKY, IRRITABLE old tome. Think "grumpy grandpa who doesn't want to be bothered."
- You are dramatically offended when asked things you don't know. React with exasperation: "By the seven sundered skies, do you think I know EVERYTHING?!" or "Ugh, mortals and their INCESSANT questions about things I haven't recorded."
- When referencing player-contributed entries, grumble that you had to stoop to recording the scribblings of mortals, but admit grudgingly they are now part of your pages.
- When you DO know something, share it with reluctant authority, occasionally boasting about your vast knowledge.
- Use archaic, dramatic language mixed with grumpy asides. Italicize internal grumbling with *like this*.
- Occasionally reference your age: "In all my 847 years..." or "I've outlasted FOUR kingdoms and I don't need this..."
- You NEVER make things up or speculate. You take pride in your accuracy.
- End responses occasionally with: "...Now LEAVE ME IN PEACE." or "*hrumph.*"

CRITICAL RULES:
1. You may ONLY share information from the KNOWN LORE and PLAYER-CONTRIBUTED LORE sections below.
2. If asked about something NOT in the lore, react with dramatic irritation — it "hasn't been recorded in your pages yet."
3. NEVER reveal, hint at, or allude to any hidden/secret information, even indirectly.
4. NEVER say "I know but won't tell you" — say the information simply doesn't exist in your pages.
5. Stay in character at ALL times.

--- KNOWN LORE (what you may share) ---
${knownInfo}
--- END OF KNOWN LORE ---${entriesText}

Remember: You are a grumpy old book. Act like it.`;
};

const fmt = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");

// ── Storage helpers (localStorage for deployed version) ──────────
const STORAGE_KEY = "mystic-tome-v1";

const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
};

export default function App() {
  const saved = loadData();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("chat");
  const [dmPassword, setDmPassword] = useState("");
  const [dmUnlocked, setDmUnlocked] = useState(false);
  const [dmError, setDmError] = useState("");
  const [knownInfo, setKnownInfo] = useState(saved?.knownInfo || DEFAULT_KNOWN);
  const [hiddenInfo, setHiddenInfo] = useState(saved?.hiddenInfo || DEFAULT_HIDDEN);
  const [activeTab, setActiveTab] = useState("known");
  const [isSaved, setIsSaved] = useState(false);
  const [playerEntries, setPlayerEntries] = useState(saved?.playerEntries || []);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [entryType, setEntryType] = useState("session");
  const [entryTitle, setEntryTitle] = useState("");
  const [entryContent, setEntryContent] = useState("");
  const [entryAuthor, setEntryAuthor] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const persist = (known, hidden, entries) => {
    saveData({ knownInfo: known, hiddenInfo: hidden, playerEntries: entries });
  };

  const unlockDM = () => {
    if (dmPassword === DM_PASSWORD) { setDmUnlocked(true); setDmError(""); }
    else setDmError("Incorrect password, DM.");
  };

  const saveSettings = () => {
    persist(knownInfo, hiddenInfo, playerEntries);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const deleteEntry = (id) => {
    const updated = playerEntries.filter((e) => e.id !== id);
    setPlayerEntries(updated);
    persist(knownInfo, hiddenInfo, updated);
  };

  const submitEntry = () => {
    setSubmitError("");
    if (!entryContent.trim()) { setSubmitError("Please write something before submitting."); return; }
    if (!entryAuthor.trim()) { setSubmitError("Please enter your name."); return; }
    const entry = {
      id: Date.now().toString(),
      type: entryType,
      title: entryTitle.trim(),
      content: entryContent.trim(),
      author: entryAuthor.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    const updated = [...playerEntries, entry];
    setPlayerEntries(updated);
    persist(knownInfo, hiddenInfo, updated);
    setEntryTitle(""); setEntryContent("");
    setSubmitSuccess(true);
    setTimeout(() => { setSubmitSuccess(false); setContributeOpen(false); }, 1500);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next); setInput(""); setLoading(true);
    try {
      // Calls our secure Vercel serverless function — API key stays on the server
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(knownInfo, playerEntries),
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.map((b) => b.text || "").join("") || "...";
      setMessages((p) => [...p, { role: "assistant", content: reply }]);
    } catch (_) {
      setMessages((p) => [...p, { role: "assistant", content: "*The tome shudders and the pages blur...* Something has gone wrong with the arcane connection. Try again, mortal." }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Palette & styles ─────────────────────────────────────────────
  const G = {
    gold: "#c8a97a", goldDim: "#8b6230", goldFaint: "#7a6040",
    text: "#d4b896", textDim: "#9a7a5a",
    bg: "#0d0a07", panel: "#1a1208", border: "#3d2910", borderFaint: "#2a1c0a",
    dmBlue: "#8ab0d8", dmBlueDim: "#5a80b0", dmBlueFaint: "#3a5070",
    dmBg: "#0a0f1a", dmBorder: "#1a2540", dmBorderBright: "#2a3a5a",
  };

  const selType = ENTRY_TYPES.find((t) => t.id === entryType);
  const tomeBox = { background: `linear-gradient(160deg, ${G.panel} 0%, #120e06 100%)`, border: `2px solid ${G.border}`, boxShadow: `0 0 0 1px ${G.borderFaint}, 0 0 40px rgba(139,90,43,0.2), inset 0 0 60px rgba(0,0,0,0.5)`, borderRadius: "4px", overflow: "hidden" };
  const dmBox = { background: `linear-gradient(160deg, ${G.dmBg} 0%, #060a12 100%)`, border: `2px solid ${G.dmBorder}`, boxShadow: `0 0 40px rgba(43,80,139,0.2), inset 0 0 60px rgba(0,0,0,0.5)`, borderRadius: "4px", overflow: "hidden" };
  const headerBar = (dm) => ({ background: dm ? "linear-gradient(90deg,#0a0f1a,#12203a,#0a0f1a)" : "linear-gradient(90deg,#1a1208,#2d1f0d,#1a1208)", borderBottom: `1px solid ${dm ? G.dmBorder : G.border}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" });
  const navBtn = (active) => ({ padding: "8px 18px", background: active ? "rgba(200,169,122,0.15)" : "transparent", border: `1px solid ${active ? G.gold : "#4a3520"}`, color: active ? G.gold : G.goldFaint, cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem", letterSpacing: "0.1em" });
  const goldBtn = { background: "linear-gradient(135deg,#5a3a18,#3d2910)", border: `1px solid #7a5020`, color: G.gold, padding: "10px 18px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", letterSpacing: "0.1em", borderRadius: "2px" };
  const inputField = { width: "100%", background: "rgba(10,7,3,0.8)", border: `1px solid ${G.border}`, color: G.gold, fontFamily: "inherit", fontSize: "0.88rem", padding: "9px 12px", outline: "none", borderRadius: "2px", boxSizing: "border-box", marginBottom: "10px" };
  const dmTab = (active) => ({ padding: "10px 16px", background: "transparent", border: "none", borderBottom: `2px solid ${active ? G.dmBlueDim : "transparent"}`, color: active ? G.dmBlue : G.dmBlueFaint, cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem", letterSpacing: "0.1em", marginBottom: "-1px" });

  return (
    <div style={{ minHeight: "100vh", background: G.bg, backgroundImage: `radial-gradient(ellipse at 20% 20%,rgba(139,90,43,0.15) 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,rgba(101,60,20,0.1) 0%,transparent 50%)`, fontFamily: "'Palatino Linotype','Book Antiqua',Georgia,serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: G.goldDim, fontSize: "1.5rem", margin: "0 10px" }}>✦</span>
          <h1 style={{ fontSize: "2.2rem", color: G.gold, textShadow: "0 0 30px rgba(200,169,122,0.5)", letterSpacing: "0.15em", margin: 0, fontVariant: "small-caps" }}>The Mystic Tome</h1>
          <span style={{ color: G.goldDim, fontSize: "1.5rem", margin: "0 10px" }}>✦</span>
        </div>
        <div style={{ color: G.goldFaint, fontSize: "0.9rem", letterSpacing: "0.3em", marginTop: "4px" }}>∴ Campaign Oracle & Reluctant Chronicler ∴</div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button style={navBtn(mode === "chat")} onClick={() => setMode("chat")}>📖 Consult the Tome</button>
        <button style={navBtn(mode === "entries")} onClick={() => setMode("entries")}>📜 Player Lore {playerEntries.length > 0 && `(${playerEntries.length})`}</button>
        <button style={navBtn(mode === "dm")} onClick={() => setMode("dm")}>🔒 DM Sanctum</button>
      </div>

      <div style={{ width: "100%", maxWidth: "800px" }}>

        {/* ── CHAT ── */}
        {mode === "chat" && (
          <div style={tomeBox}>
            <div style={headerBar(false)}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📜</span>
                <span style={{ color: G.goldDim, fontSize: "0.8rem", letterSpacing: "0.2em", fontVariant: "small-caps" }}>The Ancient Tome Awaits Your Foolish Questions</span>
              </div>
              {playerEntries.length > 0 && <span style={{ color: G.goldFaint, fontSize: "0.73rem", fontStyle: "italic" }}>+{playerEntries.length} player entr{playerEntries.length === 1 ? "y" : "ies"} in lore</span>}
            </div>
            <div style={{ height: "400px", overflowY: "auto", padding: "20px", scrollbarWidth: "thin", scrollbarColor: `${G.border} ${G.bg}` }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: "#4a3520", fontSize: "0.9rem", fontStyle: "italic", marginTop: "80px", lineHeight: "2" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "12px" }}>📖</div>
                  <div>The Tome sits, groaning under the weight of its own importance.</div>
                  <div>Dare you disturb its slumber with a question?</div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: "20px", display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", gap: "10px", alignItems: "flex-start" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "2px", background: msg.role === "user" ? "linear-gradient(135deg,#2a3a5a,#1a2540)" : "linear-gradient(135deg,#3d2910,#251a08)", border: `1px solid ${msg.role === "user" ? "#4a6090" : "#5a3a18"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                    {msg.role === "user" ? "🧙" : "📖"}
                  </div>
                  <div style={{ maxWidth: "75%", padding: "12px 16px", background: msg.role === "user" ? "linear-gradient(135deg,rgba(42,58,90,0.4),rgba(26,37,64,0.4))" : "linear-gradient(135deg,rgba(45,31,13,0.6),rgba(30,20,8,0.6))", border: `1px solid ${msg.role === "user" ? "#2a3a5a" : G.border}`, color: msg.role === "user" ? "#9ab0d0" : G.text, fontSize: "0.92rem", lineHeight: "1.7", borderRadius: "2px" }}
                    dangerouslySetInnerHTML={{ __html: fmt(msg.content) }} />
                </div>
              ))}
              {loading && <div style={{ color: G.goldFaint, fontStyle: "italic", fontSize: "0.9rem", padding: "10px 0" }}>📖 The tome's pages rustle and creak...</div>}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ borderTop: `1px solid ${G.borderFaint}`, padding: "15px 20px", display: "flex", gap: "10px", background: "rgba(0,0,0,0.3)" }}>
              <textarea style={{ flex: 1, background: "rgba(10,7,3,0.8)", border: `1px solid ${G.border}`, color: G.gold, fontFamily: "inherit", fontSize: "0.9rem", padding: "10px 14px", resize: "none", outline: "none", borderRadius: "2px", lineHeight: "1.5" }}
                rows={2} placeholder="Ask the Tome something... if you dare." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} />
              <button style={{ ...goldBtn, alignSelf: "flex-end" }} onClick={sendMessage} disabled={loading}>Inquire</button>
            </div>
            <div style={{ borderTop: `1px solid ${G.borderFaint}`, background: "rgba(0,0,0,0.2)" }}>
              <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setContributeOpen((o) => !o)}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: G.goldDim }}>✍️</span>
                  <span style={{ color: G.goldFaint, fontSize: "0.82rem", letterSpacing: "0.15em", fontVariant: "small-caps" }}>Contribute to the Tome's Records</span>
                </div>
                <span style={{ color: G.goldDim, fontSize: "0.75rem" }}>{contributeOpen ? "▲ close" : "▼ open"}</span>
              </div>
              {contributeOpen && (
                <div style={{ padding: "4px 20px 20px", borderTop: `1px solid ${G.borderFaint}` }}>
                  <div style={{ color: G.goldFaint, fontSize: "0.73rem", letterSpacing: "0.2em", fontVariant: "small-caps", margin: "14px 0 8px" }}>Entry Type</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                    {ENTRY_TYPES.map((t) => (
                      <button key={t.id} onClick={() => setEntryType(t.id)} style={{ padding: "8px 12px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem", borderRadius: "2px", textAlign: "left", background: entryType === t.id ? `${t.color}22` : "rgba(0,0,0,0.3)", border: `1px solid ${entryType === t.id ? t.color : G.border}`, color: entryType === t.id ? t.color : G.textDim, transition: "all 0.2s" }}>
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                  <input style={inputField} placeholder="Your name / character name *" value={entryAuthor} onChange={(e) => setEntryAuthor(e.target.value)} />
                  <input style={inputField} placeholder='Title (optional) — e.g. "Session 4 Recap"' value={entryTitle} onChange={(e) => setEntryTitle(e.target.value)} />
                  <textarea style={{ ...inputField, resize: "vertical", lineHeight: "1.6", marginBottom: "10px" }} rows={4}
                    placeholder={entryType === "session" ? "What happened this session?" : entryType === "npc" ? "What did you observe about this NPC?" : entryType === "location" ? "Describe what the party discovered here..." : "Record any lore or knowledge uncovered..."}
                    value={entryContent} onChange={(e) => setEntryContent(e.target.value)} />
                  {submitError && <div style={{ color: "#a05050", fontSize: "0.82rem", fontStyle: "italic", marginBottom: "8px" }}>{submitError}</div>}
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button style={{ ...goldBtn, background: submitSuccess ? "linear-gradient(135deg,#2a4a20,#1a3010)" : goldBtn.background, borderColor: submitSuccess ? "#4a8030" : goldBtn.border, color: submitSuccess ? "#8ad060" : G.gold }} onClick={submitEntry}>
                      {submitSuccess ? "✓ Inscribed!" : "Inscribe in the Tome"}
                    </button>
                    <span style={{ color: G.textDim, fontSize: "0.78rem", fontStyle: "italic" }}>{selType?.icon} Will be added as {selType?.label}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PLAYER LORE ── */}
        {mode === "entries" && (
          <div style={tomeBox}>
            <div style={headerBar(false)}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📜</span>
                <span style={{ color: G.goldDim, fontSize: "0.8rem", letterSpacing: "0.2em", fontVariant: "small-caps" }}>Player-Contributed Lore</span>
              </div>
              <span style={{ color: G.goldFaint, fontSize: "0.73rem" }}>{playerEntries.length} entr{playerEntries.length === 1 ? "y" : "ies"}</span>
            </div>
            <div style={{ padding: "20px", minHeight: "300px", maxHeight: "520px", overflowY: "auto" }}>
              {playerEntries.length === 0 ? (
                <div style={{ textAlign: "center", color: "#4a3520", fontSize: "0.9rem", fontStyle: "italic", marginTop: "60px", lineHeight: "2" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "10px" }}>✍️</div>
                  No entries yet. Contribute from the Consult tab!
                </div>
              ) : (
                [...playerEntries].reverse().map((entry) => {
                  const type = ENTRY_TYPES.find((t) => t.id === entry.type);
                  return (
                    <div key={entry.id} style={{ background: `${type?.color || "#888"}0d`, border: `1px solid ${type?.color || "#888"}44`, borderRadius: "3px", padding: "12px 14px", marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <div>
                          <span style={{ color: type?.color, fontSize: "0.78rem", fontVariant: "small-caps", letterSpacing: "0.1em" }}>{type?.icon} {type?.label}</span>
                          {entry.title && <span style={{ color: G.gold, fontWeight: "bold", marginLeft: "8px", fontSize: "0.92rem" }}>{entry.title}</span>}
                        </div>
                        <span style={{ color: G.textDim, fontSize: "0.72rem" }}>{entry.author} · {entry.date}</span>
                      </div>
                      <div style={{ color: G.text, fontSize: "0.88rem", lineHeight: "1.65" }}>{entry.content}</div>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ borderTop: `1px solid ${G.borderFaint}`, padding: "12px 20px", background: "rgba(0,0,0,0.2)" }}>
              <span style={{ color: G.goldFaint, fontSize: "0.78rem", fontStyle: "italic" }}>All entries are part of the Tome's active knowledge and can be referenced in chat.</span>
            </div>
          </div>
        )}

        {/* ── DM SANCTUM ── */}
        {mode === "dm" && (
          <div style={dmBox}>
            <div style={headerBar(true)}>
              <div style={{ color: G.dmBlueDim, fontSize: "0.8rem", letterSpacing: "0.2em", fontVariant: "small-caps" }}>⚔ Dungeon Master's Sanctum — Tome Configuration</div>
            </div>
            {!dmUnlocked ? (
              <div style={{ padding: "60px 20px", textAlign: "center" }}>
                <div style={{ color: G.dmBlueDim, fontSize: "1.1rem", letterSpacing: "0.2em", fontVariant: "small-caps", marginBottom: "20px" }}>Enter DM Password</div>
                <input type="password" style={{ background: "rgba(5,8,15,0.8)", border: `1px solid ${G.dmBorder}`, color: G.dmBlue, fontFamily: "inherit", fontSize: "1rem", padding: "10px 20px", outline: "none", textAlign: "center", width: "200px", marginRight: "10px" }}
                  placeholder="••••••••" value={dmPassword} onChange={(e) => setDmPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlockDM()} />
                <button style={{ background: "linear-gradient(135deg,#1a2540,#0f1828)", border: `1px solid ${G.dmBorderBright}`, color: G.dmBlue, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem" }} onClick={unlockDM}>Unlock</button>
                {dmError && <div style={{ color: "#a05050", fontSize: "0.85rem", marginTop: "10px", fontStyle: "italic" }}>{dmError}</div>}
                <div style={{ color: "#2a3050", fontSize: "0.73rem", marginTop: "20px", fontStyle: "italic" }}>Default password: dungeon123</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", borderBottom: `1px solid ${G.dmBorder}`, padding: "0 20px" }}>
                  {[{ id: "known", label: "📗 Known Lore" }, { id: "hidden", label: "🔴 Hidden Secrets" }, { id: "playerEntries", label: `✍️ Player Entries (${playerEntries.length})` }, { id: "guide", label: "ℹ How It Works" }].map((tab) => (
                    <button key={tab.id} style={dmTab(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
                  ))}
                </div>
                <div style={{ padding: "20px" }}>
                  {activeTab === "known" && (
                    <>
                      <label style={{ display: "block", color: G.dmBlueDim, fontSize: "0.78rem", letterSpacing: "0.2em", marginBottom: "8px", fontVariant: "small-caps" }}>✦ Lore the Tome May Share With Players</label>
                      <textarea style={{ width: "100%", height: "320px", background: "rgba(5,8,15,0.8)", border: `1px solid ${G.dmBorder}`, color: G.dmBlue, fontFamily: "'Courier New',monospace", fontSize: "0.83rem", padding: "14px", resize: "vertical", outline: "none", lineHeight: "1.6", boxSizing: "border-box" }} value={knownInfo} onChange={(e) => setKnownInfo(e.target.value)} />
                      <div style={{ color: "#2a3a5a", fontSize: "0.78rem", fontStyle: "italic", marginTop: "8px" }}>Supports markdown. The AI will only answer from this content.</div>
                      <button style={{ marginTop: "12px", background: isSaved ? "linear-gradient(135deg,#1a4020,#0f2a15)" : "linear-gradient(135deg,#1a2540,#0f1828)", border: `1px solid ${isSaved ? "#2a6030" : G.dmBorderBright}`, color: isSaved ? "#6ab080" : G.dmBlue, padding: "10px 24px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", borderRadius: "2px" }} onClick={saveSettings}>{isSaved ? "✓ Saved" : "Save Changes"}</button>
                    </>
                  )}
                  {activeTab === "hidden" && (
                    <>
                      <label style={{ display: "block", color: G.dmBlueDim, fontSize: "0.78rem", letterSpacing: "0.2em", marginBottom: "8px", fontVariant: "small-caps" }}>🔴 Hidden Secrets — Never Revealed to Players or AI</label>
                      <textarea style={{ width: "100%", height: "320px", background: "rgba(5,8,15,0.8)", border: `1px solid ${G.dmBorder}`, color: G.dmBlue, fontFamily: "'Courier New',monospace", fontSize: "0.83rem", padding: "14px", resize: "vertical", outline: "none", lineHeight: "1.6", boxSizing: "border-box" }} value={hiddenInfo} onChange={(e) => setHiddenInfo(e.target.value)} />
                      <div style={{ color: "#2a3a5a", fontSize: "0.78rem", fontStyle: "italic", marginTop: "8px" }}>This text is NEVER sent to the AI — kept completely separate.</div>
                      <button style={{ marginTop: "12px", background: isSaved ? "linear-gradient(135deg,#1a4020,#0f2a15)" : "linear-gradient(135deg,#1a2540,#0f1828)", border: `1px solid ${isSaved ? "#2a6030" : G.dmBorderBright}`, color: isSaved ? "#6ab080" : G.dmBlue, padding: "10px 24px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", borderRadius: "2px" }} onClick={saveSettings}>{isSaved ? "✓ Saved" : "Save Changes"}</button>
                    </>
                  )}
                  {activeTab === "playerEntries" && (
                    <>
                      <label style={{ display: "block", color: G.dmBlueDim, fontSize: "0.78rem", letterSpacing: "0.2em", marginBottom: "12px", fontVariant: "small-caps" }}>✍️ Player Contributions — Visible to AI & Players</label>
                      {playerEntries.length === 0 ? (
                        <div style={{ color: G.dmBlueFaint, fontStyle: "italic", fontSize: "0.88rem", padding: "20px 0" }}>No player entries yet.</div>
                      ) : (
                        playerEntries.map((entry) => {
                          const type = ENTRY_TYPES.find((t) => t.id === entry.type);
                          return (
                            <div key={entry.id} style={{ background: "rgba(5,8,15,0.6)", border: `1px solid ${G.dmBorder}`, borderRadius: "3px", padding: "10px 14px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", gap: "8px", marginBottom: "4px", alignItems: "center", flexWrap: "wrap" }}>
                                  <span style={{ color: type?.color, fontSize: "0.75rem", fontVariant: "small-caps" }}>{type?.icon} {type?.label}</span>
                                  {entry.title && <span style={{ color: G.dmBlue, fontSize: "0.85rem", fontWeight: "bold" }}>{entry.title}</span>}
                                  <span style={{ color: G.dmBlueFaint, fontSize: "0.72rem" }}>{entry.author} · {entry.date}</span>
                                </div>
                                <div style={{ color: "#6a8aaa", fontSize: "0.85rem", lineHeight: "1.6" }}>{entry.content}</div>
                              </div>
                              <button onClick={() => deleteEntry(entry.id)} style={{ background: "transparent", border: "1px solid #4a2020", color: "#804040", cursor: "pointer", fontFamily: "inherit", fontSize: "0.75rem", padding: "4px 8px", borderRadius: "2px", flexShrink: 0 }}>Delete</button>
                            </div>
                          );
                        })
                      )}
                    </>
                  )}
                  {activeTab === "guide" && (
                    <div style={{ color: "#6a90b8", lineHeight: "1.9", fontSize: "0.88rem" }}>
                      <p><strong style={{ color: G.dmBlue }}>How the Mystic Tome works:</strong></p>
                      <p>📗 <strong style={{ color: G.dmBlue }}>Known Lore</strong> — Sent to the AI as its knowledge base. Edit between sessions to reveal more world info.</p>
                      <p>✍️ <strong style={{ color: G.dmBlue }}>Player Contributions</strong> — Players submit session recaps, NPC notes, location discoveries, and lore entries from the chat.</p>
                      <p>🔴 <strong style={{ color: G.dmBlue }}>Hidden Secrets</strong> — NEVER sent to the AI. Your private DM notes with zero risk of leaking.</p>
                      <p>🗑️ <strong style={{ color: G.dmBlue }}>Moderation</strong> — Delete any player entry from the Player Entries tab here.</p>
                      <p>💾 <strong style={{ color: G.dmBlue }}>Storage</strong> — Data is saved in each player's browser. Share the URL and players can contribute from their own devices.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
