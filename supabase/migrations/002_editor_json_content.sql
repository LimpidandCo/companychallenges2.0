-- =============================================================================
-- Migration: Add JSONB content columns for advanced editor
-- =============================================================================
-- This migration adds new JSONB columns to store rich editor content as JSON,
-- alongside the existing TEXT columns (HTML) for backward compatibility.
-- 
-- Strategy:
-- 1. Add new JSONB columns with _json suffix
-- 2. Add HTML cache columns with _html suffix (generated from JSON on save)
-- 3. Keep existing TEXT columns for backward compatibility
-- 4. Application code will prioritize JSON content when available

-- =============================================================================
-- Challenges table updates
-- =============================================================================

-- Add JSONB column for challenge description (editor content)
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS description_json JSONB;

-- Add HTML cache column (generated from JSON for public rendering)
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS description_html TEXT;

-- Comment for documentation
COMMENT ON COLUMN challenges.description_json IS 'Rich editor content as JSON (ContainerNode structure)';
COMMENT ON COLUMN challenges.description_html IS 'Pre-rendered HTML from description_json for public view';
COMMENT ON COLUMN challenges.description IS 'DEPRECATED: Legacy HTML content, use description_json/description_html instead';

-- Drop brand_color column as it's no longer needed (editor handles styling)
-- Note: We're keeping it for now to avoid breaking existing code, can be removed later
-- ALTER TABLE challenges DROP COLUMN IF EXISTS brand_color;

-- =============================================================================
-- Assignments table updates
-- =============================================================================

-- Add JSONB columns for assignment content
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS instructions_json JSONB;

ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS instructions_html TEXT;

ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS content_json JSONB;

ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS content_html TEXT;

-- Also add the missing columns from TypeScript types
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS instructions TEXT;

ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS content TEXT;

ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS is_reusable BOOLEAN NOT NULL DEFAULT true;

-- Comments for documentation
COMMENT ON COLUMN assignments.instructions_json IS 'Rich editor content for instructions as JSON';
COMMENT ON COLUMN assignments.instructions_html IS 'Pre-rendered HTML from instructions_json';
COMMENT ON COLUMN assignments.content_json IS 'Rich editor content for main content as JSON';
COMMENT ON COLUMN assignments.content_html IS 'Pre-rendered HTML from content_json';
COMMENT ON COLUMN assignments.instructions IS 'DEPRECATED: Legacy HTML instructions';
COMMENT ON COLUMN assignments.content IS 'DEPRECATED: Legacy HTML content';
COMMENT ON COLUMN assignments.description IS 'DEPRECATED: Legacy HTML description, use content_json/content_html instead';

-- =============================================================================
-- Announcements table updates (also uses rich content)
-- =============================================================================

ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS content_json JSONB;

ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS content_html TEXT;

COMMENT ON COLUMN announcements.content_json IS 'Rich editor content as JSON';
COMMENT ON COLUMN announcements.content_html IS 'Pre-rendered HTML from content_json';
COMMENT ON COLUMN announcements.content IS 'DEPRECATED: Legacy HTML content';

-- =============================================================================
-- Sprints table updates
-- =============================================================================

ALTER TABLE sprints
ADD COLUMN IF NOT EXISTS description_json JSONB;

ALTER TABLE sprints
ADD COLUMN IF NOT EXISTS description_html TEXT;

COMMENT ON COLUMN sprints.description_json IS 'Rich editor description as JSON';
COMMENT ON COLUMN sprints.description_html IS 'Pre-rendered HTML from description_json';
COMMENT ON COLUMN sprints.description IS 'DEPRECATED: Legacy HTML description';

-- =============================================================================
-- Assignment usages - add title/subtitle overrides if not present
-- =============================================================================

ALTER TABLE assignment_usages
ADD COLUMN IF NOT EXISTS public_title_override TEXT;

ALTER TABLE assignment_usages
ADD COLUMN IF NOT EXISTS subtitle_override TEXT;

-- =============================================================================
-- Create index for JSON content (GIN index for JSONB querying if needed)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_challenges_description_json ON challenges USING GIN (description_json);
CREATE INDEX IF NOT EXISTS idx_assignments_content_json ON assignments USING GIN (content_json);
CREATE INDEX IF NOT EXISTS idx_assignments_instructions_json ON assignments USING GIN (instructions_json);
CREATE INDEX IF NOT EXISTS idx_assignments_tags ON assignments USING GIN (tags);

