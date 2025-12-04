#!/usr/bin/env node

// Debug script to test persona conversion logic
const testRefinedData = {
  selectedCustomers: [
    "Insurance sales leaders struggling with quote abandonment",
    "Mid-sized carriers looking to modernize digital sales",
    "Operations managers dealing with legacy system constraints",
    "Sales VPs trying to improve conversion rates",
    "IT directors evaluating AI compliance solutions",
    "Customer service managers handling policy inquiries",
    "Marketing teams targeting insurance prospects",
    "Business analysts tracking sales metrics",
    "Compliance officers ensuring regulatory adherence",
    "Executive stakeholders evaluating ROI"
  ]
};

const testWebsiteAnalysis = {
  customerProblems: [
    "High quote abandonment rates",
    "Manual processes slowing sales"
  ],
  solutions: [
    "AI-powered conversion optimization",
    "Automated compliance monitoring"
  ]
};

const testUvpToDisplay = {
  targetCustomer: {
    industry: "Insurance",
    emotionalDrivers: ["frustration", "urgency"],
    functionalDrivers: ["efficiency", "compliance"]
  }
};

console.log('🔧 Testing persona conversion logic...');
console.log('Input data:');
console.log('- selectedCustomers:', testRefinedData.selectedCustomers.length);
console.log('- customerProblems:', testWebsiteAnalysis.customerProblems.length);
console.log('- industry:', testUvpToDisplay.targetCustomer.industry);

// Simulate the conversion logic
const simpleBuyerPersonas = testRefinedData.selectedCustomers.map((customerDescription, index) => ({
  id: `customer-profile-${Date.now()}-${index}`,
  name: customerDescription || `Customer Segment ${index + 1}`,
  role: 'Target Customer',
  company_type: testUvpToDisplay.targetCustomer?.industry || 'Business',
  pain_points: testWebsiteAnalysis?.customerProblems?.slice(0, 2) || [],
  desired_outcomes: testWebsiteAnalysis?.solutions?.slice(0, 2) || [],
  emotional_drivers: testUvpToDisplay.targetCustomer?.emotionalDrivers || [],
  functional_drivers: testUvpToDisplay.targetCustomer?.functionalDrivers || [],
  source: 'uvp_flow',
  confidence_score: 85,
  validated: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}));

console.log('\n✅ Conversion successful!');
console.log('Generated personas:', simpleBuyerPersonas.length);
console.log('\nSample persona:');
console.log(JSON.stringify(simpleBuyerPersonas[0], null, 2));

console.log('\n📋 All persona names:');
simpleBuyerPersonas.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.name}`);
});