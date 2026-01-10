# Architecture Overview

Company Challenges Platform — Technical Architecture

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL EDGE NETWORK                            │
│                     (Global CDN, Edge Functions, CI/CD)                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            NEXT.JS 16 APPLICATION                           │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Admin Panel   │  │  Public Views   │  │   API Routes    │             │
│  │  (Clerk Auth)   │  │ (Collective +   │  │  (Server-side)  │             │
│  │                 │  │  Individual)    │  │                 │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           └────────────────────┼────────────────────┘                       │
│                                │                                            │
│                    ┌───────────┴───────────┐                               │
│                    │    Middleware Layer    │                               │
│                    │  (Auth + Route Guard)  │                               │
│                    └───────────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│       CLERK         │  │      SUPABASE       │  │    SUPABASE         │
│   Authentication    │  │      Postgres       │  │     Storage         │
│                     │  │                     │  │                     │
│ • Admin login       │  │ • All entities      │  │ • Images            │
│ • Individual Mode   │  │ • RLS policies      │  │ • Media files       │
│ • SSO/Social        │  │ • Functions         │  │ • Uploads           │
│ • Session mgmt      │  │ • Analytics         │  │                     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Next.js | 16.x | React framework with App Router |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **Auth** | Clerk | Latest | Authentication & user management |
| **Database** | Supabase Postgres | Latest | Primary data store |
| **Storage** | Supabase Storage | Latest | File uploads |
| **Hosting** | Vercel | - | Deployment & CDN |
| **Analytics** | GA4 + Custom | - | Usage tracking |

---

## Application Structure

```
companychallenges2.0/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public routes (no auth required)
│   │   ├── c/[slug]/             # Challenge view
│   │   └── a/[slug]/             # Assignment view
│   ├── admin/                    # Admin routes (Clerk auth required)
│   │   ├── layout.tsx            # Admin shell
│   │   ├── page.tsx              # Dashboard
│   │   ├── clients/              # Client management
│   │   ├── challenges/           # Challenge management
│   │   └── assignments/          # Assignment library
│   ├── sign-in/                  # Clerk sign-in
│   ├── sign-up/                  # Clerk sign-up
│   ├── layout.tsx                # Root layout (Clerk provider)
│   ├── page.tsx                  # Redirect to /admin
│   └── globals.css               # Design tokens
├── components/
│   ├── ui/                       # Primitives (Button, Input, Card, etc.)
│   ├── admin/                    # Admin-specific components
│   └── public/                   # Public-facing components
├── lib/
│   ├── supabase/                 # Supabase clients
│   ├── types/                    # TypeScript types
│   └── utils/                    # Utilities
├── middleware.ts                 # Auth & route protection
├── supabase/
│   └── migrations/               # SQL migrations
└── docs/                         # Documentation
```

---

## Data Model

### Core Entities

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Client    │──────<│  Challenge  │──────<│   Sprint    │
│             │   1:N │             │   1:N │  (optional) │
└─────────────┘       └──────┬──────┘       └──────┬──────┘
                             │                     │
                             │ via AssignmentUsage │
                             │         1:N         │
                             ▼                     │
                      ┌─────────────┐              │
                      │ Assignment  │<─────────────┘
                      │  Usage      │
                      └──────┬──────┘
                             │ N:1
                             ▼
                      ┌─────────────┐       ┌─────────────┐
                      │ Assignment  │──────<│ MicroQuiz   │
                      │             │   1:N │             │
                      └─────────────┘       └─────────────┘
```

### Individual Mode Entities

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ Participant │──────<│  Challenge  │       │ Assignment  │
│(Clerk user) │   N:M │ Enrollment  │       │  Progress   │
└─────────────┘       └─────────────┘       └─────────────┘
       │                                           │
       │                    N:1                    │
       └───────────────────────────────────────────┘
```

### Gamification Entities

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Challenge  │──────<│ Milestone   │       │ Achievement │
│             │   1:N │             │<──────│(per user)   │
└─────────────┘       └─────────────┘   N:1 └─────────────┘

┌─────────────┐       ┌─────────────┐
│  Challenge  │──────<│Announcement │
│             │   1:N │             │
└─────────────┘       └─────────────┘
```

---

## Authentication Flow

### Admin Access (Always Required)
```
User → /admin/* → Clerk Middleware → Auth Check → Admin Panel
                                          │
                                          └── Not authed → /sign-in
```

### Collective Mode (No Auth)
```
User → /c/[slug] → Challenge loads → Password check (if set) → Content
User → /a/[slug] → Assignment loads → Password check (if set) → Content
```

### Individual Mode (Auth Required)
```
User → /c/[slug] → Client mode check
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   collective        individual         hybrid
        │                │                │
        ▼                ▼                ▼
   No auth         Clerk auth        Optional auth
   required        required          (enhanced experience)
```

---

## Feature Flags

Per-client configuration enables/disables features:

```typescript
interface ClientFeatures {
  // Collective
  announcements: boolean
  host_videos: boolean
  sprint_structure: boolean
  collective_progress: boolean
  
  // Gamification
  time_based_unlocks: boolean
  milestones: boolean
  reveal_moments: boolean
  micro_quizzes: boolean
  
  // Individual
  progress_tracking: boolean
  session_persistence: boolean
  private_views: boolean
}
```

---

## Security Model

### Row Level Security (RLS)

| Entity | Public Read | Authenticated Write | Admin Write |
|--------|-------------|---------------------|-------------|
| Clients | ✅ (branding) | ❌ | ✅ |
| Challenges | ✅ (active only) | ❌ | ✅ |
| Assignments | ✅ | ❌ | ✅ |
| AssignmentUsages | ✅ (visible + released) | ❌ | ✅ |
| Participants | Own only | Own only | ✅ |
| Progress | Own only | Own only | ✅ |
| Analytics | ❌ | Insert own | ✅ |

### Password Protection

- Passwords are hashed with bcrypt
- Stored per-assignment
- Shared access keys (not user-specific)
- Rate limiting on attempts

---

## Analytics Architecture

### Anonymous Events (Collective Mode)

```typescript
interface AnalyticsEvent {
  event_type: 'challenge_view' | 'assignment_view' | 'assignment_complete' | ...
  client_id: string
  challenge_id: string
  session_id: string  // Anonymous cookie-based
  metadata: object
}
```

### Privacy Constraints
- No PII stored
- No IP addresses
- No cross-session tracking
- GDPR compliant

---

## Deployment Architecture

### Environments

| Environment | URL | Branch | Purpose |
|-------------|-----|--------|---------|
| Production | app.companychallenges.com | main | Live |
| Preview | *.vercel.app | PR branches | Review |
| Local | localhost:3000 | any | Development |

### CI/CD Pipeline

```
Push → GitHub Actions → Lint + Type Check → Build → Vercel Deploy
                              │
                              └── Fail → Block merge
```

---

## Performance Considerations

### Caching Strategy
- Static pages at edge
- Dynamic data via server components
- Image optimization via Vercel
- Database connection pooling

### Scalability
- Stateless application
- Horizontal scaling via Vercel
- Supabase handles database scaling
- Storage via CDN

---

## Future Extensibility

The architecture supports future additions without restructuring:

- **Real-time features**: Supabase Realtime ready
- **API access**: Server actions can become API routes
- **Mobile apps**: Same backend, different frontend
- **Advanced analytics**: Event structure supports it
- **Integrations**: Webhook-friendly design
