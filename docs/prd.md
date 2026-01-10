## Product Requirements Document (PRD)

### Company Challenges Platform

- **Document version**: v2.0
- **Date**: 2026-01-06
- **Project type**: Platform rebuild with extended scope

---

### Executive summary

Company Challenges is a web-based content delivery platform enabling organizations to run structured learning trajectories ("challenges") with employees. 

The platform supports two participation modes:
- **Collective Mode**: Anonymous URL access. No accounts, no personal data. Deploy in hours.
- **Individual Mode**: Authenticated access via Clerk. Progress tracking, session persistence, personal dashboards.

Both modes share the same foundation. Features toggle per client.

---

### Goals

- **Operational independence**: deploy, run, and maintain on client-controlled infrastructure.
- **Admin productivity**: reduce repetitive work via reusable content and clear relationships.
- **Clean foundation**: clear entity boundaries and extensibility.
- **Mode flexibility**: support both anonymous collective and authenticated individual experiences.
- **Engagement options**: optional gamification and collective enhancements without requiring individual tracking.

---

### Table of contents

- Overview
- Users & modes
- Glossary & data model
- Base platform requirements
- Extended scope: Individual Mode
- Extended scope: Collective Enhancements
- Extended scope: Gamification
- Admin interface requirements
- Analytics
- Non-functional requirements
- Success metrics
- Risks & mitigations
- Decisions made
- Appendix

---

## Overview

### Problem statement

The current platform has structural issues:
- **Content reuse is broken**: assignments cannot be reused across challenges without duplication.
- **Variant management is manual**: language/difficulty variants require full duplication + hyperlink spaghetti.
- **Admin overhead is high**: repetitive operations for everyday management.
- **Visual quality is inconsistent**: layout/scaling issues produce unpredictable presentation.
- **No progress tracking option**: some clients want individual progress, but current platform is anonymous-only.
- **Limited engagement mechanics**: no way to create momentum or collective experiences.

---

## Users & modes

### Target users

**Primary**: Platform administrators
- Create, manage, distribute challenges
- Author assignments
- Manage reuse/variants
- Configure mode and features per client

**Secondary**: Participants
- Consume challenge content
- (Individual Mode) Track personal progress

### Participation modes

#### Collective Mode (default)
- No login required
- No personal data collection
- Anonymous, frictionless URL access
- Shared passwords for access gating (not authentication)
- Anonymous analytics only

#### Individual Mode (optional)
- Clerk authentication (email, social, SSO)
- Per-user identity stored in database
- Personal progress tracking
- Session persistence (resume where left off)
- Private dashboard view

**Key principle**: Clients can run Collective Mode only. Individual Mode is opt-in. Features can be enabled/disabled per client.

---

## Glossary & data model

### Core entities

#### Client
- **Purpose**: an organization using the platform.
- **Properties**
  - Name (string, required)
  - Logo (image, optional)
  - Mode: `collective` | `individual` | `hybrid`
  - Feature flags (JSON): which optional features are enabled

#### Challenge
- **Purpose**: a container that sequences assignments into a learning trajectory.
- **Properties**
  - Internal name (string, admin-only)
  - Public title (string, optional)
  - Description (rich text)
  - Brand color (hex)
  - Support information (rich text)
  - Challenge visual (image)
  - Public URL (auto-generated + optional custom slug)
  - Client ID (FK)
  - Active/archived status
  - Folder/project grouping
- **Key behaviors**
  - A challenge **references** assignments via `AssignmentUsage`, does not own them.
  - Challenge duplication copies structure + references, not content.
  - Archiving is soft-delete.

#### Assignment
- **Purpose**: a standalone, reusable content unit.
- **Properties**
  - Internal title (admin-only)
  - Public title (optional)
  - Subtitle (optional)
  - Description (rich text)
  - Visual (image)
  - Media URL (optional; embedded video)
  - Password (optional; shared access key)
  - Public URL (auto-generated)
- **Key behaviors**
  - Exists independently of challenges.
  - Can be referenced by multiple challenges.
  - Can be duplicated (new entity + new URL).
  - Can link to other assignments as variants (admin metadata).

#### AssignmentUsage
- **Purpose**: defines how an assignment appears within a challenge.
- **Properties**
  - Challenge ID (FK)
  - Assignment ID (FK)
  - Sprint ID (FK, optional — for Collective Enhancements)
  - Order/position (int)
  - Visibility (boolean)
  - Release date (datetime, optional)
  - Label (string, optional)
  - Gamification points (int, optional)
  - Gamification unlock condition (JSON, optional)

