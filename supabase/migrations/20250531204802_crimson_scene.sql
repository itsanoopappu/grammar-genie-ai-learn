/*
  # Add score column to drill_recommendations table

  1. Changes
    - Add `score` column to `drill_recommendations` table
      - Type: double precision (float8)
      - Nullable: true
      - No default value

  2. Reason
    - Required for storing user performance scores in drill recommendations
    - Fixes schema mismatch causing API request failures
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'drill_recommendations' 
    AND column_name = 'score'
  ) THEN
    ALTER TABLE drill_recommendations 
    ADD COLUMN score double precision;
  END IF;
END $$;