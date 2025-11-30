/**
 * Weather API Service 2.0
 *
 * Enhanced weather intelligence for SMB content marketing:
 * - Regional baseline comparison (what's "hot" varies by region)
 * - Forecast-based proactive content ("Storm coming in 3 days")
 * - 20+ industry mappings with specific triggers
 * - UVP-aware opportunity detection
 * - Emotional weather targeting
 *
 * Research: Weather affects $3T of US business, with 320% higher engagement
 * for weather-informed campaigns.
 *
 * SECURITY: All API calls routed through fetch-weather Edge Function
 * No API keys exposed in browser code
 *
 * Updated: 2025-11-29 - Weather 2.0 enhancements
 */

const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

// ============================================================================
// TYPES
// ============================================================================

export interface WeatherData {
  temperature: number
  feels_like: number
  condition: string
  description: string
  humidity: number
  wind_speed: number
  location?: string
  forecast: ForecastDay[]
}

export interface ForecastDay {
  date: string
  temp_max: number
  temp_min: number
  condition: string
  precipitation_chance: number
}

export type WeatherOpportunityType =
  | 'heat_wave'
  | 'cold_snap'
  | 'storm'
  | 'precipitation'
  | 'seasonal'
  | 'forecast_alert'    // New: upcoming weather event
  | 'weather_window'    // New: good conditions ahead
  | 'deviation'         // New: temp significantly above/below normal

export type OpportunityUrgency = 'critical' | 'high' | 'medium' | 'low'

export interface WeatherOpportunity {
  type: WeatherOpportunityType
  urgency: OpportunityUrgency
  title: string
  description: string
  impact_score: number
  suggested_actions: string[]
  /** Days until event (for forecast-based opportunities) */
  days_until?: number
  /** Temperature deviation from normal */
  deviation?: number
  /** Emotional context for content */
  emotional_context?: 'hopeful' | 'anxious' | 'comfort-seeking' | 'energized' | 'protective'
  /** Industry-specific flag */
  industry_match?: boolean
  /** UVP pain point connection */
  uvp_pain_point?: string
  /** UVP-aware content angle */
  uvp_content_angle?: string
  /** EQ adjustment suggestion */
  eq_adjustment?: { emotion: string; modifier: number; reason: string }
  /** Consecutive day tracking */
  consecutive_days?: number
}

// ============================================================================
// UVP PAIN POINT MAPPINGS
// ============================================================================

export interface UVPWeatherMapping {
  weatherCondition: WeatherOpportunityType
  painPointKeywords: string[]
  contentAngles: string[]
}

const UVP_WEATHER_MAPPINGS: UVPWeatherMapping[] = [
  {
    weatherCondition: 'heat_wave',
    painPointKeywords: ['comfort', 'worry', 'stress', 'reliable', 'peace of mind', 'emergency', 'breakdown'],
    contentAngles: [
      'Stop worrying about {pain_point} - we handle it',
      'Peace of mind when it matters most',
      'Reliable service when you need it',
      "Don't let the heat add to your stress"
    ]
  },
  {
    weatherCondition: 'cold_snap',
    painPointKeywords: ['safety', 'protect', 'family', 'home', 'damage', 'prevention', 'emergency'],
    contentAngles: [
      'Protect your {pain_point} from the cold',
      'Keep your family safe and warm',
      'Prevent costly damage before it happens',
      'Emergency service when you need it most'
    ]
  },
  {
    weatherCondition: 'storm',
    painPointKeywords: ['damage', 'insurance', 'repair', 'emergency', 'fast', 'reliable', 'trust'],
    contentAngles: [
      'Fast response when storms hit',
      'Trusted partner for storm recovery',
      "We're here when disaster strikes",
      'Reliable service you can count on'
    ]
  },
  {
    weatherCondition: 'precipitation',
    painPointKeywords: ['convenience', 'time', 'hassle', 'easy', 'simple', 'delivery'],
    contentAngles: [
      'Skip the hassle - let us handle it',
      'Convenience when weather keeps you inside',
      'Easy solutions for rainy days',
      'We come to you'
    ]
  },
  {
    weatherCondition: 'seasonal',
    painPointKeywords: ['preparation', 'planning', 'ahead', 'proactive', 'maintenance', 'prevent'],
    contentAngles: [
      'Get ahead of the season',
      'Proactive {pain_point} saves money',
      'Plan now, relax later',
      'Seasonal preparation experts'
    ]
  },
  {
    weatherCondition: 'forecast_alert',
    painPointKeywords: ['prepare', 'ready', 'ahead', 'plan', 'prevent', 'avoid'],
    contentAngles: [
      'Weather coming - are you prepared?',
      'Get ready before it hits',
      'Avoid the rush - book now',
      'Smart preparation saves stress'
    ]
  },
  {
    weatherCondition: 'deviation',
    painPointKeywords: ['unusual', 'unexpected', 'surprise', 'adapt', 'flexible'],
    contentAngles: [
      'Unusual weather? We adapt.',
      'Ready for whatever weather brings',
      'Flexible service for changing conditions',
      'Prepared for the unexpected'
    ]
  }
]

// ============================================================================
// EQ-WEATHER FUSION
// ============================================================================

export interface EQWeatherAdjustment {
  weather: string
  emotionalState: string
  eqAdjustments: {
    emotion: string
    modifier: number
    reason: string
  }[]
}

const EQ_WEATHER_ADJUSTMENTS: EQWeatherAdjustment[] = [
  {
    weather: 'sunny_warm',
    emotionalState: 'hopeful',
    eqAdjustments: [
      { emotion: 'joy', modifier: 1.2, reason: 'Good weather increases positive affect' },
      { emotion: 'anticipation', modifier: 1.3, reason: 'People plan ahead in nice weather' },
      { emotion: 'trust', modifier: 1.1, reason: 'Optimism increases openness' }
    ]
  },
  {
    weather: 'rainy',
    emotionalState: 'comfort-seeking',
    eqAdjustments: [
      { emotion: 'sadness', modifier: 1.15, reason: 'Rain can trigger melancholy' },
      { emotion: 'trust', modifier: 1.2, reason: 'People seek reliable comfort' },
      { emotion: 'anticipation', modifier: 0.9, reason: 'Less planning, more nesting' }
    ]
  },
  {
    weather: 'stormy',
    emotionalState: 'anxious',
    eqAdjustments: [
      { emotion: 'fear', modifier: 1.3, reason: 'Storm anxiety increases' },
      { emotion: 'trust', modifier: 1.4, reason: 'People seek reliable help' },
      { emotion: 'anticipation', modifier: 1.2, reason: 'Preparation urgency' }
    ]
  },
  {
    weather: 'cold',
    emotionalState: 'protective',
    eqAdjustments: [
      { emotion: 'fear', modifier: 1.2, reason: 'Cold triggers protection instinct' },
      { emotion: 'trust', modifier: 1.3, reason: 'Need reliable warmth solutions' },
      { emotion: 'sadness', modifier: 1.1, reason: 'Winter blues effect' }
    ]
  },
  {
    weather: 'first_nice_day',
    emotionalState: 'energized',
    eqAdjustments: [
      { emotion: 'joy', modifier: 1.4, reason: 'Seasonal relief euphoria' },
      { emotion: 'anticipation', modifier: 1.5, reason: 'Excited to get things done' },
      { emotion: 'surprise', modifier: 1.2, reason: 'Positive unexpected weather' }
    ]
  }
]

// ============================================================================
// HISTORICAL WEATHER TRACKING
// ============================================================================

interface ConsecutiveDayTracker {
  condition: string
  days: number
  lastDate: string
}

