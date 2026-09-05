# Cadence — Brand Context for Instagram Skills

Paste-in context pack. Every field below maps to an `## Input` section of an
`instagram-skills` skill, so a skill can be run without re-reading the PRD.

**Sources:** `_bmad-output/planning-artifacts/product-brief-journey-tracker-2026-02-20.md`,
`docs/prd-journey-tracker-2026-02-20.md`, `docs/plans/2026-02-26-brand-identity-plan.md`.
Strategy and finished copy live in `social-media-kit.md`; this file is raw input only.

> **Naming:** the product shipped as *Journey Tracker* and was renamed **Cadence**
> (commit `302e8a5`). The PRD and brief still say "Journey Tracker" — read every
> occurrence as Cadence.

---

## 1. Product

**One line:** Cadence turns an ambitious goal into daily tasks, a visible streak, and a friend who can see whether you showed up.

**Category:** personal goal-achievement app (App Page). Freemium consumer SaaS.

**The problem, in the brief's own words:** people fail goals for lack of structure and daily accountability, not desire. 92% fail their New Year's resolutions; most long-term goals stall within 2–3 months. Users patch together a note app + a habit tracker + social media, and abandon the stack.

**Six features, in the order they matter to a stranger:**

| Feature | The one-line version |
|---|---|
| Hierarchical goals | Goal → tasks → substeps → phases. The breakdown is the product. |
| Daily streak engine | Streaks earned by real progress on real goals, not by checking a box |
| AI agent | Claude with 23 tools and full CRUD on your goal graph, in chat |
| Template marketplace | Fork a plan someone already ran, instead of starting from zero |
| Friends feed | Friends-only activity feed. Cheers and streak milestones, no strangers |
| Kanban board | Every task across every goal in one 3-column board |

**Differentiators (what the caption is allowed to claim):**
- AI-native, not AI-bolted-on — the agent mutates the real goal graph
- Streaks tied to actual goal progress, not habit checkboxes
- Social *without* the feed noise: friends-only, achievement-only
- Community templates lower the cost of starting

**Not yet sayable:** open source. The OSS release lands after the Instagram launch — keep it out of bio and captions.

---

## 2. Audience

**Primary — Motivated Goal-Setters, 20–45.** Professionals, students, creators running ambitious personal goals: career change, fitness, learning, creative projects, financial milestones. Tech-comfortable, daily web/mobile users.

- **The pain, precisely:** they start strong and lose momentum after **2–4 weeks**. This is the single most postable fact in the whole brief — week 3 is the enemy.
- **Current stack:** Notion/Obsidian notes + a habit tracker + journaling
- **Top 3 needs:** structure → momentum → accountability, in that order

**Secondary — accountability partners.** Arrive through a friend's shared progress; convert to primary.

**Tertiary — template creators.** Power users who publish templates for recognition. The advocate/early-adopter pool.

**For `ig-hashtag-strategist` and `ig-content-planner`:**
- Audience description: *"20–45 professionals, students, and creators who set ambitious personal goals, start strong, and stall in week 3"*
- Account size: **new / 0 followers**. Niche tags under 50k only; broad tags are a category-label touch, nothing more.

---

## 3. Voice

Speak to **momentum and structure**, never willpower or hustle. Practical and encouraging. Never corporate, never preachy. Lead with what the app does for a *stalled* goal, not with a feature list.

House rules (instagram-skills wins over the generic social ruleset):
- **No em dashes.** Use `..`, a comma, or a line break.
- American English.
- Specific numbers over adjectives — "week 3", "60 seconds", "9 half-started goals".
- One CTA per caption, naming the action.

**Voice samples** (approved, for calibration):
> Motivation fades. A streak doesn't let you forget.
>
> Cadence is the space between "I want to" and "I did."
>
> Most goals die in week 3, not week 1. The plan was fine.. the reminder to run it wasn't there.

---

## 4. Visual identity

| Token | Hex | Usage |
|---|---|---|
| `brand-primary` | `#5B50E8` | Primary accent, CTAs |
| `brand-secondary` | `#7B6FFF` | Gradients |
| `brand-light` | `#EAE8FF` | Light text on dark |
| `brand-dark` | `#2D1B8E` | Dark backgrounds |
| `brand-accent` | `#F08080` | Sparing highlight only |
| `brand-muted` | `#8B85C1` | Subdued text, borders |

Source of truth: `tailwind.config.ts` / `src/app/globals.css`. **Do not invent colors.**

Mark: rocket-orbit on lavender, `public/brand-icon.png`, 1024×1024. Never stretched, recolored, or shadowed.

---

## 5. Goal of the account

For `ig-profile-optimizer`, whose output changes entirely by this field:

- **Account goal:** grow a following → drive app signups (a product, not a service or client business)
- **Account type:** must be **Business or Creator**. Personal accounts can't hold a category label and fail Graph API OAuth.
- **Primary caption goal:** **saves**, then shares. This audience saves advice they intend to act on later; week-3 content is inherently save-shaped.
- **Link target:** buildcadence.co

---

## 6. Competitor set

From the brief's gap table — the accounts and tags to point `ig-audience-insights` at:

| Competitor | Their gap (the wedge a caption can use) |
|---|---|
| Todoist / TickTick | Tasks only, no momentum signal |
| Habitica | Gamified habits, no deep goal structure |
| Notion | Flexible but heavy setup, zero accountability |
| Strava & fitness apps | Domain-locked, not general purpose |
| ChatGPT | Ad-hoc advice, nothing persists |

---

## 7. Numbers a caption may cite

All from the brief. Nothing outside this list is sayable as fact.

- 92% of people fail their New Year's resolutions
- Most long-term goals stall within 2–3 months
- Momentum is lost at **2–4 weeks** for the target persona
- Streak milestones the product recognizes: **7, 14, 30, 60, 100 days**
- The AI agent has **23 tools**

**Not sayable yet** — these are internal targets, not results: 1,000 users, 40% D30 retention, 100+ templates, 5-day average streak. Never phrase a target as an achievement.
