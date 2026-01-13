# Company Challenges — Ecosystem Flow Guide

> A comprehensive walkthrough of the platform's user journeys, designed to power an onboarding wizard experience.

---

## Platform Overview

Company Challenges is a learning trajectory platform with **two distinct user experiences**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPANY CHALLENGES PLATFORM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────┐              ┌─────────────────────┐              │
│   │    ADMIN PORTAL     │              │  PARTICIPANT PORTAL │              │
│   │    (/admin/*)       │              │   (/participant/*)  │              │
│   │                     │              │                     │              │
│   │  • Create clients   │   content    │  • Dashboard        │              │
│   │  • Build challenges │ ──────────▶  │  • Enroll           │              │
│   │  • Author content   │   delivery   │  • Progress         │              │
│   │  • View analytics   │              │  • Achievements     │              │
│   └─────────────────────┘              └─────────────────────┘              │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     PUBLIC CHALLENGE VIEW                            │   │
│   │                     (/c/[slug], /a/[slug])                          │   │
│   │                                                                      │   │
│   │           Anonymous access • Password-gated content                  │   │
│   │           QR-code friendly • Shareable URLs                         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎭 Meet Chai — Your Platform Guide

> *Chai is a friendly owl mascot who guides users through the platform. Owls symbolize wisdom and learning — perfect for a challenge platform!*

**Chai's personality traits:**
- Encouraging but not overwhelming
- Gives helpful tips at the right moments
- Celebrates achievements enthusiastically
- Uses gentle humor to keep things light

---

## Part 1: Admin Journey

### 🦉 Scene 1: First Login

```
┌──────────────────────────────────────────────────────────┐
│  🦉 "Welcome to Company Challenges!                      │
│                                                          │
│      I'm Chai, and I'll help you get started.           │
│      Let's build your first learning challenge!"         │
│                                                          │
│      [Start Tour]  [Skip for now]                       │
└──────────────────────────────────────────────────────────┘
```

**Flow: Admin Dashboard → First Steps**

```
Admin logs in
    │
    ▼
┌─────────────────┐
│    Dashboard    │ ◀── Chai: "This is your command center!"
│                 │
│  • Quick Stats  │     - Total challenges
│  • Recent Work  │     - Active participants
│  • Quick Links  │     - Recent activity
└────────┬────────┘
         │
         ▼
    Where to start?
         │
    ┌────┴────┬──────────┐
    │         │          │
    ▼         ▼          ▼
 Clients  Challenges  Assignments
```

---

### 🦉 Scene 2: Creating a Client

```
┌──────────────────────────────────────────────────────────┐
│  🦉 "Clients are organizations you're creating           │
│      challenges for. Let's set up your first one!"       │
└──────────────────────────────────────────────────────────┘
```

**Flow: Client Management**

```
/admin/clients
    │
    ├── [+ New Client]
    │         │
    │         ▼
    │   ┌─────────────────────────────────┐
    │   │  Create Client Form             │
    │   │                                 │
    │   │  • Name (required)              │
    │   │  • Logo (upload)                │
    │   │  • Mode:                        │
    │   │    ○ Collective (anonymous)     │
    │   │    ○ Individual (tracked)       │
    │   │    ○ Hybrid (optional login)    │
    │   │  • Feature toggles              │
    │   └─────────────────────────────────┘
    │
    └── Client list with:
        • Edit / Delete actions
        • Challenge count
        • Quick "View Challenges" link
```

**Chai Tips:**
- "Collective mode = no login required. Great for quick rollouts!"
- "Individual mode lets participants track their own progress."
- "Feature flags let you customize each client's experience."

---

### 🦉 Scene 3: Building a Challenge

```
┌──────────────────────────────────────────────────────────┐
│  🦉 "A challenge is your learning journey container.     │
│      Think of it as a course with multiple lessons!"     │
└──────────────────────────────────────────────────────────┘
```

**Flow: Challenge Creation**

```
/admin/challenges
    │
    ├── [+ New Challenge]
    │         │
    │         ▼
    │   ┌─────────────────────────────────┐
    │   │  Challenge Setup                │
    │   │                                 │
    │   │  📝 Basic Info                  │
    │   │  • Internal name (for you)      │
    │   │  • Public title (for them)      │
    │   │  • Description (rich text!)     │
    │   │                                 │
    │   │  🎨 Branding                    │
    │   │  • Brand color (#hex)           │
    │   │  • Visual/banner image          │
    │   │                                 │
    │   │  📅 Scheduling                  │
    │   │  • Start date (optional)        │
    │   │  • End date (optional)          │
    │   │                                 │
    │   │  🔗 URL                         │
    │   │  • Custom slug for QR codes     │
    │   └─────────────────────────────────┘
    │
    └── Challenge Detail Page
        │
        ├── 📚 Assignments (drag to reorder!)
        │     • Add existing / Create new
        │     • Set visibility, release dates
        │     • Assign to sprints
        │
        ├── 🏃 Sprints (group content)
        │     • Week 1, Week 2, etc.
        │     • Intro/recap videos
        │
        ├── 📢 Announcements
        │     • Post updates
        │     • Pin important ones
        │
        └── 🏆 Milestones
              • Define achievements
              • Set trigger conditions
```

---

### 🦉 Scene 4: Creating Assignments

```
┌──────────────────────────────────────────────────────────┐
│  🦉 "Assignments are your actual content pieces.         │
│      The magic? They're REUSABLE across challenges!"     │
└──────────────────────────────────────────────────────────┘
```

**Flow: Assignment Library**

```
/admin/assignments
    │
    ├── Library view (all assignments)
    │     • Search & filter
    │     • Usage count ("Used in 3 challenges")
    │     • Quick duplicate
    │
    └── [+ New Assignment]
              │
              ▼
        ┌─────────────────────────────────┐
        │  Assignment Editor              │
        │                                 │
        │  📝 Content                     │
        │  • Title & subtitle             │
        │  • Rich text description        │
        │    - Headers, lists, links      │
        │    - Inline images              │
        │    - Embedded video             │
        │                                 │
        │  🖼️ Media                       │
        │  • Visual/thumbnail             │
        │  • Video URL                    │
        │                                 │
        │  🔒 Access                      │
        │  • Password (optional)          │
        │                                 │
        │  ❓ Micro-Quizzes               │
        │  • Add reflection questions     │
        │  • Multiple choice / Scale      │
        └─────────────────────────────────┘
```

**Key Concept: Reuse**
```
Assignment: "Introduction to Leadership"
         │
         ├── Used in: "Leadership 101" challenge
         ├── Used in: "Manager Bootcamp" challenge
         └── Used in: "Executive Training" challenge

Edit once → Updates everywhere! 🎉
```

---

### 🦉 Scene 5: Advanced Features

**Sprints (Organize Content)**
```
Challenge: "30-Day Wellness Journey"
    │
    ├── Sprint 1: "Foundation Week"
    │     ├── Assignment: Day 1 - Mindfulness
    │     ├── Assignment: Day 2 - Movement
    │     └── Assignment: Day 3 - Nutrition
    │
    ├── Sprint 2: "Building Habits"
    │     ├── Assignment: Day 8 - Routines
    │     └── ...
    │
    └── Sprint 3: "Advanced Practice"
          └── ...
```

**Announcements (Keep Everyone Informed)**
```
📢 "Great job everyone! We've hit 50% completion!"
   [📌 Pinned]

📢 "Reminder: Sprint 2 unlocks Monday!"
   [Published 2 days ago]
```

**Milestones (Celebrate Progress)**
```
🏆 "First Steps" - Complete first assignment
🏆 "Halfway Hero" - Reach 50% completion
🏆 "Challenge Champion" - Complete all assignments
```

---

## Part 2: Participant Journey

### 🦉 Scene 1: Discovery & Enrollment

```
┌──────────────────────────────────────────────────────────┐
│  🦉 "Ready to learn something new?                       │
│      Browse available challenges and jump in!"           │
└──────────────────────────────────────────────────────────┘
```

**Flow: Participant Dashboard**

```
Participant logs in
    │
    ▼
┌─────────────────────────────────────────┐
│  /participant (Dashboard)               │
│                                         │
│  📊 Your Stats                          │
│  ┌────────┬────────┬────────┬────────┐  │
│  │ Active │Complete│Achieve-│ Streak │  │
│  │   2    │   15   │ ments  │  5🔥   │  │
│  │        │        │   8    │        │  │
│  └────────┴────────┴────────┴────────┘  │
│                                         │
│  📚 My Challenges                       │
│  ┌─────────────────────────────────┐    │
│  │ Leadership 101         [75%]   │    │
│  │ ████████████░░░░ Continue →    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  🕐 Recent Activity                     │
│  • Completed: "Active Listening"        │
│  • Achievement: "Halfway Hero" 🏆       │
└─────────────────────────────────────────┘
```

---

### 🦉 Scene 2: Browsing Challenges

```
/participant/challenges
    │
    ├── 📚 MY CHALLENGES (Enrolled)
    │   │
    │   ├── Challenge Card
    │   │   ┌─────────────────────────────┐
    │   │   │ ████████████░░░ 75%        │
    │   │   │ Leadership 101              │
    │   │   │ Acme Corp                   │
    │   │   │ 12/16 assignments           │
    │   │   │              [Continue →]   │
    │   │   └─────────────────────────────┘
    │   │
    │   └── Empty state: "No challenges yet. Explore below!"
    │
    └── 🎯 AVAILABLE CHALLENGES
        │
        └── Challenge Card (Not enrolled)
            ┌─────────────────────────────┐
            │ ┄┄┄┄┄ NEW ┄┄┄┄┄            │
            │ Wellness Journey            │
            │ HealthCo                    │
            │ 24 assignments              │
            │              [Enroll →]     │
            └─────────────────────────────┘
```

---

### 🦉 Scene 3: Enrollment Flow

```
┌──────────────────────────────────────────────────────────┐
│  🦉 "Take a peek at what's inside before you commit!"    │
└──────────────────────────────────────────────────────────┘
```

**Flow: Challenge Preview → Enroll**

```
Click "Enroll" on available challenge
    │
    ▼
/participant/enroll/[id]
    │
    ├── Challenge Preview
    │   ┌─────────────────────────────────────────┐
    │   │  [Brand Banner Image]                   │
    │   │                                         │
    │   │  🏢 HealthCo presents                   │
    │   │  30-Day Wellness Journey                │
    │   │                                         │
    │   │  "Transform your daily habits..."       │
    │   │                                         │
    │   │  ┌────────┬────────┬────────┐          │
    │   │  │📚 24   │🏃 4    │⏱️ 6    │          │
    │   │  │assigns │sprints │ hours  │          │
    │   │  └────────┴────────┴────────┘          │
    │   │                                         │
    │   │  📅 Jan 15 - Feb 15, 2026              │
    │   │                                         │
    │   │  [🚀 Start Challenge]                   │
    │   │  Free • Track progress • Earn badges   │
    │   └─────────────────────────────────────────┘
    │
    ├── What to Expect section
    │   • 24 Assignments to complete
    │   • Track your progress
    │   • Reflection questions included
    │
    └── Support info (if provided)
```

---

### 🦉 Scene 4: Learning Experience

```
┌──────────────────────────────────────────────────────────┐
│  🦉 "Work through assignments at your own pace.          │
│      I'll track your progress automatically!"            │
└──────────────────────────────────────────────────────────┘
```

**Flow: Challenge Progress View**

```
/participant/challenges/[id]
    │
    ├── Header
    │   ┌─────────────────────────────────────────┐
    │   │  30-Day Wellness Journey                │
    │   │  [Rich text description...]             │
    │   │                                         │
    │   │  ┌──────────────────────┐              │
    │   │  │ Progress      75%   │              │
    │   │  │ ████████████░░░░    │              │
    │   │  │ 18/24 completed     │              │
    │   │  │ [🏆 View Leaderboard]│              │
    │   │  └──────────────────────┘              │
    │   └─────────────────────────────────────────┘
    │
    ├── 📢 Pinned Announcements
    │   "Week 3 content now available!"
    │
    └── Content (organized by Sprints)
        │
        ├── 🏃 Sprint 1: Foundation ✅
        │     ├── ✅ Day 1: Mindfulness Intro
        │     ├── ✅ Day 2: Movement Basics
        │     └── ✅ Day 3: Nutrition 101
        │
        ├── 🏃 Sprint 2: Building Habits 🔄
        │     ├── ✅ Day 8: Morning Routines
        │     ├── 🔄 Day 9: Evening Wind-down ← Continue
        │     └── ○ Day 10: Weekend Practices
        │
        └── 🏃 Sprint 3: Advanced (Locked)
              └── 🔒 Releases Jan 25
```

---

### 🦉 Scene 5: Assignment Completion

```
Click on assignment
    │
    ▼
Assignment Content View
    │
    ├── Header with title & visual
    │
    ├── Rich text content
    │   • Instructions
    │   • Embedded videos
    │   • Images
    │
    ├── Micro-Quiz (if present)
    │   ┌─────────────────────────────────────────┐
    │   │  💭 Quick Reflection                    │
    │   │                                         │
    │   │  "What's one thing you'll try today?"   │
    │   │  ┌───────────────────────────────────┐  │
    │   │  │                                   │  │
    │   │  │  [Your response...]               │  │
    │   │  │                                   │  │
    │   │  └───────────────────────────────────┘  │
    │   │                                         │
    │   │  Rate your confidence (1-5):            │
    │   │  ○ ○ ○ ○ ○                             │
    │   │                                         │
    │   │  [Submit & Complete]                    │
    │   └─────────────────────────────────────────┘
    │
    └── [✓ Mark Complete] → Back to challenge
```

---

### 🦉 Scene 6: Leaderboard & Competition

```
┌──────────────────────────────────────────────────────────┐
│  🦉 "See how you stack up! (Only if you opt in)"         │
└──────────────────────────────────────────────────────────┘
```

**Flow: Leaderboard**

```
/participant/challenges/[id]/leaderboard
    │
    ├── Your Rank Card
    │   ┌─────────────────────────────────────────┐
    │   │  Your Rank: #4 of 47                    │
    │   └─────────────────────────────────────────┘
    │
    ├── Stats
    │   👥 47 Participants
    │   🎯 12 Completed
    │   📊 68% Avg Progress
    │
    └── Rankings Table
        ┌─────┬──────────────┬──────────┬───────┐
        │Rank │ Participant  │ Progress │Status │
        ├─────┼──────────────┼──────────┼───────┤
        │ 🥇  │ Alex M.      │ ████ 100%│ Done  │
        │ 🥈  │ Sam K.       │ ████ 100%│ Done  │
        │ 🥉  │ Jordan L.    │ ███░ 92% │       │
        │  4  │ You          │ ███░ 75% │       │ ← Highlighted
        │  5  │ Taylor R.    │ ██░░ 67% │       │
        └─────┴──────────────┴──────────┴───────┘

        "Only showing participants who opted in"
        [Manage privacy settings →]
```

---

### 🦉 Scene 7: Achievements

```
/participant/achievements
    │
    └── Achievement Gallery
        ┌─────────────────────────────────────────┐
        │  🏆 Your Achievements (8)               │
        │                                         │
        │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
        │  │   🌟    │ │   🎯    │ │   🔥    │   │
        │  │ First   │ │ Halfway │ │  5-Day  │   │
        │  │ Steps   │ │  Hero   │ │ Streak  │   │
        │  │ Jan 15  │ │ Jan 22  │ │ Jan 24  │   │
        │  └─────────┘ └─────────┘ └─────────┘   │
        │                                         │
        │  ┌─────────┐ ┌─────────┐               │
        │  │   📚    │ │   🏃    │               │
        │  │ Sprint  │ │ Sprint  │               │
        │  │   1     │ │   2     │               │
        │  │Complete │ │Complete │               │
        │  └─────────┘ └─────────┘               │
        └─────────────────────────────────────────┘
```

---

### 🦉 Scene 8: Settings & Privacy

```
/participant/settings
    │
    ├── Profile
    │   • Display name (for leaderboards)
    │
    └── Privacy
        ┌─────────────────────────────────────────┐
        │  🔒 Privacy Settings                    │
        │                                         │
        │  Show on Leaderboard        [====○]    │
        │  Allow your name on rankings            │
        │                                         │
        │  Public Progress            [○====]    │
        │  Let others see your progress           │
        │                                         │
        │  [Save Changes]                         │
        └─────────────────────────────────────────┘
```

---

## Part 3: Public Access (Collective Mode)

```
┌──────────────────────────────────────────────────────────┐
│  🦉 "No login needed! Just share the URL and go!"        │
└──────────────────────────────────────────────────────────┘
```

**Flow: Anonymous Challenge Access**

```
QR code / Shared URL
    │
    ▼
/c/[custom-slug]
    │
    ├── Challenge Overview (public)
    │   • Title, description
    │   • Assignment list
    │   • Brand colors applied
    │
    └── Click assignment
          │
          ▼
        /a/[slug]
          │
          ├── Password protected?
          │   ├── Yes → Password prompt
          │   └── No → Content loads
          │
          ├── Not yet released?
          │   └── "Available on [date]"
          │
          └── Content view
              • No progress tracking
              • "Complete" returns to overview
```

---

## Navigation Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PLATFORM NAVIGATION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ADMIN (/admin/*)                    PARTICIPANT (/participant/*)           │
│  ═══════════════                     ═══════════════════════════            │
│                                                                              │
│  Dashboard ─────────────────┐        Dashboard ─────────────────┐           │
│       │                     │             │                     │           │
│       ├── Clients           │             ├── Challenges        │           │
│       │    └── [id]         │             │    ├── [id]         │           │
│       │                     │             │    │    └── leaderboard         │
│       ├── Challenges        │             │    │                │           │
│       │    └── [id]         │             │    └── (enrolled    │           │
│       │         ├── sprints │             │        + available) │           │
│       │         ├── announce│             │                     │           │
│       │         └── milestone             ├── Enroll            │           │
│       │                     │             │    └── [id]         │           │
│       ├── Assignments       │             │                     │           │
│       │    └── [id]         │             ├── Achievements      │           │
│       │                     │             │                     │           │
│       └── Analytics         │             └── Settings          │           │
│                             │                                   │           │
│  PUBLIC (/c/*, /a/*)        │                                   │           │
│  ═══════════════════        │                                   │           │
│                             │                                   │           │
│  /c/[slug] (challenge)      │                                   │           │
│       │                     │                                   │           │
│       └── /a/[slug] (assign)│                                   │           │
│                             │                                   │           │
└─────────────────────────────┴───────────────────────────────────────────────┘
```

---

## Onboarding Wizard Checkpoints

### Admin Onboarding
```
□ Step 1: Create your first client
□ Step 2: Build your first challenge
□ Step 3: Add 3 assignments
□ Step 4: Preview participant view
□ Step 5: Copy & share URL
🎉 "You're ready to launch!"
```

### Participant Onboarding
```
□ Step 1: Browse available challenges
□ Step 2: Enroll in your first challenge
□ Step 3: Complete your first assignment
□ Step 4: Check your dashboard
🎉 "You're on your way!"
```

---

## Chai's Contextual Tips

| Location | Chai Says |
|----------|-----------|
| Empty client list | "Let's add your first organization!" |
| New challenge | "Great! Now add some assignments." |
| First assignment | "💡 Pro tip: Assignments are reusable!" |
| No enrollments | "Browse 'Available' to find challenges." |
| First completion | "🎉 You did it! Keep the momentum!" |
| Leaderboard #1 | "🏆 Look at you, leader!" |
| 50% progress | "Halfway there! You've got this!" |
| Challenge complete | "🎊 Champion! Ready for another?" |

---

*This ecosystem flow document serves as the foundation for building an interactive onboarding wizard with Chai as the guide.*
