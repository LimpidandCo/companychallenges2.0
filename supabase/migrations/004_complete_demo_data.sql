-- Complete Demo Data Seed
-- This creates a full example with all features populated
-- Run this AFTER the existing migrations

-- Clean up any existing demo data first
DELETE FROM public.micro_quizzes WHERE assignment_id IN (
  SELECT id FROM public.assignments WHERE slug LIKE 'em-%'
);
DELETE FROM public.milestone_achievements WHERE milestone_id IN (
  SELECT id FROM public.milestones WHERE challenge_id IN (
    SELECT id FROM public.challenges WHERE slug = 'emotional-mastery-2026'
  )
);
DELETE FROM public.milestones WHERE challenge_id IN (
  SELECT id FROM public.challenges WHERE slug = 'emotional-mastery-2026'
);
DELETE FROM public.announcements WHERE challenge_id IN (
  SELECT id FROM public.challenges WHERE slug = 'emotional-mastery-2026'
);
DELETE FROM public.assignment_usages WHERE challenge_id IN (
  SELECT id FROM public.challenges WHERE slug = 'emotional-mastery-2026'
);
DELETE FROM public.sprints WHERE challenge_id IN (
  SELECT id FROM public.challenges WHERE slug = 'emotional-mastery-2026'
);
DELETE FROM public.challenges WHERE slug = 'emotional-mastery-2026';
DELETE FROM public.assignments WHERE slug LIKE 'em-%';
DELETE FROM public.clients WHERE name = 'ACME Learning Corp';

-- ============================================================================
-- 1. CREATE CLIENT
-- ============================================================================
INSERT INTO public.clients (
  id, name, logo_url, mode, features, created_at, updated_at
)
VALUES (
  'c1a00000-0000-4000-a000-000000000001',
  'ACME Learning Corp',
  'https://api.dicebear.com/7.x/initials/svg?seed=ACME&backgroundColor=f97316',
  'individual',
  '{
    "announcements": true,
    "host_videos": true,
    "sprint_structure": true,
    "collective_progress": true,
    "time_based_unlocks": true,
    "milestones": true,
    "reveal_moments": true,
    "micro_quizzes": true,
    "progress_tracking": true,
    "session_persistence": true,
    "private_views": true
  }'::jsonb,
  NOW(),
  NOW()
);

