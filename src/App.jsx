import { useState, useEffect } from "react";

const SECTORS = [
  { id: "food", label: "Food & FMCG", icon: "🌾", baseImportDep: 85, bufferWeeks: 16, freightShare: 0.08, airShare: 0.05 },
  { id: "pharma", label: "Pharmaceuticals", icon: "💊", baseImportDep: 92, bufferWeeks: 6, freightShare: 0.04, airShare: 0.45 },
  { id: "electronics", label: "Electronics", icon: "📱", baseImportDep: 98, bufferWeeks: 4, freightShare: 0.03, airShare: 0.35 },
  { id: "construction", label: "Construction Materials", icon: "🏗️", baseImportDep: 70, bufferWeeks: 8, freightShare: 0.12, airShare: 0.02 },
  { id: "auto", label: "Automotive & Parts", icon: "🚗", baseImportDep: 95, bufferWeeks: 5, freightShare: 0.06, airShare: 0.08 },
  { id: "energy", label: "Energy & Fuel", icon: "⛽", baseImportDep: 30, bufferWeeks: 3, freightShare: 0.15, airShare: 0.00 },
  { id: "retail", label: "General Retail", icon: "🛒", baseImportDep: 88, bufferWeeks: 10, freightShare: 0.07, airShare: 0.15 },
  { id: "hospitality", label: "Hospitality & Tourism", icon: "🏨", baseImportDep: 80, bufferWeeks: 2, freightShare: 0.06, airShare: 0.20 },
];

const SCENARIOS = {
  short: {
    label: "Short De-escalation",
    duration: "< 4 Weeks",
    color: "#22c55e",
    oilRange: [80, 88],
    freightMult: [1.2, 1.4],
    airMult: [1.3, 1.6],
    insuranceMult: 2.0,
    demandShock: 0.05,
    description: "Ceasefire or US-Iran diplomacy within 30 days. Hormuz reopens partially. Buffer stocks absorb most disruption.",
    probability: 28,
  },
  sustained: {
    label: "Sustained Disruption",
    duration: "1–3 Months",
    color: "#f59e0b",
    oilRange: [88, 100],
    freightMult: [1.6, 2.0],
    airMult: [2.0, 3.0],
    insuranceMult: 4.0,
    demandShock: 0.15,
    description: "Hormuz remains contested. Cape rerouting absorbs some volume. War risk premiums surge. Retail prices begin rising.",
    probability: 45,
  },
  prolonged: {
    label: "Prolonged Closure",
    duration: "3–6 Months",
    color: "#f97316",
    oilRange: [100, 120],
    freightMult: [2.5, 3.5],
    airMult: [3.5, 5.0],
    insuranceMult: 8.0,
    demandShock: 0.30,
    description: "Jebel Ali operations severely limited. Structural rerouting via east coast ports. Consumer inflation 8–12%. Panic buying cycles.",
    probability: 20,
  },
  collapse: {
    label: "Full Hormuz Collapse",
    duration: "6+ Months",
    color: "#ef4444",
    oilRange: [120, 160],
    freightMult: [4.0, 8.0],
    airMult: [6.0, 10.0],
    insuranceMult: 15.0,
    demandShock: 0.55,
    description: "Total closure. Overland corridor saturation. UAE enters emergency rationing protocols. Recession risk elevated.",
    probability: 7,
  },
};

const BASE_FREIGHT_RATE = 1572; // USD per FEU China-UAE
const BASE_AIR_RATE = 4.2; // USD per kg
const BASE_INSURANCE = 0.0025; // % hull value
const BASE_OIL = 75; // USD/bbl pre-conflict



