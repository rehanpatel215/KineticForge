import pg from 'pg';
const { Client } = pg;

async function reset() {
  const client = new Client({
    host: 'db.nlxfvozdoirjzhvzughw.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Rumina@21092006',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  await client.query("UPDATE auth.users SET encrypted_password = crypt('15112006', gen_salt('bf')) WHERE email = '4SH24CS001@forge.local'");
  await client.end();
  console.log('Password reset to 15112006 for 4SH24CS001');
}
reset();
