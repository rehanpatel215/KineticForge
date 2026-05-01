import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

async function runSql() {
  // Try with just the password first.
  // The user passed [Rumina@21092006], I will assume the brackets might be literal or not.
  // Let's assume the password is Rumina@21092006. If it fails, we will try with brackets.
  let password = 'Rumina@21092006';
  
  const client = new Client({
    host: 'db.nlxfvozdoirjzhvzughw.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: password,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase DB successfully!');

    // Read schema.sql
    const schemaPath = path.resolve('..', 'backend', 'supabase', 'schema.sql');
    console.log('Reading:', schemaPath);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema.sql...');
    await client.query(schemaSql);
    console.log('Schema applied successfully.');

    // Read seed.sql
    const seedPath = path.resolve('..', 'backend', 'supabase', 'seed.sql');
    console.log('Reading:', seedPath);
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing seed.sql...');
    await client.query(seedSql);
    console.log('Seed data applied successfully.');

  } catch (err) {
    // If it fails with password auth, print the error so we can retry with brackets
    console.error('Execution Failed:', err.message);
  } finally {
    await client.end();
  }
}

runSql();
