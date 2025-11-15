/**
 * Test Weather API via Supabase Edge Function
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function testWeatherAPI() {
  console.log('🧪 Testing Weather API...\n');

  try {
    // Test 1: Current Weather
    console.log('Test 1: Current Weather for Austin, TX\n');

    const currentResponse = await fetch(`${SUPABASE_URL}/functions/v1/fetch-weather`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'current',
        location: 'Austin'
      })
    });

    console.log('Current Weather Response Status:', currentResponse.status);

    const currentData = await currentResponse.json();

    if (!currentResponse.ok) {
      console.error('❌ FAILED - Edge Function Error:', currentData);
      process.exit(1);
    }

    if (!currentData.success) {
      console.error('❌ FAILED - API Error:', currentData.error);
      process.exit(1);
    }

    console.log('✅ Current Weather Retrieved Successfully!');
    console.log(`\nTemperature: ${currentData.data.temperature}°F`);
    console.log(`Feels Like: ${currentData.data.feels_like}°F`);
    console.log(`Condition: ${currentData.data.condition}`);
    console.log(`Description: ${currentData.data.description}`);
    console.log(`Humidity: ${currentData.data.humidity}%`);
    console.log(`Wind Speed: ${currentData.data.wind_speed} mph`);

    // Test 2: 5-Day Forecast
    console.log('\n\nTest 2: 5-Day Forecast for Austin, TX\n');

    const forecastResponse = await fetch(`${SUPABASE_URL}/functions/v1/fetch-weather`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'forecast',
        location: 'Austin'
      })
    });

    console.log('Forecast Response Status:', forecastResponse.status);

    const forecastData = await forecastResponse.json();

    if (!forecastResponse.ok) {
      console.error('❌ FAILED - Edge Function Error:', forecastData);
      process.exit(1);
    }

    if (!forecastData.success) {
      console.error('❌ FAILED - API Error:', forecastData.error);
      process.exit(1);
    }

    console.log('✅ Forecast Retrieved Successfully!');
    console.log(`\nReceived ${forecastData.data.length} days of forecast:`);

    forecastData.data.forEach((day, i) => {
      console.log(`\n${i + 1}. ${day.date}`);
      console.log(`   High: ${day.temp_max}°F | Low: ${day.temp_min}°F`);
      console.log(`   Condition: ${day.condition}`);
      console.log(`   Precipitation: ${day.precipitation_chance}%`);
    });

    console.log('\n✅ Weather API Test PASSED\n');

  } catch (error) {
    console.error('❌ FAILED - Unexpected Error:', error.message);
    process.exit(1);
  }
}

// Load .env file
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

testWeatherAPI();
