/*
  # Add Authentication and User-Specific Access

  ## Overview
  This migration updates the schema to support user authentication and user-specific sheet access.

  ## Changes

  1. Tables Updated
    - `sheets` table: Add `user_id` column to track ownership
    - `sheet_data` table: Inherits user access through sheets relationship

  2. Security Updates
    - Drop existing public policies
    - Add user-specific RLS policies
    - Users can only view/edit their own sheets
    - Sheet data access is controlled through sheet ownership

  3. New Columns
    - `sheets.user_id` (uuid) - References auth.users(id)
    - `sheets.google_access_token` (text) - Encrypted OAuth token for API access
    - `sheets.google_refresh_token` (text) - Encrypted refresh token

  ## Notes
  - Existing sheets will need user_id populated manually or will be inaccessible
  - Google OAuth tokens enable direct API access to private sheets
*/

-- Add user_id column to sheets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sheets' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE sheets ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add Google OAuth token columns for API access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sheets' AND column_name = 'google_access_token'
  ) THEN
    ALTER TABLE sheets ADD COLUMN google_access_token text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sheets' AND column_name = 'google_refresh_token'
  ) THEN
    ALTER TABLE sheets ADD COLUMN google_refresh_token text;
  END IF;
END $$;

-- Create index on user_id for performance
CREATE INDEX IF NOT EXISTS idx_sheets_user_id ON sheets(user_id);

-- Drop existing public policies
DROP POLICY IF EXISTS "Anyone can view sheets" ON sheets;
DROP POLICY IF EXISTS "Anyone can insert sheets" ON sheets;
DROP POLICY IF EXISTS "Anyone can update sheets" ON sheets;
DROP POLICY IF EXISTS "Anyone can delete sheets" ON sheets;

DROP POLICY IF EXISTS "Anyone can view sheet_data" ON sheet_data;
DROP POLICY IF EXISTS "Anyone can insert sheet_data" ON sheet_data;
DROP POLICY IF EXISTS "Anyone can update sheet_data" ON sheet_data;
DROP POLICY IF EXISTS "Anyone can delete sheet_data" ON sheet_data;

-- Create user-specific policies for sheets table
CREATE POLICY "Users can view own sheets"
  ON sheets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sheets"
  ON sheets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sheets"
  ON sheets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sheets"
  ON sheets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for sheet_data table (access through sheets ownership)
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