-- ============================================================================
-- 2. CREATE CHALLENGE with full description_json
-- ============================================================================
INSERT INTO public.challenges (
  id, client_id, slug, internal_name, public_title, show_public_title,
  mode, features,
  description,
  description_html,
  description_json,
  brand_color, support_info, visual_url,
  is_archived, folder, starts_at, ends_at, created_at, updated_at
)
VALUES (
  'c2b00000-0000-4000-b000-000000000001',
  'c1a00000-0000-4000-a000-000000000001',
  'emotional-mastery-2026',
  'Emotional Intelligence Mastery',
  'Master Your Emotional Intelligence',
  true,
  'individual',
  '{
    "announcements": true,
    "host_videos": true,
    "sprint_structure": true,
    "collective_progress": false,
    "time_based_unlocks": true,
    "milestones": true,
    "reveal_moments": true,
    "micro_quizzes": true,
    "progress_tracking": true,
    "session_persistence": true,
    "private_views": true
  }'::jsonb,
  'A comprehensive 6-week program to develop emotional intelligence skills.',
  -- description_html
  '<article class="prose prose-slate max-w-none"><h1 class="text-4xl font-bold mb-6">Master Your Emotional Intelligence</h1><p class="text-lg leading-relaxed mb-6">Welcome to this transformative 6-week journey designed to help you understand, develop, and leverage your emotional intelligence in both personal and professional contexts.</p><h2 class="text-2xl font-semibold mt-8 mb-4">Program Overview</h2><p class="leading-relaxed mb-4">Emotional Intelligence (EQ) is the ability to recognize, understand, manage, and effectively use emotions in yourself and others. Research shows that EQ is often more important than IQ for success in leadership, relationships, and overall well-being.</p><h2 class="text-2xl font-semibold mt-8 mb-4">What You''ll Learn</h2><ul class="list-disc pl-6 space-y-2 mb-6"><li><strong>Self-Awareness</strong> – Recognize your emotions and their impact on your thoughts and behavior</li><li><strong>Self-Regulation</strong> – Manage disruptive emotions and adapt to changing circumstances</li><li><strong>Motivation</strong> – Harness emotions to pursue goals with energy and persistence</li><li><strong>Empathy</strong> – Sense others'' emotions and understand their perspective</li><li><strong>Social Skills</strong> – Build relationships, inspire others, and manage conflict</li></ul><h2 class="text-2xl font-semibold mt-8 mb-4">Program Structure</h2><p class="leading-relaxed mb-4">The program is divided into <strong>3 sprints</strong>, each lasting two weeks. You''ll complete readings, reflections, and practical exercises to build real-world skills.</p><blockquote class="border-l-4 border-orange-500 pl-4 italic my-6">"Emotional intelligence is not the opposite of intelligence, it is not the triumph of heart over head – it is the unique intersection of both." – David Caruso</blockquote></article>',
  -- description_json (ContainerNode format)
  '{
    "id": "root",
    "type": "container",
    "children": [
      {
        "id": "h1-welcome",
        "type": "h1",
        "content": "Master Your Emotional Intelligence",
        "attributes": {}
      },
      {
        "id": "p-intro",
        "type": "p",
        "content": "Welcome to this transformative 6-week journey designed to help you understand, develop, and leverage your emotional intelligence in both personal and professional contexts.",
        "attributes": {}
      },
      {
        "id": "h2-overview",
        "type": "h2",
        "content": "Program Overview",
        "attributes": {}
      },
      {
        "id": "p-overview",
        "type": "p",
        "content": "Emotional Intelligence (EQ) is the ability to recognize, understand, manage, and effectively use emotions in yourself and others. Research shows that EQ is often more important than IQ for success in leadership, relationships, and overall well-being.",
        "attributes": {}
      }
    ],
    "attributes": {
      "pageBackgroundColor": "#ffffff"
    }
  }'::jsonb,
  '#f97316',
  'Need help? Contact support@acmelearning.com or call 1-800-ACME-LRN',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&h=600&fit=crop',
  false,
  'Q1 2026',
  '2026-01-01',
  '2026-03-15',
  NOW(),
  NOW()
);

-- ============================================================================
-- 3. CREATE SPRINTS
-- ============================================================================
INSERT INTO public.sprints (id, challenge_id, name, description, position, starts_at, ends_at, intro_video_url, recap_video_url, created_at, updated_at)
VALUES
  (
    '5ab00000-0000-4000-a000-000000000001',
    'c2b00000-0000-4000-b000-000000000001',
    'Foundation: Self-Awareness',
    'Build the foundation of emotional intelligence by developing deep self-awareness. Learn to recognize your emotions as they happen and understand their impact.',
    0,
    '2026-01-01',
    '2026-01-14',
    'https://www.youtube.com/watch?v=example1',
    NULL,
    NOW(),
    NOW()
  ),
  (
    '5ab00000-0000-4000-a000-000000000002',
    'c2b00000-0000-4000-b000-000000000001',
    'Growth: Managing Emotions',
    'Take control of your emotional responses. Learn techniques for self-regulation and channeling emotions productively toward your goals.',
    1,
    '2026-01-15',
    '2026-01-28',
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    '5ab00000-0000-4000-a000-000000000003',
    'c2b00000-0000-4000-b000-000000000001',
    'Mastery: Social Intelligence',
    'Apply your emotional skills in relationships. Develop empathy, improve communication, and become a more effective leader and collaborator.',
    2,
    '2026-01-29',
    '2026-02-14',
    NULL,
    'https://www.youtube.com/watch?v=example2',
    NOW(),
    NOW()
  );

-- ============================================================================
-- 4. CREATE ASSIGNMENTS with full content_json
-- ============================================================================

