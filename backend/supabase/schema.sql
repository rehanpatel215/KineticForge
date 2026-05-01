-- 1. Create Tables

CREATE TABLE public.students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  usn TEXT UNIQUE NOT NULL,
  admission_number TEXT,
  email TEXT,
  branch_code TEXT NOT NULL,
  batch TEXT DEFAULT '2024-2028',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.sessions (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  topic TEXT NOT NULL,
  month_number INTEGER NOT NULL,
  duration_hours DECIMAL(3,1) DEFAULT 2.0,
  session_type TEXT DEFAULT 'offline',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.import_log (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_rows INTEGER NOT NULL,
  imported_rows INTEGER NOT NULL,
  skipped_rows INTEGER NOT NULL,
  warnings TEXT,
  column_mapping TEXT,
  status TEXT NOT NULL
);

CREATE TABLE public.attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES public.students(id) NOT NULL,
  session_id INTEGER REFERENCES public.sessions(id) NOT NULL,
  present BOOLEAN NOT NULL,
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  marked_by TEXT DEFAULT 'system',
  import_id INTEGER REFERENCES public.import_log(id),
  UNIQUE (student_id, session_id)
);

CREATE TABLE public.materials (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES public.sessions(id) NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: The auth.users table is managed by Supabase Auth.
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('mentor', 'student')),
  student_id INTEGER REFERENCES public.students(id),
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Constraints & Triggers

CREATE OR REPLACE FUNCTION check_attendance_date()
RETURNS TRIGGER AS $$
DECLARE
  session_date DATE;
BEGIN
  SELECT date INTO session_date FROM public.sessions WHERE id = NEW.session_id;
  IF session_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Attendance date cannot be in the future';
  END IF;
  IF session_date < '2025-08-04' THEN
    RAISE EXCEPTION 'Attendance date cannot be before 2025-08-04';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_attendance_date
BEFORE INSERT OR UPDATE ON public.attendance
FOR EACH ROW EXECUTE FUNCTION check_attendance_date();

-- Auto-create user for new student
CREATE OR REPLACE FUNCTION create_student_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Custom logic to handle user creation if necessary
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Students Table RLS
CREATE POLICY "mentor_all_students" ON public.students FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor');
CREATE POLICY "students_read_own" ON public.students FOR SELECT USING (id = (SELECT student_id FROM public.users WHERE id = auth.uid()));

-- Sessions Table RLS
CREATE POLICY "mentor_all_sessions" ON public.sessions FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor');
CREATE POLICY "student_read_all_sessions" ON public.sessions FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'student');

-- Attendance Table RLS
CREATE POLICY "mentor_all_attendance" ON public.attendance FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor');
CREATE POLICY "student_read_own_attendance" ON public.attendance FOR SELECT USING (student_id = (SELECT student_id FROM public.users WHERE id = auth.uid()));

-- Materials Table RLS
CREATE POLICY "mentor_all_materials" ON public.materials FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor');
CREATE POLICY "student_read_all_materials" ON public.materials FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'student');

-- ImportLog Table RLS
CREATE POLICY "mentor_all_import_log" ON public.import_log FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor');

-- Users Table RLS
CREATE POLICY "users_read_all" ON public.users FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
