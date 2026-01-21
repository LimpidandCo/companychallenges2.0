# Company Challenges — Admin Flow Specification

> Consolidated from legacy platform transcripts, rebuild PRD, and current implementation analysis

---

## Overview: The Core Admin Workflow

Based on the three video transcripts documenting the legacy platform, the **essential admin flow** is:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         CORE ADMIN WORKFLOW                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. CLIENTS                    2. CHALLENGES                                │
│   ─────────                     ────────────                                 │
│   List all clients  ──────────► Within client, list challenges               │
│   Add client (name, logo)       Add challenge with:                         │
│   Edit/Delete client              • Internal name (admin)                   │
│                                   • Public title (participant)              │
│                                   • Contact info                            │
│                                   • Brand color                             │
│                                   • Description (rich text)                 │
│                                   • Password instructions                   │
│                                   • Support information                     │
│                                 Get unique URL → Preview → Copy link        │
│                                                                              │
│                                        │                                     │
│                                        ▼                                     │
│                                                                              │
│   3. ASSIGNMENTS (within challenge)                                          │
│   ─────────────────────────────────                                          │
│   List assignments in order (title, subtitle, position)                      │
│   Add/Edit assignment with:                                                  │
│     • Title, Subtitle                                                        │
│     • Description (FULL RICH TEXT - inline, not modal)                      │
│     • Visual (image)                                                         │
│     • Video URL                                                              │
│     • Password (optional)                                                    │
│   Reorder by drag or position change                                        │
│   Each assignment gets unique URL                                            │
│   Preview assignment                                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Current State vs. Required State

### ✅ What's Working Well

| Feature | Status | Notes |
|---------|--------|-------|
| Client CRUD | ✅ Working | Name, logo, mode selection |
| Challenge CRUD | ✅ Working | All fields present |
| Assignment CRUD | ✅ Working | Within challenge context |
| Drag-drop reorder | ✅ Working | For assignments |
| Unique URLs | ✅ Working | `/c/[slug]`, `/a/[slug]` |
| Preview button | ✅ Working | "Preview Public Page" link |
| Password gating | ✅ Working | Hash-based protection |
| Copy URL | ⚠️ Partial | Need more prominent placement |
| Rich text editing | ⚠️ Complicated | Modal-based, not inline |

### ⚠️ What Needs Adjustment

| Issue | Current | Required | Priority |
|-------|---------|----------|----------|
| **Rich text editor** | Opens in separate modal (AdvancedEditor) | Should be more inline/direct | 🔴 High |
| **Challenge form fields** | Missing: contact info, password instructions | Add these fields | 🔴 High |
| **URL prominence** | Shown in small banner | Should be prominent with copy button | 🟡 Medium |
| **Assignment library** | Separate global view | Should primarily be accessed from challenge | 🟡 Medium |
| **Preview flow** | External link opens new tab | Should also have inline preview option | 🟢 Low |

### ❌ Over-Prioritized Features (Nice-to-Have)

These are in the codebase but were explicitly listed as **"nice to have"** or **"advanced"**:

| Feature | Current Status | Should Be |
|---------|---------------|-----------|
| Sprints | Fully implemented | Nice-to-have (feature flag) |
| Announcements | Fully implemented | Nice-to-have (feature flag) |
| Milestones | Fully implemented | Advanced (requires Individual mode) |
| Micro-quizzes | Fully implemented | Nice-to-have |
| Mode selection (individual/hybrid) | Prominent in forms | Should be de-emphasized |
| Feature flags UI | Complex toggle UI | Simpler, collapsed by default |
| Import/Export Excel | Fully implemented | Nice-to-have |

---

## The Required Admin Screens (Priority Order)

### Screen 1: Client List
**Route:** `/admin/clients`