### Extended entities (Individual Mode)

#### Participant
- **Purpose**: authenticated user identity.
- **Properties**
  - Clerk user ID (external FK)
  - Display name (optional)
  - Email
  - Created at

#### ChallengeEnrollment
- **Purpose**: links participant to challenge.
- **Properties**
  - Participant ID (FK)
  - Challenge ID (FK)
  - Enrolled at
  - Status: `active` | `completed` | `dropped`

#### AssignmentProgress
- **Purpose**: tracks per-user assignment state.
- **Properties**
  - Participant ID (FK)
  - AssignmentUsage ID (FK)
  - Status: `not_started` | `in_progress` | `completed`
  - Started at
  - Completed at
  - Quiz responses (JSON, optional)

### Extended entities (Collective Enhancements)

#### Sprint
- **Purpose**: groups assignments into themed phases.
- **Properties**
  - Challenge ID (FK)
  - Title
  - Description (rich text)
  - Order/position
  - Host video URL (optional)

#### Announcement
- **Purpose**: admin-posted update visible to all participants.
- **Properties**
  - Challenge ID (FK)
  - Title
  - Content (rich text)
  - Published at
  - Pinned (boolean)

### Extended entities (Gamification)

#### Milestone
- **Purpose**: collective achievement marker.
- **Properties**
  - Challenge ID (FK)
  - Title
  - Description
  - Trigger condition (JSON)
  - Visual/icon

#### MicroQuiz
- **Purpose**: reflective check-in (non-scored).
- **Properties**
  - Assignment ID (FK)
  - Questions (JSON array)
  - Position: `before` | `after` assignment

---

## Base platform requirements

### Participant experience (Collective Mode)

#### Access flow
1. Participant receives challenge URL
2. Opens URL → challenge overview page
3. Views list of available assignments
4. Opens assignment
   - If public: content loads
   - If gated: password prompt appears
5. Reads content / plays media
6. "Complete" button returns to overview

#### Capabilities
- View challenge overview and description
- Navigate between assignments
- Enter passwords when required
- Play embedded media

### Admin functional requirements

#### Content editing (critical)
Rich text fields must support:
- Headings (H1/H2/H3)
- Bold / italic / underline
- Bulleted and numbered lists
- Hyperlinks
- Inline images
- Embedded media
- Copy/paste from Word/Google Docs without breaking
- Undo/redo

#### Layout & scaling (critical)
- No fixed-height containers
- Fluid scaling based on content
- No clipped images or awkward whitespace
- Responsive across desktop and mobile

#### Content reuse (primary rebuild driver)
- Assignments are standalone and reusable by reference
- Single source of truth: editing updates all usages
- View all challenges using an assignment
- Usage count visible
- Explicit duplication creates independent copy

#### Challenge management
- Create, edit, duplicate, archive
- Folder/project grouping
- Copy URL to clipboard
- Preview participant view

#### Assignment passwords
- Shared access keys (not user authentication)
- Single password per assignment
- Password prompt before content loads
- Rate limiting on attempts

#### Scheduled release
- Release date per AssignmentUsage (challenge-level)
- Before release: hidden or "Available on [date]"
- Can combine with passwords

#### Variants
- Assignments can reference other assignments as metadata
- Admin can create, view, navigate relationships
- Labels: "English version", "French translation", "Advanced version"
- Not exposed to participants (this rebuild)

#### Custom URLs
- Challenges can have admin-defined slugs
- Critical for QR codes and printed materials
- Assignments use auto-generated URLs

---

## Extended scope: Individual Mode

**Requires**: Clerk authentication

### Participant capabilities
- Log in via email, social, or SSO
- View personal dashboard
- See progress across enrolled challenges
- Resume where left off (session persistence)
- Mark assignments complete

### Data stored
- Participant profile (Clerk user ID, email, display name)
- Challenge enrollments
- Assignment progress (status, timestamps)
- Quiz responses (if micro-quizzes enabled)

### Privacy considerations
- Personal data is stored (unlike Collective Mode)
- Must comply with GDPR
- Users can request data deletion
- No data shared between clients

### Admin capabilities
- View participant list per challenge
- See aggregate progress
- Export progress data

---

## Extended scope: Collective Enhancements

**Does not require**: Individual Mode (works with anonymous access)

### Sprint structure
- Group assignments into themed phases
- Sprint title, description, order
- Optional host video per sprint (intro/recap)

### Announcements
- Admin posts updates visible to all
- Title, content, timestamp
- Can be pinned
- Displayed on challenge overview

