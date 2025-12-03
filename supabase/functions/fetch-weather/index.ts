import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

/**
 * OpenWeather API Edge Function
 *
 * Securely proxies weather requests through Supabase Edge Functions
 * to keep API key server-side only.
 *
 * OpenWeather API: https://openweathermap.org/api
 * - Current Weather: https://api.openweathermap.org/data/2.5/weather
 * - 5-Day Forecast: https://api.openweathermap.org/data/2.5/forecast
 *
 * Updated: 2025-11-29 - Migrated from WeatherAPI.com to OpenWeather
 */

const WEATHER_API_KEY = Deno.env.get('WEATHER_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// OpenWeather condition code to readable description mapping
function getConditionText(weatherCode: number): string {
  // Thunderstorm
  if (weatherCode >= 200 && weatherCode < 300) return 'Thunderstorm'
  // Drizzle
  if (weatherCode >= 300 && weatherCode < 400) return 'Drizzle'
  // Rain
  if (weatherCode >= 500 && weatherCode < 600) return 'Rain'
  // Snow
  if (weatherCode >= 600 && weatherCode < 700) return 'Snow'
  // Atmosphere (fog, mist, etc.)
  if (weatherCode >= 700 && weatherCode < 800) return 'Fog'
  // Clear
  if (weatherCode === 800) return 'Clear'
  // Clouds
  if (weatherCode > 800) return 'Cloudy'
  return 'Unknown'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const type = body.type || 'current'  // 'current' or 'forecast'
    const location = body.location

    if (!WEATHER_API_KEY) {
      throw new Error('Weather API key not configured. Set WEATHER_API_KEY in Supabase Edge Function secrets.')
    }

    if (!location) {
      throw new Error('Location is required')
    }

    let url: string
    const baseUrl = 'https://api.openweathermap.org/data/2.5'

    // OpenWeather uses 'q' param for city name
    // Format: "City" or "City,StateCode,CountryCode" e.g., "London,uk" or "Austin,TX,US"
    const locationQuery = encodeURIComponent(location)

    if (type === 'current') {
      // Current weather endpoint
      url = `${baseUrl}/weather?q=${locationQuery}&appid=${WEATHER_API_KEY}&units=imperial`
    } else if (type === 'forecast') {
      // 5-day/3-hour forecast endpoint (OpenWeather free tier)
      url = `${baseUrl}/forecast?q=${locationQuery}&appid=${WEATHER_API_KEY}&units=imperial`
    } else {
      throw new Error('Invalid type. Use "current" or "forecast"')
    }

    console.log('[Weather Edge] Fetching:', type, 'for', location)

    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Weather Edge] OpenWeather error:', errorData)
      throw new Error(`OpenWeather API error (${response.status}): ${errorData.message || response.statusText}`)
    }

    const data = await response.json()

    // Transform response based on type
    let result: any

    if (type === 'current') {
      // Transform current weather response
      result = {
        temperature: data.main.temp,
        feels_like: data.main.feels_like,
        condition: getConditionText(data.weather[0]?.id || 800),
        description: data.weather[0]?.description || 'Unknown',
        humidity: data.main.humidity,
        wind_speed: data.wind.speed,
        location: data.name || location,
        forecast: []
      }
    } else {
      // Transform 5-day forecast response
      // OpenWeather returns 3-hour intervals, we need to aggregate to daily
      const dailyMap = new Map<string, {
        date: string
        temps: number[]
        conditions: number[]
        precip: number[]
      }>()

      // Group by date
      for (const item of data.list) {
        const date = item.dt_txt.split(' ')[0] // "2025-11-30 12:00:00" -> "2025-11-30"

        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            date,
            temps: [],
            conditions: [],
            precip: []
          })
        }

        const day = dailyMap.get(date)!
        day.temps.push(item.main.temp)
        day.conditions.push(item.weather[0]?.id || 800)
        // OpenWeather gives pop (probability of precipitation) as 0-1
        day.precip.push((item.pop || 0) * 100)
      }

      // Convert to daily forecasts (limit to 5 days)
      const dailyForecasts = Array.from(dailyMap.values())
        .slice(0, 5)
        .map(day => ({
          date: day.date,
          temp_max: Math.round(Math.max(...day.temps)),
          temp_min: Math.round(Math.min(...day.temps)),
          condition: getConditionText(day.conditions[Math.floor(day.conditions.length / 2)]),
          precipitation_chance: Math.round(Math.max(...day.precip))
        }))

      result = dailyForecasts
    }

    console.log('[Weather Edge] Success:', type, 'returned', Array.isArray(result) ? result.length + ' days' : 'current conditions')

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('[Weather Edge] Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