-- Sprint 1: Foundation Assignments
INSERT INTO public.assignments (
  id, slug, internal_title, content_type,
  instructions_html, instructions_json,
  content_html, content_json,
  is_reusable, password_hash, tags,
  created_at, updated_at
)
VALUES
  (
    'a1b00000-0000-4000-a000-000000000001',
    'em-understanding-emotions',
    'Understanding Your Emotional Landscape',
    'standard',
    '<p>Complete this module to understand the basics of emotional intelligence and begin mapping your emotional patterns.</p>',
    '{"id":"root","type":"container","children":[{"id":"p1","type":"p","content":"Complete this module to understand the basics of emotional intelligence and begin mapping your emotional patterns.","attributes":{}}],"attributes":{}}'::jsonb,
    '<article class="prose prose-slate max-w-none"><h1>Understanding Your Emotional Landscape</h1><p>Emotions are data. They tell us something important about our environment, our relationships, and ourselves. The first step in developing emotional intelligence is learning to recognize and name our emotions accurately.</p><h2>The Emotion Wheel</h2><p>Psychologist Robert Plutchik identified 8 primary emotions: joy, trust, fear, surprise, sadness, disgust, anger, and anticipation. Each of these has variations in intensity.</p><h2>Your Assignment</h2><ol><li>For the next 3 days, keep an emotion journal</li><li>Note the emotion, its intensity (1-10), and the situation that triggered it</li><li>Look for patterns in when and why certain emotions arise</li></ol><h2>Reflection Questions</h2><ul><li>Which emotions do you experience most frequently?</li><li>Are there emotions you tend to suppress or avoid?</li><li>How do your emotions typically affect your behavior?</li></ul></article>',
    '{"id":"root","type":"container","children":[{"id":"h1-1","type":"h1","content":"Understanding Your Emotional Landscape","attributes":{}},{"id":"p-1","type":"p","content":"Emotions are data. They tell us something important about our environment, our relationships, and ourselves.","attributes":{}}],"attributes":{"pageBackgroundColor":"#ffffff"}}'::jsonb,
    true,
    NULL,
    ARRAY['self-awareness', 'foundation', 'journaling'],
    NOW(),
    NOW()
  ),
  (
    'a1b00000-0000-4000-a000-000000000002',
    'em-body-emotion-connection',
    'The Body-Emotion Connection',
    'video',
    '<p>Watch the video and complete the body scan exercise.</p>',
    '{"id":"root","type":"container","children":[{"id":"p1","type":"p","content":"Watch the video and complete the body scan exercise.","attributes":{}}],"attributes":{}}'::jsonb,
    '<article class="prose prose-slate max-w-none"><h1>The Body-Emotion Connection</h1><p>Our bodies hold our emotions. Learning to notice physical sensations is a powerful shortcut to emotional awareness.</p><h2>Video: Body Scan Meditation</h2><p>Watch this 15-minute guided body scan meditation to develop somatic awareness.</p><h2>Key Takeaways</h2><ul><li>Emotions manifest physically before we consciously recognize them</li><li>Common patterns: tension in shoulders (stress), pit in stomach (anxiety), warmth in chest (joy)</li><li>Regular body scanning builds emotional awareness over time</li></ul></article>',
    '{"id":"root","type":"container","children":[{"id":"h1-1","type":"h1","content":"The Body-Emotion Connection","attributes":{}}],"attributes":{"pageBackgroundColor":"#ffffff"}}'::jsonb,
    true,
    NULL,
    ARRAY['self-awareness', 'somatic', 'meditation'],
    NOW(),
    NOW()
  ),
  (
    'a1b00000-0000-4000-a000-000000000003',
    'em-triggers-assessment',
    'Emotional Triggers Assessment',
    'quiz',
    '<p>Complete this assessment to identify your emotional triggers.</p>',
    '{"id":"root","type":"container","children":[{"id":"p1","type":"p","content":"Complete this assessment to identify your emotional triggers.","attributes":{}}],"attributes":{}}'::jsonb,
    '<article class="prose prose-slate max-w-none"><h1>Emotional Triggers Assessment</h1><p>Understanding what triggers strong emotional reactions is essential for self-management. This assessment will help you identify patterns.</p><h2>Instructions</h2><p>Answer each question honestly. There are no right or wrong answers – this is about self-discovery.</p></article>',
    '{"id":"root","type":"container","children":[{"id":"h1-1","type":"h1","content":"Emotional Triggers Assessment","attributes":{}},{"id":"p-1","type":"p","content":"Understanding what triggers strong emotional reactions is essential for self-management.","attributes":{}}],"attributes":{"pageBackgroundColor":"#ffffff"}}'::jsonb,
    true,
    NULL,
    ARRAY['self-awareness', 'assessment', 'triggers'],
    NOW(),
    NOW()
  );