```
┌─────────────────────────────────────────────────────────────────┐
│  Clients                                               [+ Add]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  [Logo]  Acme Corp                    3 challenges    →  │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  [Logo]  TechStart Inc                1 challenge     →  │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  [Logo]  Global Partners              5 challenges    →  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Required Fields (from transcript):**
- Name (required)
- Logo (optional upload)

**Current Implementation Note:** The form also includes Mode and Features - these should be collapsible/advanced settings, not primary.

---

### Screen 2: Client Detail / Challenges
**Route:** `/admin/clients/[id]`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Clients                                                      │
│                                                                 │
│  [Logo]  Acme Corp                              [Edit Client]   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Challenges                                    [+ New Challenge] │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ● AI Innovation Challenge                               │   │
│  │    Q1 2026 Program                     12 assignments    │   │
│  │    companychallenges.com/c/ai-innovation    [Copy] [View]│   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  ○ Leadership 101 (archived)                             │   │
│  │    Manager training series              8 assignments    │   │
│  │    companychallenges.com/c/lead101      [Copy] [View]    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**What this replaces:** Currently challenges are listed globally at `/admin/challenges` with client filters. The transcript shows challenges being accessed within a client context.

**Recommendation:** Keep global challenge list but also add client detail page showing that client's challenges.

---

### Screen 3: Challenge Form
**Modal or Route:** Opens when clicking "New Challenge" or editing

```
┌─────────────────────────────────────────────────────────────────┐
│  New Challenge                                           [×]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Internal Name *                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Q1 2026 AI Innovation Challenge                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Public Title                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ AI Innovation Journey                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ☑ Show public title to participants                            │
│                                                                 │
│  Brand Color                                                    │
│  [●] [●] [●] [●] [●] [●] [●]  #3b82f6                         │
│                                                                 │
│  Description                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [B] [I] [U] | [H1] [H2] | [•] [1.] | [🔗] [📷] [📹]    │   │
│  │─────────────────────────────────────────────────────────│   │
│  │                                                         │   │
│  │ Welcome to the AI Innovation Challenge!                 │   │
│  │                                                         │   │
│  │ This 4-week program will help you...                   │   │
│  │                                                         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🔒 Password Instructions                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Passwords are distributed via scratch cards each week.  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📞 Support Information                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Contact: support@acme.com | Teams: #ai-challenge        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📁 Folder (optional)                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 2026 Programs                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▼ Advanced Settings (collapsed by default)                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Mode: ○ Collective  ○ Individual  ○ Hybrid              │   │
│  │ Features: ☐ Sprints  ☐ Announcements  ☐ etc.           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                    [Cancel]    [Create Challenge]│
└─────────────────────────────────────────────────────────────────┘
```

**Key Changes from Current:**
1. **Inline rich text editor** instead of "Click to edit page" trigger
2. **Password Instructions** field (from transcript: "instruction for use of passwords")
3. **Support Information** field (from transcript: "support information")
4. **Mode/Features collapsed** under "Advanced Settings"

---

### Screen 4: Challenge Detail (Assignments)
**Route:** `/admin/challenges/[id]`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Clients / Acme Corp / AI Innovation Challenge                │
│                                                                 │
│  AI Innovation Challenge                                        │
│  Q1 2026 Program                                                │
│                                                                 │
│  URL: companychallenges.com/c/ai-innovation   [📋 Copy] [👁 View]│
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Assignments                        [+ New] [📚 From Library]   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ≡  1. Introduction to AI Concepts                        │   │
│  │        What is AI and why it matters            [⚙] [👁] │   │
│  │        🔒 Password protected                              │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ≡  2. Getting Started with Prompts                       │   │
│  │        Learn the basics of prompt engineering   [⚙] [👁] │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ≡  3. Advanced Techniques                                │   │
│  │        Take your skills to the next level       [⚙] [👁] │   │
│  │        📅 Releases Jan 22                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▼ Sprints (if enabled)                                         │
│  ▼ Announcements (if enabled)                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**This is already working well.** Key requirements met:
- Drag to reorder (≡ handle)
- Title and subtitle visible
- Password indicator (🔒)
- Settings (⚙) and visibility (👁) controls
- Scheduled release indicator (📅)

---

### Screen 5: Assignment Form
**Modal or Route:** Opens when creating/editing assignment

```
┌─────────────────────────────────────────────────────────────────┐
│  New Assignment                                          [×]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Title *                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Introduction to AI Concepts                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Subtitle                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ What is AI and why it matters                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Description *                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [B] [I] [U] | [H1] [H2] | [•] [1.] | [🔗] [📷] [📹]    │   │
│  │─────────────────────────────────────────────────────────│   │
│  │                                                         │   │
│  │ In this assignment, you'll learn about the             │   │
│  │ fundamentals of Artificial Intelligence...              │   │
│  │                                                         │   │
│  │ ## What You'll Learn                                    │   │
│  │ • Understanding AI basics                               │   │
│  │ • Machine learning vs AI                                │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Visual                               Video                     │
│  ┌─────────────┐                     ┌─────────────┐           │
│  │  [Upload]   │                     │  [Upload]   │           │
│  │  or URL     │                     │  or URL     │           │
│  └─────────────┘                     └─────────────┘           │
│                                                                 │
│  🔒 Password (optional)                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ••••••••                                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ☑ Save to library for reuse in other challenges               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                    [Cancel]    [Create Assignment]│
└─────────────────────────────────────────────────────────────────┘
```

**Key transcript requirements:**
> "All of these areas where you can enter text should be completely editable. Use all the different fonts and sizes, all the different layouts. You have to be able to add links, remove links, embed files, embed pictures, visuals."

**Current Issue:** The editor opens in a separate full-screen modal (`AdvancedEditor`). The transcript implies wanting more inline/direct editing.

---

## Transcript Quotes vs. Implementation

### From Client Admin Transcript:
> "you can add a new client by typing its name and adding a logo"

✅ **Implemented correctly**

### From Challenge Admin Transcript:
> "a name, which is an internal name for us. A title, which is what the client will see. A contact, some contact information. a general background color for the challenge... a description of the challenge, instruction for use of passwords, support information"

⚠️ **Missing:** 
- Contact information field
- Password instructions field
- Support information should be more prominent

### From Challenge Assignments Transcript:
> "these assignments can we get a title here, a subtitle, and you can change their positions relative to each other"

✅ **Implemented correctly** - drag-drop reorder works

> "All of these areas where you can enter Text should be completely editable. Use all the different fonts and sizes, all the different layouts. You have to be able to add links, remove links, embed files, embed pictures, visuals."

⚠️ **Partial:** Rich editing exists but in modal form, not inline

> "every assignment has its own URL as well"

✅ **Implemented correctly** - `/a/[slug]`

> "We link to the different assignments in the platform, and we have analytics for each of the assignments and for each of the challenge."

⚠️ **Analytics exists** but could be more granular per-assignment

---

## Recommended Fixes (Prioritized)

### 🔴 High Priority (Base Requirements)

1. **Add missing challenge fields:**
   - `contact_info` (string)
   - `password_instructions` (string/rich text)
   - Make `support_info` more prominent in form

2. **Simplify rich text editing:**
   - Option A: Make `AdvancedEditor` feel less like a separate app
   - Option B: Add inline TipTap editor for simpler fields
   - The current "click to open editor" pattern is confusing

3. **URL prominence:**
   - Show challenge URL prominently at top of challenge detail
   - Add one-click copy button
   - Show assignment URLs in list

4. **Client → Challenge flow:**
   - Add `/admin/clients/[id]` page showing that client's challenges
   - Currently you have to go to global challenges and filter

### 🟡 Medium Priority (UX Improvements)

5. **Collapse advanced features:**
   - Mode selection → collapsed by default
   - Feature toggles → collapsed by default
   - Sprints/Announcements/Milestones → show only if enabled

6. **Simplify assignment library:**
   - Primary creation flow: from within challenge
   - Library is secondary for reuse/search
   - Current messaging "Create assignments from the challenge page" is correct but form should also allow direct creation

### 🟢 Low Priority (Polish)

7. Preview improvements
8. Better empty states
9. Inline assignment preview

---

## Database Schema Additions

```sql
-- Add missing fields to challenges table
ALTER TABLE challenges ADD COLUMN contact_info text;
ALTER TABLE challenges ADD COLUMN password_instructions text;
-- support_info already exists but may need to be more visible in UI
```

---

## Summary

The rebuild has solid foundations but has **over-invested in advanced features** (sprints, announcements, milestones, micro-quizzes, import/export) while **under-investing in core UX** (inline editing, missing fields, workflow clarity).

**The "weird notion-like editor"** complaint refers to the AdvancedEditor modal - it's a powerful full-screen editor that feels disconnected from the form flow. The legacy platform apparently had more inline editing.

**Priority recommendation:** Focus on the core admin workflow (Client → Challenge → Assignments) with inline editing before polishing advanced features that are explicitly "nice to have."

