/**
 * Test script to verify UVP transform is correctly extracting data
 *
 * Usage: node scripts/test-uvp-transform.mjs
 *
 * This script:
 * 1. Reads the existing marba_uvps data for a brand
 * 2. Simulates running the transform
 * 3. Shows what full_uvp would be generated
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://icvuzorpisnpmtcvzcfq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdnV6b3JwaXNucG10Y3Z6Y2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwMDM2NDAsImV4cCI6MjA0NjU3OTY0MH0.LKmBXFD_hH6G5JvC-rWEqSKQGaZfXtLPfj6rP1yjqS4";

const supabase = createClient(supabaseUrl, supabaseKey);

const brandId = "09c379e0-fd35-455c-9180-15426b1534b3";

console.log("=== Testing UVP Transform ===\n");

// 1. Get the marba_uvps data
const { data: uvp, error: uvpErr } = await supabase
  .from("marba_uvps")
  .select("*")
  .eq("brand_id", brandId)
  .single();

if (uvpErr) {
  console.log("Error fetching UVP:", uvpErr.message);
  process.exit(1);
}

console.log("=== RAW UVP DATA FROM DB ===\n");

// 2. Check target_customer structure
console.log("--- target_customer ---");
console.log("Statement:", uvp.target_customer?.statement?.substring(0, 100));
console.log("emotionalDrivers:", uvp.target_customer?.emotionalDrivers);
console.log("functionalDrivers:", uvp.target_customer?.functionalDrivers);

// 3. Check transformation_goal structure
console.log("\n--- transformation_goal ---");
console.log("Statement:", uvp.transformation_goal?.statement?.substring(0, 100));
console.log("emotionalDrivers:", uvp.transformation_goal?.emotionalDrivers);
console.log("functionalDrivers:", uvp.transformation_goal?.functionalDrivers);
console.log("before:", uvp.transformation_goal?.before?.substring(0, 100));
console.log("after:", uvp.transformation_goal?.after?.substring(0, 100));

// 4. Check unique_solution structure
console.log("\n--- unique_solution ---");
console.log("Statement:", uvp.unique_solution?.statement?.substring(0, 100));
console.log("differentiators count:", uvp.unique_solution?.differentiators?.length);
console.log("differentiators raw:");
uvp.unique_solution?.differentiators?.forEach((d, i) => {
  console.log(`  [${i}] id: ${d?.id}, statement: ${d?.statement?.substring(0, 80)}`);
});

// 5. Check key_benefit structure
console.log("\n--- key_benefit ---");
console.log("Statement:", uvp.key_benefit?.statement?.substring(0, 100));
console.log("metrics count:", uvp.key_benefit?.metrics?.length);

// 6. Check products_services structure
console.log("\n--- products_services ---");
console.log("categories count:", uvp.products_services?.categories?.length);
uvp.products_services?.categories?.forEach((cat, i) => {
  console.log(`  [${i}] ${cat.name}: ${cat.items?.length} items`);
  cat.items?.forEach((item, j) => {
    console.log(`      [${j}] ${item.name}`);
  });
});

// 7. Simulate the transform
console.log("\n\n=== SIMULATING TRANSFORM ===\n");

// This mimics what extractFullUVP does
const targetCustomer = {
  statement: uvp.target_customer?.statement || '',
  emotionalDrivers: uvp.target_customer?.emotionalDrivers || [],
  functionalDrivers: uvp.target_customer?.functionalDrivers || [],
};

const transformationGoal = {
  emotionalDrivers: uvp.transformation_goal?.emotionalDrivers || [],
  functionalDrivers: uvp.transformation_goal?.functionalDrivers || [],
};

const uniqueSolution = {
  statement: uvp.unique_solution?.statement || '',
  differentiators: uvp.unique_solution?.differentiators || [],
};

// Merge emotional drivers
const emotional_drivers = [
  ...targetCustomer.emotionalDrivers,
  ...transformationGoal.emotionalDrivers,
].filter(d => d);

// Merge functional drivers
const functional_drivers = [
  ...targetCustomer.functionalDrivers,
  ...transformationGoal.functionalDrivers,
].filter(d => d);

// Extract differentiator statements
const differentiators = uniqueSolution.differentiators
  .filter(d => d && d.statement)
  .map(d => d.statement);

console.log("--- RESULTING full_uvp fields ---");
console.log("emotional_drivers:", emotional_drivers);
console.log("functional_drivers:", functional_drivers);
console.log("differentiators:", differentiators);

// Extract products
const products_services = [];
if (uvp.products_services?.categories) {
  uvp.products_services.categories.forEach(cat => {
    cat.items?.forEach(item => {
      products_services.push(item.name);
      if (item.description) {
        products_services.push(`${item.name}: ${item.description}`);
      }
    });
  });
}
console.log("products_services:", products_services.slice(0, 5), products_services.length > 5 ? `... (${products_services.length} total)` : '');

console.log("\n\n=== DIAGNOSIS ===\n");

if (emotional_drivers.length === 0) {
  console.log("❌ PROBLEM: No emotional drivers found!");
  console.log("   - target_customer.emotionalDrivers:", uvp.target_customer?.emotionalDrivers);
  console.log("   - transformation_goal.emotionalDrivers:", uvp.transformation_goal?.emotionalDrivers);
}

if (functional_drivers.length === 0) {
  console.log("❌ PROBLEM: No functional drivers found!");
  console.log("   - target_customer.functionalDrivers:", uvp.target_customer?.functionalDrivers);
  console.log("   - transformation_goal.functionalDrivers:", uvp.transformation_goal?.functionalDrivers);
}

if (differentiators.length === 0) {
  console.log("❌ PROBLEM: No differentiators extracted!");
  console.log("   - unique_solution.differentiators count:", uvp.unique_solution?.differentiators?.length);
  console.log("   - First differentiator structure:", JSON.stringify(uvp.unique_solution?.differentiators?.[0]));
}

if (emotional_drivers.length > 0 && functional_drivers.length > 0 && differentiators.length > 0) {
  console.log("✅ All UVP fields look good!");
}

console.log("\n=== END ===");
