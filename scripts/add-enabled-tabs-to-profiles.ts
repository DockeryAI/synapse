// Script to add enabledTabs field to all industry profiles in Supabase
// Run: npx tsx scripts/add-enabled-tabs-to-profiles.ts

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Industries that should have Local + Weather tabs enabled
// These are outdoor/weather-dependent services, location-dependent businesses
const WEATHER_AND_LOCAL_INDUSTRIES = [
  // Outdoor/Construction Services
  'garden-center', 'landscape-architecture', 'roofing-contractors', 'painting-contractors',
  'concrete-pouring', 'drywall-contractors', 'glass-glazing-contractors', 'masonry-contractors',
  'foundation-structure-contractors', 'framing-contractors', 'finish-carpentry', 'tile-contractors',
  'flooring-contractors', 'site-preparation-contractors', 'highway-street-construction',
  'commercial-building-construction', 'residential-building-construction', 'new-multifamily-construction',
  'industrial-building-construction', 'heavy-civil-construction', 'paving-contractors',
  'siding-contractors', 'structural-steel-erection', 'demolition-contractors',
  'excavation-contractors', 'water-well-drilling', 'septic-system-contractors',
  'power-line-construction', 'oil-gas-pipeline-construction',
  // HVAC/Plumbing (weather-dependent)
  'hvac-contractors', 'plumbing-contractors', 'electrical-contractors',
  // Outdoor Events/Recreation
  'sports-teams-clubs', 'golf-courses', 'skiing-facilities', 'marinas',
  'amusement-parks', 'fitness-recreation-centers', 'nature-parks', 'campgrounds-rv-parks',
  // Agriculture/Farming
  'nursery-garden-center', 'farm-management', 'crop-production', 'animal-production',
  // Automotive (somewhat weather affected)
  'automotive-repair', 'automotive-dealers', 'motorcycle-dealers', 'boat-dealers',
  'tire-dealers', 'automotive-parts', 'car-wash',
];

// Industries that should have Local only (location-dependent but not weather-sensitive)
const LOCAL_ONLY_INDUSTRIES = [
  // Retail
  'department-stores', 'warehouse-clubs', 'convenience-stores', 'supermarkets', 'grocery-stores',
  'specialty-food-stores', 'beer-wine-liquor-stores', 'pharmacies', 'cosmetics-stores',
  'optical-goods-stores', 'health-supplement-stores', 'gas-stations', 'clothing-stores',
  'shoe-stores', 'jewelry-stores', 'sporting-goods-stores', 'hobby-toy-game-stores',
  'book-stores', 'florists', 'gift-novelty-stores', 'pet-stores', 'art-dealers',
  'musical-instrument-stores', 'office-supplies-stores', 'used-merchandise-stores',
  'furniture-stores', 'home-furnishings-stores', 'appliance-stores', 'electronics-stores',
  'building-materials-dealers', 'hardware-stores', 'paint-wallpaper-stores',
  'lawn-garden-equipment-stores',
  // Food Service
  'full-service-restaurants', 'limited-service-restaurants', 'cafeterias-buffets',
  'snack-nonalcoholic-bars', 'bars-nightclubs', 'mobile-food-services', 'caterers',
  'coffee-shops', 'bakeries', 'ice-cream-parlors', 'pizza-restaurants', 'food-trucks',
  // Healthcare
  'physician-offices', 'dentist-offices', 'chiropractors', 'optometrists',
  'mental-health-practitioners', 'physical-therapy', 'speech-therapy', 'occupational-therapy',
  'podiatrists', 'urgent-care-centers', 'outpatient-care-centers', 'family-planning-centers',
  'blood-organ-banks', 'ambulance-services', 'medical-laboratories', 'diagnostic-imaging',
  'home-health-care', 'nursing-care-facilities', 'assisted-living', 'continuing-care-retirement',
  'hospice-care', 'kidney-dialysis-centers', 'substance-abuse-treatment', 'psychiatric-hospitals',
  'veterinary-services',
  // Personal Services
  'hair-salons', 'barber-shops', 'nail-salons', 'beauty-salons', 'day-spas',
  'diet-weight-loss-centers', 'tattoo-parlors', 'tanning-salons', 'massage-therapists',
  'funeral-homes', 'cemeteries', 'pet-care-services', 'pet-grooming', 'pet-boarding',
  'laundry-services', 'dry-cleaning', 'alterations', 'shoe-repair',
  'parking-lots-garages', 'photofinishing', 'dating-services', 'wedding-planning',
  // Real Estate
  'real-estate-agents', 'property-management', 'real-estate-appraisers', 'title-companies',
  // Financial (local branches)
  'banks', 'credit-unions', 'payday-lenders', 'pawn-shops',
  // Entertainment/Recreation (indoor but local)
  'movie-theaters', 'live-theaters', 'concert-venues', 'museums', 'zoos-aquariums',
  'bowling-centers', 'fitness-centers', 'dance-studios', 'martial-arts-studios',
  'yoga-studios', 'pilates-studios', 'escape-rooms', 'laser-tag', 'trampoline-parks',
  // Education (local)
  'child-day-care', 'preschools', 'elementary-schools', 'high-schools',
  'tutoring-services', 'driving-schools', 'music-lessons', 'art-classes',
  // Professional Services (often local)
  'legal-services', 'accounting', 'architectural-services', 'engineering-services',
  'surveying-services', 'interior-design', 'graphic-design', 'photography-studios',
  'translation-services', 'notary-services', 'printing-services', 'sign-making',
];

