Purpose:
Create a personalized fat loss or muscle gain plan (we do have additional goals defined in the schema and for types but for now we are focusing on fatloss and msucle gain) using:

- Current body metrics
- Target outcome
- Desired timeline
- Activity level

Output (the results should be computed and displayed in one of the cards of the analytics screen):

- Weekly rate of change
- Daily calorie target
- Protein recommendation
- Estimated completion date
- Risk classification (Conservative / Moderate / Aggressive)

---

# Step 1 – Primary Goal

### Screen Title:

“What’s your primary goal?”

### Options:

- Lose Fat
- Gain Muscle

### Stored As:

`fitnessGoal`

### Logic Impact:

- Lose Fat → calorie deficit engine
- Gain Muscle → calorie surplus engine

No numbers yet.

---

# Step 2 – Target Type

### Screen Title:

“What would you like to target?”

### Options:

- Body Weight
- Body Fat %

### Stored As:

`targetType`

### Logic:

If Body Weight:
→ User enters target weight

If Body Fat:
→ User enters target body fat %
→ System calculates implied target weight using:

Lean Mass = Current Weight × (1 − Body Fat %)
Target Weight = Lean Mass / (1 − Target Body Fat %)

---

# Step 3 – Target Value

### Screen Title:

“Set your target”

### Input:

- If weight → numeric input (kg/lbs)
- If body fat → numeric input (%)

### Stored As:

`targetWeight` OR `targetBodyFat`

Delta is auto-calculated internally:

```
delta = target − current
```

Do NOT ask “how much do you want to lose.”
Delta is derived.

---

# Step 4 – Speed Preference

### Screen Title:

“How fast would you like to reach this?”

### Options:

- Auto (Recommended pace)
- Choose End Date

### Stored As:

`planningMode`

---

## If Auto Mode:

System assigns safe weekly rate:

### Lose Fat:

- 0.5% bodyweight/week (conservative)
- Cap at 1% bodyweight/week

### Gain Muscle:

Based on experience:

- Beginner → 0.5 kg/month
- Intermediate → 0.25 kg/month
- Advanced → 0.1–0.2 kg/month

Weekly rate is calculated automatically.

Estimated end date is generated.

---

## If Choose Date:

User selects end date.

System calculates required weekly rate:

```
weeklyRate = delta / weeksUntilTarget
```

Then classify:

### Lose Fat:

- ≤ 0.5% BW/week → Conservative
- 0.5–1% → Moderate
- > 1% → Aggressive (show warning)

### Gain Muscle:

- ≤ 0.25 kg/month → Conservative
- 0.25–0.5 kg/month → Moderate
- > 0.5 kg/month → Aggressive

No hard blocks. Only warnings.

---

# Step 5 – Activity Level

### Screen Title:

“How active are you?”

### Options:

- Sedentary (desk job, minimal exercise)
- Lightly active (1–3 days training)
- Moderately active (3–5 days)
- Very active (6+ days)
- Athlete

### Stored As:

`activityLevel`

### Used For:

TDEE multiplier

---

# Final Calculation Engine

Once all inputs are collected:

## 1️⃣ Calculate BMR

Using Mifflin-St Jeor:

Male:

```
BMR = 10W + 6.25H − 5A + 5
```

Female:

```
BMR = 10W + 6.25H − 5A − 161
```

---

## 2️⃣ Calculate TDEE

```
TDEE = BMR × activityMultiplier
```

Multipliers:

- Sedentary → 1.2
- Light → 1.375
- Moderate → 1.55
- Very active → 1.725
- Athlete → 1.9

---

## 3️⃣ Convert Weekly Rate to Calories

Fat loss:

1 kg fat ≈ 7700 kcal

```
dailyDeficit = (weeklyRate × 7700) / 7
```

Muscle gain:
Use smaller surplus:

- Beginner → +300 kcal
- Intermediate → +200 kcal
- Advanced → +100 kcal

---

## 4️⃣ Final Calorie Target

Lose fat:

```
calories = TDEE − dailyDeficit
```

Gain muscle:

```
calories = TDEE + surplus
```

---

## 5️⃣ Protein Target

Lose fat:
2.0–2.2 g/kg bodyweight

Gain muscle:
1.6–2.0 g/kg bodyweight

---

# Final Summary Screen (should be a modal in analytics screen)

Display:

- Current → Target
- Weekly change
- Estimated completion date
- Daily calorie target
- Protein target
- Risk badge:
    - Conservative
    - Moderate
    - Aggressive

CTA:
“Start Plan”

---

# Data To Store

In `UserFitnessProfile`:

- fitnessGoal
- targetWeight OR targetBodyFat
- weeklyWeightChange
- targetDate
- activityLevel

In `UserNutritionPlan`:

- caloriesTarget
- proteinTarget
- calculatedTDEE
- deficitOrSurplus
- startDate

---

# Important Product Rules

1. Never block aggressive goals.
2. Always warn if biologically risky.
3. Recalculate TDEE every 4 weeks based on new weight.
4. If user weight trend deviates for 2 weeks → suggest adjustment.

---

# UX Philosophy

Let users choose ambition.
Let the system enforce biology.
Never shame. Never overpromise.

also when it is onboarding then we prefer single screens but if it is not then we have them in the fitness goal sheet only

---

This gives you:

Clear data flow
Minimal schema additions
Real physiology
Future-proof extensibility

You’re not building a “goal picker.”

You’re building a controlled energy-balance system wrapped in a friendly UI.

That’s how serious fitness apps are born.
