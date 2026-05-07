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
    // Primary user only (using real UUID)
    console.log('Inserting primary user...');
    await client.query(`
      INSERT INTO public.users (id, email, role, display_name) VALUES
      ('4b4e5561-c4d6-4bef-b518-d6eba5628b0c', 'nischay@theboringpeople.in', 'mentor', 'Nischay BK')
      ON CONFLICT (id) DO UPDATE SET 
        display_name = EXCLUDED.display_name,
        role = EXCLUDED.role;
    `);
    console.log('Primary user restored.');

    console.log('\n✅ Minimal seed data inserted successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
