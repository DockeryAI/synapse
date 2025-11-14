import { WeatherAlert, OpportunityInsight } from '@/types/intelligence.types'
import { supabase } from '@/lib/supabase'

/**
 * Weather Alerts Service
 * Detects weather-based marketing opportunities
 * Integrates with weather APIs (OpenWeatherMap, WeatherAPI, etc.)
 */

interface WeatherConfig {
  brandId: string
  location: string
  industry: string
  zipCode?: string
  latitude?: number
  longitude?: number
}

interface WeatherAPIResponse {
  current: {
    temp_f: number
    condition: {
      text: string
      code: number
    }
    precip_in: number
  }
  forecast: {
    forecastday: Array<{
      date: string
      day: {
        maxtemp_f: number
        mintemp_f: number
        condition: {
          text: string
        }
        daily_chance_of_rain: number
        daily_chance_of_snow: number
      }
    }>
  }
}

export class WeatherAlertsService {
  private static readonly WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || ''
  private static readonly CACHE_TTL_MINUTES = 30

  /**
   * Detect weather-based opportunities for a brand
   */
  static async detectWeatherOpportunities(
    config: WeatherConfig
  ): Promise<OpportunityInsight[]> {
    const opportunities: OpportunityInsight[] = []

    try {
      // Get weather data
      const weatherData = await this.fetchWeatherData(config)
      if (!weatherData) return opportunities

      // Analyze current conditions
      const currentOpps = this.analyzeCurrentConditions(
        weatherData.current,
        config
      )
      opportunities.push(...currentOpps)

      // Analyze forecast
      const forecastOpps = this.analyzeForecast(
        weatherData.forecast,
        config
      )
      opportunities.push(...forecastOpps)

      // Save to database
      for (const opp of opportunities) {
        await this.saveOpportunity(opp)
      }

      return opportunities
    } catch (error) {
      console.error('Weather opportunity detection failed:', error)
      return opportunities
    }
  }

