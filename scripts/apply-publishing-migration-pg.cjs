#!/usr/bin/env node
/**
 * Apply Publishing Queue Migration via PostgreSQL
 * Uses pg library to directly connect and execute SQL
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl || !dbPassword) {
  console.error('❌ Missing database credentials');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'present' : 'missing');
  console.error('SUPABASE_DB_PASSWORD:', dbPassword ? 'present' : 'missing');
  process.exit(1);
}

// Extract project ref from URL (e.g., jpwljchikgmggjidogon from https://jpwljchikgmggjidogon.supabase.co)
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

// Build PostgreSQL connection string
const connectionString = `postgres://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

console.log('🔌 Connecting to Supabase PostgreSQL...');
console.log('   Project:', projectRef);

async function applyMigration() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('📡 Establishing connection...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('📖 Reading migration file...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251114000001_socialpilot_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Executing migration SQL...');
    await client.query(sql);

    console.log('✅ Migration applied successfully!');
    console.log('📋 Created tables:');
    console.log('   ✓ socialpilot_connections');
    console.log('   ✓ publishing_queue');
    console.log('   ✓ RLS policies');
    console.log('   ✓ Indexes');
    console.log('   ✓ Triggers');

  } catch (error) {
    if (error.message && error.message.includes('already exists')) {
      console.log('✅ Tables already exist!');
      console.log('📋 Existing tables:');
      console.log('   ✓ socialpilot_connections');
      console.log('   ✓ publishing_queue');
    } else {
      console.error('❌ Migration failed:', error.message);
      console.error('\nFull error:', error);
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

applyMigration();