### Editorial milestones
- "You've completed Sprint 1!" moments
- Triggered by assignment position, not individual progress
- Creates narrative rhythm

---

## Extended scope: Gamification

**Does not require**: Individual Mode (collective mechanics work anonymously)

### Time-based unlocks
- Content reveals at scheduled times
- Goes beyond basic release dates
- Can create "reveal moments"

### Reveal moments
- Dramatic content unlocks
- Visual/animation treatment
- Builds collective anticipation

### Micro-quizzes
- Reflective, non-scored check-ins
- Appear before or after assignments
- Multiple choice or short text
- Responses stored (if Individual Mode) or anonymous

### Collective progress
- "X% of participants reached this point"
- Anonymous calculation from analytics events
- Creates social proof without individual tracking

### Milestones
- Challenge-level achievements
- Triggered by collective metrics
- Visual celebration moments

---

## Admin interface requirements

### Client management
- List clients (name, logo)
- Create / edit / delete client
- Configure mode and feature flags

### Challenge management
- List challenges per client (with status)
- Create / edit / duplicate / archive
- Folder organization
- Copy URL / Preview
- Configure sprints (if enabled)
- Post announcements (if enabled)

### Assignment management (within challenge)
- List in order
- Drag-drop reorder
- Add existing / create new
- Remove from challenge (without deleting)
- Edit usage properties (visibility, release, label, gamification)

### Assignment library
- View all assignments
- Search / filter
- Usage count
- "Used in" list
- Create / edit / duplicate
- Configure micro-quizzes (if enabled)

### Analytics dashboard
- Views per challenge
- Views per assignment
- Media engagement
- (Individual Mode) Progress summaries
- (Gamification) Collective progress metrics

---

## Analytics

### Core events (anonymous)
- Challenge page viewed
- Assignment page viewed
- Media played
- Password attempt (success/failure)

### Individual Mode events
- User logged in
- Assignment started
- Assignment completed
- Quiz submitted

### Event metadata
- Client ID
- Challenge ID
- Assignment ID
- Timestamp
- (Individual Mode) Participant ID

### Privacy
- Collective Mode: no personal identifiers, no IP storage
- Individual Mode: user-linked data, GDPR compliant
- No cross-session tracking in Collective Mode

### Implementation
- GA4 or custom event logging
- Anonymous by default
- Individual events only when mode enabled

---

## Non-functional requirements

### Security
- HTTPS only
- Secure password storage (bcrypt for shared keys)
- SQL injection prevention (Supabase RLS + parameterized queries)
- XSS protection (sanitized rich text)
- Rate limiting on password attempts
- Clerk handles auth security for Individual Mode

### Browser support
- Chrome, Firefox, Safari, Edge: latest 2 versions
- Mobile Safari: last 2 iOS versions
- Mobile Chrome: last 2 Android versions

### Accessibility
- Target: WCAG 2.1 AA
- Keyboard navigation
- Proper contrast
- Semantic HTML

### Performance
- Page load < 2s (p95)
- No layout shifts
- Media starts promptly on click
- Admin CRUD feels responsive

### Hosting & independence
- Complete source code access
- Deployment documentation
- No proprietary locked components
- Deployable on client infrastructure (Vercel)

---

## Success metrics

### Launch criteria
- First client can run a full challenge in Collective Mode
- Admin can manage content without developer help
- Assignment reuse works correctly
- Custom URLs work for QR codes
- No layout/scaling issues

### Secondary success criteria
- Positive admin feedback on management interface
- Fewer support requests about reuse/variants
- Codebase is understandable by external developers

### Quality criteria
- Page load < 2s (p95)
- Rich text paste works from Word/Docs
- Zero data leakage between modes
- WCAG 2.1 AA compliance

---

## User stories

### Admin user stories
- **Client management**
  - As an admin, I can create a new client with name and logo so I can organize challenges by organization.
  - As an admin, I can edit client details so I can keep information current.
  - As an admin, I can delete a client so I can remove organizations no longer using the platform.
- **Challenge management**
  - As an admin, I can create a new challenge with title, description, and branding so participants have clear context.
  - As an admin, I can organize challenges into folders so I can manage multiple projects efficiently.
  - As an admin, I can duplicate a challenge so I can quickly create variations for different groups.
  - As an admin, I can archive a challenge so it's hidden but recoverable if needed.
  - As an admin, I can preview a challenge so I see what participants will experience.
  - As an admin, I can copy a challenge URL so I can distribute it to participants.
