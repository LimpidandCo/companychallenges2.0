-- =============================================================================
-- Replace Clerk auth with simple email identification
-- =============================================================================
-- Renames clerk_user_id to email on participants table.
-- The existing UNIQUE constraint and index carry over automatically.

ALTER TABLE participants RENAME COLUMN clerk_user_id TO email;

-- Rename the index for clarity
ALTER INDEX IF EXISTS idx_participants_clerk_user_id RENAME TO idx_participants_email;
