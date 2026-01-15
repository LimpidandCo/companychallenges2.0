# Company Challenges 2.0 - Admin Platform Guide

> A comprehensive guide for administrators to create, manage, and deliver engaging learning challenges.

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Getting Started](#getting-started)
3. [Managing Clients](#managing-clients)
4. [Creating Challenges](#creating-challenges)
5. [Using the Rich Editor](#using-the-rich-editor)
6. [Managing Assignments](#managing-assignments)
7. [Organizing with Sprints](#organizing-with-sprints)
8. [Setting Up Milestones](#setting-up-milestones)
9. [Posting Announcements](#posting-announcements)
10. [Adding Micro Quizzes](#adding-micro-quizzes)
11. [Preview & Publishing](#preview--publishing)
12. [Best Practices](#best-practices)

---

## Platform Overview

Company Challenges 2.0 is a learning management platform that allows organizations to create structured learning experiences called **Challenges**. Each challenge contains:

- **Assignments** - Individual learning modules (articles, videos, quizzes)
- **Sprints** - Time-based phases that group assignments together
- **Milestones** - Achievement markers that celebrate participant progress
- **Announcements** - Communications to keep participants informed
- **Micro Quizzes** - Quick assessments embedded within assignments

### Key Concepts

| Term | Description |
|------|-------------|
| **Client** | An organization/company using the platform |
| **Challenge** | A complete learning program (e.g., "Leadership Development 2026") |
| **Assignment** | A single learning unit within a challenge |
| **Sprint** | A themed phase grouping multiple assignments (e.g., "Week 1-2: Foundations") |
| **Milestone** | An achievement unlocked when participants reach goals |
| **Assignment Usage** | Links an assignment to a specific challenge with custom settings |

---

## Getting Started

### Accessing the Admin Panel

1. Navigate to `/admin` in your browser
2. Log in with your admin credentials
3. You'll see the main dashboard with navigation options

### Navigation Structure

```
Admin Panel
├── Clients (Organizations)
│   └── [Client Name]
│       └── Challenges
│           └── [Challenge Name]
│               ├── Assignments
│               ├── Sprints
│               ├── Milestones
│               └── Announcements
└── Assignment Library (Global assignments)
```

---

## Managing Clients

Clients represent organizations that run challenges on the platform. Client setup is simple - just name and logo.

### Creating a New Client

1. Go to **Admin → Clients**
2. Click **"New Client"**
3. Fill in:

| Field | Description | Required |
|-------|-------------|----------|
| **Logo** | Upload or drag-drop company logo image | |
| **Client Name** | Organization name (e.g., "Acme Corp") | ✓ |

> **Note:** Mode and feature configuration happens at the **Challenge level**, not the Client level. This allows you to have multiple challenges under the same client with different setups.

---

## Creating Challenges

A Challenge is the main container for your learning program. Each challenge has its own mode and feature configuration.

### Step-by-Step: Create a Challenge

1. Navigate to **Admin → Clients → [Your Client]**
2. Click **"New Challenge"**
3. The form has **two tabs**:

#### Basic Info Tab

| Field | Description | Example |
|-------|-------------|---------|
| **Internal Name** | Admin-only identifier | "Q1 2026 Leadership Program" |
| **Public Title** | What participants see | "Leadership Excellence Journey" |
| **Show Public Title** | Display title on public page | ✓ (usually checked) |
| **Challenge Page** | Rich content for welcome page | Click to open editor |
| **Brand Color** | Theme color for the challenge | Pick from presets or enter hex |
| **Folder** | Organize challenges into groups | "2026 Programs" |

#### Mode & Features Tab

**Challenge Mode** - How participants experience the challenge:

| Mode | Description | Use When |
|------|-------------|----------|
| **Collective** | Shared viewing, no individual tracking | Anonymous/public content |
| **Individual** | Personal progress per participant | Self-paced with tracking |
| **Hybrid** | Shared content + individual progress | Cohort programs |

**Feature Toggles** - Enable/disable per challenge:

| Category | Features |
|----------|----------|
| **Content & Structure** | Sprints, Announcements, Scheduled Releases |
| **Gamification** | Milestones*, Micro Quizzes |
| **Tracking** | Progress Tracking* |

\* = Requires Individual or Hybrid mode

### After Creating a Challenge

Once created, you'll be taken to the **Challenge Detail Page** where you can:

- 👁️ **Preview Public Page** - See exactly what participants see
- ➕ **Create New Assignment** - Build content from scratch
- 📚 **From Library** - Use existing assignments

**Sections appear based on your feature settings:**

| Section | Appears When |
|---------|--------------|
| 📅 **Sprints** | Sprint Structure enabled |
| 📢 **Announcements** | Announcements enabled |
| 🏆 **Milestones** | Milestones enabled AND mode is Individual/Hybrid |
| ❓ **Quiz Button** | Micro Quizzes enabled (on each assignment row) |

> **Tip:** If you don't see a section, edit the challenge and check the Mode & Features tab.

---

## Using the Rich Editor

The Rich Editor is used to create beautiful content for challenge pages and assignments.

### Opening the Editor

1. Click **"Edit page"** or **"Add page"** on any content field
2. The full-screen editor opens

### Editor Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [X Close]  Challenge Page           [Preview] [Save]       │  ← Header
├─────────────────────────────────────────────────────────────┤
│  [Undo] [Redo] | [Table] [Media ▼] | [Page BG] | [Info Btn] │  ← Toolbar
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Your Content Here                        │  ← Editor
│                                                             │
│     Click anywhere to start typing...                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Toolbar Features

| Icon | Feature | Description |
|------|---------|-------------|
| ↶ ↷ | Undo/Redo | Revert or restore changes |
| ⊞ | Table | Insert data tables |
| 🖼️ | Media | Insert images, galleries, or videos |
| 🎨 | Page Background | Set content area background color |
| 🔘 | Info Button | Add floating info button |

### Adding Content Blocks

**Between existing blocks:**
- Hover between two blocks
- A faint line with a **+** button appears
- Click to add a new paragraph

**Block Types Available:**
- Headings (H1, H2, H3)
- Paragraphs
- Bullet Lists (unordered)
- Numbered Lists (ordered)
- Blockquotes
- Code Blocks

### Text Formatting (Selection Toolbar)

1. Select any text by clicking and dragging
2. A floating toolbar appears with options:

| Option | Description |
|--------|-------------|
| **Type ▼** | Change to heading, paragraph, etc. |
| **B** | Bold |
| **I** | Italic |
| **U** | Underline |
| **S** | Strikethrough |
| **C** | Inline code |
| **Color ▼** | Text color |
| **Size** | Font size (−/+) |
| **Font ▼** | Font family |
| **Align** | Left, center, right |
| **Link** | Add hyperlink |

### Adding Images

1. Click **Media ▼** in toolbar
2. Choose option:
   - **Single Image** - One image, full width
   - **Image Gallery** - Multiple images in grid
   - **Video** - Embed video content
3. Upload from your computer or paste URL

### Setting Page Background

1. Click the **Page Background** button (🎨) in toolbar
2. Choose from preset colors or enter a hex code
3. The background applies to the content area

### Adding an Info Button

Info buttons are floating buttons that display information when clicked.

1. Click **Info Button** in toolbar
2. Configure:
   - **Icon** - Choose from info, lock, help, etc.
   - **Position** - Corner placement (top-left, bottom-right, etc.)
   - **Colors** - Button and text colors
   - **Title & Content** - What shows when clicked
3. Click **Save** to apply

### Saving Your Work

- **Save** - Saves without closing (keeps editing)
- **Close** - Prompts to save if unsaved changes
- **Preview** - Opens public view in new tab (prompts to save first)

---

## Managing Assignments

Assignments are the individual learning modules within a challenge.

### Assignment Types

| Type | Icon | Use For |
|------|------|---------|
| **Standard** | 📄 | Articles, readings, exercises |
| **Video** | 🎬 | Video-based content |
| **Quiz** | ❓ | Assessments and tests |

### Creating an Assignment

**Method 1: Create New**
1. On Challenge detail page, click **"Create New"**
2. Fill in:
   - **Title** - What participants see
   - **Content Type** - Standard, Video, or Quiz
   - **Instructions** - Brief guidance (shown at top)
   - **Content** - Main content (use Rich Editor)
   - **Estimated Duration** - Time in minutes
   - **Password** - Optional protection

**Method 2: From Library**
1. Click **"From Library"**
2. Browse or search existing assignments
3. Click to add to this challenge

### Assignment Settings (Usage)

When an assignment is linked to a challenge, you can customize:

| Setting | Description |
|---------|-------------|
| **Sprint** | Which sprint it belongs to |
| **Order** | Position in the list (drag to reorder) |
| **Visibility** | Show/hide from participants |
| **Label** | Custom tag (e.g., "Week 1", "Bonus") |
| **Release Date** | When it becomes available |
| **Due Date** | Deadline for completion |

### Password Protection

To restrict access to an assignment:

1. Edit the assignment
2. Enter a password in the **Password** field
3. Participants must enter this password to access content
4. Share the password via Announcements or external communication

---

## Organizing with Sprints

Sprints group assignments into themed phases with time boundaries.

### Creating a Sprint

1. On Challenge detail page, find **Sprints** section
2. Click **"Create Sprint"**
3. Fill in:

| Field | Description | Example |
|-------|-------------|---------|
| **Name** | Sprint title | "Week 1-2: Foundations" |
| **Description** | What this phase covers | "Build core skills..." |
| **Start Date** | When sprint begins | 2026-01-01 |
| **End Date** | When sprint ends | 2026-01-14 |
| **Intro Video URL** | Optional kickoff video | YouTube link |
| **Recap Video URL** | Optional summary video | YouTube link |

### Assigning to Sprints

1. Click on an assignment's settings (gear icon)
2. Select a Sprint from the dropdown
3. The assignment will now appear grouped under that sprint

### Sprint Display (Public View)

Participants see sprints as collapsible sections:

```
▼ Sprint 1: Foundations (Jan 1 - Jan 14)
  "Build the foundation of your skills..."
  [Watch Intro Video]
  
  ☐ Assignment 1: Getting Started
  ☐ Assignment 2: Core Concepts
  ☑ Assignment 3: Practice Exercise ✓

▶ Sprint 2: Advanced Topics (Jan 15 - Jan 28)
  [Locked until Jan 15]
```

---

## Setting Up Milestones

Milestones celebrate participant achievements and encourage progress.

> **Note:** Milestones require:
> 1. The **Milestones** feature to be enabled in the challenge's Mode & Features tab
> 2. The challenge mode to be **Individual** or **Hybrid**
>
> If these aren't configured, the Milestones section won't appear on the challenge page.

### Creating a Milestone

1. On Challenge detail page, find **Milestones** section
2. Click **"Add Milestone"**
3. Configure:

| Field | Description |
|-------|-------------|
| **Title** | Achievement name ("First Step") |
| **Description** | What it means |
| **Trigger Type** | When it's earned |
| **Celebration Type** | How it's displayed |

### Trigger Types

| Trigger | Description | Config Example |
|---------|-------------|----------------|
| **Assignment Complete** | Earned when specific assignment is done | Select assignment |
| **Sprint Complete** | Earned when all sprint assignments done | Select sprint |
| **Percentage** | Earned at progress threshold | 25%, 50%, 100% |
| **Custom** | Manual trigger via code | Custom logic |

### Celebration Types

| Type | What Happens |
|------|--------------|
| **Message** | Simple congratulations popup |
| **Badge** | Visual badge with icon |
| **Animation** | Confetti or special effect |

### Example Milestone Setup

**"Halfway Hero" Milestone:**
- Trigger: `Percentage` → `50%`
- Celebration: `Animation`
- Message: "You're halfway there! Keep going!"

---

## Posting Announcements

Keep participants informed with announcements.

### Creating an Announcement

1. On Challenge detail page, find **Announcements** section
2. Click **"Post Announcement"**
3. Fill in:

| Field | Description |
|-------|-------------|
| **Title** | Announcement headline |
| **Content** | Full message (supports formatting) |
| **Pin** | Keep at top of announcements |
| **Schedule** | Post immediately or schedule for later |

### Announcement Best Practices

- **Welcome Message** - Pin a welcome announcement for new participants
- **Sprint Launches** - Announce when new sprints become available
- **Reminders** - Send deadline reminders
- **Celebrations** - Highlight participant achievements

### Announcement Display

Participants see announcements on the challenge page:

```
📢 Announcements
┌─────────────────────────────────────────┐
│ 📌 Welcome to the Program!              │  ← Pinned
│ Posted Jan 1, 2026                       │
│ We're excited to have you...            │
├─────────────────────────────────────────┤
│ Sprint 2 Now Available                  │
│ Posted Jan 15, 2026                     │
│ Great progress! Sprint 2 is ready...   │
└─────────────────────────────────────────┘
```

---

## Adding Micro Quizzes

Micro quizzes are quick assessments embedded within assignments.

### Quiz Question Types

| Type | Description | Example |
|------|-------------|---------|
| **Multiple Choice** | Select one option | "Which skill is most important?" |
| **Scale** | Rate on numeric scale | "Rate your confidence (1-10)" |
| **Reflection** | Open text response | "Describe your experience..." |

### Adding Questions to an Assignment

1. Edit an assignment
2. Scroll to **Micro Quizzes** section
3. Click **"Add Question"**
4. Configure:

| Field | Description |
|-------|-------------|
| **Question** | The question text |
| **Type** | Multiple choice, scale, or reflection |
| **Options** | Answer choices (for multiple choice) |
| **Required** | Must answer to continue |

### Scale Question Configuration

```
Question: "How confident are you?"
Type: Scale
Min: 1 (Label: "Not confident")
Max: 10 (Label: "Very confident")
```

### Multiple Choice Configuration

```
Question: "Which approach do you prefer?"
Type: Multiple Choice
Options:
  - "Structured learning"
  - "Self-directed exploration"
  - "Collaborative projects"
  - "Hands-on practice"
```

---

## Preview & Publishing

### Previewing Your Challenge

**From Challenge Detail Page:**
1. Click the orange **"Preview Public Page"** button
2. A new tab opens showing exactly what participants see

**From Rich Editor:**
1. Click **"Preview"** in the editor header
2. If unsaved changes exist, you'll be prompted to save first

### Public URLs

Each challenge has a public URL:

```
Your Domain: https://yourcompany.com
Challenge URL: /c/[challenge-slug]

Example: https://yourcompany.com/c/emotional-mastery-2026
```

### What Participants See

```
Challenge Page (/c/slug)
├── Header with title and visual
├── Challenge description (from Rich Editor)
├── Announcements section
├── Sprint sections with assignments
│   ├── Sprint 1
│   │   ├── Assignment 1 → /a/assignment-slug
│   │   └── Assignment 2 → /a/assignment-slug
│   └── Sprint 2
│       └── ...
└── Support information
```

---

## Best Practices

### Content Organization

1. **Plan Your Structure First**
   - Map out sprints and their themes
   - List assignments for each sprint
   - Define milestones at natural progress points

2. **Use Consistent Naming**
   - Clear, descriptive titles
   - Include week/phase in labels
   - Use internal names for admin clarity

3. **Set Realistic Timelines**
   - Account for participant workload
   - Build in buffer time
   - Consider time zones for global audiences

### Rich Editor Tips

1. **Start with Structure**
   - Add headings first to outline content
   - Fill in details under each section
   - Use lists for scannable content

2. **Use Visual Hierarchy**
   - H1 for main title (once per page)
   - H2 for major sections
   - H3 for subsections
   - Bold for emphasis, not entire sentences

3. **Keep It Scannable**
   - Short paragraphs (2-3 sentences)
   - Bullet points for lists
   - Blockquotes for important callouts

### Engagement Strategies

1. **Milestone Placement**
   - Early milestone (25%) for quick win
   - Midpoint milestone (50%) for momentum
   - Completion milestone (100%) for celebration

2. **Sprint Pacing**
   - 1-2 weeks per sprint is ideal
   - 3-4 assignments per sprint
   - Mix content types within sprints

3. **Announcement Timing**
   - Welcome on day 1
   - Sprint launches on start dates
   - Encouragement at midpoint
   - Celebration at completion

---

## Quick Reference

### Keyboard Shortcuts (Rich Editor)

| Action | Shortcut |
|--------|----------|
| Bold | Cmd/Ctrl + B |
| Italic | Cmd/Ctrl + I |
| Underline | Cmd/Ctrl + U |
| Undo | Cmd/Ctrl + Z |
| Redo | Cmd/Ctrl + Shift + Z |

### Common Workflows

**Creating a Complete Challenge:**
1. Create Client (if new organization)
2. Create Challenge with welcome page
3. Create Sprints for time periods
4. Create/Import Assignments
5. Link Assignments to Sprints
6. Set up Milestones
7. Post Welcome Announcement
8. Preview and Test
9. Share Public URL

**Adding a New Assignment Mid-Program:**
1. Create Assignment (or use Library)
2. Assign to appropriate Sprint
3. Set Release Date
4. Set Visibility to hidden initially
5. Post Announcement when ready
6. Enable Visibility

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Content not saving | Check for unsaved changes dialog, click Save |
| Editor shows default | Re-edit and save content to generate JSON |
| Milestone not triggering | Verify client is in Individual mode |
| Assignment not visible | Check visibility toggle and release date |
| Password not working | Passwords are case-sensitive |

### Getting Help

If you encounter issues:
1. Check this guide for relevant section
2. Preview the public page to see participant view
3. Contact technical support with:
   - Challenge URL
   - Screenshot of issue
   - Steps to reproduce

---

*Last Updated: January 2026*