const CONSECUTIVE_DAY_TRIGGERS: Record<string, { days: number; industry: string; trigger: string; urgency: OpportunityUrgency }[]> = {
  freezing: [
    { days: 3, industry: 'auto_service', trigger: 'Battery failure risk increases significantly', urgency: 'high' },
    { days: 2, industry: 'plumbing', trigger: 'Pipe freeze risk critical', urgency: 'critical' },
    { days: 3, industry: 'hvac', trigger: 'Heating system under continuous strain', urgency: 'high' }
  ],
  hot_90plus: [
    { days: 2, industry: 'hvac', trigger: 'AC breakdown risk elevated', urgency: 'high' },
    { days: 3, industry: 'landscaping', trigger: 'Lawn damage likely without irrigation', urgency: 'medium' },
    { days: 2, industry: 'pool_spa', trigger: 'Pool chemical balance critical', urgency: 'medium' }
  ],
  rainy: [
    { days: 3, industry: 'roofing', trigger: 'Leak detection opportunities peak', urgency: 'medium' },
    { days: 4, industry: 'pest_control', trigger: 'Moisture pest activity increases', urgency: 'medium' },
    { days: 2, industry: 'food_delivery', trigger: 'Delivery demand sustained high', urgency: 'low' }
  ]
}

// Local storage key for tracking consecutive days
const CONSECUTIVE_TRACKER_KEY = 'weather_consecutive_tracker'

