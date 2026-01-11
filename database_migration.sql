-- Add progress tracking columns to logs table
ALTER TABLE logs 
ADD COLUMN IF NOT EXISTS is_in_progress BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS progress_current NUMERIC,
ADD COLUMN IF NOT EXISTS progress_total NUMERIC;

-- Note: For streak tracking, the logs table should have an updated_at column
-- Supabase tables typically include this automatically with timestamps
-- If your table doesn't have updated_at, add it in Supabase dashboard:
-- ALTER TABLE logs ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
-- Then enable automatic updates via trigger in Supabase dashboard

