-- Add mode and features to challenges table (moved from clients)
-- This allows each challenge to have its own configuration

-- Add mode column to challenges
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'collective' 
CHECK (mode IN ('collective', 'individual', 'hybrid'));

-- Add features column to challenges
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '{
  "announcements": true,
  "host_videos": true,
  "sprint_structure": true,
  "collective_progress": false,
  "time_based_unlocks": true,
  "milestones": false,
  "reveal_moments": false,
  "micro_quizzes": false,
  "progress_tracking": false,
  "session_persistence": false,
  "private_views": false
}'::jsonb;

-- Add comment explaining the features
COMMENT ON COLUMN public.challenges.mode IS 'Challenge mode: collective (shared viewing), individual (personal tracking), or hybrid (both)';
COMMENT ON COLUMN public.challenges.features IS 'Feature flags for this specific challenge';

-- Update existing challenges to have sensible defaults based on what they already have
-- Enable sprints if they have any sprints
UPDATE public.challenges c
SET features = jsonb_set(c.features, '{sprint_structure}', 'true'::jsonb)
WHERE EXISTS (SELECT 1 FROM public.sprints s WHERE s.challenge_id = c.id);

-- Enable announcements if they have any announcements
UPDATE public.challenges c
SET features = jsonb_set(c.features, '{announcements}', 'true'::jsonb)
WHERE EXISTS (SELECT 1 FROM public.announcements a WHERE a.challenge_id = c.id);

-- Enable milestones if they have any milestones (and set to individual mode)
UPDATE public.challenges c
SET 
  mode = 'individual',
  features = jsonb_set(c.features, '{milestones}', 'true'::jsonb)
WHERE EXISTS (SELECT 1 FROM public.milestones m WHERE m.challenge_id = c.id);

