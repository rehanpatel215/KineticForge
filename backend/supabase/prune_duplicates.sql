-- ============================================
-- ForgeTrack: Prune Duplicate Uploaded Data
-- ============================================
-- Run this in Supabase SQL Editor:
-- https://nlxfvozdoirjzhvzughw.supabase.co
-- Run ALL steps in order, top to bottom.

-- ============================================
-- STEP 1: Show counts BEFORE pruning
-- ============================================
SELECT 'students'    AS table_name, COUNT(*) AS total FROM students
UNION ALL
SELECT 'sessions',   COUNT(*) FROM sessions
UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL
SELECT 'import_log', COUNT(*) FROM import_log;

-- ============================================
-- STEP 2: Remove duplicate ATTENDANCE records
-- Keep only 1 record per (student_id, session_id) — the earliest one
-- ============================================
DELETE FROM attendance
WHERE id NOT IN (
  SELECT MIN(id)
  FROM attendance
  GROUP BY student_id, session_id
);

-- ============================================
-- STEP 3: Remove duplicate STUDENTS by USN
-- Keep the one with the lowest id (first inserted)
-- ============================================
DELETE FROM students
WHERE id NOT IN (
  SELECT MIN(id)
  FROM students
  WHERE usn IS NOT NULL
  GROUP BY usn
)
AND usn IS NOT NULL;

-- ============================================
-- STEP 4: Remove duplicate SESSIONS by date
-- Keep the one with the lowest id
-- ============================================
DELETE FROM sessions
WHERE id NOT IN (
  SELECT MIN(id)
  FROM sessions
  GROUP BY date
);

-- ============================================
-- STEP 5: Remove duplicate IMPORT_LOG entries
-- Keep one entry per filename (lowest id)
-- ============================================
DELETE FROM import_log
WHERE id NOT IN (
  SELECT MIN(id)
  FROM import_log
  GROUP BY filename
);

-- ============================================
-- STEP 6: Add UNIQUE constraint on import_log.filename
-- so the same file can never be double-inserted again.
-- Safe to run multiple times (uses IF NOT EXISTS logic).
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'import_log_filename_unique'
    AND conrelid = 'public.import_log'::regclass
  ) THEN
    ALTER TABLE public.import_log
      ADD CONSTRAINT import_log_filename_unique UNIQUE (filename);
    RAISE NOTICE 'Constraint import_log_filename_unique added.';
  ELSE
    RAISE NOTICE 'Constraint import_log_filename_unique already exists — skipped.';
  END IF;
END;
$$;

-- ============================================
-- STEP 7: Verify final counts AFTER pruning
-- ============================================
SELECT 'students'    AS table_name, COUNT(*) AS total FROM students
UNION ALL
SELECT 'sessions',   COUNT(*) FROM sessions
UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL
SELECT 'import_log', COUNT(*) FROM import_log;
