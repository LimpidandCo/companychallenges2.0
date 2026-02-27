-- Add is_archived column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
