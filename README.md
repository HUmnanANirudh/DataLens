# DataLens

## Overview

DataLens is a decision-first analytics system that converts raw tabular data into ranked, actionable strategies.

Input: arbitrary CSV
Output: prioritized actions with quantified impact, reasoning, and simulation

The system does not stop at analysis. It produces decisions.

---

## Architecture

| Stage | Description |
|------|------------|
| CSV Upload | Ingest raw dataset |
| Feature Engineering | Clean + type inference |
| Model Training | Train multiple models |
| Model Selection | Choose best via F1 score |
| Decision Engine | Generate + score actions |
| Top Actions | Return top 3 recommendations |
| Simulation | Evaluate impact of actions |
| Chat Interface | Interactive querying |

---

## Key Components

### 1. CSV Upload + Feature Engine

- Streaming CSV parsing (large datasets supported)
- Automatic column type detection:
  - numeric
  - categorical
  - date
  - target
- Data preview and mapping

---

### 2. Model Layer

Multiple models trained in parallel:

- Logistic Regression
- Random Forest
- Gradient Boosting / XGBoost (or equivalent)

Evaluation metrics:
- F1 Score (primary)
- Precision
- Recall

Model selection:

best_model = argmax(F1 score)\
Only the selected model is used downstream.

---

### 3. Decision Engine

Transforms model outputs into actions.

#### Input:
- churn probabilities
- segment assignments
- feature importance

#### Output:

- Action {
    id
    title
    expectedImpact { delta, metric, confidence }
    affectedUsers
    reasoning[]
}

---

### 4. Action Scoring

Each action is ranked using:

score = impact_weight * expected_lift

- confidence_weight * model_confidence
- coverage_weight * affected_users
- cost_penalty

Breakdown:
- Impact: magnitude of change (e.g. churn reduction)
- Confidence: model certainty
- Coverage: number of users affected
- Cost: implementation penalty

Top 3 actions are selected.

---

### 5. Simulation Engine

Applies action effects to baseline metrics.

before → after

Example:
Churn Rate: 18.2% → 15.0%
At-risk Users: 184 → 127
Simulation is deterministic and derived from action parameters.

---

### 6. Chat Interface

Secondary exploration layer.

Functions:
- explain churn drivers
- describe segments
- justify actions
- surface affected users

Constraints:
- every response references actual data
- every response ties back to actions
- no generic outputs

---

## Data Flow

CSV → Parsed Rows
→ Feature Matrix
→ Model Training
→ Predictions
→ Decision Rules
→ Action Scoring
→ Top Actions
→ Simulation
→ UI + Chat Context

---

## Decision Examples

Action:
Convert monthly users to annual contracts

Reasoning:

- contract type = primary churn driver
- monthly users show 3.2x higher churn

Impact:
-12% churn rate

Affected:
1,842 users

---

## Constraints

- No dependency on external datasets\
- Works on arbitrary tabular input\
- No assumption of domain\
- All intelligence derived from uploaded data

---

## Execution Model

- client handles ingestion + interaction
- worker handles model computation
- API routes coordinate decision + simulation logic

---

## Outcome

Transforms data into:
- ranked actions
- quantified impact
- explainable reasoning
- immediate next steps