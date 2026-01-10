# Sprint 1: Foundation & Core Infrastructure

**Duration**: Week 1–2  
**Goal**: Establish project structure, authentication, database, design system, and admin scaffolding.  
**Status**: 🟡 In Progress

---

## Overview

This sprint builds the foundation for both Collective Mode and Individual Mode. By the end, we'll have:
- Project structure and conventions established
- Clerk authentication integrated (admin protection)
- Supabase database schema deployed
- Design system with CSS variables and core components
- Admin panel shell with navigation
- Public route structure ready

---

## Completed ✅

### 1.1 Project Structure
- [x] Folder structure created (`app/`, `lib/`, `components/`)
- [x] Path aliases configured (`@/lib`, `@/components`)
- [x] `.nvmrc`, `.editorconfig`, `env.example` present

### 1.2 Design System
- [x] CSS variables for colors, spacing, typography, shadows, radii
- [x] Dark mode via `prefers-color-scheme` + `.dark` class
- [x] Base typography and scrollbar styles

### 1.3 Core UI Components
- [x] `Button` – primary/secondary/ghost/destructive variants
- [x] `Input` / `Textarea` – with label, error, hint states
- [x] `Card` – with header/title/description/content/footer
- [x] `Badge` – status indicators
- [x] `Spinner` – loading state

### 1.4 Database Types
- [x] TypeScript types for all entities (Clients, Challenges, Assignments, etc.)
- [x] Types for Individual Mode (Participants, Progress, Enrollments)
- [x] Types for Gamification (Milestones, Quizzes, Announcements)
- [x] Input types for CRUD operations

### 1.5 Clerk Integration
- [x] `@clerk/nextjs` installed
- [x] ClerkProvider wrapper (handles missing keys gracefully)
- [x] Middleware for admin route protection
- [x] Sign-in / Sign-up pages (with dev mode fallback)
- [x] UserButton in admin sidebar

### 1.6 Route Structure
- [x] `/admin/*` – Admin routes (Clerk protected)
- [x] `/c/[slug]` – Public challenge view
- [x] `/a/[slug]` – Public assignment view
- [x] `/sign-in`, `/sign-up` – Auth pages

### 1.7 Admin Layout
- [x] Sidebar with navigation (Dashboard, Clients, Challenges, Assignments)
- [x] Mobile header with menu button
- [x] User menu with Clerk UserButton
- [x] Responsive layout

### 1.8 Documentation
- [x] PRD restructured and cleaned
- [x] Roadmap document with full scope
- [x] Architecture document with data model
- [x] Sprint planning document

---

## Remaining 🔴

### 1.9 Supabase Setup
- [ ] Create Supabase project
- [ ] Add credentials to `.env.local`
- [ ] Run migration SQL
- [ ] Verify tables and RLS policies

### 1.10 Supabase Clients
- [ ] Test browser client connection
- [ ] Test server client connection
- [ ] Verify RLS policies work as expected

### 1.11 Basic CRUD (Optional for Sprint 1)
- [ ] Client create/list/edit (placeholder data for now)

---

## Definition of Done

- [x] Project structure matches spec
- [x] Design tokens defined and dark mode works
- [x] Database types created
- [ ] Supabase connected and tables exist
- [x] Core UI components built
- [x] Admin and public layouts scaffolded
- [x] Clerk auth integrated
- [x] All placeholder pages render without errors
- [x] `npm run build` passes
- [x] `npm run lint` passes (with warnings acceptable)

---

## Next Sprint Preview

**Sprint 2: Core Content Management**
- Rich text editor (TipTap)
- Client CRUD with Supabase
- Challenge CRUD
- Assignment CRUD
- Image uploads (Supabase Storage)

---

## Notes

- Clerk keys not required for local dev (graceful fallback)
- Supabase migration ready at `supabase/migrations/001_initial_schema.sql`
- Admin protection active when Clerk is configured
- Build passes without external services configured
