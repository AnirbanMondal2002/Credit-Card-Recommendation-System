import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SPEND_CATEGORIES = [
  { id: "lounge", label: "Airport Lounge", icon: "✈️", desc: "Frequent flyer perks" },
  { id: "fuel", label: "Fuel / Petrol", icon: "⛽", desc: "Daily commute savings" },
  { id: "dining", label: "Dining & Food", icon: "🍽️", desc: "Restaurants & delivery" },
  { id: "shopping", label: "Shopping", icon: "🛍️", desc: "Online & offline retail" },
  { id: "travel", label: "Travel & Hotels", icon: "🏨", desc: "Flights, stays, cabs" },
  { id: "groceries", label: "Groceries", icon: "🛒", desc: "Supermarkets & kirana" },
  { id: "movies", label: "Movies & OTT", icon: "🎬", desc: "Entertainment & streaming" },
  { id: "international", label: "International Spends", icon: "🌍", desc: "Forex & travel abroad" },
  { id: "emi", label: "Big Purchases / EMI", icon: "💳", desc: "Electronics, appliances" },
  { id: "cashback", label: "Cashback", icon: "💰", desc: "Savings on everything" },
];

const INCOME_RANGES = [
  { id: "lt3", label: "< ₹3 LPA", sub: "Entry level" },
  { id: "3to6", label: "₹3–6 LPA", sub: "Growing career" },
  { id: "6to12", label: "₹6–12 LPA", sub: "Mid level" },
  { id: "12to25", label: "₹12–25 LPA", sub: "Senior level" },
  { id: "gt25", label: "> ₹25 LPA", sub: "Premium segment" },
];

const FEE_PREFS = [
  { id: "free", label: "Lifetime Free", sub: "₹0 forever", icon: "🎁" },
  { id: "low", label: "Under ₹2,000/yr", sub: "Budget friendly", icon: "💚" },
  { id: "mid", label: "₹2,000–₹5,000/yr", sub: "Mid range", icon: "💛" },
  { id: "premium", label: "Premium (₹5,000+/yr)", sub: "Max benefits", icon: "👑" },
];

const STEPS = ["Your Uses", "Monthly Spend", "Income", "Fee Preference"];