-- Sprint 2: Growth Assignments
INSERT INTO public.assignments (
  id, slug, internal_title, content_type,
  instructions_html, instructions_json,
  content_html, content_json,
  is_reusable, password_hash, tags,
  created_at, updated_at
)
VALUES
  (
    'a1b00000-0000-4000-a000-000000000004',
    'em-pause-technique',
    'The Pause Technique',
    'standard',
    '<p>Learn and practice the STOP technique for emotional regulation.</p>',
    '{"id":"root","type":"container","children":[{"id":"p1","type":"p","content":"Learn and practice the STOP technique for emotional regulation.","attributes":{}}],"attributes":{}}'::jsonb,
    '<article class="prose prose-slate max-w-none"><h1>The Pause Technique</h1><p>Between stimulus and response, there is a space. In that space lies our power to choose our response. This assignment teaches you to expand that space.</p><h2>The STOP Technique</h2><ul><li><strong>S</strong> - Stop what you''re doing</li><li><strong>T</strong> - Take a breath</li><li><strong>O</strong> - Observe your thoughts and feelings</li><li><strong>P</strong> - Proceed with awareness</li></ul><h2>Practice Exercise</h2><p>Use the STOP technique 3 times today when you notice an emotional reaction. Record your experience in your journal.</p></article>',
    '{"id":"root","type":"container","children":[{"id":"h1-1","type":"h1","content":"The Pause Technique","attributes":{}}],"attributes":{"pageBackgroundColor":"#ffffff"}}'::jsonb,
    true,
    NULL,
    ARRAY['self-regulation', 'techniques', 'mindfulness'],
    NOW(),
    NOW()
  ),
  (
    'a1b00000-0000-4000-a000-000000000005',
    'em-reframing-thoughts',
    'Cognitive Reframing',
    'standard',
    '<p>Master the skill of reframing negative thoughts into constructive perspectives.</p>',
    '{"id":"root","type":"container","children":[{"id":"p1","type":"p","content":"Master the skill of reframing negative thoughts into constructive perspectives.","attributes":{}}],"attributes":{}}'::jsonb,
    '<article class="prose prose-slate max-w-none"><h1>Cognitive Reframing</h1><p>Our thoughts shape our emotions. By changing how we think about situations, we can change how we feel about them.</p><h2>The Reframing Process</h2><ol><li>Identify the triggering situation</li><li>Notice your automatic thought</li><li>Examine the evidence for and against this thought</li><li>Generate alternative, balanced perspectives</li><li>Choose a more helpful thought</li></ol><h2>Common Cognitive Distortions</h2><ul><li><strong>All-or-nothing thinking</strong> - Seeing things in black and white</li><li><strong>Catastrophizing</strong> - Expecting the worst possible outcome</li><li><strong>Mind reading</strong> - Assuming you know what others think</li><li><strong>Personalization</strong> - Taking responsibility for things outside your control</li></ul></article>',
    '{"id":"root","type":"container","children":[{"id":"h1-1","type":"h1","content":"Cognitive Reframing","attributes":{}}],"attributes":{"pageBackgroundColor":"#ffffff"}}'::jsonb,
    true,
    NULL,
    ARRAY['self-regulation', 'cognitive', 'reframing'],
    NOW(),
    NOW()
  ),
  (
    'a1b00000-0000-4000-a000-000000000006',
    'em-motivation-mastery',
    'Intrinsic Motivation',
    'standard',
    '<p>Discover your core motivators and learn to sustain motivation through challenges.</p>',
    '{"id":"root","type":"container","children":[{"id":"p1","type":"p","content":"Discover your core motivators and learn to sustain motivation through challenges.","attributes":{}}],"attributes":{}}'::jsonb,
    '<article class="prose prose-slate max-w-none"><h1>Intrinsic Motivation</h1><p>Emotionally intelligent people are self-motivated. They have a drive to pursue goals with energy and persistence, beyond external rewards.</p><h2>The Three Pillars of Intrinsic Motivation</h2><ul><li><strong>Autonomy</strong> - The desire to direct our own lives</li><li><strong>Mastery</strong> - The urge to get better at something that matters</li><li><strong>Purpose</strong> - The yearning to do what we do in service of something larger</li></ul><h2>Reflection</h2><p>Think about a time when you felt deeply motivated. What was driving you? How can you create more of those conditions in your current work?</p></article>',
    '{"id":"root","type":"container","children":[{"id":"h1-1","type":"h1","content":"Intrinsic Motivation","attributes":{}}],"attributes":{"pageBackgroundColor":"#ffffff"}}'::jsonb,
    true,
    NULL,
    ARRAY['motivation', 'self-regulation', 'purpose'],
    NOW(),
    NOW()
  );

