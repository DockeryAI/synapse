// Intelligence types stub
export interface IntelligenceData {
  id: string
  type: string
  data: any
}

export interface OpportunityData {
  id: string
  title: string
  score: number
}

export interface TrendData {
  keyword: string
  volume: number
  trending: boolean
}
