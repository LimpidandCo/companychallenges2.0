# Company Challenges Platform — Roadmap

**Last updated**: 2026-01-06  
**Target**: Production-ready for first client, end of January 2026

---

## Modes

- **Collective Mode**: Anonymous URL access. No accounts, no personal data.
- **Individual Mode**: Clerk login, personal progress tracking.

Both share the same foundation. Features toggle per client.

---

## Base Platform (Required)

### Admin Panel
| Feature | Status |
|---------|--------|
| Admin authentication (Clerk) | 🟡 In Progress |
| Client CRUD | 🔴 |
| Challenge CRUD (create, edit, duplicate, archive) | 🔴 |
| Assignment CRUD (create, edit, duplicate) | 🔴 |
| Rich text editor | 🔴 |
| Image uploads | 🔴 |
| Folder organization | 🔴 |

### Content Reuse
| Feature | Status |
|---------|--------|
| Assignment reuse (same assignment in multiple challenges) | 🔴 |
| AssignmentUsage (per-challenge sequencing, visibility, release) | 🔴 |
| "Used in" visibility | 🔴 |
| Assignment library (search, filter, usage count) | 🔴 |
| Variant relationships (translations, difficulty) | 🔴 |
| Challenge duplication | 🔴 |
| Assignment duplication | 🔴 |

### Admin UX
| Feature | Status |
|---------|--------|
| Drag-drop reordering | 🔴 |
| Archive/restore | 🔴 |
| Preview participant view | 🔴 |
| Copy URL | 🔴 |

### Participant Experience
| Feature | Status |
|---------|--------|
| Public challenge view | 🔴 |
| Public assignment view | 🔴 |
| Password gating | 🔴 |
| Scheduled releases | 🔴 |
| Custom URLs (for QR/print) | 🔴 |
| Responsive layouts | 🟡 Foundation |
| Brand color theming | 🔴 |
| Media playback | 🔴 |

### Analytics
| Feature | Status |
|---------|--------|
| Anonymous event tracking | 🔴 |
| Views per challenge/assignment | 🔴 |
| GA4 or custom logging | 🔴 |

### Security
| Feature | Status |
|---------|--------|
| HTTPS | ✅ |
| Password hashing | 🔴 |
| XSS protection | 🔴 |
| Rate limiting | 🔴 |

---

## Extended Scope

### Individual Mode
| Feature | Status |
|---------|--------|
| Clerk auth for participants | 🟡 Integrated |
| Participant profiles | 🔴 |
| Progress tracking | 🔴 |
| Session persistence | 🔴 |

### Collective Enhancements
| Feature | Status |
|---------|--------|
| Sprint structure | 🔴 |
| Announcements | 🔴 |
| Host videos | 🔴 |

### Gamification
| Feature | Status |
|---------|--------|
| Time-based unlocks | 🔴 |
| Milestones | 🔴 |
| Micro-quizzes | 🔴 |
| Collective progress | 🔴 |

---

## Milestones

### M1: Admin Shell
**Goal**: Admin can log in and navigate the panel.

- [x] Clerk admin authentication
- [x] Admin layout with sidebar
- [x] Placeholder pages (Dashboard, Clients, Challenges, Assignments)
- [ ] Supabase connected with tables deployed

### M2: Client Management
**Goal**: Admin can create and manage clients.

- [ ] Client list view
- [ ] Create client (name, logo upload)
- [ ] Edit client
- [ ] Delete client (with safeguards)

### M3: Challenge Management
**Goal**: Admin can create challenges for a client.

- [ ] Challenge list per client
- [ ] Create challenge (internal name, public title, description, brand color)
- [ ] Edit challenge properties
- [ ] Rich text editor for description
- [ ] Image upload for challenge visual
- [ ] Folder/project grouping
- [ ] Archive/restore challenge
- [ ] Duplicate challenge

### M4: Assignment Management
**Goal**: Admin can create standalone assignments.

- [ ] Assignment library view (all assignments)
- [ ] Create assignment (title, description, media URL)
- [ ] Edit assignment
- [ ] Rich text editor for content
- [ ] Image upload for assignment visual
- [ ] Set/remove password
- [ ] Duplicate assignment

### M5: Content Relationships
**Goal**: Admin can add assignments to challenges and reuse them.

- [ ] Add existing assignment to challenge
- [ ] Create new assignment within challenge
- [ ] AssignmentUsage: position, visibility, release date, label
- [ ] Drag-drop reorder assignments
- [ ] Remove assignment from challenge (without deleting)
- [ ] "Used in" view (see which challenges use an assignment)
- [ ] Usage count in assignment library
- [ ] Variant relationships (link translations/difficulty)

### M6: Participant Views
**Goal**: Participants can access challenges via URL.

- [ ] Public challenge page (overview, assignment list)
- [ ] Public assignment page (content, media)
- [ ] Password prompt for protected assignments
- [ ] Scheduled release (hidden or "Available on [date]")
- [ ] Custom URL slugs for challenges
- [ ] Brand color applied to participant views
- [ ] Media embed/playback
- [ ] Navigation (back to overview, complete button)
- [ ] Responsive layout polish

### M7: Admin Polish
**Goal**: Admin experience is efficient and complete.

- [ ] Preview participant view from admin
- [ ] Copy challenge URL to clipboard
- [ ] Search assignments in library
- [ ] Filter by client/usage
- [ ] Inline editing where useful

### M8: Analytics
**Goal**: Basic usage visibility.

- [ ] Track challenge views
- [ ] Track assignment views
- [ ] Track media plays
- [ ] Track password attempts
- [ ] Dashboard with view counts
- [ ] GA4 integration or custom events

### M9: Individual Mode
**Goal**: Authenticated users can track personal progress.

- [ ] Participant login (Clerk)
- [ ] Participant profile in database
- [ ] Challenge enrollment
- [ ] Assignment progress (not started / in progress / completed)
- [ ] Session persistence (resume where left off)
- [ ] Personal dashboard

### M10: Collective Enhancements
**Goal**: Richer collective experience.

- [ ] Sprint structure (group assignments)
- [ ] Sprint intro/recap videos
- [ ] Announcements (admin-posted updates)
- [ ] Editorial milestones

### M11: Gamification
**Goal**: Engagement mechanics.

- [ ] Time-based unlocks (beyond basic scheduling)
- [ ] Reveal moments (dramatic content unlocks)
- [ ] Micro-quizzes (reflective, non-scored)
- [ ] Collective progress ("X% completed this sprint")
- [ ] Milestone celebrations

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 |
| Styling | Tailwind 4 |
| Auth | Clerk |
| Database | Supabase (Postgres) |
| Storage | Supabase Storage |
| Hosting | Vercel |

---

## References

- [PRD](./prd.md) — Source of truth for requirements
- [Architecture](./architecture.md) — Data model, auth flow
- [Sprint 1](./sprints/sprint-1.md) — Current work
