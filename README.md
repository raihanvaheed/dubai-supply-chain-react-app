# GCC Supply Chain Disruption Cost Escalation Model

A real-time interactive dashboard analyzing the economic impact of potential Hormuz Strait disruption on UAE supply chains and business operations across eight critical sectors.

## Why This Matters

The Strait of Hormuz is a chokepoint through which **~21% of global traded oil** and **35+ million barrels per day** pass. Any prolonged closure would trigger:

- **Immediate freight cost escalation** (100–500% for ocean routes)
- **War risk insurance surges** (2–15× baseline premiums)
- **Oil price volatility** ($80–160/barrel range)
- **Supply chain buffer depletion** across food, pharma, electronics, and automotive sectors
- **Structural inflation** for consumer goods (8–12% CPI impact in severe scenarios)
- **Business interruption risk** for import-dependent UAE economy

This model quantifies those risks in real time.

---

## What This Shows

### Four Disruption Scenarios

| Scenario | Duration | Probability | Oil Range | Key Impact |
|----------|----------|-------------|-----------|-----------|
| **Short De-escalation** | < 4 weeks | 28% | $80–88/bbl | Buffer stocks absorb disruption |
| **Sustained Disruption** | 1–3 months | 45% | $88–100/bbl | Cape rerouting, price inflation begins |
| **Prolonged Closure** | 3–6 months | 20% | $100–120/bbl | Jebel Ali crippled, structural rerouting |
| **Full Collapse** | 6+ months | 7% | $120–160/bbl | Emergency protocols, recession risk |

### Eight Sector Risk Analysis

Track real-time impact on:
- 🌾 **Food & FMCG** (85% import dependent)
- 💊 **Pharmaceuticals** (92% import dependent, air-reliant)
- 📱 **Electronics** (98% import dependent)
- 🏗️ **Construction Materials** (70% import dependent)
- 🚗 **Automotive & Parts** (95% import dependent)
- ⛽ **Energy & Fuel** (30% import dependent)
- 🛒 **General Retail** (88% import dependent)
- 🏨 **Hospitality & Tourism** (80% import dependent)

### Key Metrics Tracked

- **Ocean Freight Costs** (China→UAE, per 40ft container)
- **Air Cargo Rates** (emergency resupply cost)
- **Brent Crude Price** (energy cost driver)
- **War Risk Insurance** (hull value premiums)
- **Buffer Stock Runway** (days until exhaustion per sector)
- **Criticality Scoring** (business impact severity)

---

## How to Use It

### 1. **Select a Scenario**
Click one of the four scenario buttons at the top to model different Hormuz disruption outcomes.

### 2. **Adjust Timeline**
Use the **Week Slider** (1–26 weeks) to see how costs and buffer depletion evolve over time. Watch the risk level shift from ACUTE → DISRUPTION → ADAPTATION → STRUCTURAL SHIFT.

### 3. **Review Key Metrics**
Monitor real-time cost escalation across:
- Ocean freight rates
- Air cargo rates
- Oil prices
- War risk insurance
- Consumer CPI impact

### 4. **Analyze by Sector**
Switch to the **"Sector Risk Matrix"** tab to see per-industry impact:
- Cost escalation breakdown (freight + air + energy)
- Demand shock severity
- Buffer exhaustion timeline
- Overall criticality score (0–100)

### 5. **Monitor Buffer Stocks**
The **"Buffer Stock Analysis"** tab shows:
- How many weeks of supply each sector has
- Real-time depletion rate
- Red-flag sectors already past capacity

### 6. **Review Mitigation Strategies**
The **"Mitigation Playbook"** tab provides actionable response strategies by urgency:
- **IMMEDIATE**: Route diversification to non-Hormuz ports
- **WEEK 1–2**: Inventory buildup and triage
- **WEEK 2–4**: Cost pass-through and pricing adjustments
- **MEDIUM-TERM**: Supplier diversification (India CEPA, GCC, Turkey)

---

## Key Takeaways

✅ **Food sector** most vulnerable to buffer depletion (2–16 week runway)  
✅ **Pharma** most impacted by air cargo cost spikes  
✅ **Electronics** highest import dependency (98%)  
✅ **Energy** least exposed (30% import dependent)  
⚠️ **Worst case (Full Hormuz Collapse)**: 55% demand shock + rerouting chaos  

---

## Technical Stack

- **React 18** with hooks (useState, useEffect)
- **Pure CSS-in-JS** (no external styling library)
- **Interactive components**: Scenario selector, week slider, tab navigation
- **Real-time calculations** based on scenario parameters

## Running Locally

```bash
npm install
npm start
```

Opens at `localhost:3000`.

## Deployment

This app is optimized for **Vercel** static hosting:

```bash
npm run build
```

Deploy via Vercel's GitHub integration for automatic updates.

---

## Data Sources

- HAPAG-LLOYD (container rates)
- DP World (Jebel Ali & port data)
- Bloomberg (commodity prices & spreads)
- Baltic Exchange (freight indices)
- UAE FCSA (CPI baskets)
- Maersk (logistics networks)
- Lloyd's of London (war risk premiums)

---

## Limitations & Assumptions

- Model uses **linear cost escalation** (real-world may be non-linear)
- **Scenario probabilities** based on Mar 2026 geopolitical assessment
- **Buffer stock figures** are sector averages (company-specific variation exists)
- Does **not account for** secondary supply chain cascades or financial contagion

---

## Version

**v1.0** — March 2026 baseline | GCC Supply Chain Resilience Analysis