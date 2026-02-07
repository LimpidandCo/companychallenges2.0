# Release Notes — February 7, 2026

## Summary

Polish pass addressing findings from run-through #6. Focused on removing unnecessary UI clutter from the public experience, hardening admin data integrity, and improving assignment management workflows.

---

## Public Experience

### Cleaner sprint view

- Removed the hardcoded "Sprint" / "Select a mission to begin" header that sat above sprint cards. The sprint name and description already communicate this — the extra header was redundant.
- Sprint cards now display in a **responsive grid** (1 column on mobile, 2 on tablet, 3 on desktop) instead of a vertical stack. Better use of screen space when there are multiple sprints.
- Replaced sprint **numbers** (1, 2, 3) with a **play icon** on sprint cards and the sprint header badge. Numbers implied a strict sequence that doesn't always apply. Admin panel still shows numbers for drag-to-reorder purposes.

### Quiz improvements

- Removed the "Quick Reflection(s)" header from the quiz section. Quizzes are visually distinct enough on their own — the header added clutter.
- Removed the non-functional **"Submit Response" button**. Quiz responses are now captured automatically:
  - **Multiple choice / Scale**: submitted instantly on selection.
  - **Reflection (text)**: submitted when the user leaves the field (on blur).
  - A "Response recorded" confirmation still appears after submission.

---

## Admin Panel

### Duplicate client name protection

`createClient` and `updateClient` now check for existing clients with the same name (case-insensitive) before saving. If a duplicate is found, the form shows "A client with this name already exists" instead of silently creating a second entry. The update check excludes the current client's own ID so re-saving without changing the name still works.

### Multi-tag filtering in assignment library

The single-select tag dropdown has been replaced with **clickable tag badges**. Click a tag to filter; click again to remove. Multiple tags can be active simultaneously — assignments must match **all** selected tags (AND logic). A "Clear all" button appears when any tags are active.

This same multi-tag filtering has been added to the **"Pick from Library" dialog** inside challenge management.

### Add to Challenge from assignment library

Each assignment in the library now has an **"Add to Challenge"** button (+ icon) in its action column. Clicking it opens a dialog to:

1. Select a target challenge
2. Optionally select a sprint within that challenge
3. Add the assignment

Previously, adding a library assignment to a challenge required navigating to the challenge page first.

---

## Files Changed

| File | What changed |
|---|---|
| `app/(public)/c/[slug]/start/page-client.tsx` | Grid layout, play icons, removed headers |
| `components/public/micro-quiz.tsx` | Auto-submit, removed Submit button + header |
| `lib/actions/clients.ts` | Duplicate name validation on create/update |
| `app/admin/assignments/page-client.tsx` | Multi-tag filter UI + logic |
| `components/admin/assignment-picker.tsx` | Multi-tag filter in library picker dialog |
| `components/admin/assignment-list.tsx` | "Add to Challenge" button + dialog |

---

## Notes

- Build verified clean (`npm run build` — no errors).
- All changes tested via Playwright browser automation against the running dev server.
- No database migrations required — all changes are application-level.