-- Sprint 3: Mastery Assignments
INSERT INTO public.assignments (
  id, slug, internal_title, content_type,
  instructions_html, instructions_json,
  content_html, content_json,
  is_reusable, password_hash, tags,
  created_at, updated_at
)
VALUES
  (
    'a1b00000-0000-4000-a000-000000000007',
    'em-empathy-practice',
    'Developing Empathy',
    'standard',
    '<p>Practice perspective-taking and empathic listening skills.</p>',
    '{"id":"root","type":"container","children":[{"id":"p1","type":"p","content":"Practice perspective-taking and empathic listening skills.","attributes":{}}],"attributes":{}}'::jsonb,
    '<article class="prose prose-slate max-w-none"><h1>Developing Empathy</h1><p>Empathy is the ability to understand and share the feelings of another. It''s the foundation of all meaningful relationships and effective leadership.</p><h2>Three Types of Empathy</h2><ul><li><strong>Cognitive Empathy</strong> - Understanding someone''s perspective intellectually</li><li><strong>Emotional Empathy</strong> - Feeling what another person feels</li><li><strong>Compassionate Empathy</strong> - Understanding + feeling + being moved to help</li></ul><h2>Empathic Listening Exercise</h2><p>This week, practice empathic listening in at least 3 conversations:</p><ol><li>Give full attention (no phones, no distractions)</li><li>Listen to understand, not to respond</li><li>Reflect back what you hear</li><li>Ask clarifying questions</li><li>Validate emotions before offering solutions</li></ol></article>',
    '{"id":"root","type":"container","children":[{"id":"h1-1","type":"h1","content":"Developing Empathy","attributes":{}}],"attributes":{"pageBackgroundColor":"#ffffff"}}'::jsonb,
    true,
    NULL,
    ARRAY['empathy', 'social-skills', 'listening'],
    NOW(),
    NOW()
  ),
  (
    'a1b00000-0000-4000-a000-000000000008',
    'em-difficult-conversations',
    'Navigating Difficult Conversations',
    'standard',
    '<p>Learn frameworks for having productive difficult conversations.</p>',
    '{"id":"root","type":"container","children":[{"id":"p1","type":"p","content":"Learn frameworks for having productive difficult conversations.","attributes":{}}],"attributes":{}}'::jsonb,
    '<article class="prose prose-slate max-w-none"><h1>Navigating Difficult Conversations</h1><p>The ability to have difficult conversations with grace is a hallmark of emotional intelligence. This module gives you a framework for addressing tough topics.</p><h2>The DESC Framework</h2><ul><li><strong>D - Describe</strong> the situation objectively</li><li><strong>E - Express</strong> how it affects you using "I" statements</li><li><strong>S - Specify</strong> what you would like to happen</li><li><strong>C - Consequences</strong> - Share positive outcomes of resolution</li></ul><h2>Before the Conversation</h2><ol><li>Clarify your purpose</li><li>Check your assumptions</li><li>Manage your emotions first</li><li>Choose the right time and place</li></ol><blockquote>Remember: The goal is understanding, not winning.</blockquote></article>',
    '{"id":"root","type":"container","children":[{"id":"h1-1","type":"h1","content":"Navigating Difficult Conversations","attributes":{}}],"attributes":{"pageBackgroundColor":"#ffffff"}}'::jsonb,
    true,
    'password123',
    ARRAY['social-skills', 'communication', 'conflict-resolution'],
    NOW(),
    NOW()
  ),
  (
    'a1b00000-0000-4000-a000-000000000009',
    'em-final-assessment',
    'Final Assessment & Action Plan',
    'quiz',
    '<p>Complete your final EQ assessment and create a personal action plan.</p>',
    '{"id":"root","type":"container","children":[{"id":"p1","type":"p","content":"Complete your final EQ assessment and create a personal action plan.","attributes":{}}],"attributes":{}}'::jsonb,
    '<article class="prose prose-slate max-w-none"><h1>Final Assessment & Action Plan</h1><p>Congratulations on reaching the final module! This assessment will measure your growth and help you create a plan for continued development.</p><h2>Part 1: Self-Assessment</h2><p>Rate yourself on each EQ competency compared to when you started.</p><h2>Part 2: Action Plan</h2><p>Identify 3 specific ways you will continue developing your emotional intelligence after this program.</p></article>',
    '{"id":"root","type":"container","children":[{"id":"h1-1","type":"h1","content":"Final Assessment & Action Plan","attributes":{}}],"attributes":{"pageBackgroundColor":"#ffffff"}}'::jsonb,
    true,
    NULL,
    ARRAY['assessment', 'action-plan', 'capstone'],
    NOW(),
    NOW()
  );

