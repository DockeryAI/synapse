#!/usr/bin/env node

console.log('🔍 Checking UVP database status...');

// Simulate the database check using Node.js with the app's connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwdWxqY2hpa2dtZ2dqaWRvZ29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4MTM3MTAsImV4cCI6MjA0NzM4OTcxMH0.SBTUx1PGCO0nGW-HXK_3kQ6e3_HSfQKcgaIDLJKWPNE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  try {
    console.log('1. Checking marba_uvps table...');
    const { data: uvps, error: uvpError } = await supabase
      .from('marba_uvps')
      .select('id, brand_id, value_proposition_statement, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (uvpError) {
      console.error('❌ Error accessing marba_uvps:', uvpError);
    } else {
      console.log('✅ marba_uvps count:', uvps?.length || 0);
      if (uvps?.length > 0) {
        console.log('📄 Recent UVP entries:');
        uvps.forEach(uvp => {
          console.log(`  - ID: ${uvp.id}, Brand: ${uvp.brand_id}, Created: ${uvp.created_at}`);
          console.log(`    Statement: ${uvp.value_proposition_statement?.substring(0, 100)}...`);
        });
      }
    }

    console.log('\n2. Checking buyer_personas table...');
    const { data: personas, error: personaError } = await supabase
      .from('buyer_personas')
      .select('id, brand_id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (personaError) {
      console.error('❌ Error accessing buyer_personas:', personaError);
    } else {
      console.log('✅ buyer_personas count:', personas?.length || 0);
      if (personas?.length > 0) {
        console.log('📄 Recent persona entries:');
        personas.forEach(persona => {
          console.log(`  - ID: ${persona.id}, Brand: ${persona.brand_id}, Name: ${persona.name}, Created: ${persona.created_at}`);
        });
      }
    }

    console.log('\n3. Checking brands table...');
    const { data: brands, error: brandError } = await supabase
      .from('brands')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (brandError) {
      console.error('❌ Error accessing brands:', brandError);
    } else {
      console.log('✅ brands count:', brands?.length || 0);
      if (brands?.length > 0) {
        console.log('📄 Recent brand entries:');
        brands.forEach(brand => {
          console.log(`  - ID: ${brand.id}, Name: ${brand.name}, Created: ${brand.created_at}`);
        });
      }
    }

    console.log('\n✅ Database check complete');

  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkDatabase();