import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: 'db.nlxfvozdoirjzhvzughw.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Rumina@21092006',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected!');

  try {
    // Students
    console.log('Inserting students...');
    await client.query(`
      INSERT INTO public.students (name, usn, admission_number, email, branch_code, batch, is_active) VALUES
      ('Abhishek Sharma','4SH24CS001','24CS001','abhishek@gmail.com','CS','2024-2028',true),
      ('Divya Kulkarni','4SH24CS002','24CS002','divya@gmail.com','AI','2024-2028',true),
      ('Ravi Kumar','4SH24CS003','24CS003','ravi@gmail.com','CS','2024-2028',true),
      ('Priya Singh','4SH24CS004','24CS004','priya@gmail.com','IS','2024-2028',true),
      ('Rahul M','4SH24CS005','24CS005','rahul@gmail.com','CS','2024-2028',true),
      ('Sneha Patil','4SH24CS006','24CS006','sneha@gmail.com','AI','2024-2028',true),
      ('Vikram Reddy','4SH24CS007','24CS007','vikram@gmail.com','IS','2024-2028',true),
      ('Anjali Desai','4SH24CS008','24CS008','anjali@gmail.com','CS','2024-2028',true),
      ('Karthik N','4SH24CS009','24CS009','karthik@gmail.com','AI','2024-2028',true),
      ('Megha Bhat','4SH24CS010','24CS010','megha@gmail.com','IS','2024-2028',true),
      ('Suresh Gowda','4SH24CS011','24CS011','suresh@gmail.com','CS','2024-2028',true),
      ('Kavya J','4SH24CS012','24CS012','kavya@gmail.com','AI','2024-2028',true),
      ('Arun K','4SH24CS013','24CS013','arun@gmail.com','IS','2024-2028',true),
      ('Neha Sharma','4SH24CS014','24CS014','neha@gmail.com','CS','2024-2028',true),
      ('Pradeep R','4SH24CS015','24CS015','pradeep@gmail.com','AI','2024-2028',true),
      ('Swathi V','4SH24CS016','24CS016','swathi@gmail.com','IS','2024-2028',true),
      ('Manoj K','4SH24CS017','24CS017','manoj@gmail.com','CS','2024-2028',true),
      ('Pooja N','4SH24CS018','24CS018','pooja@gmail.com','AI','2024-2028',true),
      ('Rakesh S','4SH24CS019','24CS019','rakesh@gmail.com','IS','2024-2028',true),
      ('Deepa P','4SH24CS020','24CS020','deepa@gmail.com','CS','2024-2028',true),
      ('Kiran B','4SH24CS021','24CS021','kiran@gmail.com','AI','2024-2028',true),
      ('Shruti D','4SH24CS022','24CS022','shruti@gmail.com','IS','2024-2028',true),
      ('Ganesh M','4SH24CS023','24CS023','ganesh@gmail.com','CS','2024-2028',true),
      ('Vidya S','4SH24CS024','24CS024','vidya@gmail.com','AI','2024-2028',true),
      ('Chethan V','4SH24CS025','24CS025','chethan@gmail.com','IS','2024-2028',true)
      ON CONFLICT (usn) DO NOTHING;
    `);
    console.log('Students inserted.');

    // Sessions
    console.log('Inserting sessions...');
    await client.query(`
      INSERT INTO public.sessions (date, topic, month_number, duration_hours, session_type) VALUES
      ('2025-08-05','Introduction to Vibe Engineering',4,2.0,'offline'),
      ('2025-08-12','React State Management',4,2.0,'offline'),
      ('2025-08-19','Tailwind CSS Mastery',4,2.0,'online'),
      ('2025-08-26','Supabase Database & Auth',4,2.0,'offline'),
      ('2025-09-02','Building REST APIs',5,2.0,'offline'),
      ('2025-09-09','Introduction to LLMs',5,2.0,'online'),
      ('2025-09-16','8-Layer AI Stack',5,2.0,'offline'),
      ('2025-09-23','Prompt Engineering',5,2.0,'offline'),
      ('2025-09-30','ReAct Agent Pattern',5,2.0,'offline'),
      ('2025-10-07','pgvector RAG',6,2.0,'offline'),
      ('2025-10-14','Embeddings and Vector DBs',6,2.0,'online'),
      ('2025-10-21','LangChain Basics',6,2.0,'offline'),
      ('2025-10-28','Tiered Autonomy Multi-Agent',6,2.0,'offline'),
      ('2025-11-04','Deployment Strategies',6,2.0,'offline'),
      ('2025-11-11','Final Project Presentations',6,3.0,'offline')
      ON CONFLICT (date) DO NOTHING;
    `);
    console.log('Sessions inserted.');

    // Attendance (random 80% presence)
    console.log('Inserting attendance...');
    await client.query(`
      DO $$
      DECLARE
        student RECORD;
        sess RECORD;
        is_present BOOLEAN;
      BEGIN
        FOR student IN SELECT id FROM public.students LOOP
          FOR sess IN SELECT id FROM public.sessions LOOP
            is_present := random() < 0.8;
            INSERT INTO public.attendance (student_id, session_id, present, marked_by)
            VALUES (student.id, sess.id, is_present, 'system')
            ON CONFLICT (student_id, session_id) DO NOTHING;
          END LOOP;
        END LOOP;
      END $$;
    `);
    console.log('Attendance inserted.');

    // Materials
    console.log('Inserting materials...');
    await client.query(`
      INSERT INTO public.materials (session_id, title, type, url, description)
      SELECT id, topic || ' Slides', 'slides', 'https://docs.google.com/presentation/...', 'Slide deck for ' || topic
      FROM public.sessions
      ON CONFLICT DO NOTHING;

      INSERT INTO public.materials (session_id, title, type, url, description)
      SELECT id, topic || ' Recording', 'recording', 'https://youtube.com/...', 'Recording for ' || topic
      FROM public.sessions
      ON CONFLICT DO NOTHING;
    `);
    console.log('Materials inserted.');

    console.log('\n✅ All seed data inserted successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
