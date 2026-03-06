-- Migration: Switch from email to username identification
-- EU privacy compliance: avoid collecting email addresses without proper security infrastructure

ALTER TABLE public.participants
  RENAME COLUMN email TO username;

-- Drop any email-specific constraints if they exist
-- The username is a free-text identifier, no format validation needed
ALTER TABLE public.participants
  DROP CONSTRAINT IF EXISTS participants_email_key;

-- Add unique constraint on username
ALTER TABLE public.participants
  ADD CONSTRAINT participants_username_key UNIQUE (username);
