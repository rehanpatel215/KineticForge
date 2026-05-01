import pg from 'pg';
const { Client } = pg;

async function resetStudentPasswords() {
  // Database connection details from run_sql.js
  const config = {
    host: 'db.nlxfvozdoirjzhvzughw.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Rumina@21092006',
    ssl: { rejectUnauthorized: false }
  };

  const client = new Client(config);

  try {
    console.log('Connecting to Supabase Database...');
    await client.connect();
    console.log('Connected successfully.');

    console.log('Fetching students and their auth IDs...');
    const res = await client.query(`
      SELECT s.usn, u.id as auth_id 
      FROM public.students s
      JOIN public.users u ON s.id = u.student_id
      WHERE u.role = 'student'
    `);

    const students = res.rows;
    console.log(`Found ${students.length} students to reset.`);

    for (const student of students) {
      console.log(`Resetting password for USN: ${student.usn}...`);
      
      // Update auth.users encrypted_password back to USN
      // Supabase uses blowfish (bf) for crypt
      await client.query(`
        UPDATE auth.users 
        SET encrypted_password = crypt($1, gen_salt('bf'))
        WHERE id = $2
      `, [student.usn, student.auth_id]);
    }

    console.log('✅ All student passwords have been reset to their respective USNs.');

  } catch (err) {
    console.error('❌ Reset Failed:', err.message);
  } finally {
    await client.end();
  }
}

resetStudentPasswords();
