/**
 * Run SQL migration using Supabase SQL Editor
 * This script outputs SQL that you can paste into Supabase SQL Editor
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

const migrationSQL = readFileSync(
  resolve(__dirname, '../supabase/migrations/000_industry_database.sql'),
  'utf-8'
)

console.log('=' .repeat(80))
console.log('COPY THE SQL BELOW AND PASTE INTO SUPABASE SQL EDITOR')
console.log('https://supabase.com/dashboard/project/jpwljchikgmggjidogon/sql/new')
console.log('=' .repeat(80))
console.log()
console.log(migrationSQL)
console.log()
console.log('=' .repeat(80))
console.log('After running the SQL, execute: npm run import:industry-data')
console.log('=' .repeat(80))
