# Release Notes — February 13, 2026

## Summary

This release delivers the analytics and reporting capabilities prioritized in the February 10 team call and subsequent WhatsApp discussions. Michiel is getting engagement questions from the Essent client -- this release gives the team the tools to answer them: a completion drop-off chart, PDF report export, per-assignment summary CSV, and GA4 route-change tracking (ready to activate with one env var). Also fixes the dialog overflow bug Michiel reported.

---

## Analytics: Completion Drop-off Chart

Added a dedicated **Completion Drop-off** chart to the challenge analytics page. This directly addresses Michiel's request: "if you have a hundred completes for the first assignment, how many will you have for the 10th or the 20th?"

The chart shows:
- A line graph with views (dashed) and completions (solid) plotted per assignment position
- Summary stats: first assignment completions, last assignment completions, total drop-off percentage
- Shaded area under the completions line to make the trend visually obvious
- Filtered by sprint when a sprint filter is active

---

## Analytics: PDF Report Export

New **"PDF Report"** button on the challenge analytics page generates a professional, client-facing PDF document containing:

- Branded header with challenge name and date range
- Overview stat cards (views, assignment views, media plays, completions, sessions, completion rate)
- Sprint breakdown table (if sprints exist)
- Full assignment performance table with positions, views, sessions, completions, and rates
- Completion drop-off summary with visual bars

The PDF is generated client-side using jsPDF -- no server round-trip needed. The filename includes the challenge name for easy identification.

---

## Analytics: Per-Assignment Summary CSV

New **"Summary CSV"** export alongside the existing raw events export. This gives a pre-aggregated table:

| Position | Assignment | Sprint | Views | Unique Sessions | Media Plays | Completions | Password Attempts | Password Successes | Completion Rate % |

This is the format Michiel described wanting -- filterable data he can play with in Excel to analyze engagement patterns and drop-off.

---

## GA4: Route-Change Tracking

The `GoogleAnalytics` provider now includes a `RouteChangeTracker` component that uses `usePathname()` and `useSearchParams()` to fire `page_view` events on every client-side navigation. Previously, only the initial page load was tracked. This is critical for accurate pageview counts in a Next.js SPA.

**To activate GA4**, set this one environment variable in Vercel:
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```
All code is ready -- GA4 script loading, route tracking, and custom events (challenge views, assignment views, completions, media plays, quiz responses) are already wired up.

---

## Analytics: Custom Date Range & Completions

- Both dashboards support **Custom date range** with date inputs (in addition to 7d/30d/90d/All Time presets)
- **Total Completions** stat card added to both overview and challenge dashboards
- Challenge-level stats now fetched server-side scoped to the selected challenge
- CSV filenames include client/challenge name and date range

---

## Dialog Overflow Fix

Redesigned the dialog layout system to use a pinned header/footer pattern:

- `DialogContent`: `flex flex-col` + `overflow-hidden` + `max-h-[85vh]`
- `DialogHeader` / `DialogFooter`: `shrink-0` (always visible)
- Dialog body sections: `overflow-y-auto min-h-0 flex-1` (only scrollable region)
- Fixed 6 dialogs: link-picker, assignment-picker, sprint-form, announcement-form, assignment-usage-editor, milestone-form
- Fixed nested `DialogContent` bug in 3 forms (replaced with plain `<div>`)

---

## Files Changed

| File | What changed |
|---|---|
| `lib/analytics/export-pdf.ts` | **New** — PDF report generator using jsPDF |
| `lib/analytics/ga.ts` | GA4 event helpers (unchanged) |
| `lib/actions/admin-analytics.ts` | `exportAssignmentSummaryCSV`, challengeId on getOverviewStats, custom date range |
| `components/providers/google-analytics.tsx` | Route-change tracker for SPA navigations |
| `app/admin/analytics/[challengeId]/challenge-analytics.tsx` | Drop-off chart, PDF export, summary CSV, custom dates |
| `app/admin/analytics/analytics-dashboard.tsx` | Custom date picker, completions stat card |
| `app/admin/analytics/[challengeId]/page.tsx` | Passes challenge name to client component |
| `components/ui/dialog.tsx` | flex-col layout, overflow-hidden, shrink-0 |
| `components/ui/link-picker.tsx` | Scrollable body section |
| `components/admin/assignment-picker.tsx` | Scrollable body sections |
| `components/admin/sprint-form.tsx` | Flex form wrapper, scrollable body |
| `components/admin/announcement-form.tsx` | Flex form wrapper, replaced nested DialogContent |
| `components/admin/assignment-usage-editor.tsx` | Flex form wrapper, replaced nested DialogContent |
| `components/admin/milestone-form.tsx` | Flex form wrapper, replaced nested DialogContent |

---

## Dependencies Added

- `jspdf` — Client-side PDF generation
- `jspdf-autotable` — Table rendering for jsPDF

---

## Notes

- Build verified clean (`npm run build` — no errors, no type errors).
- Dialog fix verified via Playwright at 1280x720 and 1024x600 viewports.
- No database migrations required.
- GA4 activation requires only setting `NEXT_PUBLIC_GA_MEASUREMENT_ID` in production.
