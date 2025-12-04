/**
 * Check UVP Sessions Data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const brandId = '001e28bd-afa4-43e1-a262-7a459330cd01';

async function checkUVPSessions() {
  console.log('🔍 Checking UVP sessions for buyer personas...');

  try {
    // Get UVP sessions
    const { data: sessions, error } = await supabase
      .from('uvp_sessions')
      .select('*')
      .eq('brand_id', brandId)
      .order('updated_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`✅ Found ${sessions?.length || 0} UVP sessions\n`);

    sessions?.forEach((session, index) => {
      console.log(`📄 Session ${index + 1}:`);
      console.log(`   ID: ${session.session_id}`);
      console.log(`   Stage: ${session.stage || 'Unknown'}`);
      console.log(`   Created: ${session.created_at}`);
      console.log(`   Updated: ${session.updated_at}`);

      // Check if buyer personas are in session data
      if (session.customer_data) {
        try {
          const customerData = typeof session.customer_data === 'string'
            ? JSON.parse(session.customer_data)
            : session.customer_data;

          if (customerData.buyerPersonas && customerData.buyerPersonas.length > 0) {
            console.log(`   🎯 FOUND ${customerData.buyerPersonas.length} buyer personas in customer_data:`);
            customerData.buyerPersonas.forEach((persona, i) => {
              console.log(`      ${i + 1}. ${persona.name || persona.persona_name || 'Unnamed'}`);
            });
          } else {
            console.log(`   🚫 No buyer personas in customer_data`);
          }
        } catch (e) {
          console.log(`   ⚠️  Error parsing customer_data: ${e.message}`);
        }
      }

      // Check transformation data
      if (session.transformation_data) {
        try {
          const transformData = typeof session.transformation_data === 'string'
            ? JSON.parse(session.transformation_data)
            : session.transformation_data;

          if (transformData.buyerPersonas && transformData.buyerPersonas.length > 0) {
            console.log(`   🎯 FOUND ${transformData.buyerPersonas.length} buyer personas in transformation_data:`);
            transformData.buyerPersonas.forEach((persona, i) => {
              console.log(`      ${i + 1}. ${persona.name || persona.persona_name || 'Unnamed'}`);
            });
          }
        } catch (e) {
          // Ignore parse errors for transformation_data
        }
      }

      // Check complete UVP
      if (session.complete_uvp) {
        console.log(`   ✅ Has complete UVP data`);
      } else {
        console.log(`   ⭕ No complete UVP yet`);
      }

      console.log('');
    });

    // Check if there are any buyer personas in ANY table
    console.log('\n🔍 Double-checking buyer_personas table...');
    const { data: personas, error: personasError } = await supabase
      .from('buyer_personas')
      .select('count(*)')
      .eq('brand_id', brandId);

    if (!personasError) {
      console.log(`   Found ${personas?.[0]?.count || 0} buyer personas in buyer_personas table`);
    }

  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

checkUVPSessions();