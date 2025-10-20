-- CONSOLIDATED MIGRATION FOR NEW SUPABASE PROJECT
-- Run this in Supabase SQL Editor to set up the complete database schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- TABLES
-- ============================================

-- Create sheets table
CREATE TABLE IF NOT EXISTS sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  sheet_url text NOT NULL,
  sheet_id text NOT NULL,
  headers jsonb DEFAULT '[]'::jsonb,
  google_access_token text,
  google_refresh_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sheet_data table for cached content (cell-level storage)
CREATE TABLE IF NOT EXISTS sheet_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id uuid NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  column_index integer NOT NULL,
  column_name text DEFAULT '',
  cell_value text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create sheet_rows table (row-level JSON storage)
CREATE TABLE IF NOT EXISTS sheet_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id uuid NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  row_array jsonb DEFAULT '[]'::jsonb,
  row_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sheets_user_id ON sheets(user_id);
CREATE INDEX IF NOT EXISTS idx_sheet_data_sheet_id ON sheet_data(sheet_id);
CREATE INDEX IF NOT EXISTS idx_sheet_data_cell_value ON sheet_data USING gin(cell_value gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_sheet_data_column_name ON sheet_data(column_name);
CREATE INDEX IF NOT EXISTS idx_sheet_rows_sheet_id ON sheet_rows(sheet_id);
CREATE INDEX IF NOT EXISTS idx_sheet_rows_row_json ON sheet_rows USING gin(row_json jsonb_path_ops);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheet_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheet_rows ENABLE ROW LEVEL SECURITY;

-- Policies for sheets table
DROP POLICY IF EXISTS "Users can view own sheets" ON sheets;
CREATE POLICY "Users can view own sheets"
  ON sheets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sheets" ON sheets;
CREATE POLICY "Users can insert own sheets"
  ON sheets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sheets" ON sheets;
CREATE POLICY "Users can update own sheets"
  ON sheets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sheets" ON sheets;
CREATE POLICY "Users can delete own sheets"
  ON sheets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for sheet_data table
DROP POLICY IF EXISTS "Users can view own sheet data" ON sheet_data;
CREATE POLICY "Users can view own sheet data"
  ON sheet_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = sheet_data.sheet_id
      AND sheets.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own sheet data" ON sheet_data;
CREATE POLICY "Users can insert own sheet data"
  ON sheet_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = sheet_data.sheet_id
      AND sheets.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own sheet data" ON sheet_data;
CREATE POLICY "Users can update own sheet data"
  ON sheet_data FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = sheet_data.sheet_id
      AND sheets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = sheet_data.sheet_id
      AND sheets.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own sheet data" ON sheet_data;
CREATE POLICY "Users can delete own sheet data"
  ON sheet_data FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = sheet_data.sheet_id
      AND sheets.user_id = auth.uid()
    )
  );

-- Policies for sheet_rows table
DROP POLICY IF EXISTS "Users can view own sheet rows" ON sheet_rows;
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

DROP POLICY IF EXISTS "Users can insert own sheet rows" ON sheet_rows;
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

DROP POLICY IF EXISTS "Users can update own sheet rows" ON sheet_rows;
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

DROP POLICY IF EXISTS "Users can delete own sheet rows" ON sheet_rows;
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

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Function to search across all sheet rows (JSON-based)
CREATE OR REPLACE FUNCTION search_sheet_rows(
  search_term text DEFAULT '',
  filter_sheet_ids uuid[] DEFAULT ARRAY[]::uuid[]
)
RETURNS TABLE (
  id uuid,
  sheet_id uuid,
  row_index integer,
  row_array jsonb,
  row_json jsonb,
  created_at timestamptz,
  sheets jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.id,
    sr.sheet_id,
    sr.row_index,
    sr.row_array,
    sr.row_json,
    sr.created_at,
    to_jsonb(s.*) as sheets
  FROM sheet_rows sr
  INNER JOIN sheets s ON s.id = sr.sheet_id
  WHERE 
    s.user_id = auth.uid()
    AND (
      ARRAY_LENGTH(filter_sheet_ids, 1) IS NULL 
      OR sr.sheet_id = ANY(filter_sheet_ids)
    )
    AND (
      search_term = '' 
      OR sr.row_json::text ILIKE '%' || search_term || '%'
    )
  ORDER BY sr.sheet_id, sr.row_index;
END;
$$;