-- ============================================================================
-- 5. CREATE ASSIGNMENT USAGES (Link assignments to challenge/sprints)
-- ============================================================================
INSERT INTO public.assignment_usages (id, challenge_id, assignment_id, sprint_id, position, is_visible, label, release_at, created_at, updated_at)
VALUES
  -- Sprint 1 assignments
  ('a0b00000-0000-4000-a000-000000000001', 'c2b00000-0000-4000-b000-000000000001', 'a1b00000-0000-4000-a000-000000000001', '5ab00000-0000-4000-a000-000000000001', 0, true, 'Week 1', '2026-01-01', NOW(), NOW()),
  ('a0b00000-0000-4000-a000-000000000002', 'c2b00000-0000-4000-b000-000000000001', 'a1b00000-0000-4000-a000-000000000002', '5ab00000-0000-4000-a000-000000000001', 1, true, 'Week 1', '2026-01-01', NOW(), NOW()),
  ('a0b00000-0000-4000-a000-000000000003', 'c2b00000-0000-4000-b000-000000000001', 'a1b00000-0000-4000-a000-000000000003', '5ab00000-0000-4000-a000-000000000001', 2, true, 'Week 2', '2026-01-08', NOW(), NOW()),

  -- Sprint 2 assignments
  ('a0b00000-0000-4000-a000-000000000004', 'c2b00000-0000-4000-b000-000000000001', 'a1b00000-0000-4000-a000-000000000004', '5ab00000-0000-4000-a000-000000000002', 3, true, 'Week 3', '2026-01-15', NOW(), NOW()),
  ('a0b00000-0000-4000-a000-000000000005', 'c2b00000-0000-4000-b000-000000000001', 'a1b00000-0000-4000-a000-000000000005', '5ab00000-0000-4000-a000-000000000002', 4, true, 'Week 3', '2026-01-15', NOW(), NOW()),
  ('a0b00000-0000-4000-a000-000000000006', 'c2b00000-0000-4000-b000-000000000001', 'a1b00000-0000-4000-a000-000000000006', '5ab00000-0000-4000-a000-000000000002', 5, true, 'Week 4', '2026-01-22', NOW(), NOW()),

  -- Sprint 3 assignments
  ('a0b00000-0000-4000-a000-000000000007', 'c2b00000-0000-4000-b000-000000000001', 'a1b00000-0000-4000-a000-000000000007', '5ab00000-0000-4000-a000-000000000003', 6, true, 'Week 5', '2026-01-29', NOW(), NOW()),
  ('a0b00000-0000-4000-a000-000000000008', 'c2b00000-0000-4000-b000-000000000001', 'a1b00000-0000-4000-a000-000000000008', '5ab00000-0000-4000-a000-000000000003', 7, true, 'Week 5 - Protected', '2026-01-29', NOW(), NOW()),
  ('a0b00000-0000-4000-a000-000000000009', 'c2b00000-0000-4000-b000-000000000001', 'a1b00000-0000-4000-a000-000000000009', '5ab00000-0000-4000-a000-000000000003', 8, true, 'Final', '2026-02-05', NOW(), NOW());

