-- =============================================================================
-- SEED DATA: Demo Client with Full Feature Challenge
-- =============================================================================
-- This migration creates a complete demo setup showcasing all platform features:
-- - Client with all features enabled
-- - Challenge with branding and rich content
-- - 3 Sprints (chapters/phases)
-- - 9 Assignments across sprints
-- - Milestones for gamification
-- - Sample announcement
-- =============================================================================

-- Generate consistent UUIDs for referential integrity
DO $$
DECLARE
  -- Client
  v_client_id uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  
  -- Challenge
  v_challenge_id uuid := 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
  
  -- Sprints
  v_sprint_1_id uuid := 'c3d4e5f6-a7b8-9012-cdef-123456789012';
  v_sprint_2_id uuid := 'd4e5f6a7-b8c9-0123-def1-234567890123';
  v_sprint_3_id uuid := 'e5f6a7b8-c9d0-1234-ef12-345678901234';
  
  -- Assignments
  v_assign_1_id uuid := 'f6a7b8c9-d0e1-2345-f123-456789012345';
  v_assign_2_id uuid := 'a7b8c9d0-e1f2-3456-0123-567890123456';
  v_assign_3_id uuid := 'b8c9d0e1-f2a3-4567-1234-678901234567';
  v_assign_4_id uuid := 'c9d0e1f2-a3b4-5678-2345-789012345678';
  v_assign_5_id uuid := 'd0e1f2a3-b4c5-6789-3456-890123456789';
  v_assign_6_id uuid := 'e1f2a3b4-c5d6-7890-4567-901234567890';
  v_assign_7_id uuid := 'f2a3b4c5-d6e7-8901-5678-012345678901';
  v_assign_8_id uuid := 'a3b4c5d6-e7f8-9012-6789-123456789012';
  v_assign_9_id uuid := 'b4c5d6e7-f8a9-0123-7890-234567890123';
  
  -- Assignment Usages
  v_usage_1_id uuid := 'c5d6e7f8-a9b0-1234-8901-345678901234';
  v_usage_2_id uuid := 'd6e7f8a9-b0c1-2345-9012-456789012345';
  v_usage_3_id uuid := 'e7f8a9b0-c1d2-3456-0123-567890123456';
  v_usage_4_id uuid := 'f8a9b0c1-d2e3-4567-1234-678901234567';
  v_usage_5_id uuid := 'a9b0c1d2-e3f4-5678-2345-789012345678';
  v_usage_6_id uuid := 'b0c1d2e3-f4a5-6789-3456-890123456789';
  v_usage_7_id uuid := 'c1d2e3f4-a5b6-7890-4567-901234567890';
  v_usage_8_id uuid := 'd2e3f4a5-b6c7-8901-5678-012345678901';
  v_usage_9_id uuid := 'e3f4a5b6-c7d8-9012-6789-123456789012';
  
  -- Milestones
  v_milestone_1_id uuid := 'f4a5b6c7-d8e9-0123-7890-234567890123';
  v_milestone_2_id uuid := 'a5b6c7d8-e9f0-1234-8901-345678901234';
  v_milestone_3_id uuid := 'b6c7d8e9-f0a1-2345-9012-456789012345';
  v_milestone_4_id uuid := 'c7d8e9f0-a1b2-3456-0123-567890123456';

