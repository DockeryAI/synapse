/**
 * Website Analyzer Service
 *
 * Performs deep website scanning to extract services, benefits, and unique aspects
 * for more personalized UVP suggestions
 */

import { supabase } from '@/lib/supabase'
import { scrapeWebsite } from '@/services/scraping/websiteScraper'

export interface WebsiteAnalysis {
  services: string[]
  products: string[]
  benefits: string[]
  differentiators: string[]
  target_audience: string[]
  problems_solved: string[]
  testimonials: string[]
  pricing_model?: string
  company_values: string[]
  unique_aspects: string[]
  content_themes: string[]
  keywords: string[]
  competitors_mentioned: string[]
  guarantees: string[]
  certifications: string[]
}

class WebsiteAnalyzer {
  /**
   * Perform deep analysis of website content
   */
  async analyzeWebsite(websiteUrl: string, brandId: string): Promise<WebsiteAnalysis | null> {
    console.log('[WebsiteAnalyzer] Starting deep analysis for:', websiteUrl)

    try {
      // First, check if we have recent cached analysis
      const { data: cached, error: cacheError } = await supabase
        .from('website_analyses')
        .select('*')
        .eq('brand_id', brandId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Within last 24 hours
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (cached && !cacheError) {
        console.log('[WebsiteAnalyzer] Using cached analysis from:', cached.created_at)
        return cached.analysis as WebsiteAnalysis
      }

      // Perform new analysis using AI service
      const analysis = await this.performDeepScan(websiteUrl)

      // Cache the results
      if (analysis) {
        await supabase
          .from('website_analyses')
          .upsert({
            brand_id: brandId,
            website_url: websiteUrl,
            analysis: analysis,
            created_at: new Date().toISOString()
          })
      }

      return analysis
    } catch (error) {
      console.error('[WebsiteAnalyzer] Analysis failed:', error)
      return null
    }
  }

  /**
   * Perform the actual deep scan of website
   */
  private async performDeepScan(websiteUrl: string): Promise<WebsiteAnalysis | null> {
    console.log('[WebsiteAnalyzer] Performing deep scan of:', websiteUrl)

    try {
      // First, scrape the actual website content
      console.log('[WebsiteAnalyzer] Scraping website content...')
      const scrapedData = await scrapeWebsite(websiteUrl)

      if (!scrapedData) {
        console.error('[WebsiteAnalyzer] Failed to scrape website')
        return null
      }

      console.log('[WebsiteAnalyzer] Website scraped successfully:', {
        headings: scrapedData.content.headings.length,
        paragraphs: scrapedData.content.paragraphs.length,
        links: scrapedData.content.links.length
      })

      // Use OpenRouter AI to analyze the scraped content
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
      if (!apiKey) {
        console.error('[WebsiteAnalyzer] No OpenRouter API key found')
        return null
      }

      // Prepare content for analysis
      const websiteContent = {
        url: websiteUrl,
        title: scrapedData.metadata.title,
        description: scrapedData.metadata.description,
        keywords: scrapedData.metadata.keywords,
        headings: scrapedData.content.headings.slice(0, 30),
        paragraphs: scrapedData.content.paragraphs.slice(0, 50),
        navigation: scrapedData.structure.navigation,
        sections: scrapedData.structure.sections,
        links: scrapedData.content.links.slice(0, 30)
      }

      // Create a comprehensive prompt for website analysis
      const prompt = `Analyze this scraped website content for a business:

URL: ${websiteUrl}
Title: ${websiteContent.title}
Description: ${websiteContent.description}

HEADINGS ON THE SITE:
${websiteContent.headings.join('\n')}

KEY CONTENT PARAGRAPHS:
${websiteContent.paragraphs.join('\n')}

NAVIGATION LINKS:
${websiteContent.navigation.join(', ')}

WEBSITE SECTIONS:
${websiteContent.sections.join(', ')}

Based on this ACTUAL website content, extract and return the following information in JSON format:
{
  "services": ["list of specific services mentioned on the website"],
  "products": ["list of specific products if any"],
  "benefits": ["key benefits they highlight to customers"],
  "differentiators": ["what makes them unique/different from competitors"],
  "target_audience": ["who their ideal customers are based on the content"],
  "problems_solved": ["specific problems they say they address"],
  "testimonials": ["key testimonial themes or actual quotes if found"],
  "pricing_model": "how they price their services/products (if mentioned)",
  "company_values": ["core values they explicitly mention"],
  "unique_aspects": ["unique aspects of their business from the content"],
  "content_themes": ["main recurring themes in their content"],
  "keywords": ["important keywords they frequently use"],
  "competitors_mentioned": ["any competitors they reference"],
  "guarantees": ["any guarantees or promises they make"],
  "certifications": ["certifications, awards, or credentials mentioned"]
}

IMPORTANT: Extract ONLY what is actually present in the content above. Do NOT make assumptions.
If information is not found in the content, use empty arrays [] or null.
Be specific and use the actual wording from the website where possible.`

      // Call OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'MARBA Website Analyzer',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-opus-4.1',
          messages: [
            {
              role: 'system',
              content: 'You are a website analysis assistant. Analyze websites and extract specific business information. Always return valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        console.error('[WebsiteAnalyzer] API request failed:', response.status)
        return null
      }

      const data = await response.json()
      const content = data.choices[0].message.content

      // Parse the JSON response
      let analysis: WebsiteAnalysis
      try {
        // Try to extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0])
        } else {
          analysis = JSON.parse(content)
        }
      } catch (parseError) {
        console.error('[WebsiteAnalyzer] Failed to parse AI response:', parseError)
        // Return basic structure with empty data
        analysis = {
          services: [],
          products: [],
          benefits: [],
          differentiators: [],
          target_audience: [],
          problems_solved: [],
          testimonials: [],
          pricing_model: undefined,
          company_values: [],
          unique_aspects: [],
          content_themes: [],
          keywords: [],
          competitors_mentioned: [],
          guarantees: [],
          certifications: []
        }
      }

      console.log('[WebsiteAnalyzer] Extraction complete:', {
        services: analysis.services?.length || 0,
        products: analysis.products?.length || 0,
        benefits: analysis.benefits?.length || 0,
        differentiators: analysis.differentiators?.length || 0
      })

      return analysis
    } catch (error) {
      console.error('[WebsiteAnalyzer] Deep scan failed:', error)
      return null
    }
  }

  /**
   * Extract services from website content
   */
  extractServices(content: string): string[] {
    const services: string[] = []

    // Common service indicators
    const servicePatterns = [
      /(?:we offer|we provide|our services include)\s+([^.]+)/gi,
      /(?:specializing in|specialized in)\s+([^.]+)/gi,
      /(?:services?:\s*)((?:[^.]+(?:,|\band\b))+[^.]+)/gi
    ]

    servicePatterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          // Clean and split services
          const extracted = match[1]
            .split(/[,;]|\band\b/i)
            .map(s => s.trim())
            .filter(s => s.length > 5 && s.length < 100)

          services.push(...extracted)
        }
      }
    })

    // Remove duplicates and clean
    return [...new Set(services)]
      .map(s => this.cleanExtractedText(s))
      .filter(s => s.length > 0)
  }

  /**
   * Extract benefits from website content
   */
  extractBenefits(content: string): string[] {
    const benefits: string[] = []

    const benefitPatterns = [
      /(?:you'll|you will|customers?|clients?)\s+(?:get|receive|enjoy|benefit from)\s+([^.]+)/gi,
      /(?:save|reduce|increase|improve|enhance)\s+(?:your\s+)?([^.]+)/gi,
      /(?:results? in|leads? to|delivers?)\s+([^.]+)/gi
    ]

    benefitPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          const benefit = this.cleanExtractedText(match[1])
          if (benefit.length > 10 && benefit.length < 150) {
            benefits.push(benefit)
          }
        }
      }
    })

    return [...new Set(benefits)]
  }

  /**
   * Clean extracted text
   */
  private cleanExtractedText(text: string): string {
    return text
      .replace(/[\n\r\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^[,.\s]+|[,.\s]+$/g, '')
      .trim()
  }
}

export const websiteAnalyzer = new WebsiteAnalyzer()