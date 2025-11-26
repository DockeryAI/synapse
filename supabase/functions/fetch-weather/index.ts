import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const WEATHER_API_KEY = Deno.env.get('WEATHER_API_KEY') || Deno.env.get('VITE_WEATHER_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const type = body.type || 'current'  // Default to current weather
    const location = body.location

    if (!WEATHER_API_KEY) {
      throw new Error('Weather API key not configured in Edge Function environment')
    }

    if (!location) {
      throw new Error('Location is required')
    }

    let url: string

    if (type === 'current') {
      // Current weather from WeatherAPI.com
      url = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&aqi=no`
    } else if (type === 'forecast') {
      // 5-day forecast from WeatherAPI.com
      url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&days=5&aqi=no`
    } else {
      throw new Error('Invalid type. Use "current" or "forecast"')
    }

    console.log('[Weather Edge] Fetching:', type, 'for', location)

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Weather API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()

    // Transform response based on type
    let result: any

    if (type === 'current') {
      result = {
        temperature: data.current.temp_f,
        feels_like: data.current.feelslike_f,
        condition: data.current.condition.text,
        description: data.current.condition.text,
        humidity: data.current.humidity,
        wind_speed: data.current.wind_mph,
        location: data.location.name || location,
        forecast: []
      }
    } else {
      // forecast
      const dailyForecasts = data.forecast.forecastday.map((day: any) => ({
        date: day.date,
        temp_max: day.day.maxtemp_f,
        temp_min: day.day.mintemp_f,
        condition: day.day.condition.text,
        precipitation_chance: day.day.daily_chance_of_rain || 0
      }))

      result = dailyForecasts.slice(0, 5)
    }

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
