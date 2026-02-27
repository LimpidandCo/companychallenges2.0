-- =============================================================================
-- Individual Mode Sprint Infrastructure
-- =============================================================================
-- Adds sequential sprint unlocking and per-user sprint progress tracking.
-- Sprints can now be progressively unlocked as users complete them.

-- Challenge-level config for sequential sprint ordering
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS sequential_sprints BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN challenges.sequential_sprints IS 'When true, sprints must be completed in order (individual mode). When false, all sprints are accessible.';

-- =============================================================================
-- Sprint Progress Table (Individual Mode)
-- =============================================================================

CREATE TABLE IF NOT EXISTS sprint_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'locked'
    CHECK (status IN ('locked', 'unlocked', 'in_progress', 'completed')),

  unlocked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(participant_id, sprint_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sprint_progress_participant_id ON sprint_progress(participant_id);
CREATE INDEX IF NOT EXISTS idx_sprint_progress_sprint_id ON sprint_progress(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_progress_status ON sprint_progress(status);

-- updated_at trigger
CREATE TRIGGER update_sprint_progress_updated_at
  BEFORE UPDATE ON sprint_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE sprint_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sprint progress"
  ON sprint_progress FOR SELECT
  USING (participant_id IN (
    SELECT id FROM participants
    WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can insert own sprint progress"
  ON sprint_progress FOR INSERT
  WITH CHECK (participant_id IN (
    SELECT id FROM participants
    WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can update own sprint progress"
  ON sprint_progress FOR UPDATE
  USING (participant_id IN (
    SELECT id FROM participants
    WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));