-- ============================================================================
-- 6. CREATE MILESTONES
-- ============================================================================
INSERT INTO public.milestones (id, challenge_id, name, description, trigger_type, trigger_value, celebration_type, celebration_content, position, created_at, updated_at)
VALUES
  (
    'a1c00000-0000-4000-a000-000000000001',
    'c2b00000-0000-4000-b000-000000000001',
    'First Step',
    'Complete your first assignment',
    'assignment_complete',
    'a1b00000-0000-4000-a000-000000000001',
    'message',
    'Great Start! You''ve taken your first step on the emotional intelligence journey. Keep going!',
    0,
    NOW(),
    NOW()
  ),
  (
    'a1c00000-0000-4000-a000-000000000002',
    'c2b00000-0000-4000-b000-000000000001',
    'Foundation Complete',
    'Complete all Sprint 1 assignments',
    'sprint_complete',
    '5ab00000-0000-4000-a000-000000000001',
    'badge',
    'Foundation Builder - You''ve built a strong foundation of self-awareness!',
    1,
    NOW(),
    NOW()
  ),
  (
    'a1c00000-0000-4000-a000-000000000003',
    'c2b00000-0000-4000-b000-000000000001',
    'Halfway Hero',
    'Complete 50% of all assignments',
    'percentage',
    '50',
    'animation',
    'Halfway There! You''re halfway through your emotional intelligence journey. Amazing progress!',
    2,
    NOW(),
    NOW()
  ),
  (
    'a1c00000-0000-4000-a000-000000000004',
    'c2b00000-0000-4000-b000-000000000001',
    'Growth Champion',
    'Complete Sprint 2: Managing Emotions',
    'sprint_complete',
    '5ab00000-0000-4000-a000-000000000002',
    'badge',
    'Emotion Master - You''ve learned to manage your emotions effectively!',
    3,
    NOW(),
    NOW()
  ),
  (
    'a1c00000-0000-4000-a000-000000000005',
    'c2b00000-0000-4000-b000-000000000001',
    'EQ Master',
    'Complete all assignments',
    'percentage',
    '100',
    'animation',
    'Emotional Intelligence Master! Congratulations! You''ve completed the entire program and developed powerful emotional intelligence skills.',
    4,
    NOW(),
    NOW()
  );

-- ============================================================================
-- 7. CREATE ANNOUNCEMENTS
-- ============================================================================
INSERT INTO public.announcements (id, challenge_id, title, content, content_html, is_pinned, published_at, created_at, updated_at)
VALUES
  (
    'a2b00000-0000-4000-a000-000000000001',
    'c2b00000-0000-4000-b000-000000000001',
    'Welcome to Emotional Intelligence Mastery! 🎉',
    'Welcome participants! We''re excited to have you join this 6-week journey. Please start with the first assignment in Sprint 1. Remember: take your time, reflect deeply, and enjoy the process.',
    '<p>Welcome participants! We''re excited to have you join this 6-week journey.</p><p>Please start with the first assignment in Sprint 1. Remember: take your time, reflect deeply, and enjoy the process.</p>',
    true,
    NOW(),
    NOW(),
    NOW()
  ),
  (
    'a2b00000-0000-4000-a000-000000000002',
    'c2b00000-0000-4000-b000-000000000001',
    'Sprint 2 Now Available',
    'Great progress everyone! Sprint 2: Managing Emotions is now available. This sprint focuses on practical techniques for emotional regulation.',
    '<p>Great progress everyone! Sprint 2: Managing Emotions is now available.</p><p>This sprint focuses on practical techniques for emotional regulation.</p>',
    false,
    '2026-01-15 09:00:00',
    NOW(),
    NOW()
  ),
  (
    'a2b00000-0000-4000-a000-000000000003',
    'c2b00000-0000-4000-b000-000000000001',
    'Final Sprint: Social Intelligence',
    'You''ve made it to the final sprint! Sprint 3 covers empathy and social skills. Don''t forget: one assignment in this sprint is password-protected. The password is: password123',
    '<p>You''ve made it to the final sprint! Sprint 3 covers empathy and social skills.</p><p><strong>Note:</strong> One assignment in this sprint is password-protected. The password is: <code>password123</code></p>',
    false,
    '2026-01-29 09:00:00',
    NOW(),
    NOW()
  );