BEGIN
  -- ===========================================================================
  -- 1. CLIENT: Demo Company with all features
  -- ===========================================================================
  INSERT INTO public.clients (id, name, logo_url, mode, features, created_at, updated_at)
  VALUES (
    v_client_id,
    'Demo Company',
    'https://placehold.co/200x80/ff6b4a/white?text=DEMO',
    'individual',
    '{
      "milestones": true,
      "host_videos": true,
      "announcements": true,
      "micro_quizzes": true,
      "private_views": true,
      "reveal_moments": true,
      "sprint_structure": true,
      "progress_tracking": true,
      "time_based_unlocks": true,
      "collective_progress": true,
      "session_persistence": true
    }'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    features = EXCLUDED.features,
    updated_at = now();

  -- ===========================================================================
  -- 2. CHALLENGE: Leadership Fundamentals Program
  -- ===========================================================================
  INSERT INTO public.challenges (
    id, client_id, slug, internal_name, public_title, show_public_title,
    description, description_html, brand_color, support_info, visual_url,
    is_archived, folder, starts_at, ends_at, created_at, updated_at
  )
  VALUES (
    v_challenge_id,
    v_client_id,
    'leadership-fundamentals-2026',
    'Leadership Fundamentals Q1 2026',
    'Leadership Fundamentals',
    true,
    'Master the essential skills of effective leadership through interactive modules, real-world scenarios, and practical exercises.',
    '<div class="space-y-6">
      <h1 class="text-4xl font-bold mb-2">Welcome to Leadership Fundamentals</h1>
      <p class="text-base leading-[1.6]">This comprehensive program will guide you through the essential skills every leader needs to succeed in today''s dynamic workplace.</p>
      
      <h2 class="text-3xl font-bold mb-1.5">What You''ll Learn</h2>
      <ul class="list-disc pl-6 space-y-2">
        <li class="text-base leading-[1.6]"><strong>Communication Excellence</strong> - Master the art of clear, empathetic communication</li>
        <li class="text-base leading-[1.6]"><strong>Team Building</strong> - Learn to build and nurture high-performing teams</li>
        <li class="text-base leading-[1.6]"><strong>Decision Making</strong> - Develop frameworks for confident decision-making</li>
        <li class="text-base leading-[1.6]"><strong>Emotional Intelligence</strong> - Understand and leverage emotional dynamics</li>
      </ul>
      
      <h2 class="text-3xl font-bold mb-1.5">Program Structure</h2>
      <p class="text-base leading-[1.6]">The program is divided into <strong>3 sprints</strong>, each focusing on a key leadership dimension. Complete assignments at your own pace, earn milestones, and track your progress throughout the journey.</p>
      
      <blockquote class="text-base opacity-70 italic border-l-4 border-[var(--color-accent)] pl-6 py-1">
        "Leadership is not about being in charge. It''s about taking care of those in your charge." — Simon Sinek
      </blockquote>
    </div>',
    '#ff6b4a',
    '<p>Need help? Contact your program coordinator at <a href="mailto:support@demo.com">support@demo.com</a> or visit our <a href="#">Help Center</a>.</p>',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop',
    false,
    'Q1 2026 Programs',
    now(),
    now() + interval '90 days',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    internal_name = EXCLUDED.internal_name,
    description_html = EXCLUDED.description_html,
    updated_at = now();

  -- ===========================================================================
  -- 3. SPRINTS: Three phases of the program
  -- ===========================================================================
  
  -- Sprint 1: Foundations
  INSERT INTO public.sprints (
    id, challenge_id, name, description, position, 
    intro_video_url, starts_at, ends_at, created_at, updated_at
  )
  VALUES (
    v_sprint_1_id,
    v_challenge_id,
    'Sprint 1: Foundations',
    'Build your leadership foundation with self-awareness and communication basics.',
    0,
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    now(),
    now() + interval '30 days',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = now();

  -- Sprint 2: Team Dynamics
  INSERT INTO public.sprints (
    id, challenge_id, name, description, position,
    intro_video_url, starts_at, ends_at, created_at, updated_at
  )
  VALUES (
    v_sprint_2_id,
    v_challenge_id,
    'Sprint 2: Team Dynamics',
    'Learn to build, motivate, and lead high-performing teams.',
    1,
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    now() + interval '30 days',
    now() + interval '60 days',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = now();

  -- Sprint 3: Advanced Leadership
  INSERT INTO public.sprints (
    id, challenge_id, name, description, position,
    intro_video_url, recap_video_url, starts_at, ends_at, created_at, updated_at
  )
  VALUES (
    v_sprint_3_id,
    v_challenge_id,
    'Sprint 3: Advanced Leadership',
    'Master strategic thinking, change management, and executive presence.',
    2,
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    now() + interval '60 days',
    now() + interval '90 days',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = now();

  -- ===========================================================================
  -- 4. ASSIGNMENTS: Nine learning modules
  -- ===========================================================================

  -- Assignment 1: Self-Assessment
  INSERT INTO public.assignments (
    id, slug, internal_title, public_title, subtitle, content_type,
    content, content_html, instructions, instructions_html,
    is_reusable, tags, created_at, updated_at
  )
  VALUES (
    v_assign_1_id,
    'leadership-self-assessment',
    'Leadership Self-Assessment',
    'Discover Your Leadership Style',
    'Understanding where you are today',
    'standard',
    'Complete the leadership self-assessment to identify your strengths and growth areas.',
    '<div class="space-y-4">
      <h2 class="text-3xl font-bold mb-1.5">Leadership Self-Assessment</h2>
      <p class="text-base leading-[1.6]">Before we begin your leadership journey, it''s essential to understand your current leadership style and tendencies.</p>
      <h3 class="text-2xl font-bold mb-1">Why Self-Assessment Matters</h3>
      <p class="text-base leading-[1.6]">Great leaders are self-aware. They understand their strengths, acknowledge their weaknesses, and continuously seek growth opportunities.</p>
      <h3 class="text-2xl font-bold mb-1">The Assessment Framework</h3>
      <p class="text-base leading-[1.6]">This assessment evaluates you across four key dimensions:</p>
      <ul class="list-disc pl-6 space-y-1">
        <li class="text-base leading-[1.6]">Communication Style</li>
        <li class="text-base leading-[1.6]">Decision Making Approach</li>
        <li class="text-base leading-[1.6]">Team Interaction Patterns</li>
        <li class="text-base leading-[1.6]">Conflict Resolution Methods</li>
      </ul>
    </div>',
    'Complete the assessment honestly - there are no right or wrong answers. Your results will be used to personalize your learning path.',
    '<p class="text-base leading-[1.6]">Complete the assessment honestly - there are no right or wrong answers. Your results will be used to personalize your learning path.</p>',
    true,
    ARRAY['leadership', 'assessment', 'self-awareness'],
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    internal_title = EXCLUDED.internal_title,
    updated_at = now();

  -- Assignment 2: Communication Fundamentals
  INSERT INTO public.assignments (
    id, slug, internal_title, public_title, subtitle, content_type,
    content, content_html, media_url,
    is_reusable, tags, created_at, updated_at
  )
  VALUES (
    v_assign_2_id,
    'communication-fundamentals',
    'Communication Fundamentals',
    'The Art of Clear Communication',
    'Say what you mean, mean what you say',
    'video',
    'Learn the fundamentals of effective leadership communication.',
    '<div class="space-y-4">
      <h2 class="text-3xl font-bold mb-1.5">Communication Fundamentals</h2>
      <p class="text-base leading-[1.6]">Effective communication is the cornerstone of great leadership. In this module, you''ll learn frameworks for clear, empathetic, and impactful communication.</p>
      <h3 class="text-2xl font-bold mb-1">Key Topics</h3>
      <ul class="list-disc pl-6 space-y-1">
        <li class="text-base leading-[1.6]">Active Listening Techniques</li>
        <li class="text-base leading-[1.6]">The Feedback Sandwich</li>
        <li class="text-base leading-[1.6]">Non-verbal Communication</li>
        <li class="text-base leading-[1.6]">Adapting Your Style</li>
      </ul>
    </div>',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    true,
    ARRAY['leadership', 'communication', 'video'],
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    internal_title = EXCLUDED.internal_title,
    updated_at = now();

  -- Assignment 3: Active Listening Workshop
  INSERT INTO public.assignments (
    id, slug, internal_title, public_title, subtitle, content_type,
    content, content_html,
    is_reusable, tags, created_at, updated_at
  )
  VALUES (
    v_assign_3_id,
    'active-listening-workshop',
    'Active Listening Workshop',
    'Listen to Lead',
    'The power of truly hearing others',
    'standard',
    'Practice active listening techniques with real-world scenarios.',
    '<div class="space-y-4">
      <h2 class="text-3xl font-bold mb-1.5">Active Listening Workshop</h2>
      <p class="text-base leading-[1.6]">Most people listen to respond, not to understand. This workshop will transform how you engage in conversations.</p>
      <h3 class="text-2xl font-bold mb-1">The HEAR Framework</h3>
      <ul class="list-disc pl-6 space-y-1">
        <li class="text-base leading-[1.6]"><strong>H</strong>alt - Stop what you''re doing and give full attention</li>
        <li class="text-base leading-[1.6]"><strong>E</strong>ngage - Show you''re listening with body language</li>
        <li class="text-base leading-[1.6]"><strong>A</strong>nticipate - Think about what''s being said</li>
        <li class="text-base leading-[1.6]"><strong>R</strong>eplay - Summarize to confirm understanding</li>
      </ul>
      <h3 class="text-2xl font-bold mb-1">Practice Scenarios</h3>
      <p class="text-base leading-[1.6]">You''ll work through three common workplace scenarios where active listening makes the difference between conflict and resolution.</p>
    </div>',
    true,
    ARRAY['leadership', 'communication', 'listening', 'workshop'],
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    internal_title = EXCLUDED.internal_title,
    updated_at = now();

  -- Assignment 4: Building Trust
  INSERT INTO public.assignments (
    id, slug, internal_title, public_title, subtitle, content_type,
    content, content_html,
    is_reusable, tags, created_at, updated_at
  )
  VALUES (
    v_assign_4_id,
    'building-trust',
    'Building Trust in Teams',
    'The Trust Equation',
    'Foundation of high-performing teams',
    'standard',
    'Understand and apply the trust equation in your team relationships.',
    '<div class="space-y-4">
      <h2 class="text-3xl font-bold mb-1.5">Building Trust in Teams</h2>
      <p class="text-base leading-[1.6]">Trust is the foundation upon which all successful teams are built. Without trust, collaboration suffers, innovation stalls, and engagement plummets.</p>
      <h3 class="text-2xl font-bold mb-1">The Trust Equation</h3>
      <p class="text-base leading-[1.6]"><code class="font-mono bg-gray-100 px-1 py-0.5 rounded">Trust = (Credibility + Reliability + Intimacy) / Self-Orientation</code></p>
      <ul class="list-disc pl-6 space-y-1">
        <li class="text-base leading-[1.6]"><strong>Credibility</strong> - Your expertise and knowledge</li>
        <li class="text-base leading-[1.6]"><strong>Reliability</strong> - Consistency in delivering on promises</li>
        <li class="text-base leading-[1.6]"><strong>Intimacy</strong> - Safety in sharing information</li>
        <li class="text-base leading-[1.6]"><strong>Self-Orientation</strong> - Focus on self vs. others (lower is better)</li>
      </ul>
    </div>',
    true,
    ARRAY['leadership', 'team-building', 'trust'],
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    internal_title = EXCLUDED.internal_title,
    updated_at = now();

  -- Assignment 5: Delegation Mastery
  INSERT INTO public.assignments (
    id, slug, internal_title, public_title, subtitle, content_type,
    content, content_html, password_hash,
    is_reusable, tags, created_at, updated_at
  )
  VALUES (
    v_assign_5_id,
    'delegation-mastery',
    'Delegation Mastery',
    'The Art of Letting Go',
    'Empowering others through delegation',
    'standard',
    'Learn when, what, and how to delegate effectively.',
    '<div class="space-y-4">
      <h2 class="text-3xl font-bold mb-1.5">Delegation Mastery</h2>
      <p class="text-base leading-[1.6]">Many leaders struggle with delegation. They either hold on too tightly or delegate without proper support. This module teaches the balanced approach.</p>
      <h3 class="text-2xl font-bold mb-1">The Delegation Matrix</h3>
      <p class="text-base leading-[1.6]">Use this framework to decide what to delegate:</p>
      <ul class="list-disc pl-6 space-y-1">
        <li class="text-base leading-[1.6]"><strong>Do</strong> - High importance, high urgency (you handle)</li>
        <li class="text-base leading-[1.6]"><strong>Delegate</strong> - High importance, low urgency (develop others)</li>
        <li class="text-base leading-[1.6]"><strong>Defer</strong> - Low importance, high urgency (quick handoff)</li>
        <li class="text-base leading-[1.6]"><strong>Delete</strong> - Low importance, low urgency (eliminate)</li>
      </ul>
    </div>',
    '$2a$10$rOvHPZjnVvPQFfGJ3d0KzOxxxxxxxxxxxxxxxxxxx', -- Password: "leader2026"
    true,
    ARRAY['leadership', 'delegation', 'productivity'],
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    internal_title = EXCLUDED.internal_title,
    updated_at = now();

  -- Assignment 6: Feedback Culture
  INSERT INTO public.assignments (
    id, slug, internal_title, public_title, subtitle, content_type,
    content, content_html,
    is_reusable, tags, created_at, updated_at
  )
  VALUES (
    v_assign_6_id,
    'feedback-culture',
    'Creating a Feedback Culture',
    'Feedback as a Gift',
    'Building a culture of continuous improvement',
    'standard',
    'Create an environment where feedback flows freely and constructively.',
    '<div class="space-y-4">
      <h2 class="text-3xl font-bold mb-1.5">Creating a Feedback Culture</h2>
      <p class="text-base leading-[1.6]">High-performing teams thrive on feedback. This module teaches you how to give, receive, and cultivate feedback as a team norm.</p>
      <h3 class="text-2xl font-bold mb-1">The SBI Model</h3>
      <p class="text-base leading-[1.6]">Structure your feedback using:</p>
      <ul class="list-disc pl-6 space-y-1">
        <li class="text-base leading-[1.6]"><strong>Situation</strong> - Describe the specific context</li>
        <li class="text-base leading-[1.6]"><strong>Behavior</strong> - Explain the observed behavior</li>
        <li class="text-base leading-[1.6]"><strong>Impact</strong> - Share the effect of the behavior</li>
      </ul>
      <blockquote class="text-base opacity-70 italic border-l-4 border-[var(--color-accent)] pl-6 py-1">
        "Feedback is the breakfast of champions." — Ken Blanchard
      </blockquote>
    </div>',
    true,
    ARRAY['leadership', 'feedback', 'team-building'],
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    internal_title = EXCLUDED.internal_title,
    updated_at = now();

  -- Assignment 7: Strategic Thinking
  INSERT INTO public.assignments (
    id, slug, internal_title, public_title, subtitle, content_type,
    content, content_html, media_url,
    is_reusable, tags, created_at, updated_at
  )
  VALUES (
    v_assign_7_id,
    'strategic-thinking',
    'Strategic Thinking for Leaders',
    'Think Big, Act Smart',
    'Developing your strategic mindset',
    'video',
    'Develop the ability to think strategically about your team and organization.',
    '<div class="space-y-4">
      <h2 class="text-3xl font-bold mb-1.5">Strategic Thinking for Leaders</h2>
      <p class="text-base leading-[1.6]">Strategic thinking separates managers from leaders. Learn to see the big picture while managing day-to-day operations.</p>
      <h3 class="text-2xl font-bold mb-1">The Strategic Mindset</h3>
      <ul class="list-disc pl-6 space-y-1">
        <li class="text-base leading-[1.6]">Long-term vision over short-term gains</li>
        <li class="text-base leading-[1.6]">Systems thinking and interconnections</li>
        <li class="text-base leading-[1.6]">Anticipating change and disruption</li>
        <li class="text-base leading-[1.6]">Balancing stakeholder interests</li>
      </ul>
    </div>',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    true,
    ARRAY['leadership', 'strategy', 'advanced'],
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    internal_title = EXCLUDED.internal_title,
    updated_at = now();

  -- Assignment 8: Change Management
  INSERT INTO public.assignments (
    id, slug, internal_title, public_title, subtitle, content_type,
    content, content_html,
    is_reusable, tags, created_at, updated_at
  )
  VALUES (
    v_assign_8_id,
    'change-management',
    'Leading Through Change',
    'Change Leadership',
    'Navigating uncertainty with confidence',
    'standard',
    'Learn to lead your team through organizational change effectively.',
    '<div class="space-y-4">
      <h2 class="text-3xl font-bold mb-1.5">Leading Through Change</h2>
      <p class="text-base leading-[1.6]">Change is constant. Your ability to navigate and lead through change will define your leadership legacy.</p>
      <h3 class="text-2xl font-bold mb-1">The Change Curve</h3>
      <p class="text-base leading-[1.6]">Understanding the emotional journey of change:</p>
      <ol class="list-decimal pl-6 space-y-1">
        <li class="text-base leading-[1.6]"><strong>Denial</strong> - "This won''t really happen"</li>
        <li class="text-base leading-[1.6]"><strong>Resistance</strong> - "Why do we need this?"</li>
        <li class="text-base leading-[1.6]"><strong>Exploration</strong> - "Maybe this could work..."</li>
        <li class="text-base leading-[1.6]"><strong>Commitment</strong> - "Let''s make this successful"</li>
      </ol>
      <h3 class="text-2xl font-bold mb-1">Your Role as Change Leader</h3>
      <p class="text-base leading-[1.6]">Learn to communicate vision, address concerns, celebrate wins, and maintain momentum through the change journey.</p>
    </div>',
    true,
    ARRAY['leadership', 'change-management', 'advanced'],
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    internal_title = EXCLUDED.internal_title,
    updated_at = now();

  -- Assignment 9: Final Assessment & Reflection
  INSERT INTO public.assignments (
    id, slug, internal_title, public_title, subtitle, content_type,
    content, content_html,
    is_reusable, tags, created_at, updated_at
  )
  VALUES (
    v_assign_9_id,
    'leadership-final-reflection',
    'Leadership Journey Reflection',
    'Your Leadership Journey',
    'Celebrating growth and planning ahead',
    'quiz',
    'Reflect on your leadership journey and create your personal development plan.',
    '<div class="space-y-4">
      <h2 class="text-3xl font-bold mb-1.5">Your Leadership Journey</h2>
      <p class="text-base leading-[1.6]">Congratulations on completing the Leadership Fundamentals program! Take time to reflect on your growth and plan your continued development.</p>
      <h3 class="text-2xl font-bold mb-1">Reflection Questions</h3>
      <ul class="list-disc pl-6 space-y-1">
        <li class="text-base leading-[1.6]">What was your biggest "aha" moment during this program?</li>
        <li class="text-base leading-[1.6]">Which skill do you feel most improved in?</li>
        <li class="text-base leading-[1.6]">What challenge will you tackle first with your new skills?</li>
        <li class="text-base leading-[1.6]">How will you continue developing as a leader?</li>
      </ul>
      <h3 class="text-2xl font-bold mb-1">Your Leadership Commitment</h3>
      <p class="text-base leading-[1.6]">Write down three specific actions you''ll take in the next 30 days to apply what you''ve learned.</p>
    </div>',
    true,
    ARRAY['leadership', 'reflection', 'assessment'],
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    internal_title = EXCLUDED.internal_title,
    updated_at = now();

  -- ===========================================================================
  -- 5. ASSIGNMENT USAGES: Link assignments to challenge via sprints
  -- ===========================================================================

  -- Sprint 1 Assignments (positions 0-2)
  INSERT INTO public.assignment_usages (
    id, challenge_id, sprint_id, assignment_id, position, is_visible,
    label, is_milestone, reveal_style, created_at, updated_at
  )
  VALUES
    (v_usage_1_id, v_challenge_id, v_sprint_1_id, v_assign_1_id, 0, true, 'Start Here', false, 'instant', now(), now()),
    (v_usage_2_id, v_challenge_id, v_sprint_1_id, v_assign_2_id, 1, true, NULL, false, 'fade', now(), now()),
    (v_usage_3_id, v_challenge_id, v_sprint_1_id, v_assign_3_id, 2, true, 'Workshop', true, 'dramatic', now(), now())
  ON CONFLICT (id) DO UPDATE SET
    position = EXCLUDED.position,
    updated_at = now();

  -- Sprint 2 Assignments (positions 3-5)
  INSERT INTO public.assignment_usages (
    id, challenge_id, sprint_id, assignment_id, position, is_visible,
    label, is_milestone, reveal_style, created_at, updated_at
  )
  VALUES
    (v_usage_4_id, v_challenge_id, v_sprint_2_id, v_assign_4_id, 3, true, NULL, false, 'fade', now(), now()),
    (v_usage_5_id, v_challenge_id, v_sprint_2_id, v_assign_5_id, 4, true, 'Premium', false, 'fade', now(), now()),
    (v_usage_6_id, v_challenge_id, v_sprint_2_id, v_assign_6_id, 5, true, NULL, true, 'dramatic', now(), now())
  ON CONFLICT (id) DO UPDATE SET
    position = EXCLUDED.position,
    updated_at = now();

  -- Sprint 3 Assignments (positions 6-8)
  INSERT INTO public.assignment_usages (
    id, challenge_id, sprint_id, assignment_id, position, is_visible,
    label, is_milestone, reveal_style, release_at, created_at, updated_at
  )
  VALUES
    (v_usage_7_id, v_challenge_id, v_sprint_3_id, v_assign_7_id, 6, true, 'Advanced', false, 'fade', now() + interval '60 days', now(), now()),
    (v_usage_8_id, v_challenge_id, v_sprint_3_id, v_assign_8_id, 7, true, NULL, false, 'fade', now() + interval '75 days', now(), now()),
    (v_usage_9_id, v_challenge_id, v_sprint_3_id, v_assign_9_id, 8, true, 'Final', true, 'dramatic', now() + interval '85 days', now(), now())
  ON CONFLICT (id) DO UPDATE SET
    position = EXCLUDED.position,
    updated_at = now();

  -- ===========================================================================
  -- 6. MILESTONES: Gamification achievements
  -- ===========================================================================

  -- Milestone 1: Getting Started
  INSERT INTO public.milestones (
    id, challenge_id, name, description, trigger_type, trigger_value,
    celebration_type, celebration_content, position, created_at, updated_at
  )
  VALUES (
    v_milestone_1_id,
    v_challenge_id,
    'Getting Started',
    'Completed your first assignment!',
    'assignment_complete',
    v_assign_1_id::text,
    'message',
    '🎉 Welcome aboard! You''ve taken the first step on your leadership journey. Keep up the momentum!',
    0,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = now();

  -- Milestone 2: Foundation Complete
  INSERT INTO public.milestones (
    id, challenge_id, name, description, trigger_type, trigger_value,
    celebration_type, celebration_content, position, created_at, updated_at
  )
  VALUES (
    v_milestone_2_id,
    v_challenge_id,
    'Foundation Builder',
    'Completed Sprint 1: Foundations',
    'sprint_complete',
    v_sprint_1_id::text,
    'badge',
    'https://placehold.co/100x100/14b8a6/white?text=🏗️',
    1,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = now();

  -- Milestone 3: Halfway There
  INSERT INTO public.milestones (
    id, challenge_id, name, description, trigger_type, trigger_value,
    celebration_type, celebration_content, position, created_at, updated_at
  )
  VALUES (
    v_milestone_3_id,
    v_challenge_id,
    'Halfway Hero',
    'Completed 50% of the program',
    'percentage',
    '50',
    'animation',
    'confetti',
    2,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = now();

  -- Milestone 4: Leadership Graduate
  INSERT INTO public.milestones (
    id, challenge_id, name, description, trigger_type, trigger_value,
    celebration_type, celebration_content, position, created_at, updated_at
  )
  VALUES (
    v_milestone_4_id,
    v_challenge_id,
    'Leadership Graduate',
    'Completed the entire Leadership Fundamentals program!',
    'percentage',
    '100',
    'message',
    '🎓 Congratulations, Leader! You''ve completed the Leadership Fundamentals program. You now have the tools to lead with confidence, empathy, and impact. Go make a difference!',
    3,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = now();

  -- ===========================================================================
  -- 7. ANNOUNCEMENT: Welcome message
  -- ===========================================================================
  INSERT INTO public.announcements (
    id, challenge_id, title, content, content_html, is_pinned,
    published_at, created_at, updated_at
  )
  VALUES (
    'a6b7c8d9-e0f1-2345-6789-012345678901',
    v_challenge_id,
    'Welcome to Leadership Fundamentals! 👋',
    'We''re excited to have you join us on this leadership journey. Take your time with each module and don''t hesitate to reach out if you have questions.',
    '<p class="text-base leading-[1.6]">We''re excited to have you join us on this leadership journey. Take your time with each module and don''t hesitate to reach out if you have questions.</p><p class="text-base leading-[1.6] mt-2">Remember: <strong>Leadership is a practice, not a destination.</strong> Enjoy the journey!</p>',
    true,
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    updated_at = now();

  -- ===========================================================================
  -- 8. MICRO QUIZ: Sample quiz for reflection assignment
  -- ===========================================================================
  INSERT INTO public.micro_quizzes (
    id, assignment_id, question, quiz_type, options, position, created_at, updated_at
  )
  VALUES (
    'b7c8d9e0-f1a2-3456-7890-123456789012',
    v_assign_9_id,
    'What was your biggest takeaway from this program?',
    'reflection',
    NULL,
    0,
    now(),
    now()
  ),
  (
    'c8d9e0f1-a2b3-4567-8901-234567890123',
    v_assign_9_id,
    'How confident do you feel in your leadership abilities now?',
    'scale',
    NULL,
    1,
    now(),
    now()
  ),
  (
    'd9e0f1a2-b3c4-5678-9012-345678901234',
    v_assign_9_id,
    'Which skill area do you want to develop further?',
    'multiple_choice',
    '["Communication", "Delegation", "Strategic Thinking", "Change Management", "Team Building"]'::jsonb,
    2,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    question = EXCLUDED.question,
    updated_at = now();

  -- Update scale labels for the scale quiz
  UPDATE public.micro_quizzes 
  SET scale_min = 1, scale_max = 10, scale_labels = '{"min": "Not confident", "max": "Very confident"}'::jsonb
  WHERE id = 'c8d9e0f1-a2b3-4567-8901-234567890123';

END $$;

-- =============================================================================
-- VERIFICATION: Check the data was created
-- =============================================================================
-- Run these queries to verify:
-- SELECT * FROM clients WHERE name = 'Demo Company';
-- SELECT * FROM challenges WHERE slug = 'leadership-fundamentals-2026';
-- SELECT * FROM sprints WHERE challenge_id IN (SELECT id FROM challenges WHERE slug = 'leadership-fundamentals-2026');
-- SELECT * FROM assignment_usages WHERE challenge_id IN (SELECT id FROM challenges WHERE slug = 'leadership-fundamentals-2026') ORDER BY position;
-- SELECT * FROM milestones WHERE challenge_id IN (SELECT id FROM challenges WHERE slug = 'leadership-fundamentals-2026') ORDER BY position;