function RiskMeter({ value, max = 100, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ width: "100%", height: 6, background: "#1a1a2e", borderRadius: 3, overflow: "hidden" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 3,
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 8px ${color}80`,
        }}
      />
    </div>
  );
}

function Ticker({ items }) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setOffset((o) => (o - 1) % (items.length * 280)), 30);
    return () => clearInterval(id);
  }, [items.length]);
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap", borderTop: "1px solid #ff4d0030", borderBottom: "1px solid #ff4d0030", padding: "6px 0", marginBottom: 24 }}>
      <span style={{ display: "inline-block", transform: `translateX(${offset}px)`, transition: "none", fontSize: 11, color: "#ff9500", fontFamily: "monospace", letterSpacing: 1 }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{ marginRight: 60 }}>
            <span style={{ color: "#ff4d00" }}>▶</span> {item}
          </span>
        ))}
      </span>
    </div>
  );
}

export default function App() {
  const [scenario, setScenario] = useState("sustained");
  const [week, setWeek] = useState(4);
  const [activeTab, setActiveTab] = useState("costs");
  const [animating, setAnimating] = useState(false);

  const sc = SCENARIOS[scenario];

  const freightRate = BASE_FREIGHT_RATE * ((sc.freightMult[0] + sc.freightMult[1]) / 2);
  const airRate = BASE_AIR_RATE * ((sc.airMult[0] + sc.airMult[1]) / 2);
  const oilPrice = (sc.oilRange[0] + sc.oilRange[1]) / 2;
  const insurancePct = BASE_INSURANCE * sc.insuranceMult;

  function getSectorImpact(sector) {
    const freightImpact = sector.freightShare * (freightRate / BASE_FREIGHT_RATE - 1) * 100;
    const airImpact = sector.airShare * (airRate / BASE_AIR_RATE - 1) * 100;
    const energyImpact = (oilPrice / BASE_OIL - 1) * 8;
    const demandImpact = sc.demandShock * 100;
    const bufferRisk = week > sector.bufferWeeks ? ((week - sector.bufferWeeks) / sector.bufferWeeks) * 30 : 0;

    const totalCostEscalation = freightImpact + airImpact + energyImpact;
    const totalBusinessImpact = totalCostEscalation + demandImpact + Math.min(bufferRisk, 40);

    const criticalityScore = Math.min(
      (sector.baseImportDep / 100) * totalBusinessImpact * (1 + (week > sector.bufferWeeks ? 0.5 : 0)),
      100
    );

    return {
      freightImpact: freightImpact.toFixed(1),
      airImpact: airImpact.toFixed(1),
      energyImpact: energyImpact.toFixed(1),
      totalCostEscalation: totalCostEscalation.toFixed(1),
      demandImpact: demandImpact.toFixed(1),
      bufferRisk: bufferRisk.toFixed(1),
      bufferExhausted: week > sector.bufferWeeks,
      criticalityScore: criticalityScore.toFixed(0),
    };
  }

  const tickerItems = [
    `Jebel Ali TEU -38% WoW • War Risk Premium ${(insurancePct * 100).toFixed(2)}% hull value`,
    `Brent Crude $${oilPrice.toFixed(0)}/bbl • ${((oilPrice / BASE_OIL - 1) * 100).toFixed(0)}% above pre-conflict`,
    `Ocean Freight China-UAE $${freightRate.toFixed(0)}/FEU • +${((freightRate / BASE_FREIGHT_RATE - 1) * 100).toFixed(0)}% vs baseline`,
    `Air Cargo AED ${(airRate * 3.67).toFixed(2)}/kg • Capacity -18% global`,
    `Strait of Hormuz: ${scenario === "short" ? "CONTESTED - Partial Transit" : scenario === "collapse" ? "CLOSED - Full Embargo" : "EFFECTIVELY CLOSED"}`,
    `Scenario: ${sc.label} • Duration ${sc.duration} • Probability ${sc.probability}%`,
  ];

  const handleScenarioChange = (s) => {
    setAnimating(true);
    setTimeout(() => {
      setScenario(s);
      setAnimating(false);
    }, 200);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050510",
        color: "#e8e8f0",
        fontFamily: "'Courier New', Courier, monospace",
        padding: "0",
        overflowX: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "28px 32px 16px",
          borderBottom: "1px solid #ff4d0020",
          background: "linear-gradient(180deg, #0a0a1f 0%, #050510 100%)",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "#ff4d00", letterSpacing: 4, marginBottom: 6, textTransform: "uppercase" }}>
              ⚠ LIVE CONFLICT ANALYSIS — UAE PERSPECTIVE
            </div>
            <h1
              style={{
                fontSize: "clamp(20px, 4vw, 32px)",
                fontWeight: 900,
                margin: 0,
                background: "linear-gradient(90deg, #ffffff 0%, #ff9500 60%, #ff4d00 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: -1,
                lineHeight: 1.1,
              }}
            >
              GCC SUPPLY CHAIN DISRUPTION
              <br />
              COST ESCALATION MODEL
            </h1>
            <div style={{ fontSize: 11, color: "#6060a0", marginTop: 8, letterSpacing: 1 }}>
              IRAN CONFLICT 2026 • HORMUZ CLOSURE SCENARIOS • UAE IMPORT IMPACT
            </div>
          </div>
          <div
            style={{
              background: "#0f0f2a",
              border: "1px solid #ff4d0040",
              borderRadius: 8,
              padding: "12px 20px",
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: 10, color: "#ff4d00", letterSpacing: 2, marginBottom: 4 }}>ACTIVE SCENARIO</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: sc.color }}>{sc.label}</div>
            <div style={{ fontSize: 11, color: "#8080c0", marginTop: 2 }}>{sc.duration} • {sc.probability}% probability</div>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ padding: "0 0" }}>
        <Ticker items={tickerItems} />
      </div>

      <div style={{ padding: "0 32px 40px" }}>
        {/* Scenario Selector */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, color: "#6060a0", letterSpacing: 3, marginBottom: 12, textTransform: "uppercase" }}>
            Select Scenario
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Object.entries(SCENARIOS).map(([key, s]) => (
              <button
                key={key}
                onClick={() => handleScenarioChange(key)}
                style={{
                  background: scenario === key ? s.color + "20" : "#0a0a1f",
                  border: `1px solid ${scenario === key ? s.color : "#2020408"}`,
                  borderColor: scenario === key ? s.color : "#202040",
                  color: scenario === key ? s.color : "#6060a0",
                  padding: "10px 18px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 11,
                  fontFamily: "inherit",
                  letterSpacing: 1,
                  fontWeight: scenario === key ? 700 : 400,
                  transition: "all 0.2s",
                  boxShadow: scenario === key ? `0 0 20px ${s.color}30` : "none",
                }}
              >
                <div>{s.label}</div>
                <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{s.duration}</div>
              </button>
            ))}
          </div>
          <div
            style={{
              marginTop: 12,
              padding: "10px 16px",
              background: sc.color + "08",
              border: `1px solid ${sc.color}20`,
              borderRadius: 6,
              fontSize: 11,
              color: "#9090c0",
              lineHeight: 1.6,
            }}
          >
            {sc.description}
          </div>
        </div>

        {/* Week Slider */}
        <div style={{ marginBottom: 28, padding: "16px 20px", background: "#0a0a1f", borderRadius: 8, border: "1px solid #202040" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#6060a0", letterSpacing: 2, textTransform: "uppercase" }}>
              📅 Week into Disruption: <span style={{ color: sc.color, fontWeight: 700 }}>Week {week}</span>
            </div>
            <div style={{ fontSize: 10, color: sc.color }}>
              {week <= 2 ? "ACUTE PHASE" : week <= 8 ? "DISRUPTION PHASE" : week <= 16 ? "ADAPTATION PHASE" : "STRUCTURAL SHIFT"}
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={26}
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            style={{ width: "100%", accentColor: sc.color, cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#404060", marginTop: 4 }}>
            <span>Wk 1</span><span>Wk 4</span><span>Wk 8</span><span>Wk 13</span><span>Wk 20</span><span>Wk 26</span>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 28,
            opacity: animating ? 0.3 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {[
            { label: "Ocean Freight", value: `$${freightRate.toFixed(0)}/FEU`, change: `+${((freightRate / BASE_FREIGHT_RATE - 1) * 100).toFixed(0)}%`, color: sc.color },
            { label: "Air Cargo Rate", value: `$${airRate.toFixed(2)}/kg`, change: `+${((airRate / BASE_AIR_RATE - 1) * 100).toFixed(0)}%`, color: sc.color },
            { label: "Brent Crude", value: `$${oilPrice.toFixed(0)}/bbl`, change: `+${((oilPrice / BASE_OIL - 1) * 100).toFixed(0)}%`, color: sc.color },
            { label: "War Risk Premium", value: `${(insurancePct * 100).toFixed(3)}%`, change: `${sc.insuranceMult}× baseline`, color: sc.color },
            { label: "Capacity Loss", value: "−18% Air", change: "−38% Jebel Ali", color: "#a855f7" },
            { label: "Consumer CPI Δ", value: `+${(sc.demandShock * 100 * 0.4).toFixed(1)}%`, change: "est. impact", color: "#06b6d4" },
          ].map((m, i) => (
            <div
              key={i}
              style={{
                background: "#0a0a1f",
                border: `1px solid ${m.color}25`,
                borderRadius: 8,
                padding: "14px 16px",
              }}
            >
              <div style={{ fontSize: 9, color: "#5050808", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: 10, color: "#808090", marginTop: 4 }}>{m.change}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #202040" }}>
          {[
            { id: "costs", label: "Cost Escalation" },
            { id: "sectors", label: "Sector Risk Matrix" },
            { id: "buffers", label: "Buffer Stock Analysis" },
            { id: "strategy", label: "Mitigation Playbook" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom: `2px solid ${activeTab === t.id ? sc.color : "transparent"}`,
                color: activeTab === t.id ? sc.color : "#5050809",
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "inherit",
                letterSpacing: 1,
                fontWeight: activeTab === t.id ? 700 : 400,
                marginBottom: -1,
                transition: "all 0.2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* COSTS TAB */}
        {activeTab === "costs" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {/* Freight Cost Breakdown */}
              <div style={{ background: "#0a0a1f", border: "1px solid #202040", borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 10, color: "#6060a0", letterSpacing: 3, marginBottom: 16, textTransform: "uppercase" }}>
                  Ocean Freight Cost Build-Up
                </div>
                {[
                  { label: "Base Rate (China→UAE)", value: BASE_FREIGHT_RATE, color: "#3b82f6" },
                  { label: "Conflict Surcharge", value: freightRate - BASE_FREIGHT_RATE - 1200, color: sc.color },
                  { label: "War Risk Add-on", value: 800, color: "#ef4444" },
                  { label: "Rerouting Premium (Cape)", value: 400, color: "#a855f7" },
                  { label: "Port Congestion Fee", value: freightRate - BASE_FREIGHT_RATE - 800 - 400, color: "#f97316" },
                ].map((item, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "#8080c0" }}>{item.label}</span>
                      <span style={{ fontSize: 11, color: item.color, fontWeight: 700 }}>${Math.max(0, item.value).toFixed(0)}</span>
                    </div>
                    <RiskMeter value={Math.max(0, item.value)} max={freightRate} color={item.color} />
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #303050", paddingTop: 12, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#e0e0f0", fontWeight: 700 }}>TOTAL / FEU</span>
                  <span style={{ fontSize: 16, color: sc.color, fontWeight: 900 }}>${freightRate.toFixed(0)}</span>
                </div>
              </div>

              {/* Scenario Probability Matrix */}
              <div style={{ background: "#0a0a1f", border: "1px solid #202040", borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 10, color: "#6060a0", letterSpacing: 3, marginBottom: 16, textTransform: "uppercase" }}>
                  Scenario Probability Matrix
                </div>
                {Object.entries(SCENARIOS).map(([key, s]) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: key === scenario ? s.color : "#6060a0", fontWeight: key === scenario ? 700 : 400 }}>
                        {s.label}
                      </span>
                      <span style={{ fontSize: 11, color: s.color, fontWeight: 700 }}>{s.probability}%</span>
                    </div>
                    <RiskMeter value={s.probability} max={100} color={s.color} />
                    <div style={{ fontSize: 9, color: "#404060", marginTop: 2 }}>
                      Oil: ${s.oilRange[0]}–${s.oilRange[1]}/bbl • Freight: {s.freightMult[0]}–{s.freightMult[1]}× base
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Escalation over Time Table */}
            <div style={{ background: "#0a0a1f", border: "1px solid #202040", borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 10, color: "#6060a0", letterSpacing: 3, marginBottom: 16, textTransform: "uppercase" }}>
                Cost Escalation Timeline — {sc.label}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #303050" }}>
                      {["Week", "Ocean Freight/FEU", "Air Cargo/kg", "Oil $/bbl", "Insurance % Hull", "Consumer CPI Δ", "Risk Level"].map((h) => (
                        <th key={h} style={{ padding: "8px 12px", color: "#5050809", textAlign: "left", fontWeight: 400, letterSpacing: 1, fontSize: 9, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 4, 6, 8, 13, 20, 26].map((w) => {
                      const wProg = w / 26;
                      const wFreight = BASE_FREIGHT_RATE * (1 + (sc.freightMult[0] - 1 + (sc.freightMult[1] - sc.freightMult[0]) * wProg));
                      const wAir = BASE_AIR_RATE * (1 + (sc.airMult[0] - 1 + (sc.airMult[1] - sc.airMult[0]) * wProg));
                      const wOil = sc.oilRange[0] + (sc.oilRange[1] - sc.oilRange[0]) * wProg;
                      const wIns = BASE_INSURANCE * (1 + (sc.insuranceMult - 1) * wProg);
                      const wCPI = sc.demandShock * wProg * 40;
                      const riskScore = (wFreight / BASE_FREIGHT_RATE + wAir / BASE_AIR_RATE + wOil / BASE_OIL) / 3;
                      const riskColor = riskScore < 1.5 ? "#22c55e" : riskScore < 2.5 ? "#f59e0b" : riskScore < 4 ? "#f97316" : "#ef4444";
                      const riskLabel = riskScore < 1.5 ? "LOW" : riskScore < 2.5 ? "ELEVATED" : riskScore < 4 ? "HIGH" : "CRITICAL";
                      const isCurrentWeek = w === week;
                      return (
                        <tr key={w} style={{ borderBottom: "1px solid #1a1a3020", background: isCurrentWeek ? sc.color + "08" : "transparent" }}>
                          <td style={{ padding: "8px 12px", color: isCurrentWeek ? sc.color : "#8080c0", fontWeight: isCurrentWeek ? 700 : 400 }}>
                            {isCurrentWeek ? `▶ Wk ${w}` : `Wk ${w}`}
                          </td>
                          <td style={{ padding: "8px 12px", color: "#e0e0f0" }}>${wFreight.toFixed(0)}</td>
                          <td style={{ padding: "8px 12px", color: "#e0e0f0" }}>${wAir.toFixed(2)}</td>
                          <td style={{ padding: "8px 12px", color: "#e0e0f0" }}>${wOil.toFixed(0)}</td>
                          <td style={{ padding: "8px 12px", color: "#e0e0f0" }}>{(wIns * 100).toFixed(3)}%</td>
                          <td style={{ padding: "8px 12px", color: "#e0e0f0" }}>+{wCPI.toFixed(1)}%</td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{ color: riskColor, background: riskColor + "15", padding: "2px 8px", borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>
                              {riskLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTORS TAB */}
        {activeTab === "sectors" && (
          <div>
            <div style={{ fontSize: 11, color: "#6060a0", marginBottom: 20, lineHeight: 1.6 }}>
              Impact analysis at <span style={{ color: sc.color }}>Week {week}</span> under the <span style={{ color: sc.color }}>{sc.label}</span> scenario.
              Buffer exhaustion triggers compounding supply risk beyond the primary cost escalation.
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {SECTORS.map((sector) => {
                const impact = getSectorImpact(sector);
                const critColor =
                  Number(impact.criticalityScore) < 25 ? "#22c55e" :
                  Number(impact.criticalityScore) < 50 ? "#f59e0b" :
                  Number(impact.criticalityScore) < 75 ? "#f97316" : "#ef4444";
                return (
                  <div
                    key={sector.id}
                    style={{
                      background: "#0a0a1f",
                      border: `1px solid ${impact.bufferExhausted ? "#ef444430" : "#202040"}`,
                      borderRadius: 8,
                      padding: "16px 20px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {impact.bufferExhausted && (
                      <div style={{
                        position: "absolute",
                        top: 0, right: 0,
                        background: "#ef4444",
                        color: "white",
                        fontSize: 8,
                        padding: "3px 10px",
                        fontWeight: 700,
                        letterSpacing: 1,
                        borderBottomLeftRadius: 6,
                      }}>
                        ⚠ BUFFER EXHAUSTED
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 28 }}>{sector.icon}</div>
                        <div style={{ fontSize: 9, color: "#505070", marginTop: 2, whiteSpace: "nowrap" }}>{sector.baseImportDep}% imported</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#e0e0f0", marginBottom: 8, fontSize: 13 }}>{sector.label}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                          {[
                            { label: "Ocean Freight Δ", value: `+${impact.freightImpact}%`, color: "#3b82f6" },
                            { label: "Air Cargo Δ", value: `+${impact.airImpact}%`, color: "#a855f7" },
                            { label: "Energy Cost Δ", value: `+${impact.energyImpact}%`, color: sc.color },
                            { label: "Total Cost Δ", value: `+${impact.totalCostEscalation}%`, color: "#f97316", bold: true },
                            { label: "Demand Shock", value: `-${impact.demandImpact}%`, color: "#ef4444" },
                            { label: "Buffer Risk", value: `+${impact.bufferRisk}%`, color: impact.bufferExhausted ? "#ef4444" : "#6060a0" },
                          ].map((m, i) => (
                            <div key={i} style={{ background: "#0f0f25", borderRadius: 4, padding: "6px 8px" }}>
                              <div style={{ fontSize: 8, color: "#505070", letterSpacing: 1, marginBottom: 2 }}>{m.label}</div>
                              <div style={{ fontSize: 13, fontWeight: m.bold ? 900 : 600, color: m.color }}>{m.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ textAlign: "center", minWidth: 70 }}>
                        <div style={{ fontSize: 9, color: "#505070", marginBottom: 6, letterSpacing: 1 }}>CRITICALITY</div>
                        <div
                          style={{
                            fontSize: 32,
                            fontWeight: 900,
                            color: critColor,
                            lineHeight: 1,
                            textShadow: `0 0 20px ${critColor}60`,
                          }}
                        >
                          {impact.criticalityScore}
                        </div>
                        <div style={{ fontSize: 8, color: critColor, marginTop: 4, letterSpacing: 1 }}>
                          {Number(impact.criticalityScore) < 25 ? "LOW" : Number(impact.criticalityScore) < 50 ? "MEDIUM" : Number(impact.criticalityScore) < 75 ? "HIGH" : "CRITICAL"}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <RiskMeter value={Number(impact.criticalityScore)} max={100} color={critColor} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BUFFERS TAB */}
        {activeTab === "buffers" && (
          <div>
            <div style={{ fontSize: 11, color: "#6060a0", marginBottom: 20, lineHeight: 1.6 }}>
              Buffer stock runway vs. current Week {week}. Red zones indicate sectors already past their estimated buffer capacity.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {SECTORS.map((sector) => {
                const exhausted = week > sector.bufferWeeks;
                const pct = Math.min((week / sector.bufferWeeks) * 100, 100);
                const barColor = exhausted ? "#ef4444" : pct > 75 ? "#f97316" : pct > 50 ? "#f59e0b" : "#22c55e";
                const weeksRemaining = Math.max(0, sector.bufferWeeks - week);
                return (
                  <div
                    key={sector.id}
                    style={{
                      background: "#0a0a1f",
                      border: `1px solid ${exhausted ? "#ef444430" : "#202040"}`,
                      borderRadius: 8,
                      padding: 20,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{sector.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#e0e0f0" }}>{sector.label}</span>
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          color: barColor,
                          background: barColor + "15",
                          padding: "3px 8px",
                          borderRadius: 3,
                          fontWeight: 700,
                          letterSpacing: 1,
                        }}
                      >
                        {exhausted ? "⚠ DEPLETED" : `${weeksRemaining}w left`}
                      </span>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 10, color: "#6060a0" }}>
                        <span>Buffer capacity used</span>
                        <span style={{ color: barColor }}>{Math.min(pct, 100).toFixed(0)}%</span>
                      </div>
                      <div style={{ height: 10, background: "#151530", borderRadius: 5, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            height: "100%",
                            background: `linear-gradient(90deg, #22c55e, ${barColor})`,
                            borderRadius: 5,
                            transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                            boxShadow: `0 0 10px ${barColor}40`,
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                      <div style={{ background: "#0f0f25", borderRadius: 4, padding: "8px 10px" }}>
                        <div style={{ fontSize: 8, color: "#505070", marginBottom: 2 }}>BUFFER RUNWAY</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#e0e0f0" }}>{sector.bufferWeeks} wks</div>
                      </div>
                      <div style={{ background: "#0f0f25", borderRadius: 4, padding: "8px 10px" }}>
                        <div style={{ fontSize: 8, color: "#505070", marginBottom: 2 }}>IMPORT DEPENDENCY</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#e0e0f0" }}>{sector.baseImportDep}%</div>
                      </div>
                    </div>
                    {exhausted && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: "8px 10px",
                          background: "#ef444410",
                          border: "1px solid #ef444430",
                          borderRadius: 4,
                          fontSize: 10,
                          color: "#ef4444",
                          lineHeight: 1.5,
                        }}
                      >
                        ⚠ Buffer exhausted {week - sector.bufferWeeks} week(s) ago. Now dependent on real-time supply chain recovery.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STRATEGY TAB */}
        {activeTab === "strategy" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {[
                {
                  title: "🚢 Route Diversification",
                  urgency: "IMMEDIATE",
                  color: sc.color,
                  items: [
                    "Shift ocean volumes to Fujairah & Khor Fakkan (outside Hormuz)",
                    "Activate sea-air hybrid via Piraeus → overland GCC corridor",
                    "Pre-book Cape of Good Hope capacity before saturation",
                    "Renegotiate carrier contracts for contingency routing clauses",
                  ],
                },
                {
                  title: "📦 Inventory Strategy",
                  urgency: "WEEK 1–2",
                  color: "#06b6d4",
                  items: [
                    "Raise buffer stock for critical imports to 16–20 weeks minimum",
                    "Triage by sector criticality: pharma > food > industrial",
                    "Pre-position safety stock in bonded warehouses outside UAE",
                    "Audit vendor lead times and identify dual-source alternatives",
                  ],
                },
                {
                  title: "💰 Cost & Pricing Management",
                  urgency: "WEEK 2–4",
                  color: "#a855f7",
                  items: [
                    "Implement geopolitical surcharge pass-through models for customers",
                    "Review all landed cost calculations to reflect war risk premiums",
                    "Lock in forward freight agreements at current rates before escalation",
                    "Engage UAE freight forwarders for bulk rate consolidation",
                  ],
                },
                {
                  title: "🌐 Supplier Diversification",
                  urgency: "MEDIUM-TERM",
                  color: "#22c55e",
                  items: [
                    "Accelerate India-UAE CEPA sourcing to leverage duty-free advantage",
                    "Expand GCC-origin procurement (Saudi, Jordan, Egypt) for regional goods",
                    "Identify Turkey and Southeast Asia as alternate manufacturing hubs",
                    "Use UAE's free zone ecosystem for bonded stock accumulation",
                  ],
                },
                {
                  title: "📊 Demand Management",
                  urgency: "ACTIVE NOW",
                  color: "#f59e0b",
                  items: [
                    "Communicate proactively to prevent panic buying cycles",
                    "Implement purchase limits for high-risk commodity categories",
                    "Activate demand forecasting models adjusted for conflict scenarios",
                    "Engage UAE government trade bodies (MoEI) for coordination",
                  ],
                },
                {
                  title: "🛡️ Risk & Insurance",
                  urgency: "WEEK 1",
                  color: "#ef4444",
                  items: [
                    "Review all cargo insurance policies for war exclusion clauses",
                    "Upgrade to comprehensive war risk endorsements immediately",
                    "Model business interruption exposure under all 4 scenarios",
                    "Activate trade credit insurance to protect against supplier default",
                  ],
                },
              ].map((card, i) => (
                <div
                  key={i}
                  style={{
                    background: "#0a0a1f",
                    border: `1px solid ${card.color}25`,
                    borderRadius: 8,
                    padding: 18,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e0e0f0" }}>{card.title}</div>
                    <span
                      style={{
                        fontSize: 8,
                        color: card.color,
                        background: card.color + "15",
                        padding: "3px 8px",
                        borderRadius: 3,
                        fontWeight: 700,
                        letterSpacing: 1,
                        whiteSpace: "nowrap",
                        marginLeft: 8,
                      }}
                    >
                      {card.urgency}
                    </span>
                  </div>
                  <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                    {card.items.map((item, j) => (
                      <li key={j} style={{ fontSize: 11, color: "#8080c0", lineHeight: 1.7, marginBottom: 2 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* KPIs to monitor */}
            <div style={{ background: "#0a0a1f", border: "1px solid #202040", borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 10, color: "#6060a0", letterSpacing: 3, marginBottom: 16, textTransform: "uppercase" }}>
                📡 Key Indicators to Monitor — UAE Supply Chain
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                {[
                  { kpi: "Jebel Ali vessel call count", freq: "Daily", source: "DP World / Marine Traffic", threshold: "< 40 calls/day = critical" },
                  { kpi: "War risk insurance premium", freq: "Daily", source: "Lloyd's / JLT Specialty", threshold: "> 0.5% hull = severe" },
                  { kpi: "Cape Brent/BDTI spread", freq: "Daily", source: "Baltic Exchange", threshold: "+150% = route saturation" },
                  { kpi: "Hormuz transit data", freq: "Real-time", source: "MarineTraffic / TankerTrackers", threshold: "0 tankers = full closure" },
                  { kpi: "UAE CPI basket (imports)", freq: "Weekly", source: "UAE FCSA", threshold: "> 3% MoM = inflationary" },
                  { kpi: "Dubai supermarket basket price", freq: "Weekly", source: "Dubai Statistics Centre", threshold: "> 8% rise = structural" },
                  { kpi: "US-Iran diplomatic signals", freq: "Continuous", source: "Reuters / Bloomberg", threshold: "Ceasefire = scenario change" },
                  { kpi: "QatarEnergy LNG output", freq: "Weekly", source: "GIIGNL / Bloomberg", threshold: "< 50% capacity = GCC energy shock" },
                ].map((kpi, i) => (
                  <div key={i} style={{ background: "#0f0f25", borderRadius: 6, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color: "#e0e0f0", fontWeight: 700, marginBottom: 4 }}>{kpi.kpi}</div>
                    <div style={{ fontSize: 9, color: "#505070", marginBottom: 4 }}>📊 {kpi.source} • {kpi.freq}</div>
                    <div style={{ fontSize: 9, color: "#f97316" }}>⚡ {kpi.threshold}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #202040", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 9, color: "#404060", letterSpacing: 1 }}>
            MODEL VERSION 1.0 • BASE RATES: JAN 2026 • SCENARIO CALIBRATION: MARCH 2026 DATA
          </div>
          <div style={{ fontSize: 9, color: "#404060", letterSpacing: 1 }}>
            SOURCES: HAPAG-LLOYD • DP WORLD • BLOOMBERG • BALTIC EXCHANGE • UAE FCSA • MAERSK • LLOYDS
          </div>
        </div>
      </div>
    </div>
  );
}
