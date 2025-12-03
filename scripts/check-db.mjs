import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://icvuzorpisnpmtcvzcfq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdnV6b3JwaXNucG10Y3Z6Y2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwMDM2NDAsImV4cCI6MjA0NjU3OTY0MH0.LKmBXFD_hH6G5JvC-rWEqSKQGaZfXtLPfj6rP1yjqS4";

const supabase = createClient(supabaseUrl, supabaseKey);

const brandId = "09c379e0-fd35-455c-9180-15426b1534b3";

console.log("=== 1. CHECK marba_uvps (UVP wizard saves here) ===");
const { data: uvp, error: uvpErr } = await supabase
  .from("marba_uvps")
  .select("*")
  .eq("brand_id", brandId)
  .single();

if (uvpErr) {
  console.log("UVP Error:", uvpErr.message);
} else {
  console.log("UVP Found: YES");
  console.log("products_services categories:", uvp?.products_services?.categories?.length || 0);
  console.log("products_services sample:", JSON.stringify(uvp?.products_services?.categories?.[0]?.items?.[0])?.substring(0, 200));
  console.log("target_customer statement:", uvp?.target_customer?.statement?.substring(0, 150));
  console.log("target_customer emotionalDrivers:", uvp?.target_customer?.emotionalDrivers);
  console.log("target_customer functionalDrivers:", uvp?.target_customer?.functionalDrivers);
  console.log("unique_solution differentiators count:", uvp?.unique_solution?.differentiators?.length || 0);
  console.log("unique_solution sample:", JSON.stringify(uvp?.unique_solution?.differentiators?.[0])?.substring(0, 200));
  console.log("key_benefit statement:", uvp?.key_benefit?.statement?.substring(0, 150));
}

console.log("\n=== 2. CHECK specialty_profiles (triggers read from here) ===");
const { data: profile, error: profErr } = await supabase
  .from("specialty_profiles")
  .select("*")
  .eq("brand_id", brandId)
  .single();

if (profErr) {
  console.log("Profile Error:", profErr.message);
} else {
  console.log("Profile Found: YES");
  console.log("specialty_name:", profile?.specialty_name);
  console.log("customer_triggers count:", profile?.customer_triggers?.length);
  console.log("customer_triggers sample:", JSON.stringify(profile?.customer_triggers?.[0])?.substring(0, 200));
  console.log("common_pain_points:", profile?.common_pain_points);
  console.log("common_buying_triggers:", profile?.common_buying_triggers);
  console.log("urgency_drivers:", profile?.urgency_drivers);
  console.log("profile_data keys:", Object.keys(profile?.profile_data || {}));
  const fullUvp = profile?.profile_data?.full_uvp;
  console.log("\n--- full_uvp inside profile_data ---");
  console.log("full_uvp exists:", !!fullUvp);
  console.log("full_uvp.products_services:", fullUvp?.products_services?.length || 0);
  console.log("full_uvp.differentiators:", fullUvp?.differentiators?.length || 0);
  console.log("full_uvp.emotional_drivers:", fullUvp?.emotional_drivers?.length || 0);
  console.log("full_uvp.functional_drivers:", fullUvp?.functional_drivers?.length || 0);
  console.log("full_uvp.key_benefit_statement:", fullUvp?.key_benefit_statement?.substring(0, 150));
  console.log("full_uvp.target_customer_statement:", fullUvp?.target_customer_statement?.substring(0, 150));
}
