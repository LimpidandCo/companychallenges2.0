# Analytics: Where We Are & How to Enrich It

## Current State

### What we track (in-platform)

All tracking is anonymous (cookie-based session IDs, 24h expiry, no PII).

| Event | When it fires | Stored data |
|---|---|---|
| `challenge_view` | Landing page load | client, challenge, session |
| `assignment_view` | Assignment page load | client, challenge, assignment, sprint, session |
| `assignment_complete` | User clicks Complete | same as above |
| `media_play` | Video starts playing | same + mediaType/duration in metadata |
| `password_attempt` | Password gate submit | same + success/failure in metadata |
| `quiz_response` | **Exists in code but never called** | would store questionId + response |

### What the admin dashboard shows

- 4 stat cards: Challenge Views, Assignment Views, Media Plays, Unique Sessions
- Time-series chart (bar/line/area) — views + sessions over time
- Challenge performance table — per-challenge: views, sessions, assignment views, media plays, completions, engagement rate
- Donut chart — view distribution across challenges
- Quick insights panel — avg daily views, peak day, period trend
- CSV export (raw events, max 10k rows)
- Date range presets: 7 / 30 / 90 / all time

### What we don't track

- No quiz responses flowing to analytics (code exists, never wired up)
- No sprint-level aggregation in dashboard
- No device/browser/OS data
- No geographic data
- No time-on-page or scroll depth
- No referrer/UTM tracking
- No funnel visualization (challenge → assignment → complete)
- No per-client dashboard or export scoping
- No Google Analytics (env var placeholder exists, no integration)
- No real-time view

---

## Gaps That Matter for Clients

Michiel's right — enterprise clients want numbers. The current dashboard gives us the basics but it's self-contained. Here are the practical approaches, from lightweight to full-featured.

---

## Approach A: Enrich the In-Platform Analytics

**What**: Make the existing system significantly more useful without adding third-party dependencies.

### A1. Wire up quiz response tracking (quick win)

The `trackQuizResponse` function exists but is never called from `micro-quiz.tsx`. One-line fix: fire the analytics event when `onResponse` is called. This gives clients visibility into quiz engagement and actual response data.

### A2. Add sprint-level drill-down

Current dashboard only shows challenge-level stats. Add a second level: click a challenge → see per-sprint breakdown (views, completions, engagement rate per sprint). The data is already in `analytics_events.sprint_id` — it's just not aggregated or displayed.

### A3. Add a completion funnel

Track the natural user journey: Challenge View → Assignment View → Assignment Complete. Show drop-off at each stage. This is the metric clients will reference most when justifying the program. The data already exists — it's a query and a visualization.

### A4. Client-scoped analytics view

Today the dashboard shows all challenges across all clients. Add a client filter (or a client-specific analytics page accessible from the client detail view). When presenting to a client, you want to show them *their* data without everything else.

### A5. Richer metadata capture

Extend the `metadata` JSONB on events to capture:
- **User agent** → parse into device type (mobile/desktop/tablet), browser, OS
- **Referrer** → how users arrive (direct link, email click, QR code, etc.)
- **Time-on-page** → fire a `time_spent` event on page unload/visibility change with duration
- **Scroll depth** → percentage of assignment content scrolled (25/50/75/100%)

This doesn't require any new tables — just richer metadata on existing events.

### A6. Scheduled reports / email summaries

Auto-generate a weekly or monthly PDF/email summary per client. Could use a cron job (Vercel cron or Supabase edge function) that queries the same data the dashboard uses and formats it into an email. Clients love receiving these without having to log in.

**Effort**: A1-A3 are small changes (existing data, new queries + UI). A4-A5 are medium. A6 is a standalone feature.

---

## Approach B: Add Google Analytics / External Pixel

**What**: Layer in GA4 (or similar) alongside the in-platform tracking to get the analytics clients are familiar with.

### What it gives you

- **Geographic data** — country, city, language (clients love this for global programs)
- **Device breakdown** — mobile vs desktop usage patterns, screen sizes
- **Session flow** — full funnel visualization built into GA4's exploration reports
- **Real-time view** — live users on the platform right now (good for launch days)
- **Retention/cohort analysis** — return rates over time
- **Referral tracking** — UTM parameters, traffic source attribution
- **Integration with Google ecosystem** — Looker Studio dashboards, BigQuery export, Data Studio

