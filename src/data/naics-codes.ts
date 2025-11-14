/**
 * ============================================================================
 * NAICS CODES - Standard + Custom Sub-Industry Extensions
 * ============================================================================
 *
 * NAICS (North American Industry Classification System) provides standardized
 * industry codes. We extend it with custom sub-industry codes for precision.
 *
 * Structure:
 * - 2-digit: Sector (e.g., "54" = Professional Services)
 * - 3-digit: Subsector (e.g., "541" = Professional, Scientific, Technical Services)
 * - 4-digit: Industry Group (e.g., "5416" = Management & Technical Consulting)
 * - 6-digit: Detailed Industry (e.g., "541618" = Other Management Consulting)
 * - 7-digit CUSTOM: Sub-Industry (e.g., "541618-CONST" = Construction Consulting)
 */

export interface NAICSCode {
  code: string;             // "541618" or "541618-CONST"
  parentCode: string | null;
  level: number;            // 2=sector, 3=subsector, 4=industry, 6=detailed, 7=custom sub-industry
  title: string;
  description: string;
  isStandard: boolean;      // false for custom sub-industries
  keywords?: string[];      // Keywords for detection
}

/**
 * NAICS Codes Database
 * Includes common industries + custom sub-industry extensions
 */
export const NAICS_CODES: NAICSCode[] = [
  // ========================================================================
  // SECTOR 54: PROFESSIONAL, SCIENTIFIC, AND TECHNICAL SERVICES
  // ========================================================================
  {
    code: "54",
    parentCode: null,
    level: 2,
    title: "Professional, Scientific, and Technical Services",
    description: "Professional services requiring specialized knowledge",
    isStandard: true,
    keywords: []
  },

  // Subsector: Professional Services
  {
    code: "541",
    parentCode: "54",
    level: 3,
    title: "Professional, Scientific, and Technical Services",
    description: "Professional services",
    isStandard: true,
    keywords: []
  },

  // Industry Group: Management & Technical Consulting
  {
    code: "5416",
    parentCode: "541",
    level: 4,
    title: "Management, Scientific, and Technical Consulting Services",
    description: "Consulting services",
    isStandard: true,
    keywords: ["consulting", "consultant", "advisory"]
  },

  // Detailed Industry: Other Management Consulting
  {
    code: "541618",
    parentCode: "5416",
    level: 6,
    title: "Other Management Consulting Services",
    description: "Management consulting not classified elsewhere",
    isStandard: true,
    keywords: ["management", "consulting", "strategy", "business"]
  },

  // CUSTOM SUB-INDUSTRIES - Consulting Specializations
  {
    code: "541618-CONST",
    parentCode: "541618",
    level: 7,
    title: "Construction Management Consulting",
    description: "Consulting services for construction projects, contractors, and developers",
    isStandard: false,
    keywords: ["construction", "building", "contractor", "project management", "architect", "developer", "GC"]
  },
  {
    code: "541618-SOFT",
    parentCode: "541618",
    level: 7,
    title: "Software Consulting",
    description: "Consulting for software development, IT systems, and digital transformation",
    isStandard: false,
    keywords: ["software", "IT", "technology", "digital", "systems", "development", "engineering"]
  },
  {
    code: "541618-HEALTH",
    parentCode: "541618",
    level: 7,
    title: "Healthcare Consulting",
    description: "Consulting for healthcare providers, hospitals, and medical practices",
    isStandard: false,
    keywords: [
      "healthcare consulting", "healthcare consultant", "healthcare strategy",
      "hospital consulting", "healthcare advisory", "medical practice consulting",
      "healthcare operations consulting", "healthcare management consulting",
      "hospital management consultant", "healthcare systems consulting",
      "medical consulting firm", "healthcare business consulting"
    ]
  },
  {
    code: "541618-FIN",
    parentCode: "541618",
    level: 7,
    title: "Financial Consulting",
    description: "Consulting for financial services, investment, and wealth management",
    isStandard: false,
    keywords: ["financial", "investment", "wealth", "banking", "capital", "portfolio"]
  },
  {
    code: "541618-MKTG",
    parentCode: "541618",
    level: 7,
    title: "Marketing Consulting",
    description: "Consulting for marketing strategy, branding, and customer acquisition",
    isStandard: false,
    keywords: ["marketing", "brand", "advertising", "digital marketing", "growth", "acquisition"]
  },
  {
    code: "541618-HR",
    parentCode: "541618",
    level: 7,
    title: "Human Resources Consulting",
    description: "Consulting for HR strategy, talent management, and organizational development",
    isStandard: false,
    keywords: ["HR", "human resources", "talent", "recruiting", "organizational", "workforce"]
  },

  // ========================================================================
  // SECTOR 23: CONSTRUCTION
  // ========================================================================
  {
    code: "23",
    parentCode: null,
    level: 2,
    title: "Construction",
    description: "Construction of buildings and infrastructure",
    isStandard: true,
    keywords: []
  },

  {
    code: "236",
    parentCode: "23",
    level: 3,
    title: "Construction of Buildings",
    description: "New construction and renovation of buildings",
    isStandard: true,
    keywords: ["construction", "building", "contractor"]
  },

  {
    code: "2361",
    parentCode: "236",
    level: 4,
    title: "Residential Building Construction",
    description: "Construction of residential buildings",
    isStandard: true,
    keywords: ["residential", "housing", "home"]
  },

  {
    code: "236118",
    parentCode: "2361",
    level: 6,
    title: "Residential Remodelers",
    description: "Home renovation and remodeling",
    isStandard: true,
    keywords: ["remodel", "renovation", "home improvement"]
  },

  {
    code: "2362",
    parentCode: "236",
    level: 4,
    title: "Nonresidential Building Construction",
    description: "Construction of commercial and institutional buildings",
    isStandard: true,
    keywords: ["commercial", "industrial", "office"]
  },

  {
    code: "236220",
    parentCode: "2362",
    level: 6,
    title: "Commercial and Institutional Building Construction",
    description: "General contractors for commercial projects",
    isStandard: true,
    keywords: ["commercial", "general contractor", "GC"]
  },

  // CUSTOM SUB-INDUSTRIES - Contractor Specializations
  {
    code: "236220-RES",
    parentCode: "236220",
    level: 7,
    title: "Residential General Contractor",
    description: "General contractors specializing in residential projects",
    isStandard: false,
    keywords: ["residential", "home", "housing", "custom home"]
  },
  {
    code: "236220-COM",
    parentCode: "236220",
    level: 7,
    title: "Commercial General Contractor",
    description: "General contractors specializing in commercial projects",
    isStandard: false,
    keywords: ["commercial", "office", "retail", "warehouse"]
  },

  // Specialty Trade Contractors
  {
    code: "238",
    parentCode: "23",
    level: 3,
    title: "Specialty Trade Contractors",
    description: "Specialized construction trades",
    isStandard: true,
    keywords: ["trade", "specialty"]
  },

  {
    code: "2382",
    parentCode: "238",
    level: 4,
    title: "Building Equipment Contractors",
    description: "Installation of building systems",
    isStandard: true,
    keywords: ["equipment", "systems"]
  },

  {
    code: "238220",
    parentCode: "2382",
    level: 6,
    title: "Plumbing, Heating, and Air-Conditioning Contractors",
    description: "HVAC and plumbing contractors",
    isStandard: true,
    keywords: ["plumbing", "HVAC", "heating", "cooling", "air conditioning"]
  },

  {
    code: "238210",
    parentCode: "2382",
    level: 6,
    title: "Electrical Contractors and Other Wiring Installation Contractors",
    description: "Electrical contractors",
    isStandard: true,
    keywords: ["electrical", "electrician", "wiring"]
  },

  // ========================================================================
  // SECTOR 72: ACCOMMODATION AND FOOD SERVICES
  // ========================================================================
  {
    code: "72",
    parentCode: null,
    level: 2,
    title: "Accommodation and Food Services",
    description: "Hotels, restaurants, and food services",
    isStandard: true,
    keywords: []
  },

  {
    code: "722",
    parentCode: "72",
    level: 3,
    title: "Food Services and Drinking Places",
    description: "Restaurants and food service establishments",
    isStandard: true,
    keywords: ["restaurant", "food", "dining"]
  },

  {
    code: "722513",
    parentCode: "722",
    level: 6,
    title: "Limited-Service Restaurants",
    description: "Quick service and fast casual restaurants",
    isStandard: true,
    keywords: ["restaurant", "fast food", "quick service", "cafe"]
  },

  {
    code: "722511",
    parentCode: "722",
    level: 6,
    title: "Full-Service Restaurants",
    description: "Full-service dining establishments",
    isStandard: true,
    keywords: ["restaurant", "dining", "full service"]
  },

  {
    code: "722515",
    parentCode: "722",
    level: 6,
    title: "Snack and Nonalcoholic Beverage Bars",
    description: "Coffee shops, juice bars, ice cream shops",
    isStandard: true,
    keywords: ["coffee", "cafe", "bakery", "juice", "smoothie"]
  },

  // ========================================================================
  // SECTOR 62: HEALTH CARE AND SOCIAL ASSISTANCE
  // ========================================================================
  {
    code: "62",
    parentCode: null,
    level: 2,
    title: "Health Care and Social Assistance",
    description: "Healthcare services and social assistance",
    isStandard: true,
    keywords: []
  },

  {
    code: "621",
    parentCode: "62",
    level: 3,
    title: "Ambulatory Health Care Services",
    description: "Outpatient healthcare services",
    isStandard: true,
    keywords: ["healthcare", "medical", "clinic"]
  },

  {
    code: "621111",
    parentCode: "621",
    level: 6,
    title: "Offices of Physicians (except Mental Health Specialists)",
    description: "Medical practices and physician offices",
    isStandard: true,
    keywords: [
      "doctor", "physician", "medical practice", "clinic", "medical clinic",
      "health clinic", "healthcare provider", "primary care", "family medicine",
      "urgent care", "medical center", "regional clinic", "patient care",
      "medical group", "health center", "family practice", "internal medicine",
      "pediatrics", "medical services", "healthcare services", "outpatient care",
      "medical office", "doctors office", "physician practice"
    ]
  },

  {
    code: "621210",
    parentCode: "621",
    level: 6,
    title: "Offices of Dentists",
    description: "Dental practices",
    isStandard: true,
    keywords: [
      "dentist", "dental", "orthodontist", "dental practice", "dental office",
      "dental clinic", "oral health", "teeth", "dentistry", "family dentistry",
      "cosmetic dentistry", "dental care", "orthodontics", "dental surgeon"
    ]
  },

  {
    code: "621310",
    parentCode: "621",
    level: 6,
    title: "Offices of Chiropractors",
    description: "Chiropractic practices",
    isStandard: true,
    keywords: [
      "chiropractor", "chiropractic", "chiropractic care", "spinal adjustment",
      "back pain", "spine", "chiropractic clinic", "wellness center"
    ]
  },

  {
    code: "621330",
    parentCode: "621",
    level: 6,
    title: "Offices of Mental Health Practitioners (except Physicians)",
    description: "Therapists, counselors, psychologists",
    isStandard: true,
    keywords: [
      "therapist", "counselor", "psychologist", "mental health", "therapy",
      "counseling", "psychotherapy", "behavioral health", "mental wellness",
      "psychology practice", "licensed therapist", "marriage counselor",
      "family therapy", "anxiety", "depression", "mental health services"
    ]
  },

  // ========================================================================
  // SECTOR 71: ARTS, ENTERTAINMENT, AND RECREATION
  // ========================================================================
  {
    code: "71",
    parentCode: null,
    level: 2,
    title: "Arts, Entertainment, and Recreation",
    description: "Entertainment, recreation, and arts services",
    isStandard: true,
    keywords: []
  },

  {
    code: "713",
    parentCode: "71",
    level: 3,
    title: "Amusement, Gambling, and Recreation Industries",
    description: "Recreation and fitness facilities",
    isStandard: true,
    keywords: ["recreation", "fitness", "entertainment"]
  },

  {
    code: "713940",
    parentCode: "713",
    level: 6,
    title: "Fitness and Recreational Sports Centers",
    description: "Gyms, fitness centers, yoga studios",
    isStandard: true,
    keywords: ["gym", "fitness", "yoga", "personal trainer", "studio"]
  },

  // ========================================================================
  // SECTOR 44-45: RETAIL TRADE
  // ========================================================================
  {
    code: "44",
    parentCode: null,
    level: 2,
    title: "Retail Trade",
    description: "Stores selling merchandise to consumers",
    isStandard: true,
    keywords: ["retail", "store", "shop"]
  },

  // Subsector: Sporting Goods, Hobby, Musical Instrument, and Book Stores
  {
    code: "451",
    parentCode: "44",
    level: 3,
    title: "Sporting Goods, Hobby, Musical Instrument, and Book Stores",
    description: "Specialized retail stores",
    isStandard: true,
    keywords: ["sporting", "hobby", "music", "book"]
  },

  // Industry Group: Musical Instrument and Supplies Stores
  {
    code: "4511",
    parentCode: "451",
    level: 4,
    title: "Sporting Goods, Hobby, and Musical Instrument Stores",
    description: "Retail stores selling sporting goods, hobbies, and musical instruments",
    isStandard: true,
    keywords: ["sporting", "hobby", "instrument", "music"]
  },

  {
    code: "451140",
    parentCode: "4511",
    level: 6,
    title: "Musical Instrument and Supplies Retailers",
    description: "Stores selling musical instruments, sheet music, and related supplies",
    isStandard: true,
    keywords: ["musical instrument", "music store", "guitar", "piano", "sheet music", "music shop"]
  },

  // Industry Group: Book and Music Stores
  {
    code: "4512",
    parentCode: "451",
    level: 4,
    title: "Book Stores and News Dealers",
    description: "Retail stores selling books, periodicals, and music",
    isStandard: true,
    keywords: ["book", "music", "record", "cd", "vinyl"]
  },

  {
    code: "451220",
    parentCode: "4512",
    level: 6,
    title: "Prerecorded Tape, Compact Disc, and Record Stores",
    description: "Stores selling new and used music recordings including vinyl records, CDs, tapes",
    isStandard: true,
    keywords: ["record store", "record shop", "vinyl", "cd store", "music store", "records", "albums", "cds", "tapes", "music shop"]
  },

  // Subsector: General Merchandise Stores
  {
    code: "452",
    parentCode: "44",
    level: 3,
    title: "General Merchandise Stores",
    description: "Department stores and warehouse clubs",
    isStandard: true,
    keywords: ["department", "merchandise", "general store"]
  },

  // Subsector: Food and Beverage Stores
  {
    code: "445",
    parentCode: "44",
    level: 3,
    title: "Food and Beverage Retailers",
    description: "Grocery stores, supermarkets, and specialty food retailers",
    isStandard: true,
    keywords: ["grocery", "supermarket", "food", "beverage", "market"]
  },

  {
    code: "445110",
    parentCode: "445",
    level: 6,
    title: "Supermarkets and Other Grocery Retailers",
    description: "Grocery stores and supermarkets",
    isStandard: true,
    keywords: ["grocery", "supermarket", "food store", "market"]
  },

  // Subsector: Clothing and Accessories Stores
  {
    code: "448",
    parentCode: "44",
    level: 3,
    title: "Clothing and Clothing Accessories Retailers",
    description: "Stores selling clothing and fashion accessories",
    isStandard: true,
    keywords: ["clothing", "apparel", "fashion", "boutique"]
  },

  {
    code: "448110",
    parentCode: "448",
    level: 6,
    title: "Men's Clothing Stores",
    description: "Retail stores selling men's clothing",
    isStandard: true,
    keywords: ["men's clothing", "menswear"]
  },

  {
    code: "448120",
    parentCode: "448",
    level: 6,
    title: "Women's Clothing Stores",
    description: "Retail stores selling women's clothing",
    isStandard: true,
    keywords: ["women's clothing", "womenswear", "boutique"]
  },

  {
    code: "448140",
    parentCode: "448",
    level: 6,
    title: "Family Clothing Stores",
    description: "Retail stores selling clothing for all family members",
    isStandard: true,
    keywords: ["family clothing", "clothing store"]
  },

  // ========================================================================
  // SECTOR 53: REAL ESTATE
  // ========================================================================
  {
    code: "53",
    parentCode: null,
    level: 2,
    title: "Real Estate and Rental and Leasing",
    description: "Real estate activities including sales, leasing, and management",
    isStandard: true,
    keywords: ["real estate", "property", "realtor"]
  },

  {
    code: "531",
    parentCode: "53",
    level: 3,
    title: "Real Estate",
    description: "Real estate agents, brokers, and property managers",
    isStandard: true,
    keywords: ["real estate", "realtor", "property"]
  },

  {
    code: "531210",
    parentCode: "531",
    level: 6,
    title: "Offices of Real Estate Agents and Brokers",
    description: "Real estate agents and brokers who sell, buy, rent, and appraise real estate",
    isStandard: true,
    keywords: ["realtor", "real estate agent", "real estate broker", "property sales", "home sales", "commercial real estate"]
  },

  {
    code: "531311",
    parentCode: "531",
    level: 6,
    title: "Residential Property Managers",
    description: "Managing residential real estate properties for others",
    isStandard: true,
    keywords: ["property management", "property manager", "residential property", "apartment management", "rental management"]
  },

  {
    code: "531312",
    parentCode: "531",
    level: 6,
    title: "Nonresidential Property Managers",
    description: "Managing commercial and industrial properties for others",
    isStandard: true,
    keywords: ["commercial property management", "office building management", "industrial property"]
  },

  // ========================================================================
  // SECTOR 52: FINANCE AND INSURANCE
  // ========================================================================
  {
    code: "52",
    parentCode: null,
    level: 2,
    title: "Finance and Insurance",
    description: "Financial services and insurance",
    isStandard: true,
    keywords: ["finance", "insurance", "financial"]
  },

  {
    code: "524",
    parentCode: "52",
    level: 3,
    title: "Insurance Carriers and Related Activities",
    description: "Insurance agencies, brokers, and related services",
    isStandard: true,
    keywords: ["insurance", "insurance agent", "broker"]
  },

  {
    code: "524210",
    parentCode: "524",
    level: 6,
    title: "Insurance Agencies and Brokerages",
    description: "Independent insurance agents and brokers",
    isStandard: true,
    keywords: ["insurance agent", "insurance agency", "insurance broker", "auto insurance", "home insurance", "life insurance", "health insurance"]
  },

  {
    code: "523",
    parentCode: "52",
    level: 3,
    title: "Securities, Commodity Contracts, and Other Financial Investments",
    description: "Investment advisors and financial planning",
    isStandard: true,
    keywords: ["investment", "financial advisor", "wealth management"]
  },

  {
    code: "523930",
    parentCode: "523",
    level: 6,
    title: "Investment Advice",
    description: "Financial planning and investment advisory services",
    isStandard: true,
    keywords: ["financial advisor", "financial planner", "investment advisor", "wealth management", "retirement planning"]
  },

  {
    code: "522",
    parentCode: "52",
    level: 3,
    title: "Credit Intermediation and Related Activities",
    description: "Mortgage brokers, loan brokers, and credit services",
    isStandard: true,
    keywords: ["mortgage", "loan", "lending", "credit"]
  },

  {
    code: "522310",
    parentCode: "522",
    level: 6,
    title: "Mortgage and Nonmortgage Loan Brokers",
    description: "Arranging loans between borrowers and lenders",
    isStandard: true,
    keywords: ["mortgage broker", "loan broker", "home loan", "mortgage lender"]
  },

  // ========================================================================
  // SECTOR 81: OTHER SERVICES (EXCEPT PUBLIC ADMINISTRATION)
  // ========================================================================
  {
    code: "81",
    parentCode: null,
    level: 2,
    title: "Other Services (except Public Administration)",
    description: "Personal care, repair, and maintenance services",
    isStandard: true,
    keywords: ["repair", "personal care", "service"]
  },

  {
    code: "811",
    parentCode: "81",
    level: 3,
    title: "Repair and Maintenance",
    description: "Automotive, electronic, and personal goods repair",
    isStandard: true,
    keywords: ["repair", "maintenance", "auto", "mechanic"]
  },

  {
    code: "811111",
    parentCode: "811",
    level: 6,
    title: "General Automotive Repair",
    description: "Auto repair shops providing general mechanical repairs",
    isStandard: true,
    keywords: ["auto repair", "car repair", "mechanic", "automotive service", "auto shop", "brake repair", "oil change"]
  },

  {
    code: "811121",
    parentCode: "811",
    level: 6,
    title: "Automotive Body, Paint, and Interior Repair and Maintenance",
    description: "Auto body shops, paint shops, and collision repair",
    isStandard: true,
    keywords: ["auto body", "collision repair", "paint shop", "body shop", "dent repair"]
  },

  {
    code: "812",
    parentCode: "81",
    level: 3,
    title: "Personal and Laundry Services",
    description: "Salons, spas, dry cleaning, pet care",
    isStandard: true,
    keywords: ["salon", "spa", "dry cleaning", "pet"]
  },

  {
    code: "812111",
    parentCode: "812",
    level: 6,
    title: "Barber Shops",
    description: "Traditional barbershops providing hair cutting services",
    isStandard: true,
    keywords: ["barber", "barbershop", "haircut", "men's haircut"]
  },

  {
    code: "812112",
    parentCode: "812",
    level: 6,
    title: "Beauty Salons",
    description: "Hair salons, beauty salons, and styling services",
    isStandard: true,
    keywords: ["salon", "hair salon", "beauty salon", "hairstylist", "hair stylist", "beauty", "haircut"]
  },

  {
    code: "812113",
    parentCode: "812",
    level: 6,
    title: "Nail Salons",
    description: "Nail care services including manicures and pedicures",
    isStandard: true,
    keywords: ["nail salon", "manicure", "pedicure", "nails", "nail technician"]
  },

  {
    code: "812191",
    parentCode: "812",
    level: 6,
    title: "Diet and Weight Reducing Centers",
    description: "Weight loss centers and diet programs",
    isStandard: true,
    keywords: ["weight loss", "diet center", "nutrition", "weight management"]
  },

  {
    code: "812910",
    parentCode: "812",
    level: 6,
    title: "Pet Care (except Veterinary) Services",
    description: "Pet grooming, boarding, training, and sitting services",
    isStandard: true,
    keywords: ["pet grooming", "dog grooming", "pet boarding", "pet sitting", "dog training", "pet daycare", "kennel"]
  },

  {
    code: "812320",
    parentCode: "812",
    level: 6,
    title: "Drycleaning and Laundry Services",
    description: "Dry cleaning and laundry services",
    isStandard: true,
    keywords: ["dry cleaning", "laundry", "dry cleaner", "laundry service"]
  },

  // ========================================================================
  // SECTOR 56: ADMINISTRATIVE AND SUPPORT SERVICES
  // ========================================================================
  {
    code: "56",
    parentCode: null,
    level: 2,
    title: "Administrative and Support and Waste Management and Remediation Services",
    description: "Support services for businesses and organizations",
    isStandard: true,
    keywords: ["administrative", "support", "services"]
  },

  {
    code: "561",
    parentCode: "56",
    level: 3,
    title: "Administrative and Support Services",
    description: "Business support services",
    isStandard: true,
    keywords: ["administrative", "support", "business services"]
  },

  {
    code: "561730",
    parentCode: "561",
    level: 6,
    title: "Landscaping Services",
    description: "Lawn care, landscape maintenance, and design services",
    isStandard: true,
    keywords: ["landscaping", "lawn care", "landscape design", "lawn maintenance", "tree service", "yard maintenance"]
  },

  {
    code: "561720",
    parentCode: "561",
    level: 6,
    title: "Janitorial Services",
    description: "Cleaning services for commercial and residential properties",
    isStandard: true,
    keywords: ["cleaning service", "janitorial", "commercial cleaning", "office cleaning", "maid service", "house cleaning"]
  },

  {
    code: "561621",
    parentCode: "561",
    level: 6,
    title: "Security Systems Services (except Locksmiths)",
    description: "Security system installation and monitoring",
    isStandard: true,
    keywords: ["security systems", "alarm systems", "home security", "security monitoring"]
  },

  // ========================================================================
  // SECTOR 61: EDUCATIONAL SERVICES
  // ========================================================================
  {
    code: "61",
    parentCode: null,
    level: 2,
    title: "Educational Services",
    description: "Schools, training centers, and educational support",
    isStandard: true,
    keywords: ["education", "training", "school", "tutoring"]
  },

  {
    code: "611",
    parentCode: "61",
    level: 3,
    title: "Educational Services",
    description: "Educational instruction and training",
    isStandard: true,
    keywords: ["education", "training", "instruction"]
  },

  {
    code: "611110",
    parentCode: "611",
    level: 6,
    title: "Elementary and Secondary Schools",
    description: "Private elementary, middle, and high schools",
    isStandard: true,
    keywords: ["private school", "elementary school", "high school", "middle school", "academy"]
  },

  {
    code: "611430",
    parentCode: "611",
    level: 6,
    title: "Professional and Management Development Training",
    description: "Corporate training and professional development",
    isStandard: true,
    keywords: ["corporate training", "professional development", "business training", "leadership training"]
  },

  {
    code: "611691",
    parentCode: "611",
    level: 6,
    title: "Exam Preparation and Tutoring",
    description: "Academic tutoring and test preparation services",
    isStandard: true,
    keywords: ["tutoring", "tutor", "test prep", "SAT prep", "academic tutoring", "math tutor", "reading tutor"]
  },

  {
    code: "611620",
    parentCode: "611",
    level: 6,
    title: "Sports and Recreation Instruction",
    description: "Sports lessons, camps, and instructional programs",
    isStandard: true,
    keywords: ["sports instruction", "sports lessons", "tennis lessons", "swim lessons", "martial arts", "dance lessons", "music lessons"]
  },
];

