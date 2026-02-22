---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
inputDocuments:
  - docs/plans/2026-02-18-kanban-feed-visibility-design.md
  - docs/plans/2026-02-20-fix-streak-calculation.md
  - docs/plans/2026-02-18-kanban-feed-visibility-plan.md
  - docs/plans/2026-02-10-ui-consistency-improvements.md
  - docs/plans/2026-02-10-sync-clerk-user-data.md
  - docs/manual-tests/template-creator-names-verification.md
  - docs/manual-tests/email-toggle-verification.md
  - docs/manual-tests/final-smoke-test.md
date: 2026-02-20
author: Alonsooteroseminario
---

# Product Brief: Journey Tracker

---

## Executive Summary

Journey Tracker is a personal goal achievement platform that helps individuals break down ambitious long-term goals into structured, daily-actionable tasks and substeps. It serves motivated adults who struggle with goal follow-through — people who set goals but lose momentum without clear structure and daily accountability. By combining hierarchical goal management, daily streak tracking, a social accountability layer, a template marketplace, and an embedded AI assistant, Journey Tracker uniquely addresses the gap between goal-setting and goal-achieving in a single cohesive tool.

---

## Core Vision

### Problem Statement

Most people fail their goals not because they lack desire, but because they lack structure and daily accountability. Existing productivity tools either offer rigid project management frameworks unsuited to personal goals, or overly simple to-do lists without the depth needed for complex multi-month journeys. There is no mainstream tool that combines:

- Hierarchical breakdown (goal → tasks → substeps → phases)
- Streak-based daily momentum tracking
- Social accountability with friends
- A marketplace of proven goal templates
- An AI coach that understands your full goal graph

### Problem Impact

Without a unified tool, users resort to a patchwork of apps — note-taking apps for structure, habit trackers for streaks, social media for accountability — creating friction, cognitive load, and ultimately abandonment. The result: 92% of people fail their New Year's resolutions; most long-term goals stall within 2–3 months of starting.

### Why Existing Solutions Fall Short

| Solution | Gap |
|----------|-----|
| Todoist / TickTick | Task management only, no streak/momentum |
| Habitica | Gamified habits, not deep goal structures |
| Notion | Flexible but requires heavy setup; no accountability |
| Strava / fitness apps | Domain-specific, not general purpose |
| ChatGPT | Ad-hoc advice, not persistent goal tracking |

None of these solutions offer a **persistent, structured, social, AI-assisted goal tracking experience** in one place.

### Proposed Solution

Journey Tracker provides a full-stack personal achievement platform:

1. **Hierarchical Goal Structure** — Goals contain Tasks, Tasks contain Substeps. Optional Phases group tasks into stages (e.g., "Phase 1: Research").
2. **Daily Streak Engine** — Every completed task/substep records activity. The streak counts consecutive days, creating a powerful daily pull.
3. **AI Agent** — An embedded Claude-powered agent with 23+ tools can create, update, analyze, and report on your goals in natural language.
4. **Template Marketplace** — Fork proven goal templates from the community. Start a "Learn Spanish in 6 months" goal in seconds.
5. **Social Feed** — Share progress with friends. See their wins. Stay accountable together.
6. **Kanban Board** — Visualize all tasks across goals in a 3-column board (Not Started / In Progress / Done) with drag-and-drop.

### Key Differentiators

- **AI-native**: Not bolted-on AI — the agent has full CRUD access to your goal graph via MCP tools.
- **Streak-driven motivation**: Not just habit tracking — streaks are earned by making real progress on real goals.
- **Social without distraction**: A friends-only activity feed focused on achievement, not social media noise.
- **Template ecosystem**: Community-generated goal templates lower the barrier to starting new journeys.
- **Developer-quality architecture**: Built with Next.js 15 App Router, RTK Query, Clerk auth — production-grade from day one.

---

## Target Users

### Primary Users

**Motivated Goal-Setters (Ages 20–45)**

- Professionals, students, and creators who set ambitious personal goals (career change, fitness, learning, creative projects, financial milestones)
- Tech-comfortable: use smartphones and web apps daily
- Pain point: Start strong but lose momentum after 2–4 weeks
- Current behavior: Mix of Notion/Obsidian notes, habit tracking apps, and journaling
- Key need: A system that makes daily progress feel meaningful and compounds over time

### Secondary Users

**Accountability Partners / Friends**

- People in the social graph of primary users
- Use the feed to see friends' progress, react, and stay connected
- May become primary users after discovering the platform through a friend

**Power Users / Template Creators**

- Highly engaged users who create and publish goal templates to the marketplace
- Derive value from community recognition and helping others
- Likely to become advocates and early adopters for new features

### Top 3 User Needs

