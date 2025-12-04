#!/usr/bin/env node

console.log('🔍 Detailed UVP Database Analysis...');

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jpwljchikgmggjidogon.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dqaWRvZ29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTY1NDAsImV4cCI6MjA3ODczMjU0MH0.At0TEROiEHP2XZQ7ccEErLa2qUG6LtGFwDJl4ukpTuo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function detailedCheck() {
  try {
    console.log('=== MOST RECENT UVP ANALYSIS ===\n');

    // Get the most recent UVP with all fields
    const { data: uvps, error: uvpError } = await supabase
      .from('marba_uvps')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (uvpError) {
      console.error('❌ Error accessing UVP:', uvpError.message);
      return;
    }

    if (!uvps || uvps.length === 0) {
      console.log('❌ No UVPs found in database');
      return;
    }

    const uvp = uvps[0];
    console.log('📋 UVP Details:');
    console.log(`   ID: ${uvp.id}`);
    console.log(`   Brand ID: ${uvp.brand_id}`);
    console.log(`   Created: ${uvp.created_at}`);
    console.log(`   Updated: ${uvp.updated_at}\n`);

    // Check target_customer field (should contain customer profiles)
    console.log('👥 TARGET CUSTOMER DATA:');
    if (uvp.target_customer) {
      console.log('   Type:', typeof uvp.target_customer);
      if (typeof uvp.target_customer === 'object') {
        console.log('   Raw data:', JSON.stringify(uvp.target_customer, null, 2));

        // Look for customer profiles or array structures
        if (uvp.target_customer.customerProfiles) {
          console.log(`   📊 Customer Profiles Count: ${uvp.target_customer.customerProfiles.length}`);
          uvp.target_customer.customerProfiles.forEach((profile, idx) => {
            console.log(`      ${idx + 1}. ${profile.title || profile.description || profile.role || JSON.stringify(profile)}`);
          });
        } else if (Array.isArray(uvp.target_customer)) {
          console.log(`   📊 Customer Array Count: ${uvp.target_customer.length}`);
          uvp.target_customer.forEach((item, idx) => {
            console.log(`      ${idx + 1}. ${JSON.stringify(item)}`);
          });
        } else {
          console.log('   📊 Structure:', Object.keys(uvp.target_customer));
        }
      } else {
        console.log(`   Value: ${uvp.target_customer}`);
      }
    } else {
      console.log('   ❌ No target_customer data');
    }

    // Check other UVP fields that might contain customer data
    console.log('\n🔍 OTHER CUSTOMER-RELATED FIELDS:');

    const customerFields = [
      'customer_problem',
      'customer_profiles',
      'customer_segments',
      'buyer_personas_data',
      'selected_customers'
    ];

    customerFields.forEach(field => {
      if (uvp[field]) {
        console.log(`   ${field}:`, typeof uvp[field] === 'object' ? JSON.stringify(uvp[field]).substring(0, 200) + '...' : uvp[field]);
      }
    });

    // Check ALL fields to see what's stored
    console.log('\n📝 ALL FIELDS IN UVP:');
    Object.keys(uvp).forEach(key => {
      const value = uvp[key];
      if (value !== null && value !== undefined) {
        const preview = typeof value === 'object'
          ? JSON.stringify(value).substring(0, 100) + '...'
          : String(value).substring(0, 100);
        console.log(`   ${key}: ${preview}`);
      }
    });

    // Double-check buyer_personas table for this brand
    console.log('\n👤 BUYER PERSONAS FOR THIS BRAND:');
    const { data: personas, error: personaError } = await supabase
      .from('buyer_personas')
      .select('*')
      .eq('brand_id', uvp.brand_id);

    if (personaError) {
      console.error('❌ Error checking personas:', personaError.message);
    } else {
      console.log(`   Count: ${personas.length}`);
      if (personas.length > 0) {
        personas.forEach((persona, idx) => {
          console.log(`   ${idx + 1}. ${persona.name} (${persona.role})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

detailedCheck();