-- ============================================================================
-- 8. CREATE MICRO QUIZZES
-- ============================================================================
INSERT INTO public.micro_quizzes (id, assignment_id, question, quiz_type, options, scale_min, scale_max, scale_labels, position, created_at, updated_at)
VALUES
  -- Quiz for Emotional Triggers Assessment (a1b00000-0000-4000-a000-000000000003)
  (
    'a3b00000-0000-4000-a000-000000000001',
    'a1b00000-0000-4000-a000-000000000003',
    'When you feel stressed, which physical sensation do you notice most?',
    'multiple_choice',
    '{"choices": ["Tension in shoulders/neck", "Upset stomach", "Racing heart", "Headache", "Difficulty breathing"]}'::jsonb,
    NULL,
    NULL,
    NULL,
    0,
    NOW(),
    NOW()
  ),
  (
    'a3b00000-0000-4000-a000-000000000002',
    'a1b00000-0000-4000-a000-000000000003',
    'On a scale of 1-10, how comfortable are you expressing negative emotions?',
    'scale',
    NULL,
    1,
    10,
    '{"min": "Very uncomfortable", "max": "Very comfortable"}'::jsonb,
    1,
    NOW(),
    NOW()
  ),
  (
    'a3b00000-0000-4000-a000-000000000003',
    'a1b00000-0000-4000-a000-000000000003',
    'Describe a recent situation where you felt a strong emotional reaction. What triggered it?',
    'reflection',
    NULL,
    NULL,
    NULL,
    NULL,
    2,
    NOW(),
    NOW()
  ),

  -- Quiz for Final Assessment (a1b00000-0000-4000-a000-000000000009)
  (
    'a3b00000-0000-4000-a000-000000000004',
    'a1b00000-0000-4000-a000-000000000009',
    'How would you rate your self-awareness compared to when you started?',
    'scale',
    NULL,
    1,
    10,
    '{"min": "No improvement", "max": "Significant improvement"}'::jsonb,
    0,
    NOW(),
    NOW()
  ),
  (
    'a3b00000-0000-4000-a000-000000000005',
    'a1b00000-0000-4000-a000-000000000009',
    'Which EQ skill do you feel you''ve improved the most?',
    'multiple_choice',
    '{"choices": ["Self-awareness", "Self-regulation", "Motivation", "Empathy", "Social skills"]}'::jsonb,
    NULL,
    NULL,
    NULL,
    1,
    NOW(),
    NOW()
  ),
  (
    'a3b00000-0000-4000-a000-000000000006',
    'a1b00000-0000-4000-a000-000000000009',
    'What are 3 specific actions you will take to continue developing your emotional intelligence?',
    'reflection',
    NULL,
    NULL,
    NULL,
    NULL,
    2,
    NOW(),
    NOW()
  ),
  (
    'a3b00000-0000-4000-a000-000000000007',
    'a1b00000-0000-4000-a000-000000000009',
    'How likely are you to recommend this program to a colleague?',
    'scale',
    NULL,
    1,
    10,
    '{"min": "Not likely", "max": "Extremely likely"}'::jsonb,
    3,
    NOW(),
    NOW()
  );

-- ============================================================================
-- OUTPUT
-- ============================================================================
SELECT 'Demo data created successfully!' as status;
SELECT 'Challenge URL: /c/emotional-mastery-2026' as public_url;
SELECT 'Password-protected assignment: "Navigating Difficult Conversations" - Password: password123' as note;