1. **Structure** — Break overwhelming goals into manageable, daily-actionable pieces
2. **Momentum** — A daily signal that they're making progress (streaks, progress bars, feed)
3. **Accountability** — Knowing someone else can see their progress creates commitment

---

## Business Objectives

### Goals (SMART)

- **Grow to 1,000 active users within 12 months of public launch**, measured by users with at least 1 goal and 1 activity in the past 30 days
- **Achieve a 30-day retention rate of 40%** among users who create at least one goal in their first session
- **Build a template marketplace with 100+ published templates** within 6 months of public launch
- **Reach 7-day average streak length of 5+ days** among active users, validating the streak mechanics drive daily engagement
- **Establish the AI agent as a differentiator** — target 50% of active users initiating at least one AI conversation per week

### Success Metrics

- **Daily Active Users (DAU)** and DAU/MAU ratio (target: 30%)
- **Streak continuation rate**: % of users with active streak who log activity the following day (target: 60%)
- **Goal completion rate**: % of goals with all tasks marked complete (target: 20% over 90 days)
- **Template fork rate**: Templates that are forked within 7 days of publishing (target: 30%)
- **AI agent engagement**: % of active users using AI chat weekly (target: 50%)
- **D7 / D30 retention**: 7-day retention 50%, 30-day retention 40%

### Business Value

Journey Tracker creates value through:
- **Consumer SaaS subscription**: Freemium model with premium features (advanced analytics, unlimited goals, AI usage)
- **Network effects**: Template marketplace and social feed increase value as user base grows
- **Data moat**: Personalized goal data and completion patterns enable better AI recommendations over time

---

## Functional Requirements (Current + Planned)

### Currently Implemented

**Goal Management**
- Create, read, update, delete goals with title, description, icon, target date, budget
- Add tasks to goals; add substeps to tasks
- Task phases for grouped milestone tracking
- Status tracking: `not_started | in_progress | completed` (recently added)
- Cost tracking per substep

**Streak System**
- Daily streak tracking based on task/substep completions
- `streakHistory` array as single source of truth (YYYY-MM-DD dates)
- Streak milestones: 7, 14, 30, 60, 100 days
- Timezone-aware calculation using user's local date

**Social & Friends**
- Friends system (send/accept/remove)
- Activity feed with `FeedItem` model
- Feed items for goal creation and streak milestones

**Templates & Marketplace**
- Publish goals as templates (public or friends-only)
- Fork templates to create your own goal
- Marketplace with search, filter by category/difficulty
- Creator attribution with Clerk user sync

**Profile & Settings**
- User profile with name, bio, location, timezone, profile image
- Email notification preferences (master toggle + per-type toggles)
- Activity calendar (heatmap)

**AI Agent**
- Claude-powered chat with 23 MCP tools (full CRUD on goals/tasks/substeps/streaks/friends/profile)
- SSE streaming for real-time responses
- Rate limiting, input sanitization, ownership verification

**UI/UX**
- Responsive design (mobile + desktop)
- Kanban board at `/board` with 3 columns and drag-and-drop
- Dark gradient background; light-themed cards

### Planned (Approved Design Docs)

**Comprehensive Activity Feed**
- Track ALL mutations with before/after diffs (currently only goal_created + streak_milestone)
- New activity types: task/substep create/update/delete/status_changed, cost_updated, note_updated, profile_updated, friend_changed, template_action
- Grouped display for rapid successive changes

**Feed Visibility Configuration**
- Per-category toggles on Profile page
- 8 categories: goal events, task events, substep events, cost/budget, notes, profile, social, streaks
- All categories ON by default; OFF = ActivityLog entry still created but no FeedItem

**Enhanced Kanban Board**
- Filter by date range, priority, goal, and search
- Drill-down: Goals → Tasks → Substeps with breadcrumb navigation
- Full drag-and-drop status transitions

**Landing Page**
- Public landing page at `/` for unauthenticated users
- Hero, features grid, "How It Works", CTA, marketplace link
- Dashboard shown for authenticated users

**Mobile Stats Panel**
- FAB (floating action button) on mobile
- Bottom sheet with streak counter, progress bar, quick stats, activity calendar

---

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Performance** | API responses < 300ms for 95th percentile |
| **Availability** | 99.5% uptime (Vercel + MongoDB Atlas) |
| **Security** | Clerk-managed auth; ownership verification on all API routes |
| **Scalability** | Support 10,000 concurrent users without architecture changes |
| **Mobile UX** | Fully responsive; all core flows usable on 375px width |
| **Accessibility** | WCAG 2.1 AA for core user flows |
| **AI Rate Limiting** | 30 agent requests/minute per user |
| **Test Coverage** | > 80% unit test coverage on business logic; all MCP tools tested |
| **TypeScript** | Strict mode; no `any` unless unavoidable |