// ── Theme tokens ──────────────────────────────────────────────
const themes = {
  dark: {
    bg: "#0b0b0f",
    bgCard: "linear-gradient(145deg,#141414,#1a1712)",
    bgHeader: "linear-gradient(180deg,#13110e 0%,#0b0b0f 100%)",
    bgInput: "rgba(255,255,255,0.04)",
    bgChip: "rgba(255,255,255,0.03)",
    bgChipSel: "linear-gradient(135deg,rgba(200,169,110,0.18),rgba(200,169,110,0.08))",
    bgOption: "rgba(255,255,255,0.02)",
    bgOptionSel: "rgba(200,169,110,0.1)",
    bgTag: "rgba(200,169,110,0.1)",
    bgNote: "rgba(255,255,255,0.02)",
    bgNoteB: "1px solid rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.08)",
    borderSel: "#c8a96e",
    borderInput: "rgba(200,169,110,0.3)",
    text: "#f0e6d0",
    textSub: "#888",
    textMuted: "#666",
    textCard: "#aaa",
    textTag: "#c8a96e",
    accent: "#c8a96e",
    accentLight: "#e2c97e",
    accentBadge: "linear-gradient(135deg,#c8a96e,#e2c97e)",
    shadow: "0 0 20px rgba(200,169,110,0.12)",
    cardShadow: "0 2px 24px rgba(0,0,0,0.5)",
    toggleBg: "rgba(255,255,255,0.06)",
    toggleBorder: "rgba(255,255,255,0.1)",
    stepDone: "#c8a96e",
    stepPending: "rgba(255,255,255,0.12)",
    pill: "rgba(200,169,110,0.08)",
    pillBorder: "rgba(200,169,110,0.25)",
    loadingShimmer: "rgba(255,255,255,0.06)",
    scrollTrack: "#111",
    scrollThumb: "#333",
    headerDivider: "rgba(255,255,255,0.05)",
  },
  light: {
    bg: "#f5f0e8",
    bgCard: "linear-gradient(145deg,#ffffff,#fdf8f0)",
    bgHeader: "linear-gradient(180deg,#fffdf7 0%,#f5f0e8 100%)",
    bgInput: "rgba(0,0,0,0.03)",
    bgChip: "rgba(0,0,0,0.03)",
    bgChipSel: "linear-gradient(135deg,rgba(160,120,50,0.14),rgba(160,120,50,0.06))",
    bgOption: "rgba(0,0,0,0.02)",
    bgOptionSel: "rgba(160,120,50,0.08)",
    bgTag: "rgba(160,120,50,0.1)",
    bgNote: "rgba(0,0,0,0.02)",
    bgNoteB: "1px solid rgba(0,0,0,0.06)",
    border: "rgba(0,0,0,0.1)",
    borderSel: "#a07832",
    borderInput: "rgba(160,120,50,0.4)",
    text: "#1a1208",
    textSub: "#6b5a3a",
    textMuted: "#9e8a68",
    textCard: "#5a4a2e",
    textTag: "#8a6520",
    accent: "#a07832",
    accentLight: "#c8943c",
    accentBadge: "linear-gradient(135deg,#a07832,#c8943c)",
    shadow: "0 0 20px rgba(160,120,50,0.15)",
    cardShadow: "0 2px 24px rgba(160,120,50,0.1)",
    toggleBg: "rgba(0,0,0,0.05)",
    toggleBorder: "rgba(0,0,0,0.1)",
    stepDone: "#a07832",
    stepPending: "rgba(0,0,0,0.12)",
    pill: "rgba(160,120,50,0.08)",
    pillBorder: "rgba(160,120,50,0.25)",
    loadingShimmer: "rgba(0,0,0,0.05)",
    scrollTrack: "#ede8df",
    scrollThumb: "#c8b896",
    headerDivider: "rgba(0,0,0,0.07)",
  },
};

function Chip({ label, icon, selected, onClick, desc, t }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 3,
        padding: "12px 14px",
        borderRadius: 14,
        border: selected ? `1.5px solid ${t.borderSel}` : `1.5px solid ${t.border}`,
        background: selected ? t.bgChipSel : t.bgChip,
        color: selected ? t.accent : t.textSub,
        cursor: "pointer",
        transition: "all 0.2s",
        width: "100%",
        boxShadow: selected ? t.shadow : "none",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 12, fontFamily: "sans-serif", fontWeight: 600, color: selected ? t.accentLight : t.text, lineHeight: 1.2 }}>{label}</span>
      {desc && <span style={{ fontSize: 10, fontFamily: "sans-serif", color: t.textMuted, lineHeight: 1.3 }}>{desc}</span>}
    </button>
  );
}

function StepIndicator({ step, total, t }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 3,
          width: i === step ? 32 : 14,
          borderRadius: 10,
          background: i <= step ? t.stepDone : t.stepPending,
          transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }} />
      ))}
    </div>
  );
}