  /**
   * Fetch weather data from API
   */
  private static async fetchWeatherData(
    config: WeatherConfig
  ): Promise<WeatherAPIResponse | null> {
    // Check for API key
    if (!this.WEATHER_API_KEY) {
      throw new Error(
        'Weather API key not configured. Add VITE_WEATHER_API_KEY to your .env file. ' +
        'Get a free API key from https://www.weatherapi.com/'
      )
    }

    // Check cache first
    const cached = await this.getCachedWeather(config.location)
    if (cached) return cached

    try {
      // Call OpenWeatherMap API (5 day forecast)
      let query = config.zipCode || config.location

      // OpenWeather doesn't like "City, State" format - just use city name
      if (query.includes(',')) {
        query = query.split(',')[0].trim()
      }

      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(query)}&appid=${this.WEATHER_API_KEY}&units=imperial&cnt=40`

      console.log('[WeatherAlerts] Fetching from OpenWeather:', query)

      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[WeatherAlerts] OpenWeather error:', errorData)
        throw new Error(
          `OpenWeather API error (${response.status}): ${errorData.message || response.statusText}`
        )
      }

      const data = await response.json()

      // Transform OpenWeather response to our format
      const transformedData = {
        current: {
          temp_f: data.list[0].main.temp,
          condition: {
            text: data.list[0].weather[0].description,
            code: data.list[0].weather[0].id
          },
          precip_in: data.list[0].rain?.['3h'] ? data.list[0].rain['3h'] / 25.4 : 0
        },
        forecast: {
          forecastday: this.groupByDay(data.list)
        }
      }

      // Cache the result
      await this.cacheWeather(config.location, transformedData)

      return transformedData
    } catch (error) {
      // Re-throw - NO SILENT FAILURES
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`Weather API failed: ${String(error)}`)
    }
  }

  /**
   * Group OpenWeather 3-hour intervals into daily forecasts
   */
  private static groupByDay(list: any[]): any[] {
    const days = new Map()

    list.forEach(item => {
      const date = item.dt_txt.split(' ')[0]
      if (!days.has(date)) {
        days.set(date, {
          date,
          day: {
            maxtemp_f: item.main.temp_max,
            mintemp_f: item.main.temp_min,
            condition: {
              text: item.weather[0].description,
              code: item.weather[0].id
            },
            totalprecip_in: item.rain?.['3h'] ? item.rain['3h'] / 25.4 : 0
          }
        })
      } else {
        const existing = days.get(date)
        existing.day.maxtemp_f = Math.max(existing.day.maxtemp_f, item.main.temp_max)
        existing.day.mintemp_f = Math.min(existing.day.mintemp_f, item.main.temp_min)
        existing.day.totalprecip_in += item.rain?.['3h'] ? item.rain['3h'] / 25.4 : 0
      }
    })

    return Array.from(days.values())
  }

  /**
   * Analyze current weather conditions
   */
  private static analyzeCurrentConditions(
    current: WeatherAPIResponse['current'],
    config: WeatherConfig
  ): OpportunityInsight[] {
    const opportunities: OpportunityInsight[] = []
    const temp = current.temp_f
    const condition = current.condition.text.toLowerCase()

    // Heat wave detection
    if (temp >= 90 && this.isHeatSensitiveIndustry(config.industry)) {
      opportunities.push({
        id: `weather_heat_${Date.now()}`,
        brand_id: config.brandId,
        type: 'weather_based',
        title: `Heat Wave Alert: ${temp}°F - High Demand Expected`,
        description: `Current temperature is ${temp}°F. Historical data shows significant increase in demand during heat waves for ${config.industry} businesses.`,
        source: 'weather_api',
        source_data: {
          temperature: temp,
          condition: condition,
          forecast_days: 1,
        },
        impact_score: 85,
        urgency: 'high',
        confidence: 0.9,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'new',
        suggested_actions: [
          {
            action_type: 'create_content',
            description: 'Create urgency-based heat relief promotion',
            priority: 'high',
            estimated_effort: 'low',
            potential_impact: 85,
            content_suggestions: this.getHeatContentSuggestions(config.industry),
          },
          {
            action_type: 'adjust_budget',
            description: 'Increase ad spend by 30-50% during heat wave',
            priority: 'high',
            estimated_effort: 'low',
            potential_impact: 70,
          },
        ],
        created_at: new Date().toISOString(),
      })
    }

    // Cold snap detection
    if (temp <= 32 && this.isColdSensitiveIndustry(config.industry)) {
      opportunities.push({
        id: `weather_cold_${Date.now()}`,
        brand_id: config.brandId,
        type: 'weather_based',
        title: `Freezing Temperatures: ${temp}°F - Service Peak`,
        description: `Temperature has dropped to ${temp}°F. Expect increased demand for heating services and winterization.`,
        source: 'weather_api',
        source_data: {
          temperature: temp,
          condition: condition,
          forecast_days: 1,
        },
        impact_score: 80,
        urgency: 'high',
        confidence: 0.88,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'new',
        suggested_actions: [
          {
            action_type: 'create_content',
            description: 'Create cold weather emergency service promotion',
            priority: 'high',
            estimated_effort: 'low',
            potential_impact: 80,
            content_suggestions: this.getColdContentSuggestions(config.industry),
          },
        ],
        created_at: new Date().toISOString(),
      })
    }

    // Rain detection
    if (
      (condition.includes('rain') || current.precip_in > 0) &&
      this.isRainSensitiveIndustry(config.industry)
    ) {
      opportunities.push({
        id: `weather_rain_${Date.now()}`,
        brand_id: config.brandId,
        type: 'weather_based',
        title: 'Rainy Conditions - Timing-Sensitive Opportunity',
        description: `Current rain conditions create urgency for ${config.industry} services. Searches typically spike 300% during and after rain.`,
        source: 'weather_api',
        source_data: {
          condition: condition,
          precipitation: current.precip_in,
        },
        impact_score: 75,
        urgency: 'medium',
        confidence: 0.85,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        status: 'new',
        suggested_actions: [
          {
            action_type: 'create_content',
            description: 'Create rain-related service promotion',
            priority: 'high',
            estimated_effort: 'low',
            potential_impact: 75,
            content_suggestions: this.getRainContentSuggestions(config.industry),
          },
        ],
        created_at: new Date().toISOString(),
      })
    }

    return opportunities
  }

  /**
   * Analyze weather forecast
   */
  private static analyzeForecast(
    forecast: WeatherAPIResponse['forecast'],
    config: WeatherConfig
  ): OpportunityInsight[] {
    const opportunities: OpportunityInsight[] = []
    const days = forecast.forecastday

    // Count consecutive hot days
    const hotDays = days.filter((day) => day.day.maxtemp_f >= 90).length
    if (hotDays >= 3 && this.isHeatSensitiveIndustry(config.industry)) {
      opportunities.push({
        id: `weather_heatwave_${Date.now()}`,
        brand_id: config.brandId,
        type: 'weather_based',
        title: `${hotDays}-Day Heat Wave Forecast`,
        description: `Forecast shows ${hotDays} consecutive days above 90°F. Plan content and capacity accordingly.`,
        source: 'weather_api',
        source_data: {
          hot_days: hotDays,
          max_temp: Math.max(...days.map((d) => d.day.maxtemp_f)),
        },
        impact_score: 90,
        urgency: 'critical',
        confidence: 0.92,
        expires_at: new Date(
          Date.now() + hotDays * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: 'new',
        suggested_actions: [
          {
            action_type: 'create_content',
            description: 'Create extended heat wave campaign',
            priority: 'critical',
            estimated_effort: 'medium',
            potential_impact: 90,
            content_suggestions: [
              `"${hotDays}-Day Heat Wave Coming - Book Service Now"`,
              '"Beat the Rush - Schedule Your Appointment Today"',
              '"Extended Forecast Alert: Prepare for the Heat"',
            ],
          },
        ],
        created_at: new Date().toISOString(),
      })
    }

    // Count rainy days
    const rainyDays = days.filter((day) => day.day.daily_chance_of_rain >= 60).length
    if (rainyDays >= 3 && this.isRainSensitiveIndustry(config.industry)) {
      opportunities.push({
        id: `weather_rain_forecast_${Date.now()}`,
        brand_id: config.brandId,
        type: 'weather_based',
        title: `Heavy Rain Expected: ${rainyDays} Days`,
        description: `Forecast shows ${rainyDays} days of likely rain. Preemptive service promotion recommended.`,
        source: 'weather_api',
        source_data: {
          rainy_days: rainyDays,
        },
        impact_score: 70,
        urgency: 'medium',
        confidence: 0.82,
        expires_at: new Date(
          Date.now() + rainyDays * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: 'new',
        suggested_actions: [
          {
            action_type: 'create_content',
            description: 'Create preventative service promotion',
            priority: 'medium',
            estimated_effort: 'low',
            potential_impact: 70,
            content_suggestions: this.getRainForecastSuggestions(config.industry),
          },
        ],
        created_at: new Date().toISOString(),
      })
    }

    return opportunities
  }

  /**
   * Industry sensitivity checks
   */
  private static isHeatSensitiveIndustry(industry: string): boolean {
    const sensitive = ['hvac', 'cooling', 'air conditioning', 'pool', 'ice cream', 'beverage']
    return sensitive.some((keyword) => industry.toLowerCase().includes(keyword))
  }

  private static isColdSensitiveIndustry(industry: string): boolean {
    const sensitive = ['heating', 'hvac', 'plumbing', 'winterization', 'insulation']
    return sensitive.some((keyword) => industry.toLowerCase().includes(keyword))
  }

  private static isRainSensitiveIndustry(industry: string): boolean {
    const sensitive = ['roofing', 'gutter', 'waterproofing', 'drainage', 'umbrella', 'indoor']
    return sensitive.some((keyword) => industry.toLowerCase().includes(keyword))
  }

  /**
   * Content suggestions by industry
   */
  private static getHeatContentSuggestions(industry: string): string[] {
    if (industry.toLowerCase().includes('hvac') || industry.toLowerCase().includes('cooling')) {
      return [
        '"Emergency AC Service Available Today - Beat the Heat"',
        '"Is Your AC Ready? Free Inspection During Heat Wave"',
        '"Stay Cool: 24/7 Emergency Cooling Service"',
      ]
    }
    return [
      '"Beat the Heat: Special Summer Offer"',
      '"Hot Weather Alert: We\'re Here to Help"',
      '"Cool Down with Our Summer Specials"',
    ]
  }

  private static getColdContentSuggestions(industry: string): string[] {
    if (industry.toLowerCase().includes('heating') || industry.toLowerCase().includes('hvac')) {
      return [
        '"Freezing Tonight? Emergency Heating Service Available"',
        '"Don\'t Let Your Pipes Freeze - Call Now"',
        '"Stay Warm: 24/7 Heating Repair Service"',
      ]
    }
    return [
      '"Cold Snap Alert: Winterization Services Available"',
      '"Protect Your Home from Freezing Temperatures"',
      '"Stay Warm & Safe - Our Services Can Help"',
    ]
  }

  private static getRainContentSuggestions(industry: string): string[] {
    if (industry.toLowerCase().includes('roofing')) {
      return [
        '"Rain Expected - Free Roof Inspection Today"',
        '"Don\'t Wait for a Leak - Get Ahead of the Storm"',
        '"Rainy Season Roof Check - Book Now"',
      ]
    }
    if (industry.toLowerCase().includes('gutter')) {
      return [
        '"Heavy Rain Coming - Is Your Gutter System Ready?"',
        '"Prevent Water Damage: Gutter Cleaning Before the Rain"',
        '"Rain Forecast Alert: Protect Your Home"',
      ]
    }
    return [
      '"Rainy Day Special Offer"',
      '"Bad Weather? Great Time to Plan Ahead"',
      '"Rain or Shine, We\'re Here to Help"',
    ]
  }

  private static getRainForecastSuggestions(industry: string): string[] {
    return [
      '"Extended Rain Forecast - Schedule Preventative Service"',
      '"Prepare for the Rain: Book Service This Week"',
      '"Stay Ahead of the Weather - Call Today"',
    ]
  }

  /**
   * NO MOCK DATA - removed to enforce real API usage
   * If weather data is needed, configure VITE_WEATHER_API_KEY
   */

  /**
   * Cache management
   */
  private static async getCachedWeather(
    location: string
  ): Promise<WeatherAPIResponse | null> {
    try {
      const cacheKey = `weather_${location}`
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return null

      const data = JSON.parse(cached)
      const cacheTime = new Date(data.cached_at).getTime()
      const now = Date.now()
      const ttl = this.CACHE_TTL_MINUTES * 60 * 1000

      if (now - cacheTime > ttl) {
        localStorage.removeItem(cacheKey)
        return null
      }

      return data.weather
    } catch {
      return null
    }
  }

  private static async cacheWeather(
    location: string,
    weather: WeatherAPIResponse
  ): Promise<void> {
    try {
      const cacheKey = `weather_${location}`
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          weather,
          cached_at: new Date().toISOString(),
        })
      )
    } catch (error) {
      console.error('Failed to cache weather:', error)
    }
  }

  /**
   * Database operations
   */
  private static async saveOpportunity(
    opportunity: OpportunityInsight
  ): Promise<void> {
    try {
      await supabase.from('intelligence_opportunities').insert(opportunity)
    } catch (error) {
      console.error('Failed to save weather opportunity:', error)
    }
  }
}
