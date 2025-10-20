-- Migration: add sheet_rows table and headers column for JSON per-row storage
-- Creates `sheet_rows` to store each row as JSON (ordered array and object mapping)
-- Adds `headers` jsonb to `sheets` to persist header order

BEGIN;

-- Add headers column to sheets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sheets' AND column_name = 'headers'
  ) THEN
    ALTER TABLE sheets ADD COLUMN headers jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create sheet_rows table
CREATE TABLE IF NOT EXISTS sheet_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id uuid NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  row_array jsonb DEFAULT '[]'::jsonb,
  row_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sheet_rows_sheet_id ON sheet_rows(sheet_id);
CREATE INDEX IF NOT EXISTS idx_sheet_rows_row_json ON sheet_rows USING gin(row_json jsonb_path_ops);

-- Enable RLS on sheet_rows and policies tied to sheets ownership
ALTER TABLE sheet_rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sheet_rows" ON sheet_rows;
DROP POLICY IF EXISTS "Users can insert sheet_rows" ON sheet_rows;
DROP POLICY IF EXISTS "Users can update sheet_rows" ON sheet_rows;
DROP POLICY IF EXISTS "Users can delete sheet_rows" ON sheet_rows;

CREATE POLICY "Users can view own sheet rows"
  ON sheet_rows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = sheet_rows.sheet_id
      AND sheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own sheet rows"
  ON sheet_rows FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = sheet_rows.sheet_id
      AND sheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own sheet rows"
  ON sheet_rows FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = sheet_rows.sheet_id
      AND sheets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = sheet_rows.sheet_id
      AND sheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own sheet rows"
  ON sheet_rows FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = sheet_rows.sheet_id
      AND sheets.user_id = auth.uid()
    )
  );

COMMIT;
