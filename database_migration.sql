-- Add progress tracking columns to logs table
ALTER TABLE logs 
ADD COLUMN IF NOT EXISTS is_in_progress BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS progress_current NUMERIC,
ADD COLUMN IF NOT EXISTS progress_total NUMERIC;

