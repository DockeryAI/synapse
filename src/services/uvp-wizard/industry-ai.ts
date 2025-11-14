/**
 * Industry-Specific AI Service for UVP Wizard
 *
 * Generates contextual, industry-specific suggestions using OpenAI
 * Falls back to smart industry templates if API is unavailable
 */

import { DraggableSuggestion, SuggestionType } from '@/types/uvp-wizard'

interface IndustryContext {
  industry?: string
  brandName?: string
  website?: string
  competitors?: string[]
}

class IndustryAI {
  private apiKey: string
  private endpoint = 'https://api.openai.com/v1/chat/completions'

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || ''
  }

  /**
   * Generate industry-specific customer segments
   */
  async generateCustomerSegments(context: IndustryContext): Promise<DraggableSuggestion[]> {
    const industry = context.industry || 'Real Estate'

    try {
      if (this.apiKey) {
        const prompt = `For a ${industry} business${context.brandName ? ` like ${context.brandName}` : ''}, suggest 5 specific target customer segments. Each should be 1-2 sentences describing demographics, needs, and pain points. Format as a JSON array of strings.`

        const suggestions = await this.callOpenAI(prompt)
        return this.formatSuggestions(suggestions, 'customer-segment')
      }
    } catch (error) {
      console.warn('[IndustryAI] API failed, using smart fallback:', error)
    }

    // Smart industry-specific fallback
    return this.getIndustryCustomerSegments(industry)
  }

  /**
   * Generate industry-specific problems
   */
  async generateCustomerProblems(
    context: IndustryContext,
    targetCustomer: string
  ): Promise<DraggableSuggestion[]> {
    const industry = context.industry || 'Real Estate'

    try {
      if (this.apiKey) {
        const prompt = `For ${targetCustomer} in the ${industry} industry, what are 5 specific problems or pain points they face? Each should be 1-2 sentences describing a real challenge. Format as a JSON array of strings.`

        const suggestions = await this.callOpenAI(prompt)
        return this.formatSuggestions(suggestions, 'problem')
      }
    } catch (error) {
      console.warn('[IndustryAI] API failed, using smart fallback:', error)
    }

    return this.getIndustryProblems(industry)
  }

  /**
   * Generate industry-specific solutions
   */
  async generateSolutions(
    context: IndustryContext,
    problem: string
  ): Promise<DraggableSuggestion[]> {
    const industry = context.industry || 'Real Estate'

    try {
      if (this.apiKey) {
        const prompt = `For this problem in the ${industry} industry: "${problem}", suggest 5 innovative solutions. Each should be 1-2 sentences describing how it solves the problem. Format as a JSON array of strings.`

        const suggestions = await this.callOpenAI(prompt)
        return this.formatSuggestions(suggestions, 'solution')
      }
    } catch (error) {
      console.warn('[IndustryAI] API failed, using smart fallback:', error)
    }

    return this.getIndustrySolutions(industry)
  }

  /**
   * Generate industry-specific benefits
   */
  async generateKeyBenefits(
    context: IndustryContext,
    solution: string
  ): Promise<DraggableSuggestion[]> {
    const industry = context.industry || 'Real Estate'

    try {
      if (this.apiKey) {
        const prompt = `For this solution in the ${industry} industry: "${solution}", what are 5 measurable benefits customers will experience? Each should be specific and quantifiable. Format as a JSON array of strings.`

        const suggestions = await this.callOpenAI(prompt)
        return this.formatSuggestions(suggestions, 'benefit')
      }
    } catch (error) {
      console.warn('[IndustryAI] API failed, using smart fallback:', error)
    }

    return this.getIndustryBenefits(industry)
  }

  /**
   * Generate industry-specific differentiators
   */
  async generateDifferentiators(
    context: IndustryContext
  ): Promise<DraggableSuggestion[]> {
    const industry = context.industry || 'Real Estate'

    try {
      if (this.apiKey) {
        const prompt = `For a ${industry} business${context.brandName ? ` like ${context.brandName}` : ''}, suggest 5 unique differentiators that would set them apart from competitors. Each should be specific and defendable. Format as a JSON array of strings.`

        const suggestions = await this.callOpenAI(prompt)
        return this.formatSuggestions(suggestions, 'differentiator')
      }
    } catch (error) {
      console.warn('[IndustryAI] API failed, using smart fallback:', error)
    }

    return this.getIndustryDifferentiators(industry)
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string[]> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a marketing strategist helping create value propositions. Provide specific, actionable suggestions based on industry best practices. Always respond with a JSON array of exactly 5 strings.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    try {
      return JSON.parse(content)
    } catch {
      // Fallback parsing if not valid JSON
      return content
        .split('\n')
        .filter((line: string) => line.trim().length > 10)
        .map((line: string) => line.replace(/^[\d.-]+\s*/, '').replace(/^["']|["']$/g, '').trim())
        .slice(0, 5)
    }
  }

  /**
   * Format suggestions
   */
  private formatSuggestions(
    content: string[],
    type: SuggestionType
  ): DraggableSuggestion[] {
    return content.map((text, index) => ({
      id: `${type}-ai-${Date.now()}-${index}`,
      content: text,
      type,
      source: 'ai-generated',
      confidence: 0.95,
      is_selected: false,
      is_customizable: true
    }))
  }

  /**
   * Get industry-specific customer segments (smart fallback)
   */
  private getIndustryCustomerSegments(industry: string): DraggableSuggestion[] {
    const segments: Record<string, string[]> = {
      'Real Estate': [
        "First-time homebuyers aged 25-35 looking for affordable starter homes in safe neighborhoods with good schools",
        "Real estate investors seeking multi-family properties with positive cash flow potential in growing markets",
        "Empty nesters downsizing from large family homes to luxury condos with amenities and minimal maintenance",
        "Corporate relocation specialists managing housing needs for employees moving to new cities",
        "Property managers overseeing 10-50 residential units who need efficient tenant screening and maintenance systems"
      ],
      'Technology': [
        "SaaS startups with 10-50 employees needing scalable infrastructure without dedicated IT staff",
        "Enterprise CTOs managing digital transformation initiatives with legacy system constraints",
        "Mobile app developers seeking cross-platform development tools with native performance",
        "E-commerce businesses processing 1000+ orders daily needing automated fulfillment solutions",
        "Data scientists at mid-size companies requiring collaborative ML model development platforms"
      ],
      'Healthcare': [
        "Private practice physicians with 2-10 providers seeking HIPAA-compliant practice management software",
        "Hospital administrators managing 100+ bed facilities focused on reducing readmission rates",
        "Telehealth platforms connecting patients with specialists across state lines",
        "Medical device manufacturers navigating FDA approval processes for Class II devices",
        "Home health agencies coordinating care for 50+ elderly patients with chronic conditions"
      ],
      'default': [
        "Small business owners with 5-20 employees seeking operational efficiency",
        "Department managers at mid-size companies looking to optimize team performance",
        "Independent professionals wanting to scale their service offerings",
        "Startup founders needing cost-effective growth solutions",
        "Enterprise teams requiring better collaboration tools"
      ]
    }

    const suggestions = segments[industry] || segments['default']
    return this.formatSuggestions(suggestions, 'customer-segment')
  }

  /**
   * Get industry-specific problems (smart fallback)
   */
  private getIndustryProblems(industry: string): DraggableSuggestion[] {
    const problems: Record<string, string[]> = {
      'Real Estate': [
        "Spending 15+ hours per week on paperwork and administrative tasks instead of selling properties",
        "Losing potential clients to competitors who respond faster to online inquiries and showing requests",
        "Struggling to accurately price properties in rapidly changing markets with limited comparable data",
        "Managing multiple communication channels with clients, lenders, inspectors, and attorneys inefficiently",
        "Missing out on referral opportunities due to inconsistent follow-up with past clients"
      ],
      'Technology': [
        "Development teams wasting 30% of time on manual deployment and testing processes",
        "Customer data scattered across 5+ different systems making unified analytics impossible",
        "Security vulnerabilities going undetected until production causing costly breaches",
        "Technical debt slowing new feature development by 40% or more",
        "Inability to scale infrastructure quickly during traffic spikes leading to downtime"
      ],
      'Healthcare': [
        "Patients waiting 3+ weeks for appointments leading to worsening conditions and ER visits",
        "Medical errors from illegible handwriting and disconnected patient records systems",
        "Insurance claim denials due to coding errors costing practices $125k+ annually",
        "Staff burnout from repetitive administrative tasks reducing quality of patient care",
        "HIPAA compliance violations risking penalties up to $1.5 million per incident"
      ],
      'default': [
        "Wasting 10+ hours weekly on repetitive manual tasks that could be automated",
        "Losing track of important customer interactions across multiple platforms",
        "Making decisions based on gut feeling instead of data-driven insights",
        "Struggling to maintain consistent quality as the business scales",
        "Missing growth opportunities due to lack of market visibility"
      ]
    }

    const suggestions = problems[industry] || problems['default']
    return this.formatSuggestions(suggestions, 'problem')
  }

  /**
   * Get industry-specific solutions (smart fallback)
   */
  private getIndustrySolutions(industry: string): DraggableSuggestion[] {
    const solutions: Record<string, string[]> = {
      'Real Estate': [
        "AI-powered CRM that automatically captures leads, schedules showings, and sends personalized follow-ups",
        "Virtual staging and 3D tour platform that lets buyers explore properties remotely 24/7",
        "Automated market analysis tool providing instant CMAs with accuracy within 3% of final sale price",
        "Integrated transaction management system connecting all parties with real-time document sharing",
        "Smart nurture campaigns that maintain touchpoints with past clients generating 40% more referrals"
      ],
      'Technology': [
        "CI/CD pipeline with automated testing reducing deployment time from hours to minutes",
        "Unified data platform consolidating all customer touchpoints into single source of truth",
        "AI-powered security scanning catching vulnerabilities before code reaches production",
        "Automated refactoring tools that modernize legacy code while maintaining functionality",
        "Auto-scaling cloud infrastructure that handles 10x traffic spikes seamlessly"
      ],
      'Healthcare': [
        "Online scheduling system with smart appointment slots reducing wait times to under 1 week",
        "Electronic health records with voice-to-text transcription eliminating handwriting errors",
        "AI-assisted coding verification reducing claim denials by 75% or more",
        "Workflow automation handling insurance verification, appointment reminders, and follow-ups",
        "Comprehensive compliance dashboard ensuring continuous HIPAA adherence"
      ],
      'default': [
        "All-in-one platform consolidating your entire workflow into a single interface",
        "AI-powered automation handling repetitive tasks while you focus on growth",
        "Real-time analytics dashboard providing actionable insights at a glance",
        "Scalable cloud infrastructure that grows seamlessly with your business",
        "Smart integration hub connecting all your existing tools effortlessly"
      ]
    }

    const suggestions = solutions[industry] || solutions['default']
    return this.formatSuggestions(suggestions, 'solution')
  }

  /**
   * Get industry-specific benefits (smart fallback)
   */
  private getIndustryBenefits(industry: string): DraggableSuggestion[] {
    const benefits: Record<string, string[]> = {
      'Real Estate': [
        "Close 30% more deals by responding to leads within 5 minutes instead of hours",
        "Save $50,000+ annually by reducing transaction coordinator and admin staff needs",
        "Increase average sale price by $15,000 through better market positioning and pricing",
        "Generate 25+ qualified referrals monthly through automated client nurture programs",
        "Reduce time-to-close from 45 to 30 days with streamlined document management"
      ],
      'Technology': [
        "Ship new features 3x faster with 90% fewer production bugs",
        "Reduce infrastructure costs by 40% through intelligent resource optimization",
        "Achieve 99.99% uptime even during Black Friday traffic surges",
        "Decrease customer churn by 25% with unified data insights",
        "Save $200,000+ annually on DevOps and IT staff requirements"
      ],
      'Healthcare': [
        "Increase patient capacity by 30% without adding staff or facilities",
        "Reduce medical errors by 95% through automated verification systems",
        "Collect 98% of insurance claims on first submission",
        "Improve patient satisfaction scores by 40+ points",
        "Save 20 hours per week on administrative tasks per provider"
      ],
      'default': [
        "Save 15+ hours per week on manual tasks through intelligent automation",
        "Increase revenue by 35% within 6 months through better insights",
        "Reduce operational costs by 40% while improving quality",
        "Scale operations 5x without proportional increase in overhead",
        "Achieve 95% customer satisfaction through consistent delivery"
      ]
    }

    const suggestions = benefits[industry] || benefits['default']
    return this.formatSuggestions(suggestions, 'benefit')
  }

  /**
   * Get industry-specific differentiators (smart fallback)
   */
  private getIndustryDifferentiators(industry: string): DraggableSuggestion[] {
    const differentiators: Record<string, string[]> = {
      'Real Estate': [
        "Only brokerage offering guaranteed response within 15 minutes, 24/7, or your commission is reduced",
        "Proprietary AI valuation model trained on 10 million+ transactions with 97% accuracy",
        "Full-service concierge handling everything from staging to moving coordination at no extra cost",
        "Exclusive off-market property network with 500+ listings not available anywhere else",
        "Performance guarantee: If your home doesn't sell in 60 days, we'll buy it ourselves"
      ],
      'Technology': [
        "Only platform built from ground up for your specific industry's compliance requirements",
        "Patented AI algorithm that learns from your data and improves accuracy by 2% monthly",
        "White-glove migration service with zero downtime and 100% data integrity guarantee",
        "Local data residency in 50+ countries ensuring compliance with all privacy regulations",
        "Unlimited free training and 24/7 support from actual engineers, not call centers"
      ],
      'Healthcare': [
        "Only solution approved by all major EHR systems with native bi-directional sync",
        "Medical-grade AI trained by board-certified physicians with 99.7% diagnostic accuracy",
        "Guaranteed Medicare/Medicaid compliance with automatic updates for regulation changes",
        "Direct integration with 5000+ insurance providers for instant eligibility verification",
        "On-site implementation team of former healthcare administrators who understand your workflow"
      ],
      'default': [
        "Only solution designed specifically for businesses exactly like yours",
        "Proprietary technology that delivers results 3x faster than alternatives",
        "Unconditional 90-day money-back guarantee with no questions asked",
        "Direct access to our leadership team for strategic guidance",
        "Transparent pricing with no hidden fees or surprise charges ever"
      ]
    }

    const suggestions = differentiators[industry] || differentiators['default']
    return this.formatSuggestions(suggestions, 'differentiator')
  }
}

export const industryAI = new IndustryAI()