/**
 * Get NAICS code by code string
 */
export function getNAICSCode(code: string): NAICSCode | undefined {
  return NAICS_CODES.find(n => n.code === code);
}

/**
 * Get hierarchy for a NAICS code
 * Returns array from sector to specific code
 */
export function getNAICSHierarchy(code: string): string[] {
  const hierarchy: string[] = [];
  let current: NAICSCode | undefined = getNAICSCode(code);

  while (current) {
    hierarchy.unshift(current.code);
    if (!current.parentCode) break;
    current = getNAICSCode(current.parentCode);
  }

  return hierarchy;
}

/**
 * Search NAICS codes by keywords
 */
export function searchNAICSByKeywords(keywords: string[]): NAICSCode[] {
  const matches: { code: NAICSCode; score: number }[] = [];

  // Filter to ensure all keywords are valid strings
  const validKeywords = keywords
    .filter(k => typeof k === 'string' && k.length > 0)
    .map(k => k.toLowerCase());

  if (validKeywords.length === 0) {
    return [];
  }

  for (const naicsCode of NAICS_CODES) {
    if (!naicsCode.keywords || naicsCode.keywords.length === 0) continue;

    let score = 0;
    for (const keyword of validKeywords) {
      for (const naicsKeyword of naicsCode.keywords) {
        const naicsLower = typeof naicsKeyword === 'string' ? naicsKeyword.toLowerCase() : '';
        if (naicsLower.includes(keyword) || keyword.includes(naicsLower)) {
          score++;
        }
      }
    }

    if (score > 0) {
      matches.push({ code: naicsCode, score });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  return matches.map(m => m.code);
}

/**
 * Get all custom sub-industries for a parent code
 */
export function getCustomSubIndustries(parentCode: string): NAICSCode[] {
  return NAICS_CODES.filter(
    n => n.parentCode === parentCode && !n.isStandard
  );
}

/**
 * Search NAICS codes by text query (searches title and keywords)
 * Returns detailed industries (level 6+) sorted by relevance
 */
export function searchNAICSByText(query: string): NAICSCode[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();
  const matches: { code: NAICSCode; score: number }[] = [];

  for (const naicsCode of NAICS_CODES) {
    // Only return detailed industries (level 6+) and custom sub-industries
    if (naicsCode.level < 6) continue;

    let score = 0;
    const title = naicsCode.title.toLowerCase();
    const description = naicsCode.description.toLowerCase();

    // Exact title match (highest score)
    if (title === searchTerm) {
      score += 100;
    }
    // Title starts with search term
    else if (title.startsWith(searchTerm)) {
      score += 50;
    }
    // Title contains search term
    else if (title.includes(searchTerm)) {
      score += 30;
    }

    // Description contains search term
    if (description.includes(searchTerm)) {
      score += 10;
    }

    // Keyword matches
    if (naicsCode.keywords) {
      for (const keyword of naicsCode.keywords) {
        const keywordLower = keyword.toLowerCase();
        if (keywordLower === searchTerm) {
          score += 40;
        } else if (keywordLower.includes(searchTerm) || searchTerm.includes(keywordLower)) {
          score += 20;
        }
      }
    }

    if (score > 0) {
      matches.push({ code: naicsCode, score });
    }
  }

  // Sort by score descending, limit to top 10
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 10).map(m => m.code);
}