interface EnabledTabs {
  triggers: boolean;
  proof: boolean;
  trends: boolean;
  conversations: boolean;
  competitors: boolean;
  local: boolean;
  weather: boolean;
}

function determineEnabledTabs(industryId: string): EnabledTabs {
  const slug = industryId.toLowerCase().replace(/_/g, '-');

  // Check if weather + local
  const isWeatherDependent = WEATHER_AND_LOCAL_INDUSTRIES.some(ind =>
    slug.includes(ind) || ind.includes(slug)
  );

  // Check if local only
  const isLocalDependent = LOCAL_ONLY_INDUSTRIES.some(ind =>
    slug.includes(ind) || ind.includes(slug)
  );

  // Default tabs always enabled
  return {
    triggers: true,
    proof: true,
    trends: true,
    conversations: true,
    competitors: true,
    local: isWeatherDependent || isLocalDependent,
    weather: isWeatherDependent,
  };
}

async function updateProfiles() {
  console.log('🚀 Starting enabledTabs migration...\n');

  // Fetch all profiles
  const { data: profiles, error: fetchError } = await supabase
    .from('industry_profiles')
    .select('id, name, profile_data');

  if (fetchError) {
    console.error('Failed to fetch profiles:', fetchError);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log('No profiles found!');
    process.exit(1);
  }

  console.log(`📁 Found ${profiles.length} profiles to update\n`);

  let localCount = 0;
  let weatherCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const profile of profiles) {
    const enabledTabs = determineEnabledTabs(profile.id);

    // Update profile_data with enabledTabs
    const updatedProfileData = {
      ...profile.profile_data,
      enabledTabs,
    };

    const { error: updateError } = await supabase
      .from('industry_profiles')
      .update({ profile_data: updatedProfileData })
      .eq('id', profile.id);

    if (updateError) {
      console.log(`   ❌ ${profile.name}: ${updateError.message}`);
      errorCount++;
    } else {
      const flags = [];
      if (enabledTabs.local) {
        flags.push('📍 Local');
        localCount++;
      }
      if (enabledTabs.weather) {
        flags.push('🌤️ Weather');
        weatherCount++;
      }

      console.log(`   ✓ ${profile.name} ${flags.length > 0 ? `[${flags.join(', ')}]` : ''}`);
      updatedCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));
  console.log(`   ✓ Updated: ${updatedCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📍 With Local tab: ${localCount}`);
  console.log(`   🌤️ With Weather tab: ${weatherCount}`);
  console.log(`   📁 Total processed: ${profiles.length}`);

  // Verify a sample
  const { data: sample } = await supabase
    .from('industry_profiles')
    .select('id, name, profile_data->enabledTabs')
    .limit(5);

  if (sample && sample.length > 0) {
    console.log('\n📋 Sample verification:');
    sample.forEach(p => {
      const tabs = (p as any).enabledTabs;
      console.log(`   - ${p.name}: local=${tabs?.local}, weather=${tabs?.weather}`);
    });
  }

  console.log('\n🎉 Migration complete!');
}

// Run the migration
updateProfiles().catch(console.error);
