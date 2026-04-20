# DataLens 
An AI Growth Strategy Engine for Fintech

## The Problem

Indian fintech companies lose ~18-25% of customers annually to churn. Traditional analytics tells you *what happened*
DataLens tells you *what to do about it*.

Most analytics tools generate dashboards. DataLens generates decisions.

---

## What I Built

A decision-first analytics system that converts raw customer CSV data into ranked, actionable growth strategies ready to implement.

**Input**: Customer data CSV (any format)
**Output**: Top 3 prioritized actions with simulated impact, reasoning, and affected customer count

---

## Why DataLens for Fintech?

- Built for customer lifecycle challenges — churn prediction, retention optimization, revenue protection
- Works with your existing CSV exports (no vendor lock-in, no integrations needed)
- Deterministic simulation shows exact impact before you commit
- AI chat interface lets any stakeholder explore the "why" behind recommendations

**Target users**: Growth leads, product managers, and churn analysts at Indian fintechs (lending, payments, neobanks, insurtech)

**Market context**: With 400+ fintech startups in India and average CACs rising, retention is the next battleground. A 5% reduction in churn translates to crores in saved revenue.

---

## Architecture

| Stage | Description |
|------|------------|
| CSV Upload | Streaming parser handles large datasets |
| Dataset Validation | Checks for customer ID, target variable, time columns (customer analytics readiness) |
| Feature Engineering | Automatic type inference — numeric, categorical, date |
| Model Training | Logistic Regression, Random Forest, Gradient Boosting in parallel |
| Model Selection | Best model via F1 score |
| Decision Engine | Generates scored actions from model outputs |
| Top Actions | Top 3 recommendations with confidence levels |
| Simulation | Before/after metrics — churn rate, at-risk customers, LTV |
| Chat Interface | AI-powered Q&A with markdown rendering, chart context awareness |

---

## Technical Stack

- **Framework**: Next.js 16 + TypeScript (deployed)
- **AI**: Google Gemini via @ai-sdk/google
- **Chat**: Vercel AI SDK with streaming responses
- **UI**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts
- **Parsing**: Papaparse (streaming CSV)

---

## Innovation: Decisions, Not Dashboards

Traditional analytics = "Your churn rate is 18.2%"

DataLens = "Offer annual contracts to monthly customers — this targets 1,842 high-risk users and reduces churn by 12%. Confidence: 89%. Simulated impact: ₹14.2L saved ARR."

We don't show you data. We show you what to do.

---

## How It Works

1. **Upload** your customer CSV (no preprocessing needed)
2. **Validate** — system checks for customer ID, target variable, time columns
3. **Train** — runs 3 models, picks the best by F1 score
4. **Decide** — generates prioritized actions with impact scores
5. **Simulate** — shows before/after metrics for each action
6. **Chat** — ask "why this action?" or "what about [segment]?" with full context awareness

---

## Key Components

### Decision Engine

Transforms model outputs into scored actions:

```
Action {
  title: "Convert monthly to annual contracts"
  expectedImpact: { delta: -12%, metric: "churn rate", confidence: 89% }
  affectedUsers: 1842
  reasoning: ["contract type = primary churn driver", "monthly users show 3.2x higher churn"]
}
```

### Simulation Engine

Before → After (deterministic, derived from action parameters):

```
Churn Rate: 18.2% → 15.0%
At-risk Customers: 184 → 127
Revenue Impact: +₹14.2L ARR

```

### Chat Interface

Context-aware AI that references your actual data:

- Explains why specific features drive churn
- Justifies action recommendations
- Handles follow-up questions about segments, timing, customer profiles
- Chart interaction: click a chart element → ask about it directly

---

## Data Flow

```
CSV Upload → Validation (customer analytics check)
→ Feature Matrix → Model Training → Predictions
→ Decision Rules → Action Scoring → Top 3 Actions
→ Simulation → UI + Chat Context

```

---

## Why It Scales

1. **No vendor dependency** — works with any CSV, any CRM export
2. **Vertical agnostic** — same engine handles fintech, e-commerce, SaaS churn
3. **Lightweight** — no data pipeline, no infrastructure, no ML platform needed
4. **Indian market fit** — handles regional data quirks (PAN, UPI, multi-language name fields)

---

## Testing with Sample Data

To test DataLens without your own dataset, you can use the provided sample fintech churn dataset:

1. **Download** the sample CSV:.
2. **Upload** it to the DataLens interface.
3. **Run Analysis** to see predicted churn, top drivers, and actionable recommendations.

---

## Limitations & Roadmap

### Current Limitation

Model training and inference currently run in a single browser thread (client-side). This introduces:

- Performance constraints on large datasets (50k+ rows)
- Limited scalability for concurrent users
- No distributed training capability

### In Progress: AWS SageMaker Migration

Migrating the ML layer to AWS SageMaker to:

- Offload training and inference to managed infrastructure
- Enable scalable, low-latency predictions via real-time endpoints
- Support larger datasets without browser limitations

**Target Architecture:**
- Next.js → preprocessing + decision engine
- SageMaker → model inference (probability generation)

This migration preserves the existing decision engine while improving system reliability and scale.