---

## Scope

### In Scope (Current + Approved Roadmap)

- Hierarchical goal management (goals → tasks → substeps → phases)
- Three-state task/substep status system
- Streak tracking with timezone support
- AI agent with full goal graph access
- Template marketplace with fork/publish
- Friends system and social feed
- Comprehensive activity feed with diff tracking
- Feed visibility preferences
- Kanban board with drill-down and filters
- Profile management with email notifications
- Public landing page
- Mobile-responsive UI with stats FAB

### Out of Scope (Current Phase)

- Native mobile app (iOS / Android)
- Real-time collaborative goal editing (multi-user on same goal)
- Third-party integrations (Google Calendar, Notion, Strava)
- Public goal profiles / shareable links to individual goals
- Paid subscription / billing system
- Advanced AI features (proactive suggestions, goal recommendations)
- Offline mode / PWA

### Future Considerations

- Webhook-based real-time collaboration
- Goal analytics dashboard with projections
- Subscription tiers (Freemium model)
- Push notifications (mobile web)
- Google Calendar sync for deadlines
- Goal coaching marketplace (human coaches)
- API access for power users

---

## Stakeholders

- **Alonsooteroseminario (Owner / Developer)** — High influence. Product vision, engineering, and roadmap decisions.
- **Early Beta Users** — Medium influence. Feedback shapes feature priority and UX decisions.
- **Template Creators** — Medium influence. Community health depends on template quality and creator experience.
- **Clerk / MongoDB / Vercel (Infrastructure Partners)** — Low influence. Platform dependencies; SLA changes would affect availability.

---

## Constraints and Assumptions

### Constraints

- Single developer team: scope must remain achievable without hiring
- MongoDB + Prisma: `Goal.tasks` stored as JSON field limits complex querying
- Vercel serverless: 120-second timeout limit on AI agent route
- Clerk auth: no custom auth logic; dependent on Clerk SLA
- Claude API cost: AI agent usage must be managed via rate limiting to control costs

### Assumptions

- Users have access to a modern browser (Chrome, Firefox, Safari, Edge) and stable internet
- Streak tracking relies on user-provided timezone; incorrect timezone = incorrect streak
- MongoDB Atlas free/shared tier sufficient for development; will need scaling for production
- The Clerk SDK caches user data, so per-request Clerk sync adds minimal latency
- Users will self-serve onboarding without guided tutorials in the current phase

---

## Success Criteria

Beyond metrics, success looks like:

- Users returning daily without external reminders because their streak motivates them
- Template creators publishing templates organically without incentives
- AI agent reducing the "blank slate" problem — new users create their first goal in under 2 minutes with AI help
- Friends tagging each other in feed activity naturally
- Zero data integrity issues with goal/task completion tracking (streaks always accurate)
- The product is stable enough for the founder to share publicly without embarrassment

---

## Timeline

### Current State (February 2026)

Core features shipped and stable:
- Goal management, streak system, AI agent, templates, friends, kanban, email notifications

### Upcoming Milestones

| Milestone | Target | Status |
|-----------|--------|--------|
| Comprehensive activity feed | March 2026 | Design approved, implementation planned |
| Feed visibility preferences | March 2026 | Design approved, implementation planned |
| Enhanced Kanban with filters | March 2026 | Design approved, implementation planned |
| Public landing page | March 2026 | Design approved, implementation planned |
| Mobile stats FAB | March 2026 | Design approved, implementation planned |
| Private beta launch | April 2026 | Pending |
| Template marketplace expansion (100+ templates) | June 2026 | Pending |
| Public launch | Q3 2026 | Pending |

---

## Risks

- **Risk: Streak inaccuracy erodes user trust**
  - Likelihood: Low (recently fixed with shared utility)
  - Mitigation: Comprehensive unit tests for streak calculation; timezone edge cases covered

- **Risk: AI agent costs exceed budget**
  - Likelihood: Medium (depends on user engagement)
  - Mitigation: Rate limiting (30 req/min per user); context trimming to reduce token usage

- **Risk: MongoDB JSON field limits scalability of tasks data**
  - Likelihood: Medium (at scale, complex queries on task data will be slow)
  - Mitigation: Plan migration path to normalized task model before reaching 10K+ users

- **Risk: Single developer bottleneck**
  - Likelihood: High
  - Mitigation: Comprehensive test suite, CLAUDE.md documentation, and BMAD workflow for systematic feature development

- **Risk: Template marketplace quality degrades with growth**
  - Likelihood: Medium
  - Mitigation: Implement template rating/review system before scaling; curation by founder initially

- **Risk: Social features attract low engagement (ghost network problem)**
  - Likelihood: High in early stage
  - Mitigation: Focus on friend referrals; make it easy to invite friends during onboarding