- **Assignment creation & management**
  - As an admin, I can create a standalone assignment with rich text, images, and media so I build reusable content.
  - As an admin, I can add an existing assignment to a challenge so I avoid duplicating content.
  - As an admin, I can reorder assignments within a challenge so I control the sequence.
  - As an admin, I can see which challenges use an assignment so I understand content relationships.
  - As an admin, I can duplicate an assignment so I can create a modified version without affecting the original.
  - As an admin, I can edit an assignment knowing it updates everywhere it's used.
  - As an admin, I can remove an assignment from a challenge without deleting the assignment itself.
- **Content editing**
  - As an admin, I can format content so I create professional-looking assignments.
  - As an admin, I can embed images inline so visuals enhance text.
  - As an admin, I can add hyperlinks so I can reference external resources.
  - As an admin, I can paste content from Docs/Word without formatting breaking.
- **Access control**
  - As an admin, I can add a password to an assignment so access is controlled.
  - As an admin, I can set a release date for an assignment so it unlocks automatically.
  - As an admin, I can combine passwords and release dates so I have flexible pacing options.
- **Variants**
  - As an admin, I can link related assignments (language/difficulty) so I track variants efficiently.
  - As an admin, I can navigate between variant assignments so I can find related content quickly.

### Participant user stories
- **Access**
  - As a participant, I can open a challenge via URL without logging in so access is frictionless.
  - As a participant, I see an overview of assignments so I understand the structure.
  - As a participant, I can open any available assignment so I progress at my own pace.
- **Consumption**
  - As a participant, I can read assignment content in a clean layout.
  - As a participant, I can play embedded video.
  - As a participant, I can return to the challenge overview easily.
- **Passwords**
  - As a participant, I can enter a password to unlock an assignment so I can access staged content.
  - As a participant, I see a clear error when a password is wrong so I can try again.

---

## Delivery phases (suggested)
- **Phase 1**: core data model + admin foundation
  - Schema (Client, Challenge, Assignment, AssignmentUsage)
  - Basic CRUD for all entities
  - Admin authentication
  - Client management screen
  - Assignment library basics
- **Phase 2**: challenge management + content editing
  - Challenge management screen
  - Rich text editor integration
  - Image upload/management
  - Assignment create/edit
  - Assignment-to-challenge relationship management
- **Phase 3**: participant experience
  - Public challenge view
  - Public assignment view
  - Password functionality
  - Media embed/playback
  - Navigation flow
- **Phase 4**: advanced admin features
  - Scheduled release
  - Drag/drop reordering
  - Challenge duplication
  - Variant relationships
  - Folder/project organization
- **Phase 5**: analytics + polish
  - Analytics integration
  - Admin preview
  - Visual scaling fixes
  - Performance optimization
  - Bug fixes/refinement
- **Phase 6**: deployment + handoff
  - Deployment documentation
  - Environment setup
  - Migration plan/execution (if needed)
  - Training materials
  - Final testing

---

## Risks & mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Rich text editor complexity | High | Use TipTap, allocate time for paste edge cases |
| Layout scaling edge cases | Medium | Test with extreme content lengths, fluid design system |
| Assignment reuse architecture | High | Document entity model, prototype usage flows early |
| Mode configuration complexity | Medium | Clear feature flag schema, test all combinations |
| Scope creep | Medium | Keep out-of-scope explicit, track future ideas separately |

---

## Decisions made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 (App Router) | Server components, streaming, Vercel integration |
| Styling | Tailwind CSS 4 | Design system, responsive utilities |
| Auth | Clerk | Enterprise-grade, SSO/social/email, separates auth complexity |
| Database | Supabase (Postgres) | RLS, storage included, self-hostable option |
| Rich text | TipTap | Modern, extensible, good paste handling |
| Hosting | Vercel | CI/CD, preview deployments, edge network |

---

## Appendix

### Reference materials
- Loom videos: client admin, challenge admin, assignment admin walkthroughs
- Live example: `https://app.companychallenges.com/KK6wYjG`
- Admin: `https://app.companychallenges.com/` (credentials in secure location)

Note: avoid storing real passwords inside the PRD. If specific example passwords are needed for testing, keep them in a separate, access-controlled place.

### Document control
- **Author**: Dev team
- **Stakeholders**: Michiel, Jaspar, Liska
- **Status**: Active
- **Revision history**
  - v1.0 (2026-01-05): Initial PRD for base rebuild
  - v2.0 (2026-01-06): Added Individual Mode, Collective Enhancements, Gamification; updated decisions
