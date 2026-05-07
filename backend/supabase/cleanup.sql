-- Disable triggers temporarily to avoid issues during mass deletion
SET session_replication_role = 'replica';

-- Truncate tables in order of dependency
TRUNCATE public.attendance CASCADE;
TRUNCATE public.materials CASCADE;
TRUNCATE public.sessions CASCADE;
TRUNCATE public.import_log CASCADE;
TRUNCATE public.students CASCADE;

DELETE FROM public.users 
WHERE id != '4b4e5561-c4d6-4bef-b518-d6eba5628b0c' AND role = 'student';

-- Re-enable triggers
SET session_replication_role = 'origin';
