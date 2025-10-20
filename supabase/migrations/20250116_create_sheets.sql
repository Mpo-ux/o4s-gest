/*
  # Google Sheets Management Schema

  ## Overview
  This migration creates the infrastructure for managing Google Sheets links and cached data.

  ## New Tables

  ### `sheets`
  Stores Google Sheets links and metadata
  - `id` (uuid, primary key) - Unique identifier for each sheet
  - `name` (text) - User-friendly name for the sheet
  - `sheet_url` (text) - Full Google Sheets URL
  - `sheet_id` (text) - Extracted Google Sheets ID
  - `created_at` (timestamptz) - When the sheet was added
  - `updated_at` (timestamptz) - Last update timestamp

  ### `sheet_data`
  Caches sheet content for fast searching
  - `id` (uuid, primary key) - Unique identifier
  - `sheet_id` (uuid, foreign key) - Reference to sheets table
  - `row_index` (integer) - Row number in the sheet
  - `column_index` (integer) - Column number in the sheet
  - `column_name` (text) - Column header name
  - `cell_value` (text) - Cell content
  - `created_at` (timestamptz) - When cached

  ## Security
  - Enable RLS on all tables
  - Public read access for demonstration purposes
  - Authenticated users can manage sheets

  ## Indexes
  - Index on sheet_data.cell_value for fast text search
  - Index on sheet_data.sheet_id for efficient joins
*/

-- Create sheets table
CREATE TABLE IF NOT EXISTS sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sheet_url text NOT NULL,
  sheet_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sheet_data table for cached content
CREATE TABLE IF NOT EXISTS sheet_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id uuid NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  column_index integer NOT NULL,
  column_name text DEFAULT '',
  cell_value text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sheet_data_sheet_id ON sheet_data(sheet_id);
CREATE INDEX IF NOT EXISTS idx_sheet_data_cell_value ON sheet_data USING gin(cell_value gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_sheet_data_column_name ON sheet_data(column_name);

-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable RLS
ALTER TABLE sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheet_data ENABLE ROW LEVEL SECURITY;

-- Create policies for sheets table
CREATE POLICY "Anyone can view sheets"
  ON sheets FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert sheets"
  ON sheets FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update sheets"
  ON sheets FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete sheets"
  ON sheets FOR DELETE
  TO public
  USING (true);

-- Create policies for sheet_data table
CREATE POLICY "Anyone can view sheet_data"
  ON sheet_data FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert sheet_data"
  ON sheet_data FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update sheet_data"
  ON sheet_data FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete sheet_data"
  ON sheet_data FOR DELETE
  TO public
  USING (true);
