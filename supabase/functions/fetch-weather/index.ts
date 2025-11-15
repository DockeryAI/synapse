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
    const { type, location } = await req.json()

    if (!WEATHER_API_KEY) {
      throw new Error('Weather API key not configured in Edge Function environment')
    }

    if (!location) {
      throw new Error('Location is required')
    }

    let url: string

    if (type === 'current') {
      // Current weather
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=imperial&appid=${WEATHER_API_KEY}`
    } else if (type === 'forecast') {
      // 5-day forecast
      url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&units=imperial&appid=${WEATHER_API_KEY}`
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
        temperature: data.main.temp,
        feels_like: data.main.feels_like,
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        wind_speed: data.wind.speed,
        location: data.name || location,
        forecast: []
      }
    } else {
      // forecast
      const dailyForecasts: any[] = []
      const grouped: Record<string, any[]> = {}

      data.list.forEach((item: any) => {
        const date = item.dt_txt.split(' ')[0]
        if (!grouped[date]) grouped[date] = []
        grouped[date].push(item)
      })

      Object.entries(grouped).forEach(([date, items]) => {
        const temps = items.map(i => i.main.temp)
        dailyForecasts.push({
          date,
          temp_max: Math.max(...temps),
          temp_min: Math.min(...temps),
          condition: items[0].weather[0].main,
          precipitation_chance: items[0].pop * 100
        })
      })

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