### Implementation

1. Add the GA4 snippet via `next/script` in the root layout (the `NEXT_PUBLIC_GA_MEASUREMENT_ID` env var already exists)
2. Fire custom events matching our existing event types: `challenge_view`, `assignment_view`, `assignment_complete`, `media_play`, `quiz_response`
3. Set custom dimensions: `client_name`, `challenge_name`, `sprint_name`, `assignment_name`
4. Optionally add UTM parameter support to challenge URLs so clients can track which email/QR/link drove traffic

### Trade-offs

- **Pro**: Clients already understand GA. You can share GA access directly. Built-in geo/device/flow/retention analysis. No extra development for reporting.
- **Pro**: Can create per-client Looker Studio dashboards that auto-refresh — very impressive in sales conversations.
- **Con**: Blocked by ad blockers (15-30% of users depending on audience). In-platform tracking is not affected by this.
- **Con**: Adds a third-party data processor — may need to update privacy disclosures.
- **Con**: GA data is GA-shaped. The in-platform data is richer for domain-specific metrics (quiz responses, completion funnels, assignment-level detail).

**Recommendation**: Use both. GA for the broad behavioral picture (geo, device, retention, real-time). In-platform for the domain-specific metrics (quiz responses, completion rates, assignment drill-down). Present GA to clients who want to self-serve; use in-platform for curated reports.

---

## Approach C: Embeddable Client Dashboard

**What**: Build a read-only, client-facing analytics view they can access themselves.

### Concept

- Generate a unique, unguessable URL per client (e.g., `/analytics/c/{client-token}`)
- Or add a simple password-protected page
- Shows only that client's data: challenge performance, sprint breakdown, completion rates, quiz insights
- Designed for non-technical stakeholders — no jargon, clear visualizations, exportable

### What to show

- **Overview**: Total participants (sessions), total completions, overall engagement rate
- **Per-challenge**: Sparkline of activity over time, completion funnel, top-performing assignments
- **Per-sprint**: Completion rate, average time between start and completion
- **Quiz insights**: Response distribution for multiple-choice, average scale ratings, word cloud or summary for reflections
- **Export**: One-click PDF or CSV of the report

### Trade-offs

- **Pro**: Major differentiator. Clients can check progress on their own. Reduces "can you send me the numbers?" emails.
- **Pro**: You control what they see and how it's presented.
- **Con**: Meaningful development effort — new pages, queries, auth flow.
- **Con**: Need to maintain it as features evolve.

---

## What I'd Prioritize

| Priority | Item | Why |
|---|---|---|
| 1 | Wire up quiz tracking (A1) | 30-minute fix, immediately useful data |
| 2 | GA4 integration (B) | Fastest path to geo/device/retention data clients expect |
| 3 | Completion funnel (A3) | The #1 metric clients care about |
| 4 | Client-scoped view (A4) | Makes every client conversation easier |
| 5 | Sprint drill-down (A2) | Natural next level of granularity |
| 6 | Richer metadata (A5) | Time-on-page and referrer are high-signal |
| 7 | Client dashboard (C) | High-impact but high-effort — do once you have paying clients who ask for it |
| 8 | Scheduled reports (A6) | Nice-to-have, builds on everything above |

---

## Quick Reference: Data We Already Have vs. Need

| Metric | Have the data? | Displayed? | Action needed |
|---|---|---|---|
| Challenge views | Yes | Yes | — |
| Assignment views | Yes | Yes | — |
| Completions | Yes | Yes | — |
| Media plays | Yes | Yes | — |
| Password attempts | Yes | No (not in dashboard) | Add to assignment detail view |
| Quiz responses | Schema exists, not tracked | No | Wire up tracking + add dashboard section |
| Unique sessions | Yes | Yes | — |
| Engagement rate | Derived | Yes (per challenge) | Add per sprint |
| Completion funnel | Derivable from existing data | No | Build funnel query + viz |
| Sprint-level stats | Data has sprint_id | No | Aggregate + display |
| Time on page | No | No | Add tracking event |
| Device/browser | No | No | GA4 or extend metadata |
| Geographic | No | No | GA4 |
| Referrer/UTM | No | No | GA4 or extend metadata |
| Per-client filtering | Data has client_id | No | Add filter to dashboard |