function CardResult({ card, index, t }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), index * 160); }, [index]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: "all 0.5s ease",
      background: t.bgCard,
      border: index === 0 ? `1.5px solid ${t.borderSel}` : `1px solid ${t.border}`,
      borderRadius: 20,
      padding: "22px 20px",
      position: "relative",
      overflow: "hidden",
      boxShadow: index === 0 ? t.shadow : t.cardShadow,
    }}>
      {index === 0 && (
        <div style={{
          position: "absolute", top: 14, right: 14,
          background: t.accentBadge,
          color: "#fff",
          fontSize: 9, fontFamily: "sans-serif", fontWeight: 800,
          padding: "4px 12px", borderRadius: 100, letterSpacing: 2,
        }}>TOP PICK</div>
      )}
      <div style={{
        position: "absolute", bottom: -30, right: -30,
        width: 130, height: 130,
        background: `radial-gradient(circle, ${t.accent}12 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{ fontSize: 10, color: t.textMuted, fontFamily: "sans-serif", letterSpacing: 1.5, marginBottom: 4 }}>
        {card.bank?.toUpperCase()}
      </div>
      <div style={{ fontSize: 19, color: t.text, marginBottom: 3, fontFamily: "Georgia,serif", paddingRight: index === 0 ? 80 : 0 }}>
        {card.name}
      </div>
      <div style={{ fontSize: 13, color: t.accent, fontFamily: "sans-serif", marginBottom: 14 }}>
        {card.annual_fee}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {card.tags?.map(tag => (
          <span key={tag} style={{
            padding: "3px 11px", borderRadius: 100,
            background: t.bgTag, color: t.textTag,
            fontSize: 10, fontFamily: "sans-serif", fontWeight: 600,
          }}>{tag}</span>
        ))}
      </div>
      <div style={{ fontSize: 13, color: t.textCard, fontFamily: "sans-serif", lineHeight: 1.75, marginBottom: 16 }}>
        {card.why_recommended}
      </div>
      <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
        <div style={{ fontSize: 10, color: t.textMuted, letterSpacing: 1.5, fontFamily: "sans-serif", marginBottom: 10, fontWeight: 700 }}>
          KEY BENEFITS
        </div>
        {card.key_benefits?.map((b, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
            <span style={{ color: t.accent, fontSize: 11, marginTop: 2, flexShrink: 0 }}>◆</span>
            <span style={{ fontSize: 13, color: t.textCard, fontFamily: "sans-serif", lineHeight: 1.55 }}>{b}</span>
          </div>
        ))}
      </div>
      {card.eligibility && (
        <div style={{
          marginTop: 14, padding: "11px 14px",
          background: t.bgNote, border: t.bgNoteB,
          borderRadius: 10, fontSize: 12, color: t.textMuted, fontFamily: "sans-serif", lineHeight: 1.5,
        }}>
          📋 {card.eligibility}
        </div>
      )}
    </div>
  );
}

function LoadingCard({ t }) {
  return (
    <div style={{
      background: t.bgCard, border: `1px solid ${t.border}`,
      borderRadius: 20, padding: 22,
    }}>
      {[75, 45, 95, 65, 85].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 20 : 12,
          width: `${w}%`,
          background: t.loadingShimmer,
          borderRadius: 6, marginBottom: 12,
          animation: "pulse 1.6s ease-in-out infinite",
          animationDelay: `${i * 0.12}s`,
        }} />
      ))}
    </div>
  );
}

function ThemeToggle({ isDark, onToggle, t }) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? "Switch to Light" : "Switch to Dark"}
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1000,
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: `1px solid ${t.toggleBorder}`,
        background: t.toggleBg,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        transition: "all 0.25s",
        backdropFilter: "blur(12px)",
        boxShadow: isDark ? "0 2px 16px rgba(0,0,0,0.4)" : "0 2px 16px rgba(0,0,0,0.1)",
      }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const t = themes[isDark ? "dark" : "light"];

  const [step, setStep] = useState(0);
  const [uses, setUses] = useState([]);
  const [monthlySpend, setMonthlySpend] = useState("");
  const [income, setIncome] = useState("");
  const [feePref, setFeePref] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const resultsRef = useRef(null);

  const toggleUse = (id) =>
    setUses(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);

  const canNext = () => {
    if (step === 0) return uses.length > 0;
    if (step === 1) return monthlySpend !== "";
    if (step === 2) return income !== "";
    if (step === 3) return feePref !== "";
    return false;
  };

  const getRecommendations = async () => {
    setLoading(true);
    setError("");
    try {
      const selectedUses = uses.map(u => SPEND_CATEGORIES.find(c => c.id === u)?.label).join(", ");
      const selectedIncome = INCOME_RANGES.find(i => i.id === income)?.label;
      const selectedFee = FEE_PREFS.find(f => f.id === feePref)?.label;

      const prompt = `You are an Indian credit card advisor. Recommend top 3 Indian credit cards.
Primary Uses: ${selectedUses}
Monthly Spend: ₹${monthlySpend}
Annual Income: ${selectedIncome}
Fee Preference: ${selectedFee}
Return ONLY JSON array (no markdown):
[{"name":"","bank":"","annual_fee":"","tags":["","",""],"why_recommended":"","key_benefits":["","","",""],"eligibility":""}]`;

      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      let text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Invalid JSON");
      setResults(JSON.parse(jsonMatch[0]));
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      console.error(e);
      setError("AI failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0); setUses([]); setMonthlySpend("");
    setIncome(""); setFeePref(""); setResults(null); setError("");
  };

  const btnStyle = (active) => ({
    padding: "14px 32px",
    borderRadius: 14,
    border: "none",
    background: active ? t.accentBadge : t.loadingShimmer,
    color: active ? "#fff" : t.textMuted,
    cursor: active ? "pointer" : "not-allowed",
    fontSize: 14,
    fontFamily: "sans-serif",
    fontWeight: 700,
    transition: "all 0.2s",
    boxShadow: active ? t.shadow : "none",
  });

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "Georgia,'Times New Roman',serif", transition: "background 0.3s,color 0.3s" }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:.9}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
        input:focus{outline:none}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:${t.scrollTrack}}
        ::-webkit-scrollbar-thumb{background:${t.scrollThumb};border-radius:2px}
        @media(max-width:480px){
          .spend-grid{grid-template-columns:repeat(2,1fr) !important}
          .nav-row{flex-direction:column !important}
          .nav-row button{width:100% !important;max-width:100% !important}
        }
      `}</style>

      <ThemeToggle isDark={isDark} onToggle={() => setIsDark(d => !d)} t={t} />

      {/* ── HEADER ── */}
      <div style={{
        padding: "48px 24px 32px",
        textAlign: "center",
        background: t.bgHeader,
        borderBottom: `1px solid ${t.headerDivider}`,
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 16px",
          border: `1px solid ${t.pillBorder}`,
          borderRadius: 100,
          fontSize: 9, letterSpacing: 3.5, color: t.accent,
          fontFamily: "sans-serif", fontWeight: 700, marginBottom: 18,
          background: t.pill,
        }}>
          ✦ AI · POWERED · ADVISOR ✦
        </div>
        <h1 style={{
          fontSize: "clamp(28px,6vw,46px)",
          fontWeight: 400,
          margin: "0 0 10px",
          background: isDark
            ? "linear-gradient(135deg,#f0e6d0 30%,#c8a96e)"
            : "linear-gradient(135deg,#1a1208 30%,#a07832)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.5px",
          lineHeight: 1.15,
        }}>
          Credit Card Concierge
        </h1>
        <p style={{ color: t.textSub, margin: 0, fontSize: 14, fontFamily: "sans-serif", lineHeight: 1.6 }}>
          Tell us how you spend — we'll find your perfect card
        </p>
      </div>

      {/* ── MAIN ── */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "36px 16px 80px", width: "100%" }}>

        {!results && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <StepIndicator step={step} total={STEPS.length} t={t} />

            {/* Step header */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 10, color: t.accent, fontFamily: "sans-serif", letterSpacing: 2.5, marginBottom: 8, fontWeight: 700 }}>
                STEP {step + 1} OF {STEPS.length} — {STEPS[step].toUpperCase()}
              </div>
              <div style={{ fontSize: "clamp(20px,4vw,26px)", color: t.text, lineHeight: 1.3 }}>
                {step === 0 && "What do you spend on?"}
                {step === 1 && "Monthly credit card spend?"}
                {step === 2 && "Your annual income?"}
                {step === 3 && "Annual fee preference?"}
              </div>
              <div style={{ fontSize: 13, color: t.textMuted, fontFamily: "sans-serif", marginTop: 6 }}>
                {step === 0 && "Select all that apply — more selections = better matches"}
                {step === 1 && "Approximate is perfectly fine"}
                {step === 2 && "Helps us filter cards you're eligible for"}
                {step === 3 && "Pick what fits your budget best"}
              </div>
            </div>

            {/* ── STEP 0: Categories ── */}
            {step === 0 && (
              <div className="spend-grid" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
                gap: 10,
              }}>
                {SPEND_CATEGORIES.map(cat => (
                  <Chip key={cat.id} icon={cat.icon} label={cat.label} desc={cat.desc}
                    selected={uses.includes(cat.id)} onClick={() => toggleUse(cat.id)} t={t} />
                ))}
              </div>
            )}

            {/* ── STEP 1: Monthly Spend ── */}
            {step === 1 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ position: "relative", display: "inline-block", width: "100%", maxWidth: 320 }}>
                  <span style={{
                    position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)",
                    fontSize: 22, color: t.accent, fontFamily: "sans-serif", pointerEvents: "none",
                  }}>₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 25000"
                    value={monthlySpend}
                    onChange={e => setMonthlySpend(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "18px 18px 18px 46px",
                      fontSize: 26,
                      background: t.bgInput,
                      border: `1.5px solid ${t.borderInput}`,
                      borderRadius: 16,
                      color: t.text,
                      fontFamily: "Georgia,serif",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>
                  {["5000","15000","30000","50000","100000"].map(v => (
                    <button key={v} onClick={() => setMonthlySpend(v)} style={{
                      padding: "8px 16px", borderRadius: 100,
                      border: monthlySpend === v ? `1.5px solid ${t.accent}` : `1px solid ${t.border}`,
                      background: monthlySpend === v ? t.bgOptionSel : "transparent",
                      color: monthlySpend === v ? t.accent : t.textSub,
                      cursor: "pointer", fontSize: 13, fontFamily: "sans-serif",
                      transition: "all 0.15s",
                    }}>
                      ₹{parseInt(v).toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 2: Income ── */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {INCOME_RANGES.map(r => (
                  <button key={r.id} onClick={() => setIncome(r.id)} style={{
                    padding: "16px 20px",
                    borderRadius: 14,
                    border: income === r.id ? `1.5px solid ${t.borderSel}` : `1.5px solid ${t.border}`,
                    background: income === r.id ? t.bgOptionSel : t.bgOption,
                    color: income === r.id ? t.accentLight : t.text,
                    cursor: "pointer",
                    fontFamily: "Georgia,serif",
                    textAlign: "left",
                    transition: "all 0.2s",
                    boxShadow: income === r.id ? t.shadow : "none",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontSize: 16 }}>{r.label}</span>
                    <span style={{ fontSize: 11, color: t.textMuted, fontFamily: "sans-serif" }}>{r.sub}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ── STEP 3: Fee Preference ── */}
            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {FEE_PREFS.map(f => (
                  <button key={f.id} onClick={() => setFeePref(f.id)} style={{
                    padding: "16px 20px",
                    borderRadius: 14,
                    border: feePref === f.id ? `1.5px solid ${t.borderSel}` : `1.5px solid ${t.border}`,
                    background: feePref === f.id ? t.bgOptionSel : t.bgOption,
                    color: feePref === f.id ? t.accentLight : t.text,
                    cursor: "pointer",
                    fontFamily: "Georgia,serif",
                    textAlign: "left",
                    transition: "all 0.2s",
                    boxShadow: feePref === f.id ? t.shadow : "none",
                    display: "flex", alignItems: "center", gap: 14,
                  }}>
                    <span style={{ fontSize: 20 }}>{f.icon}</span>
                    <span>
                      <div style={{ fontSize: 16 }}>{f.label}</div>
                      <div style={{ fontSize: 11, color: t.textMuted, fontFamily: "sans-serif", marginTop: 2 }}>{f.sub}</div>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* ── NAV BUTTONS ── */}
            <div className="nav-row" style={{ display: "flex", justifyContent: "space-between", marginTop: 32, gap: 12 }}>
              {step > 0 ? (
                <button onClick={() => setStep(s => s - 1)} style={{
                  padding: "14px 24px", borderRadius: 14,
                  border: `1px solid ${t.border}`,
                  background: "transparent", color: t.textSub,
                  cursor: "pointer", fontSize: 14, fontFamily: "sans-serif",
                  flexShrink: 0,
                }}>← Back</button>
              ) : <div />}

              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => canNext() && setStep(s => s + 1)}
                  disabled={!canNext()}
                  style={{ ...btnStyle(canNext()), flex: 1, maxWidth: 220 }}
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={() => canNext() && getRecommendations()}
                  disabled={!canNext() || loading}
                  style={{ ...btnStyle(canNext()), flex: 1, maxWidth: 280 }}
                >
                  ✦ Find My Cards
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div ref={resultsRef} style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{
                display: "inline-block", width: 44, height: 44,
                border: `2px solid ${t.border}`,
                borderTop: `2px solid ${t.accent}`,
                borderRadius: "50%",
                animation: "spin 0.9s linear infinite",
                marginBottom: 18,
              }} />
              <div style={{ color: t.accent, fontSize: 15, fontFamily: "sans-serif", fontWeight: 600 }}>
                Analysing your profile...
              </div>
              <div style={{ color: t.textMuted, fontSize: 12, fontFamily: "sans-serif", marginTop: 5 }}>
                Comparing 50+ cards across all major Indian banks
              </div>
            </div>
            {[0,1,2].map(i => <div key={i} style={{ marginBottom: 14 }}><LoadingCard t={t} /></div>)}
          </div>
        )}

        {/* ── RESULTS ── */}
        {results && !loading && (
          <div ref={resultsRef} style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                display: "inline-block",
                padding: "5px 18px",
                border: `1px solid ${t.pillBorder}`,
                borderRadius: 100,
                fontSize: 9, letterSpacing: 3, color: t.accent,
                fontFamily: "sans-serif", fontWeight: 700, marginBottom: 12,
                background: t.pill,
              }}>YOUR MATCHES</div>
              <div style={{ fontSize: "clamp(20px,4vw,26px)", color: t.text }}>
                {results.length} Cards Recommended
              </div>
              <div style={{ fontSize: 12, color: t.textMuted, fontFamily: "sans-serif", marginTop: 6, lineHeight: 1.6 }}>
                Based on: {uses.map(u => SPEND_CATEGORIES.find(c => c.id === u)?.label).join(" · ")}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              {results.map((card, i) => <CardResult key={i} card={card} index={i} t={t} />)}
            </div>

            {error && (
              <div style={{ color: "#e05555", textAlign: "center", fontFamily: "sans-serif", fontSize: 13, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <div className="nav-row" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={reset} style={{
                padding: "13px 28px", borderRadius: 14,
                border: `1.5px solid ${t.pillBorder}`,
                background: "transparent", color: t.accent,
                cursor: "pointer", fontSize: 13, fontFamily: "sans-serif",
              }}>← Start Over</button>
              <button onClick={getRecommendations} style={{
                padding: "13px 28px", borderRadius: 14,
                border: `1px solid ${t.border}`,
                background: t.bgOption, color: t.textSub,
                cursor: "pointer", fontSize: 13, fontFamily: "sans-serif",
              }}>↻ Refresh Results</button>
            </div>

            <div style={{
              marginTop: 28, padding: "14px 18px",
              background: t.bgNote, border: t.bgNoteB,
              borderRadius: 12, fontSize: 11, color: t.textMuted,
              fontFamily: "sans-serif", lineHeight: 1.6, textAlign: "center",
            }}>
              &copy; All Copywrite Reserved by Anirban Mondal <br></br>
              ⓘ AI-generated recommendations. Fees & eligibility may vary. Verify with your bank before applying.
            </div>
          </div>
        )}

        {error && !loading && !results && (
          <div style={{ textAlign: "center", color: "#e05555", fontFamily: "sans-serif" }}>
            {error}
            <br />
            <button onClick={getRecommendations} style={{
              marginTop: 14, padding: "11px 24px", borderRadius: 12,
              border: "1px solid #e05555", background: "transparent",
              color: "#e05555", cursor: "pointer", fontFamily: "sans-serif",
            }}>Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
}