function loadConsecutiveTracker(): ConsecutiveDayTracker[] {
  try {
    const stored = localStorage.getItem(CONSECUTIVE_TRACKER_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveConsecutiveTracker(tracker: ConsecutiveDayTracker[]): void {
  try {
    localStorage.setItem(CONSECUTIVE_TRACKER_KEY, JSON.stringify(tracker))
  } catch {
    // Ignore storage errors
  }
}

function updateConsecutiveTracker(condition: string): number {
  const today = new Date().toISOString().split('T')[0]
  const trackers = loadConsecutiveTracker()

  const existing = trackers.find(t => t.condition === condition)

  if (existing) {
    const lastDate = new Date(existing.lastDate)
    const todayDate = new Date(today)
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 1) {
      existing.days += diffDays === 1 ? 1 : 0
      existing.lastDate = today
    } else {
      existing.days = 1
      existing.lastDate = today
    }
  } else {
    trackers.push({ condition, days: 1, lastDate: today })
  }

  saveConsecutiveTracker(trackers)
  return trackers.find(t => t.condition === condition)?.days || 1
}

// ============================================================================
// REGIONAL TEMPERATURE BASELINES (US regions, monthly averages)
// ============================================================================

interface RegionalBaseline {
  avgHigh: number
  avgLow: number
}

// Simplified US regional baselines by month (1-12)
// Based on typical temperatures for representative cities
const REGIONAL_BASELINES: Record<string, Record<number, RegionalBaseline>> = {
  // Northeast (NYC area)
  northeast: {
    1: { avgHigh: 39, avgLow: 26 },
    2: { avgHigh: 42, avgLow: 28 },
    3: { avgHigh: 51, avgLow: 35 },
    4: { avgHigh: 63, avgLow: 45 },
    5: { avgHigh: 72, avgLow: 55 },
    6: { avgHigh: 81, avgLow: 64 },
    7: { avgHigh: 85, avgLow: 69 },
    8: { avgHigh: 84, avgLow: 68 },
    9: { avgHigh: 76, avgLow: 60 },
    10: { avgHigh: 65, avgLow: 49 },
    11: { avgHigh: 54, avgLow: 41 },
    12: { avgHigh: 43, avgLow: 31 }
  },
  // Southeast (Atlanta area)
  southeast: {
    1: { avgHigh: 52, avgLow: 34 },
    2: { avgHigh: 57, avgLow: 37 },
    3: { avgHigh: 65, avgLow: 44 },
    4: { avgHigh: 73, avgLow: 52 },
    5: { avgHigh: 80, avgLow: 61 },
    6: { avgHigh: 87, avgLow: 69 },
    7: { avgHigh: 90, avgLow: 72 },
    8: { avgHigh: 89, avgLow: 71 },
    9: { avgHigh: 83, avgLow: 65 },
    10: { avgHigh: 73, avgLow: 54 },
    11: { avgHigh: 63, avgLow: 44 },
    12: { avgHigh: 54, avgLow: 36 }
  },
  // Midwest (Chicago area)
  midwest: {
    1: { avgHigh: 32, avgLow: 18 },
    2: { avgHigh: 36, avgLow: 21 },
    3: { avgHigh: 47, avgLow: 31 },
    4: { avgHigh: 59, avgLow: 41 },
    5: { avgHigh: 70, avgLow: 51 },
    6: { avgHigh: 80, avgLow: 61 },
    7: { avgHigh: 84, avgLow: 66 },
    8: { avgHigh: 82, avgLow: 65 },
    9: { avgHigh: 75, avgLow: 56 },
    10: { avgHigh: 62, avgLow: 45 },
    11: { avgHigh: 48, avgLow: 34 },
    12: { avgHigh: 35, avgLow: 22 }
  },
  // Southwest (Phoenix area)
  southwest: {
    1: { avgHigh: 67, avgLow: 45 },
    2: { avgHigh: 71, avgLow: 48 },
    3: { avgHigh: 77, avgLow: 53 },
    4: { avgHigh: 85, avgLow: 60 },
    5: { avgHigh: 94, avgLow: 69 },
    6: { avgHigh: 104, avgLow: 78 },
    7: { avgHigh: 106, avgLow: 84 },
    8: { avgHigh: 104, avgLow: 83 },
    9: { avgHigh: 99, avgLow: 76 },
    10: { avgHigh: 88, avgLow: 64 },
    11: { avgHigh: 75, avgLow: 52 },
    12: { avgHigh: 66, avgLow: 44 }
  },
  // West Coast (LA area)
  westcoast: {
    1: { avgHigh: 68, avgLow: 49 },
    2: { avgHigh: 68, avgLow: 50 },
    3: { avgHigh: 69, avgLow: 52 },
    4: { avgHigh: 72, avgLow: 55 },
    5: { avgHigh: 74, avgLow: 58 },
    6: { avgHigh: 78, avgLow: 62 },
    7: { avgHigh: 84, avgLow: 66 },
    8: { avgHigh: 85, avgLow: 67 },
    9: { avgHigh: 83, avgLow: 65 },
    10: { avgHigh: 78, avgLow: 60 },
    11: { avgHigh: 72, avgLow: 53 },
    12: { avgHigh: 67, avgLow: 48 }
  },
  // Pacific Northwest (Seattle area)
  northwest: {
    1: { avgHigh: 47, avgLow: 36 },
    2: { avgHigh: 50, avgLow: 37 },
    3: { avgHigh: 54, avgLow: 39 },
    4: { avgHigh: 59, avgLow: 43 },
    5: { avgHigh: 65, avgLow: 48 },
    6: { avgHigh: 70, avgLow: 53 },
    7: { avgHigh: 76, avgLow: 57 },
    8: { avgHigh: 77, avgLow: 57 },
    9: { avgHigh: 71, avgLow: 53 },
    10: { avgHigh: 60, avgLow: 46 },
    11: { avgHigh: 51, avgLow: 40 },
    12: { avgHigh: 45, avgLow: 35 }
  },
  // Texas (Dallas area)
  texas: {
    1: { avgHigh: 56, avgLow: 36 },
    2: { avgHigh: 60, avgLow: 40 },
    3: { avgHigh: 68, avgLow: 48 },
    4: { avgHigh: 76, avgLow: 56 },
    5: { avgHigh: 84, avgLow: 65 },
    6: { avgHigh: 92, avgLow: 73 },
    7: { avgHigh: 96, avgLow: 77 },
    8: { avgHigh: 96, avgLow: 76 },
    9: { avgHigh: 89, avgLow: 69 },
    10: { avgHigh: 78, avgLow: 58 },
    11: { avgHigh: 66, avgLow: 47 },
    12: { avgHigh: 57, avgLow: 38 }
  },
  // Default (use midwest as baseline)
  default: {
    1: { avgHigh: 35, avgLow: 20 },
    2: { avgHigh: 40, avgLow: 24 },
    3: { avgHigh: 50, avgLow: 33 },
    4: { avgHigh: 62, avgLow: 43 },
    5: { avgHigh: 72, avgLow: 53 },
    6: { avgHigh: 81, avgLow: 62 },
    7: { avgHigh: 85, avgLow: 67 },
    8: { avgHigh: 83, avgLow: 65 },
    9: { avgHigh: 76, avgLow: 57 },
    10: { avgHigh: 64, avgLow: 46 },
    11: { avgHigh: 50, avgLow: 36 },
    12: { avgHigh: 38, avgLow: 24 }
  }
}

// ============================================================================
// INDUSTRY TRIGGERS (20+ industries)
// ============================================================================

interface IndustryTrigger {
  keywords: string[]
  heatTriggers: {
    threshold: number
    opportunities: string[]
  }
  coldTriggers: {
    threshold: number
    opportunities: string[]
  }
  rainTriggers: string[]
  snowTriggers: string[]
  moodOpportunities: Record<string, string[]>
}

const INDUSTRY_TRIGGERS: Record<string, IndustryTrigger> = {
  hvac: {
    keywords: ['hvac', 'heating', 'cooling', 'air conditioning', 'ac repair', 'furnace'],
    heatTriggers: {
      threshold: 85,
      opportunities: [
        'Emergency AC repair - same day service',
        'AC tune-up before system fails',
        'Beat the heat - free AC inspection',
        '24/7 cooling emergency service available'
      ]
    },
    coldTriggers: {
      threshold: 40,
      opportunities: [
        'Heating system check before cold snap',
        'Emergency furnace repair available',
        'Protect your family - heating tune-up',
        "Don't get left in the cold"
      ]
    },
    rainTriggers: ['Indoor comfort matters on rainy days', 'Perfect day for HVAC maintenance'],
    snowTriggers: ['Emergency heating available 24/7', 'Keep your family warm this winter'],
    moodOpportunities: {
      anxious: ['Peace of mind with 24/7 emergency service'],
      'comfort-seeking': ['Create the perfect indoor climate']
    }
  },
  roofing: {
    keywords: ['roofing', 'roof', 'roofer', 'shingles', 'roof repair'],
    heatTriggers: {
      threshold: 90,
      opportunities: [
        'Heat damages shingles - free inspection',
        'Check roof before summer storms',
        'UV damage assessment available'
      ]
    },
    coldTriggers: {
      threshold: 32,
      opportunities: [
        'Ice dam prevention inspection',
        'Winter roof damage risk assessment',
        'Protect against freeze-thaw damage'
      ]
    },
    rainTriggers: [
      'Free post-storm roof inspection',
      'Leaking? Emergency tarping available',
      'Check your roof before more rain'
    ],
    snowTriggers: [
      'Snow load assessment - prevent collapse',
      'Ice dam removal services',
      'Post-storm damage inspection'
    ],
    moodOpportunities: {
      protective: ['Protect your biggest investment'],
      anxious: ['Free no-obligation inspection']
    }
  },
  plumbing: {
    keywords: ['plumbing', 'plumber', 'pipes', 'drain', 'water heater'],
    heatTriggers: {
      threshold: 85,
      opportunities: [
        'Hot water heater working harder in summer',
        'Outdoor faucet maintenance',
        'Irrigation system check-up'
      ]
    },
    coldTriggers: {
      threshold: 32,
      opportunities: [
        'Prevent frozen pipes - call now',
        'Emergency pipe thawing service',
        'Winterize your plumbing today',
        'Water heater working overtime'
      ]
    },
    rainTriggers: [
      'Basement flooding prevention',
      'Sump pump inspection',
      'Drain clearing before heavy rain'
    ],
    snowTriggers: [
      'Frozen pipe emergency service',
      'Sump pump backup systems',
      'Protect pipes from freezing'
    ],
    moodOpportunities: {
      anxious: ['24/7 emergency plumbing'],
      protective: ['Prevent costly water damage']
    }
  },
  landscaping: {
    keywords: ['landscaping', 'lawn', 'garden', 'lawn care', 'tree service', 'lawn mowing'],
    heatTriggers: {
      threshold: 85,
      opportunities: [
        'Protect your lawn from heat stress',
        'Irrigation system optimization',
        'Drought-resistant landscaping options',
        'Summer lawn rescue program'
      ]
    },
    coldTriggers: {
      threshold: 45,
      opportunities: [
        'Fall cleanup and winterization',
        'Leaf removal services',
        'Prepare landscape for winter',
        'Tree pruning before winter'
      ]
    },
    rainTriggers: [
      'Drainage solutions for wet yards',
      'Post-rain is perfect for planting',
      'Erosion control services'
    ],
    snowTriggers: [
      'Snow removal services',
      'Salt/sand spreading',
      'Protect plants from snow damage'
    ],
    moodOpportunities: {
      hopeful: ['Transform your outdoor space'],
      energized: ['Perfect weather for landscaping projects']
    }
  },
  restaurant: {
    keywords: ['restaurant', 'dining', 'cafe', 'food', 'catering', 'bar', 'pub'],
    heatTriggers: {
      threshold: 80,
      opportunities: [
        'Cool down with our refreshing menu',
        'Patio is open - enjoy the weather',
        'Beat the heat with cold drinks',
        'Too hot to cook? Order delivery'
      ]
    },
    coldTriggers: {
      threshold: 45,
      opportunities: [
        'Warm up with comfort food specials',
        'Cozy up with our soup menu',
        'Hot drinks to fight the chill',
        'Stay in - order delivery'
      ]
    },
    rainTriggers: [
      'Perfect night for delivery',
      'Rainy day comfort food special',
      'Stay dry - we deliver'
    ],
    snowTriggers: [
      'Snowed in? We deliver',
      'Warm comfort food delivered',
      'Hot meals for cold days'
    ],
    moodOpportunities: {
      'comfort-seeking': ['Cozy comfort food awaits'],
      hopeful: ['Celebrate with great food']
    }
  },
  retail_clothing: {
    keywords: ['clothing', 'apparel', 'fashion', 'boutique', 'shoes', 'accessories'],
    heatTriggers: {
      threshold: 80,
      opportunities: [
        'Summer styles are here',
        'Stay cool in our new collection',
        'Beach-ready looks',
        'Lightweight summer essentials'
      ]
    },
    coldTriggers: {
      threshold: 50,
      opportunities: [
        'Cozy layers for cold days',
        'Winter collection now available',
        'Bundle up in style',
        'Cold weather essentials'
      ]
    },
    rainTriggers: [
      'Rainy day shopping from home',
      'Waterproof styles available',
      'Perfect weather for online shopping'
    ],
    snowTriggers: [
      'Winter wonderland looks',
      'Snow boots and warm gear',
      'Cozy indoor shopping'
    ],
    moodOpportunities: {
      'comfort-seeking': ['Retail therapy for rainy days'],
      hopeful: ['New season, new looks']
    }
  },
  auto_service: {
    keywords: ['auto', 'car', 'mechanic', 'auto repair', 'tire', 'oil change', 'automotive'],
    heatTriggers: {
      threshold: 85,
      opportunities: [
        'AC system check before summer trips',
        'Coolant system inspection',
        'Hot weather battery check',
        'Tire pressure check (heat affects PSI)'
      ]
    },
    coldTriggers: {
      threshold: 40,
      opportunities: [
        'Battery test before cold weather',
        'Winter tire swap available',
        'Cold weather car prep',
        'Antifreeze check'
      ]
    },
    rainTriggers: [
      'Wiper blade replacement',
      'Brake inspection for wet roads',
      'Tire tread check for traction'
    ],
    snowTriggers: [
      'Snow tire installation',
      '4WD/AWD system check',
      'Winter emergency kit'
    ],
    moodOpportunities: {
      protective: ['Be prepared for any weather'],
      anxious: ['Safety first - get inspected']
    }
  },
  pool_spa: {
    keywords: ['pool', 'spa', 'hot tub', 'swimming', 'pool service', 'pool cleaning'],
    heatTriggers: {
      threshold: 80,
      opportunities: [
        'Pool season is here',
        'Beat the heat - pool ready?',
        'Hot tub too warm? We can help',
        'Pool party weather - is yours ready?'
      ]
    },
    coldTriggers: {
      threshold: 55,
      opportunities: [
        'Pool winterization services',
        'Hot tub - perfect for cold nights',
        'Close your pool properly',
        'Spa maintenance for fall'
      ]
    },
    rainTriggers: [
      'Chemical balance after rain',
      'Debris removal service',
      'Water level management'
    ],
    snowTriggers: [
      'Winter pool cover check',
      'Hot tub perfect for snowy nights',
      'Freeze protection service'
    ],
    moodOpportunities: {
      energized: ['Perfect pool weather'],
      'comfort-seeking': ['Relax in the hot tub']
    }
  },
  pest_control: {
    keywords: ['pest', 'exterminator', 'pest control', 'termite', 'bug', 'rodent'],
    heatTriggers: {
      threshold: 75,
      opportunities: [
        'Bugs are active - prevention time',
        'Mosquito season treatment',
        'Ant invasion prevention',
        'Summer pest control package'
      ]
    },
    coldTriggers: {
      threshold: 45,
      opportunities: [
        'Rodents seeking warmth - seal entry points',
        'Fall pest prevention',
        'Winterize against pests',
        'Mice and rats look for shelter'
      ]
    },
    rainTriggers: [
      'Rain brings bugs indoors',
      'Mosquito breeding prevention',
      'Moisture pest treatment'
    ],
    snowTriggers: [
      'Rodent winter invasion prevention',
      'Seal your home against pests',
      'Indoor pest monitoring'
    ],
    moodOpportunities: {
      protective: ['Protect your family from pests'],
      anxious: ['Fast response pest control']
    }
  },
  insurance: {
    keywords: ['insurance', 'coverage', 'policy', 'claims', 'agent'],
    heatTriggers: {
      threshold: 90,
      opportunities: [
        'Heat wave damage coverage review',
        'Is your AC covered if it fails?',
        'Summer liability review'
      ]
    },
    coldTriggers: {
      threshold: 32,
      opportunities: [
        'Frozen pipe coverage check',
        'Winter storm preparation',
        'Ice damage policy review'
      ]
    },
    rainTriggers: [
      'Flood insurance review',
      'Water damage coverage check',
      'Storm damage preparedness'
    ],
    snowTriggers: [
      'Winter storm coverage review',
      'Snow damage protection',
      'Liability coverage for icy conditions'
    ],
    moodOpportunities: {
      protective: ['Peace of mind before the storm'],
      anxious: ['Are you properly covered?']
    }
  },
  fitness: {
    keywords: ['gym', 'fitness', 'workout', 'personal training', 'yoga', 'crossfit'],
    heatTriggers: {
      threshold: 85,
      opportunities: [
        'Beat the heat - train indoors',
        'Air-conditioned gym comfort',
        'Too hot to run outside?',
        'Summer body goals'
      ]
    },
    coldTriggers: {
      threshold: 40,
      opportunities: [
        'Skip the cold - warm gym waiting',
        'Indoor training season',
        'New year fitness goals',
        'Stay active through winter'
      ]
    },
    rainTriggers: [
      'Rainy day workout',
      'Indoor cardio alternatives',
      'Perfect gym weather'
    ],
    snowTriggers: [
      'Snow day = gym day',
      'Indoor fitness beats the cold',
      'Winter wellness program'
    ],
    moodOpportunities: {
      energized: ['Channel that energy at the gym'],
      'comfort-seeking': ['Warm up with a workout']
    }
  },
  home_improvement: {
    keywords: ['home improvement', 'contractor', 'remodeling', 'renovation', 'handyman', 'painting'],
    heatTriggers: {
      threshold: 75,
      opportunities: [
        'Perfect weather for exterior painting',
        'Deck staining season',
        'Outdoor project weather',
        'Summer renovation specials'
      ]
    },
    coldTriggers: {
      threshold: 50,
      opportunities: [
        'Indoor renovation season',
        'Insulation upgrade time',
        'Window replacement for efficiency',
        'Basement finishing projects'
      ]
    },
    rainTriggers: [
      'Indoor projects while it rains',
      'Basement waterproofing',
      'Plan your renovation'
    ],
    snowTriggers: [
      'Indoor remodeling season',
      'Plan spring projects now',
      'Cabinet and kitchen updates'
    ],
    moodOpportunities: {
      hopeful: ['Transform your space'],
      'comfort-seeking': ['Create your dream home']
    }
  },
  cleaning_service: {
    keywords: ['cleaning', 'maid service', 'house cleaning', 'janitorial', 'carpet cleaning'],
    heatTriggers: {
      threshold: 80,
      opportunities: [
        'Summer deep clean specials',
        'AC vent cleaning for efficiency',
        'Allergy season cleaning'
      ]
    },
    coldTriggers: {
      threshold: 45,
      opportunities: [
        'Fall deep cleaning',
        'Holiday prep cleaning',
        'Winter indoor air quality'
      ]
    },
    rainTriggers: [
      'Muddy floors? We can help',
      'Post-rain cleanup service',
      'Rainy day indoor cleaning'
    ],
    snowTriggers: [
      'Salt and slush cleanup',
      'Winter floor protection',
      'Holiday cleaning specials'
    ],
    moodOpportunities: {
      'comfort-seeking': ['Come home to clean'],
      hopeful: ['Fresh start with a clean home']
    }
  },
  real_estate: {
    keywords: ['real estate', 'realtor', 'homes for sale', 'property', 'house hunting'],
    heatTriggers: {
      threshold: 75,
      opportunities: [
        'Summer moving season',
        'Great weather for house hunting',
        'Curb appeal at its best',
        'Pool homes available'
      ]
    },
    coldTriggers: {
      threshold: 50,
      opportunities: [
        'Less competition in winter market',
        'Motivated sellers in cold months',
        'Cozy homes for winter'
      ]
    },
    rainTriggers: [
      'Virtual tours available',
      'Check drainage on properties',
      'Rainy day house planning'
    ],
    snowTriggers: [
      'Winter buyers get better deals',
      'Snow reveals property issues',
      'Virtual showings available'
    ],
    moodOpportunities: {
      hopeful: ['Find your dream home'],
      protective: ['Safe investment in any weather']
    }
  },
  food_delivery: {
    keywords: ['delivery', 'doordash', 'uber eats', 'food delivery', 'takeout'],
    heatTriggers: {
      threshold: 85,
      opportunities: [
        'Too hot to cook - order in',
        'Beat the heat with delivery',
        'Cold meals delivered fresh',
        'Stay cool, eat well'
      ]
    },
    coldTriggers: {
      threshold: 40,
      opportunities: [
        'Too cold to go out - we deliver',
        'Hot meals to your door',
        'Stay warm, order in',
        'Comfort food delivered'
      ]
    },
    rainTriggers: [
      'Rainy night? Perfect for delivery',
      "Don't get wet - order in",
      'Cozy night + delivery = perfect'
    ],
    snowTriggers: [
      'Snowed in? We got you',
      'Hot food, cold outside',
      'No need to brave the snow'
    ],
    moodOpportunities: {
      'comfort-seeking': ['Comfort food delivered'],
      anxious: ['One less thing to worry about']
    }
  },
  pet_services: {
    keywords: ['pet', 'dog', 'cat', 'grooming', 'vet', 'pet sitting', 'dog walking'],
    heatTriggers: {
      threshold: 80,
      opportunities: [
        'Hot pavement hurts paws',
        'Summer grooming for cool pets',
        'Heat safety for pets',
        'Indoor daycare during heat'
      ]
    },
    coldTriggers: {
      threshold: 40,
      opportunities: [
        'Cold weather pet gear',
        'Warm indoor daycare',
        'Winter grooming specials',
        'Protect paws from salt'
      ]
    },
    rainTriggers: [
      'Indoor play for rainy days',
      'Post-walk cleanup grooming',
      'Rainy day daycare'
    ],
    snowTriggers: [
      'Snow booties for dogs',
      'Indoor exercise options',
      'Paw protection from salt'
    ],
    moodOpportunities: {
      protective: ['Keep your fur baby safe'],
      'comfort-seeking': ['Pamper your pet']
    }
  },
  beauty_salon: {
    keywords: ['beauty', 'salon', 'spa', 'hair', 'nails', 'skincare', 'makeup', 'aesthetics', 'barber'],
    heatTriggers: {
      threshold: 80,
      opportunities: [
        'Beat frizz with humidity treatments',
        'Summer skincare essentials',
        'UV protection hair treatments',
        'Cool down with a refreshing facial'
      ]
    },
    coldTriggers: {
      threshold: 45,
      opportunities: [
        'Combat dry winter skin',
        'Hydrating hair treatments',
        'Winter skincare packages',
        'Warm up with a hot stone massage'
      ]
    },
    rainTriggers: [
      'Rainy day self-care special',
      'Anti-frizz treatments available',
      'Perfect day for pampering'
    ],
    snowTriggers: [
      'Cozy spa day escape',
      'Winter wellness packages',
      'Warm up inside with us'
    ],
    moodOpportunities: {
      'comfort-seeking': ['Treat yourself - you deserve it'],
      hopeful: ['New season, new look']
    }
  },
  event_planning: {
    keywords: ['event', 'wedding', 'party', 'catering', 'venue', 'planner', 'coordinator', 'banquet'],
    heatTriggers: {
      threshold: 85,
      opportunities: [
        'Indoor venue backup plans',
        'Heat contingency planning',
        'Tent and cooling rentals',
        'Summer event hydration stations'
      ]
    },
    coldTriggers: {
      threshold: 45,
      opportunities: [
        'Cozy indoor winter events',
        'Holiday party planning',
        'Winter wonderland themes',
        'Heated tent options'
      ]
    },
    rainTriggers: [
      'Rain backup venue options',
      'Tent and cover rentals',
      'Weather contingency planning'
    ],
    snowTriggers: [
      'Winter event magic',
      'Snow day backup plans',
      'Indoor venue alternatives'
    ],
    moodOpportunities: {
      anxious: ['We handle weather contingencies'],
      hopeful: ['Perfect events rain or shine']
    }
  },
  legal_services: {
    keywords: ['lawyer', 'attorney', 'legal', 'law firm', 'litigation', 'counsel', 'paralegal'],
    heatTriggers: {
      threshold: 90,
      opportunities: [
        'Heat-related workplace injury claims',
        'Property damage from heat',
        'Contract review for seasonal businesses'
      ]
    },
    coldTriggers: {
      threshold: 32,
      opportunities: [
        'Slip and fall liability season',
        'Property damage claims from freeze',
        'Winter accident consultations'
      ]
    },
    rainTriggers: [
      'Flood damage legal assistance',
      'Storm-related insurance disputes',
      'Property damage consultations'
    ],
    snowTriggers: [
      'Snow removal liability',
      'Slip and fall cases increase',
      'Winter accident legal help'
    ],
    moodOpportunities: {
      protective: ['Protect your rights and property'],
      anxious: ['Free consultation - know your options']
    }
  },
  medical_healthcare: {
    keywords: ['doctor', 'medical', 'clinic', 'healthcare', 'physician', 'urgent care', 'dental', 'therapy', 'chiropractor'],
    heatTriggers: {
      threshold: 90,
      opportunities: [
        'Heat exhaustion awareness',
        'Stay hydrated - health tips',
        'Summer wellness checkups',
        'Heat-related illness prevention'
      ]
    },
    coldTriggers: {
      threshold: 40,
      opportunities: [
        'Flu season vaccinations',
        'Cold and flu treatment',
        'Winter wellness visits',
        'Seasonal affective disorder support'
      ]
    },
    rainTriggers: [
      'Rainy day telehealth available',
      'Allergy season treatment',
      'Mental health check-in'
    ],
    snowTriggers: [
      'Telehealth appointments available',
      'Winter injury treatment',
      'Stay healthy this winter'
    ],
    moodOpportunities: {
      protective: ['Your health comes first'],
      'comfort-seeking': ['Compassionate care when you need it']
    }
  },
  education_tutoring: {
    keywords: ['tutoring', 'education', 'school', 'learning', 'academy', 'training', 'courses', 'classes'],
    heatTriggers: {
      threshold: 85,
      opportunities: [
        'Summer learning programs',
        'Beat the heat - learn inside',
        'Air-conditioned study sessions',
        'Summer enrichment courses'
      ]
    },
    coldTriggers: {
      threshold: 40,
      opportunities: [
        'Winter break tutoring',
        'Warm up your mind',
        'Indoor learning opportunities',
        'Test prep season'
      ]
    },
    rainTriggers: [
      'Rainy day learning special',
      'Online sessions available',
      'Perfect weather for studying'
    ],
    snowTriggers: [
      'Snow day tutoring online',
      'Virtual learning available',
      'Cozy up and learn'
    ],
    moodOpportunities: {
      hopeful: ['Invest in your future'],
      'comfort-seeking': ['Comfortable learning environment']
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detect region from location string (simplified)
 */
function detectRegion(location: string): string {
  const loc = location.toLowerCase()

  // Northeast
  if (loc.includes('new york') || loc.includes('boston') || loc.includes('philadelphia') ||
      loc.includes('ny') || loc.includes('ma') || loc.includes('pa') || loc.includes('nj') ||
      loc.includes('ct') || loc.includes('ri') || loc.includes('vt') || loc.includes('nh') || loc.includes('me')) {
    return 'northeast'
  }

  // Southeast
  if (loc.includes('atlanta') || loc.includes('miami') || loc.includes('florida') ||
      loc.includes('georgia') || loc.includes('fl') || loc.includes('ga') || loc.includes('sc') ||
      loc.includes('nc') || loc.includes('tn') || loc.includes('al') || loc.includes('ms') ||
      loc.includes('louisiana') || loc.includes('la')) {
    return 'southeast'
  }

  // Midwest
  if (loc.includes('chicago') || loc.includes('detroit') || loc.includes('minneapolis') ||
      loc.includes('il') || loc.includes('mi') || loc.includes('oh') || loc.includes('wi') ||
      loc.includes('mn') || loc.includes('iowa') || loc.includes('in') || loc.includes('mo')) {
    return 'midwest'
  }

  // Southwest
  if (loc.includes('phoenix') || loc.includes('arizona') || loc.includes('las vegas') ||
      loc.includes('az') || loc.includes('nv') || loc.includes('new mexico') || loc.includes('nm')) {
    return 'southwest'
  }

  // West Coast
  if (loc.includes('los angeles') || loc.includes('san diego') || loc.includes('california') ||
      loc.includes('ca') || loc.includes('la,')) {
    return 'westcoast'
  }

  // Pacific Northwest
  if (loc.includes('seattle') || loc.includes('portland') || loc.includes('washington') ||
      loc.includes('oregon') || loc.includes('wa') || loc.includes('or')) {
    return 'northwest'
  }

  // Texas
  if (loc.includes('texas') || loc.includes('tx') || loc.includes('dallas') ||
      loc.includes('houston') || loc.includes('austin') || loc.includes('san antonio')) {
    return 'texas'
  }

  return 'default'
}

/**
 * Get regional baseline for location
 */
function getRegionalBaseline(location: string, month: number): RegionalBaseline {
  const region = detectRegion(location)
  return REGIONAL_BASELINES[region]?.[month] || REGIONAL_BASELINES.default[month]
}

/**
 * Calculate temperature deviation from normal
 */
function calculateDeviation(currentTemp: number, location: string): { deviation: number; isSignificant: boolean } {
  const month = new Date().getMonth() + 1
  const baseline = getRegionalBaseline(location, month)
  const normalMidpoint = (baseline.avgHigh + baseline.avgLow) / 2
  const deviation = currentTemp - normalMidpoint

  return {
    deviation: Math.round(deviation),
    isSignificant: Math.abs(deviation) >= 10 // 10°F deviation is significant
  }
}

/**
 * Match industry from keywords
 */
function matchIndustry(industry: string): IndustryTrigger | null {
  const lowerIndustry = industry.toLowerCase()

  for (const [key, trigger] of Object.entries(INDUSTRY_TRIGGERS)) {
    if (trigger.keywords.some(kw => lowerIndustry.includes(kw))) {
      return trigger
    }
  }

  return null
}

/**
 * Find matching UVP weather mapping based on emotional context and pain points
 */
function findUVPWeatherMapping(
  emotionalContext: WeatherOpportunity['emotional_context'],
  uvpPainPoints?: string[]
): UVPWeatherMapping | null {
  if (!uvpPainPoints || uvpPainPoints.length === 0) return null

  const painPointsLower = uvpPainPoints.map(p => p.toLowerCase())

  // Map emotional context to weather condition types
  const emotionToWeatherMap: Record<string, WeatherOpportunityType[]> = {
    'anxious': ['storm', 'heat_wave', 'cold_snap'],
    'protective': ['cold_snap', 'storm', 'forecast_alert'],
    'comfort-seeking': ['precipitation', 'cold_snap', 'deviation'],
    'hopeful': ['seasonal', 'weather_window', 'deviation'],
    'energized': ['deviation', 'weather_window', 'seasonal']
  }

  const relevantWeatherTypes = emotionToWeatherMap[emotionalContext || 'hopeful'] || []

  // Find best matching UVP mapping
  for (const mapping of UVP_WEATHER_MAPPINGS) {
    if (!relevantWeatherTypes.includes(mapping.weatherCondition)) continue

    const hasMatch = mapping.painPointKeywords.some(keyword =>
      painPointsLower.some(pp => pp.includes(keyword))
    )
    if (hasMatch) return mapping
  }

  // Fallback: return mapping for first relevant weather type
  return UVP_WEATHER_MAPPINGS.find(m => relevantWeatherTypes.includes(m.weatherCondition)) || null
}

/**
 * Select best content angle from UVP mapping
 */
function selectUVPContentAngle(
  mapping: UVPWeatherMapping,
  uvpPainPoints?: string[],
  uvpTransformation?: string
): string {
  const angle = mapping.contentAngles[Math.floor(Math.random() * mapping.contentAngles.length)]

  // Replace {pain_point} placeholder with actual pain point
  if (uvpPainPoints && uvpPainPoints.length > 0 && angle.includes('{pain_point}')) {
    const painPoint = uvpPainPoints[0].toLowerCase()
    return angle.replace('{pain_point}', painPoint)
  }

  // If transformation provided, use it in certain angles
  if (uvpTransformation && angle.includes('transform')) {
    return angle.replace('transform', uvpTransformation.toLowerCase())
  }

  return angle
}

/**
 * Get EQ adjustment based on weather conditions
 */
function getEQWeatherAdjustment(
  temp: number,
  condition: string,
  deviation: number
): { emotion: string; modifier: number; reason: string } | undefined {
  const lowerCondition = condition.toLowerCase()

  let weatherType: string | null = null

  if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) {
    weatherType = 'stormy'
  } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
    weatherType = 'rainy'
  } else if (temp < 40) {
    weatherType = 'cold'
  } else if (deviation > 10 && temp >= 60 && temp <= 80) {
    weatherType = 'first_nice_day'
  } else if ((lowerCondition.includes('clear') || lowerCondition.includes('sunny')) && temp >= 65 && temp <= 85) {
    weatherType = 'sunny_warm'
  }

  if (!weatherType) return undefined

  const adjustment = EQ_WEATHER_ADJUSTMENTS.find(a => a.weather === weatherType)
  if (!adjustment) return undefined

  // Return the highest modifier adjustment
  const sorted = [...adjustment.eqAdjustments].sort((a, b) => b.modifier - a.modifier)
  return sorted[0]
}

/**
 * Get emotional context based on weather
 */
function getEmotionalContext(temp: number, condition: string, deviation: number): WeatherOpportunity['emotional_context'] {
  const lowerCondition = condition.toLowerCase()

  // Storm/severe = anxious
  if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) {
    return 'anxious'
  }

  // Rain/overcast = comfort-seeking
  if (lowerCondition.includes('rain') || lowerCondition.includes('overcast') || lowerCondition.includes('drizzle')) {
    return 'comfort-seeking'
  }

  // Clear + warm but not extreme = hopeful
  if ((lowerCondition.includes('clear') || lowerCondition.includes('sunny')) && temp >= 65 && temp <= 85) {
    return 'hopeful'
  }

  // First nice day (above normal) = energized
  if (deviation > 10 && temp >= 60 && temp <= 80) {
    return 'energized'
  }

  // Cold = protective
  if (temp < 40) {
    return 'protective'
  }

  return 'hopeful' // default
}

// ============================================================================
// WEATHER API SERVICE
// ============================================================================

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
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

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
        throw new Error(`Weather Edge Function error (${response.status}): ${errorData.error || response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
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
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

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
        throw new Error(`Weather Edge Function error (${response.status}): ${errorData.error || response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
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

  /**
   * Weather 2.0 Enhanced Opportunity Detection
   *
   * Features:
   * - Regional baseline comparison
   * - Forecast-based proactive alerts
   * - Industry-specific triggers
   * - Emotional context mapping
   * - UVP pain point integration
   * - EQ-Weather fusion
   * - Historical consecutive day tracking
   */
  async detectWeatherOpportunities(
    location: string,
    industry: string,
    uvpPainPoints?: string[],
    uvpTransformation?: string
  ): Promise<WeatherOpportunity[]> {
    const weather = await this.getCurrentWeather(location)
    if (!weather) return []

    const forecast = await this.get5DayForecast(location)
    const opportunities: WeatherOpportunity[] = []
    const temp = weather.temperature

    // Get regional deviation
    const { deviation, isSignificant } = calculateDeviation(temp, location)
    const emotionalContext = getEmotionalContext(temp, weather.condition, deviation)

    // Match industry triggers
    const industryTrigger = matchIndustry(industry)

    console.log(`[WeatherAPI 2.0] Location: ${location}, Region: ${detectRegion(location)}, Temp: ${temp}°F, Deviation: ${deviation}°F, Industry: ${industry}`)

    // =========================================================================
    // UVP PAIN POINT MATCHING
    // =========================================================================

    const matchedUVPMapping = findUVPWeatherMapping(emotionalContext, uvpPainPoints)
    const uvpContentAngle = matchedUVPMapping
      ? selectUVPContentAngle(matchedUVPMapping, uvpPainPoints, uvpTransformation)
      : undefined

    // =========================================================================
    // EQ-WEATHER FUSION
    // =========================================================================

    const eqAdjustment = getEQWeatherAdjustment(temp, weather.condition, deviation)

    // =========================================================================
    // CONSECUTIVE DAY TRACKING
    // =========================================================================

    let consecutiveDays = 0
    let consecutiveTriggers: { days: number; industry: string; trigger: string; urgency: OpportunityUrgency }[] = []

    // Track freezing days
    if (temp < 32) {
      consecutiveDays = updateConsecutiveTracker('freezing')
      consecutiveTriggers = CONSECUTIVE_DAY_TRIGGERS.freezing || []
    }
    // Track hot 90+ days
    else if (temp >= 90) {
      consecutiveDays = updateConsecutiveTracker('hot_90plus')
      consecutiveTriggers = CONSECUTIVE_DAY_TRIGGERS.hot_90plus || []
    }
    // Track rainy days
    else if (weather.condition.toLowerCase().includes('rain')) {
      consecutiveDays = updateConsecutiveTracker('rainy')
      consecutiveTriggers = CONSECUTIVE_DAY_TRIGGERS.rainy || []
    }

    // Check for industry-specific consecutive day triggers
    const matchedConsecutiveTrigger = consecutiveTriggers.find(
      t => t.days <= consecutiveDays && industry.toLowerCase().includes(t.industry.replace('_', ' '))
    )

    // =========================================================================
    // DEVIATION-BASED OPPORTUNITIES (Regional Baseline Comparison)
    // =========================================================================

    if (isSignificant) {
      if (deviation > 0) {
        // Above normal
        opportunities.push({
          type: 'deviation',
          urgency: deviation >= 15 ? 'high' : 'medium',
          title: `${Math.abs(deviation)}°F Above Normal`,
          description: `Temperature ${Math.round(temp)}°F is significantly warmer than typical for this time of year. Consumers are more active and open to purchases.`,
          impact_score: Math.min(75 + deviation, 95),
          suggested_actions: industryTrigger?.heatTriggers.opportunities ||  [
            'Capitalize on increased foot traffic and activity',
            'Promote outdoor services and activities',
            'Consumers more likely to make purchases in good weather',
            'Energy and optimism are high - great for aspirational messaging'
          ],
          deviation,
          emotional_context: 'energized',
          industry_match: !!industryTrigger,
          uvp_content_angle: uvpContentAngle,
          eq_adjustment: eqAdjustment
        })
      } else {
        // Below normal
        opportunities.push({
          type: 'deviation',
          urgency: deviation <= -15 ? 'high' : 'medium',
          title: `${Math.abs(deviation)}°F Below Normal`,
          description: `Temperature ${Math.round(temp)}°F is significantly colder than typical. Consumers seek comfort and protection.`,
          impact_score: Math.min(70 + Math.abs(deviation), 90),
          suggested_actions: industryTrigger?.coldTriggers.opportunities || [
            'Promote comfort and warmth messaging',
            'Consumers seeking cozy, protective solutions',
            'Indoor service opportunities increase',
            'Delivery and convenience more appealing'
          ],
          deviation,
          emotional_context: 'comfort-seeking',
          industry_match: !!industryTrigger,
          uvp_content_angle: uvpContentAngle,
          eq_adjustment: eqAdjustment
        })
      }
    }

    // =========================================================================
    // CONSECUTIVE DAY TRIGGER OPPORTUNITIES
    // =========================================================================

    if (matchedConsecutiveTrigger && consecutiveDays >= matchedConsecutiveTrigger.days) {
      opportunities.push({
        type: 'heat_wave', // Use appropriate base type
        urgency: matchedConsecutiveTrigger.urgency,
        title: `Day ${consecutiveDays}: ${matchedConsecutiveTrigger.trigger}`,
        description: `${consecutiveDays} consecutive days of this weather pattern. Industry data shows this is a critical trigger point.`,
        impact_score: 85 + (consecutiveDays * 2),
        suggested_actions: [
          `Critical: ${matchedConsecutiveTrigger.trigger}`,
          'Historical patterns show high service demand',
          'Proactive outreach to existing customers',
          'Emergency service availability messaging'
        ],
        consecutive_days: consecutiveDays,
        emotional_context: temp < 32 ? 'protective' : 'anxious',
        industry_match: true,
        uvp_content_angle: uvpContentAngle,
        eq_adjustment: eqAdjustment
      })
    }

    // =========================================================================
    // EXTREME TEMPERATURE OPPORTUNITIES
    // =========================================================================

    // Critical heat wave
    if (temp > 90) {
      opportunities.push({
        type: 'heat_wave',
        urgency: 'critical',
        title: 'Heat Wave Alert',
        description: `Temperature ${Math.round(temp)}°F - Critical heat conditions. Immediate action content performs best.`,
        impact_score: 95,
        suggested_actions: industryTrigger?.heatTriggers.opportunities || [
          'Promote emergency cooling services',
          '"Beat the heat" urgency messaging',
          'Same-day service availability',
          'Heat safety content'
        ],
        emotional_context: 'anxious',
        industry_match: !!industryTrigger
      })
    } else if (temp >= 85 && temp <= 90) {
      opportunities.push({
        type: 'heat_wave',
        urgency: 'high',
        title: 'Hot Weather Active',
        description: `Temperature ${Math.round(temp)}°F - High demand for cooling solutions.`,
        impact_score: 80,
        suggested_actions: industryTrigger?.heatTriggers.opportunities || [
          'Promote cooling services',
          'Summer preparation messaging',
          'Stay cool tips and solutions'
        ],
        emotional_context: emotionalContext,
        industry_match: !!industryTrigger
      })
    }

    // Freezing temperatures
    if (temp < 32) {
      opportunities.push({
        type: 'cold_snap',
        urgency: 'high',
        title: 'Freezing Temperatures',
        description: `Temperature ${Math.round(temp)}°F - High demand for heating and protection services.`,
        impact_score: 90,
        suggested_actions: industryTrigger?.coldTriggers.opportunities || [
          'Promote emergency heating services',
          'Freeze protection messaging',
          'Winterization urgency content'
        ],
        emotional_context: 'protective',
        industry_match: !!industryTrigger
      })
    }

    // =========================================================================
    // PRECIPITATION OPPORTUNITIES
    // =========================================================================

    const isRaining = weather.condition.toLowerCase().includes('rain') ||
                     weather.condition.toLowerCase().includes('drizzle')
    const isSnowing = weather.condition.toLowerCase().includes('snow')
    const isStormy = weather.condition.toLowerCase().includes('storm') ||
                    weather.condition.toLowerCase().includes('thunder')

    if (isStormy) {
      opportunities.push({
        type: 'storm',
        urgency: 'critical',
        title: 'Storm Conditions',
        description: 'Active storm - high demand for emergency services and safety content.',
        impact_score: 95,
        suggested_actions: industryTrigger?.rainTriggers || [
          'Emergency service availability',
          'Safety and protection messaging',
          'Post-storm inspection offers'
        ],
        emotional_context: 'anxious',
        industry_match: !!industryTrigger
      })
    } else if (isSnowing) {
      opportunities.push({
        type: 'precipitation',
        urgency: 'high',
        title: 'Active Snowfall',
        description: 'Snow conditions create immediate service demand.',
        impact_score: 85,
        suggested_actions: industryTrigger?.snowTriggers || [
          'Snow removal services',
          'Winter safety content',
          'Indoor activity promotions'
        ],
        emotional_context: 'protective',
        industry_match: !!industryTrigger
      })
    } else if (isRaining) {
      opportunities.push({
        type: 'precipitation',
        urgency: 'medium',
        title: 'Active Rainfall',
        description: 'Rain conditions - comfort-seeking behavior increases.',
        impact_score: 65,
        suggested_actions: industryTrigger?.rainTriggers || [
          'Delivery and convenience messaging',
          'Indoor service promotions',
          'Cozy comfort content'
        ],
        emotional_context: 'comfort-seeking',
        industry_match: !!industryTrigger
      })
    }

    // =========================================================================
    // FORECAST-BASED PROACTIVE OPPORTUNITIES
    // =========================================================================

    // Find upcoming weather events
    for (let i = 0; i < forecast.length; i++) {
      const day = forecast[i]
      const daysUntil = i + 1

      // Storm/heavy rain coming
      if (day.precipitation_chance >= 70 && daysUntil <= 3 && !isRaining && !isSnowing) {
        opportunities.push({
          type: 'forecast_alert',
          urgency: daysUntil === 1 ? 'high' : 'medium',
          title: `Heavy Weather in ${daysUntil} Day${daysUntil > 1 ? 's' : ''}`,
          description: `${day.precipitation_chance}% chance of precipitation on ${day.date}. Prepare customers now.`,
          impact_score: 70 + (10 / daysUntil),
          suggested_actions: [
            `"${daysUntil} days to prepare" messaging`,
            'Preventive service scheduling',
            'Weather preparation checklist content',
            'Book before the weather hits'
          ],
          days_until: daysUntil,
          emotional_context: 'protective',
          industry_match: !!industryTrigger
        })
        break // Only one forecast alert
      }

      // Heat wave coming
      if (day.temp_max >= 90 && temp < 85 && daysUntil <= 3) {
        opportunities.push({
          type: 'forecast_alert',
          urgency: daysUntil === 1 ? 'high' : 'medium',
          title: `Heat Wave in ${daysUntil} Day${daysUntil > 1 ? 's' : ''}`,
          description: `Temperatures reaching ${Math.round(day.temp_max)}°F expected. Prepare customers now.`,
          impact_score: 75 + (10 / daysUntil),
          suggested_actions: [
            'Schedule AC tune-ups before heat hits',
            '"Beat the rush" messaging',
            'Heat preparation tips',
            'Book cooling services now'
          ],
          days_until: daysUntil,
          emotional_context: 'hopeful',
          industry_match: !!industryTrigger
        })
        break
      }

      // Cold front coming
      if (day.temp_min <= 32 && temp > 40 && daysUntil <= 3) {
        opportunities.push({
          type: 'forecast_alert',
          urgency: daysUntil === 1 ? 'high' : 'medium',
          title: `Cold Front in ${daysUntil} Day${daysUntil > 1 ? 's' : ''}`,
          description: `Temperature dropping to ${Math.round(day.temp_min)}°F. Time to winterize.`,
          impact_score: 75 + (10 / daysUntil),
          suggested_actions: [
            'Winterization before cold arrives',
            '"Last chance before freeze" messaging',
            'Cold weather preparation checklist',
            'Schedule heating service now'
          ],
          days_until: daysUntil,
          emotional_context: 'protective',
          industry_match: !!industryTrigger
        })
        break
      }
    }

    // Good weather window ahead
    const goodWeatherDays = forecast.filter(day =>
      day.precipitation_chance < 20 &&
      day.temp_max >= 60 && day.temp_max <= 85
    ).length

    if (goodWeatherDays >= 3 && !isRaining && !isSnowing && temp >= 50) {
      opportunities.push({
        type: 'weather_window',
        urgency: 'medium',
        title: `${goodWeatherDays}-Day Perfect Weather Window`,
        description: 'Extended period of ideal conditions for outdoor work and activities.',
        impact_score: 65,
        suggested_actions: [
          'Promote outdoor services and projects',
          'Schedule exterior work',
          'Perfect conditions messaging',
          'Get outdoor projects done now'
        ],
        emotional_context: 'energized',
        industry_match: !!industryTrigger
      })
    }

    // =========================================================================
    // INDUSTRY-SPECIFIC MOOD OPPORTUNITIES
    // =========================================================================

    if (industryTrigger && emotionalContext) {
      const moodActions = industryTrigger.moodOpportunities[emotionalContext]
      if (moodActions && moodActions.length > 0) {
        // Add industry mood content to existing opportunities or create new one
        if (opportunities.length > 0) {
          // Enhance existing opportunity with industry mood actions
          opportunities[0].suggested_actions = [
            ...moodActions,
            ...opportunities[0].suggested_actions.slice(0, 2)
          ]
        }
      }
    }

    // =========================================================================
    // ENSURE AT LEAST ONE OPPORTUNITY (Seasonal Baseline)
    // =========================================================================

    if (opportunities.length === 0) {
      const month = new Date().getMonth() + 1
      const season = month >= 6 && month <= 8 ? 'Summer' :
                    month >= 12 || month <= 2 ? 'Winter' :
                    month >= 3 && month <= 5 ? 'Spring' : 'Fall'

      opportunities.push({
        type: 'seasonal',
        urgency: 'low',
        title: `${season} Season Opportunity`,
        description: `Temperature ${Math.round(temp)}°F - ${season} service opportunities available.`,
        impact_score: 40,
        suggested_actions: [
          `${season} maintenance messaging`,
          'Seasonal service packages',
          'Prepare for next season content',
          'Seasonal tips and advice'
        ],
        emotional_context: emotionalContext,
        industry_match: !!industryTrigger
      })
    }

    // Sort by impact score
    opportunities.sort((a, b) => b.impact_score - a.impact_score)

    console.log(`[WeatherAPI 2.0] 🌤️ Detected ${opportunities.length} opportunities for ${location} (${industry})`)
    return opportunities
  }

  // ===========================================================================
  // WEATHER + LOCAL EVENTS CORRELATION (Phase 4.2)
  // ===========================================================================

  /**
   * Correlate weather conditions with local events for opportunity detection
   *
   * STUB: Future integration with local events calendar APIs
   * - Eventbrite API for local events
   * - Google Places API for venue weather impact
   * - Local sports/concert schedules
   *
   * @param location - City/region to check
   * @param forecast - Weather forecast data
   * @returns Array of weather-event correlation opportunities
   */
  async getWeatherEventCorrelations(
    location: string,
    forecast: ForecastDay[]
  ): Promise<{
    event: string
    date: string
    weatherImpact: 'positive' | 'negative' | 'neutral'
    opportunity: string
    suggestedContent: string[]
  }[]> {
    console.log(`[WeatherAPI 2.0] 📅 Weather+Events correlation stub called for ${location}`)

    // STUB: Return example correlations for demo purposes
    // In production, this would integrate with:
    // - Eventbrite API
    // - Google Calendar local events
    // - Sports schedules
    // - Concert/festival calendars

    const exampleCorrelations = [
      {
        event: 'Local Outdoor Festival',
        date: forecast[2]?.date || 'upcoming',
        weatherImpact: forecast[2]?.precipitation_chance > 50 ? 'negative' as const : 'positive' as const,
        opportunity: forecast[2]?.precipitation_chance > 50
          ? 'Festival attendees need rain gear and backup plans'
          : 'Perfect weather for outdoor event promotion',
        suggestedContent: forecast[2]?.precipitation_chance > 50
          ? ['Rain contingency services', 'Indoor alternatives', 'Weather-proof products']
          : ['Outdoor service promotions', 'Event-related offerings', 'Festival specials']
      },
      {
        event: 'Weekend Sports Games',
        date: forecast[4]?.date || 'this weekend',
        weatherImpact: (forecast[4]?.temp_max || 70) > 85 ? 'negative' as const : 'positive' as const,
        opportunity: 'Sports fans making outdoor plans based on weather',
        suggestedContent: ['Tailgating services', 'Game day specials', 'Fan comfort products']
      }
    ]

    return exampleCorrelations
  }

  // ===========================================================================
  // COMPETITOR WEATHER RESPONSE ANALYSIS (Phase 4.3)
  // ===========================================================================

  /**
   * Analyze competitor weather-based content and identify gaps
   *
   * STUB: Future integration with social media monitoring
   * - Track competitor weather-triggered posts
   * - Identify response timing gaps
   * - Find underserved weather content opportunities
   *
   * @param industry - Industry to analyze
   * @param location - Geographic market
   * @returns Competitor weather response analysis
   */
  async analyzeCompetitorWeatherResponse(
    industry: string,
    location: string
  ): Promise<{
    competitorActivity: 'high' | 'medium' | 'low'
    responseGaps: string[]
    differentiationOpportunities: string[]
    recommendedTiming: string
  }> {
    console.log(`[WeatherAPI 2.0] 🔍 Competitor weather analysis stub called for ${industry} in ${location}`)

    // STUB: Return example analysis for demo purposes
    // In production, this would integrate with:
    // - Social media monitoring APIs
    // - Competitor content scraping
    // - Ad intelligence platforms

    return {
      competitorActivity: 'medium',
      responseGaps: [
        'Most competitors post weather content 24+ hours after event',
        'Few competitors use forecast-based proactive messaging',
        'Limited UVP-integrated weather content in market',
        'Emotional weather targeting underutilized'
      ],
      differentiationOpportunities: [
        'Be first to respond to weather changes (within 2 hours)',
        'Use forecast alerts to beat competitors by 2-3 days',
        'Integrate weather with brand transformation story',
        'Target specific emotional states competitors ignore'
      ],
      recommendedTiming: 'Post weather-related content within 4 hours of condition change for maximum differentiation'
    }
  }

  /**
   * Clear all weather caches
   */
  clearCache(): void {
    this.cache.clear()
    console.log('[WeatherAPI 2.0] 🧹 Cache cleared')
  }
}

export const WeatherAPI = new WeatherAPIService()
