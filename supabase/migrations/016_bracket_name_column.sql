-- Add bracket_name column to brackets table
-- Allows users to give their bracket entry a custom name (e.g. "The Dark Horse")
-- Falls back to the auto-generated `name` column if not set

alter table brackets add column if not exists bracket_name text;
