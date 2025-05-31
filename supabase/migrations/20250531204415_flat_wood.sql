/*
  # Add score column to drill_recommendations table

  1. Changes
    - Add `score` column to `drill_recommendations` table
      - Type: double precision (float)
      - Nullable: true
      - No default value
*/

ALTER TABLE drill_recommendations
ADD COLUMN IF NOT EXISTS score double precision;

-- Update types to include the new column
NOTIFY pgrst, 'reload schema';