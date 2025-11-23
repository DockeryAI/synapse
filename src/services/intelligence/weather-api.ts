/**
 * OpenWeather API Integration
 * Real-time weather data for opportunity detection
 * SECURITY: Uses Edge Function to keep API keys server-side
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

interface WeatherData {
  temperature: number
  feels_like: number
  condition: string
  description: string
  humidity: number
  wind_speed: number
  location?: string
  forecast: ForecastDay[]
}

interface ForecastDay {
  date: string
  temp_max: number
  temp_min: number
  condition: string
  precipitation_chance: number
}

interface WeatherOpportunity {
  type: 'heat_wave' | 'cold_snap' | 'storm' | 'precipitation' | 'seasonal'
  urgency: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  impact_score: number
  suggested_actions: string[]
}

class WeatherAPIService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map()

  private getCached(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  async getCurrentWeather(location: string): Promise<WeatherData | null> {
    const cacheKey = `current_${location}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-weather`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          type: 'current',
          location
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`[WeatherAPI] ❌ Edge Function error (${response.status}): ${errorData.error || response.statusText}`)
        console.error('[WeatherAPI] This likely means WEATHER_API_KEY is not configured in Supabase Edge Function secrets')
        throw new Error(`Weather Edge Function error (${response.status}): ${errorData.error || response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        console.error('[WeatherAPI] ❌ Edge Function returned error:', result.error)
        throw new Error(`Weather Edge Function error: ${result.error}`)
      }

      const weather: WeatherData = result.data

      this.setCache(cacheKey, weather)
      return weather
    } catch (error) {
      console.error('[Weather API] Error:', error)
      throw error
    }
  }

  async get5DayForecast(location: string): Promise<ForecastDay[]> {
    const cacheKey = `forecast_${location}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-weather`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          type: 'forecast',
          location
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`[WeatherAPI] ❌ Edge Function error (${response.status}): ${errorData.error || response.statusText}`)
        console.error('[WeatherAPI] This likely means WEATHER_API_KEY is not configured in Supabase Edge Function secrets')
        throw new Error(`Weather Edge Function error (${response.status}): ${errorData.error || response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        console.error('[WeatherAPI] ❌ Edge Function returned error:', result.error)
        throw new Error(`Weather Edge Function error: ${result.error}`)
      }

      const dailyForecasts: ForecastDay[] = result.data

      this.setCache(cacheKey, dailyForecasts)
      return dailyForecasts
    } catch (error) {
      console.error('[Weather API] Error:', error)
      throw error
    }
  }

  async detectWeatherOpportunities(location: string, industry: string): Promise<WeatherOpportunity[]> {
    const weather = await this.getCurrentWeather(location)
    const forecast = await this.get5DayForecast(location)

    const opportunities: WeatherOpportunity[] = []
    const temp = weather.temperature

    // EXTREME CONDITIONS (High priority)

    // Heat wave detection (HVAC, pools, cooling)
    if (temp > 90) {
      opportunities.push({
        type: 'heat_wave',
        urgency: 'critical',
        title: 'Heat Wave Alert',
        description: `Temperature ${Math.round(temp)}°F - High demand for cooling services`,
        impact_score: 95,
        suggested_actions: [
          'Promote emergency AC repair services',
          'Offer heat wave specials',
          'Increase ad spend for cooling keywords',
          'Send email campaign about heat protection'
        ]
      })
    }

    // Cold snap (heating, insulation)
    if (temp < 32) {
      opportunities.push({
        type: 'cold_snap',
        urgency: 'high',
        title: 'Freezing Temperatures',
        description: `Temperature ${Math.round(temp)}°F - Heating system demand`,
        impact_score: 90,
        suggested_actions: [
          'Promote heating system checks',
          'Offer winterization services',
          'Target frozen pipe prevention messaging'
        ]
      })
    }

    // MODERATE CONDITIONS (Medium priority)

    // Warm weather opportunities (75-90°F)
    if (temp >= 75 && temp <= 90) {
      opportunities.push({
        type: 'heat_wave',
        urgency: 'medium',
        title: 'Warm Weather Window',
        description: `Temperature ${Math.round(temp)}°F - Ideal for AC tune-ups and outdoor services`,
        impact_score: 65,
        suggested_actions: [
          'Promote preventive AC maintenance before peak heat',
          'Offer outdoor service specials',
          'Remind customers about summer preparation',
          'Target lawn care, exterior painting, roofing'
        ]
      })
    }

    // Cool weather opportunities (50-65°F)
    if (temp >= 50 && temp < 65) {
      opportunities.push({
        type: 'seasonal',
        urgency: 'medium',
        title: 'Perfect Service Weather',
        description: `Temperature ${Math.round(temp)}°F - Comfortable conditions for outdoor work`,
        impact_score: 60,
        suggested_actions: [
          'Promote seasonal maintenance (HVAC, landscaping)',
          'Offer exterior home services (painting, roofing, windows)',
          'Target spring/fall preparation messaging',
          'Schedule outdoor installations while weather is mild'
        ]
      })
    }

    // Chilly weather (32-50°F)
    if (temp >= 32 && temp < 50) {
      opportunities.push({
        type: 'cold_snap',
        urgency: 'medium',
        title: 'Heating Season Active',
        description: `Temperature ${Math.round(temp)}°F - Heating systems in regular use`,
        impact_score: 55,
        suggested_actions: [
          'Promote heating system maintenance',
          'Offer insulation and weatherproofing',
          'Target energy efficiency messaging',
          'Remind customers about heating tune-ups'
        ]
      })
    }

    // PRECIPITATION & STORMS

    // Current rain/snow
    const isRaining = weather.condition.toLowerCase().includes('rain') ||
                     weather.condition.toLowerCase().includes('drizzle')
    const isSnowing = weather.condition.toLowerCase().includes('snow')

    if (isSnowing) {
      opportunities.push({
        type: 'precipitation',
        urgency: 'high',
        title: 'Active Snowfall',
        description: 'Snow conditions - high demand for winter services',
        impact_score: 85,
        suggested_actions: [
          'Promote snow removal services',
          'Offer emergency heating repairs',
          'Target winterization and insulation',
          'Send winter safety tips'
        ]
      })
    } else if (isRaining) {
      opportunities.push({
        type: 'precipitation',
        urgency: 'medium',
        title: 'Active Rainfall',
        description: 'Current rain - opportunity for water-related services',
        impact_score: 60,
        suggested_actions: [
          'Promote waterproofing and drainage',
          'Offer roof and gutter inspections',
          'Target basement waterproofing',
          'Send maintenance reminders'
        ]
      })
    }

    // Forecast-based opportunities
    const upcomingHeavyRain = forecast.some(day => day.precipitation_chance > 60)
    const upcomingModerateRain = forecast.some(day => day.precipitation_chance > 30 && day.precipitation_chance <= 60)

    if (upcomingHeavyRain && !isRaining) {
      opportunities.push({
        type: 'precipitation',
        urgency: 'medium',
        title: 'Heavy Rain Forecast',
        description: 'Significant rain expected - prepare customers now',
        impact_score: 70,
        suggested_actions: [
          'Promote waterproofing services',
          'Offer gutter cleaning before rain',
          'Target flood prevention messaging',
          'Send weather alert emails'
        ]
      })
    } else if (upcomingModerateRain && !isRaining && !upcomingHeavyRain) {
      opportunities.push({
        type: 'precipitation',
        urgency: 'low',
        title: 'Rain in Forecast',
        description: 'Moderate rain expected - good time for preventive services',
        impact_score: 45,
        suggested_actions: [
          'Remind customers about drainage checks',
          'Offer preventive maintenance',
          'Target outdoor project completion messaging'
        ]
      })
    }

    // TEMPERATURE SWINGS

    // Check for significant day/night or week temperature changes
    const tempSwing = forecast.reduce((maxSwing, day) => {
      const swing = day.temp_max - day.temp_min
      return Math.max(maxSwing, swing)
    }, 0)

    if (tempSwing > 30) {
      opportunities.push({
        type: 'seasonal',
        urgency: 'low',
        title: 'Temperature Fluctuations',
        description: `Large temperature swings (${Math.round(tempSwing)}°F) can strain HVAC systems`,
        impact_score: 50,
        suggested_actions: [
          'Promote HVAC system checks',
          'Offer multi-season maintenance packages',
          'Target energy efficiency messaging',
          'Remind customers about system stress during swings'
        ]
      })
    }

    // SEASONAL MESSAGING (always include at least one)

    // If no specific opportunities, provide seasonal baseline
    if (opportunities.length === 0) {
      const month = new Date().getMonth() + 1 // 1-12

      let seasonalOpp: WeatherOpportunity

      if (month >= 6 && month <= 8) {
        // Summer
        seasonalOpp = {
          type: 'seasonal',
          urgency: 'low',
          title: 'Summer Season',
          description: `Temperature ${Math.round(temp)}°F - Summer service opportunities`,
          impact_score: 40,
          suggested_actions: [
            'Promote AC maintenance and tune-ups',
            'Offer summer service packages',
            'Target outdoor services (landscaping, exterior work)',
            'Send seasonal maintenance reminders'
          ]
        }
      } else if (month >= 12 || month <= 2) {
        // Winter
        seasonalOpp = {
          type: 'seasonal',
          urgency: 'low',
          title: 'Winter Season',
          description: `Temperature ${Math.round(temp)}°F - Winter service opportunities`,
          impact_score: 40,
          suggested_actions: [
            'Promote heating system maintenance',
            'Offer winterization services',
            'Target indoor home improvement projects',
            'Send winter preparation tips'
          ]
        }
      } else if (month >= 3 && month <= 5) {
        // Spring
        seasonalOpp = {
          type: 'seasonal',
          urgency: 'low',
          title: 'Spring Season',
          description: `Temperature ${Math.round(temp)}°F - Spring preparation opportunities`,
          impact_score: 40,
          suggested_actions: [
            'Promote spring AC tune-ups before summer',
            'Offer exterior home services (painting, roofing)',
            'Target landscaping and outdoor projects',
            'Send spring cleaning and maintenance reminders'
          ]
        }
      } else {
        // Fall
        seasonalOpp = {
          type: 'seasonal',
          urgency: 'low',
          title: 'Fall Season',
          description: `Temperature ${Math.round(temp)}°F - Fall preparation opportunities`,
          impact_score: 40,
          suggested_actions: [
            'Promote heating system tune-ups before winter',
            'Offer winterization and insulation',
            'Target gutter cleaning and exterior prep',
            'Send fall maintenance reminders'
          ]
        }
      }

      opportunities.push(seasonalOpp)
    }

    console.log(`[WeatherAPI] 🌤️ Detected ${opportunities.length} weather opportunities for ${location}`)
    return opportunities
  }
}

export const WeatherAPI = new WeatherAPIService()
export type { WeatherData, ForecastDay, WeatherOpportunity }
