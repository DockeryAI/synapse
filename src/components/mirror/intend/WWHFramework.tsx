/**
 * WWH Framework Component (Why, What, How)
 * Visualizes the Why/What/How framework for brand purpose
 * Core strategic foundation visualization
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Package, Lightbulb, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface WWHFrameworkProps {
  brandData?: any
}

export function WWHFramework({ brandData }: WWHFrameworkProps) {
  const [uvpData, setUVPData] = React.useState<any>(null)

  // Load UVP data from brand_uvps table
  React.useEffect(() => {
    const loadUVP = async () => {
      if (!brandData?.id) return

      const { data, error } = await supabase
        .from('brand_uvps')
        .select('*')
        .eq('brand_id', brandData.id)
        .maybeSingle()

      if (!error && data && data.is_complete) {
        console.log('[WWH] Loaded completed UVP:', data)
        setUVPData(data)
      }
    }

    loadUVP()
  }, [brandData?.id])

  // Extract from multiple possible locations
  const fullProfile = brandData?.full_profile_data || {}

  console.log('[WWH] brandData received:', brandData)
  console.log('[WWH] full_profile_data:', fullProfile)
  console.log('[WWH] uvpData:', uvpData)

  // WHY - Purpose & Belief
  // If UVP is complete, use it. Otherwise fallback to brand data
  const whyContent = uvpData
    ? `We exist to help ${uvpData.target_customer} overcome ${uvpData.customer_problem} and achieve ${uvpData.key_benefit}.`
    : fullProfile.mission ||
      fullProfile.vision ||
      fullProfile.brand_purpose ||
      brandData?.positioning_statement ||
      fullProfile.positioning_statement ||
      (fullProfile.overview && typeof fullProfile.overview === 'string' ? fullProfile.overview : null) ||
      'Your core purpose and reason for existing'

  const why = {
    title: 'WHY',
    subtitle: 'Purpose & Belief',
    content: whyContent,
    icon: Heart,
    color: 'from-yellow-500 to-amber-600',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
  }

  // HOW - Unique Approach
  // If UVP is complete, use differentiation. Otherwise fallback to brand data
  const howItems = uvpData && uvpData.differentiation
    ? [
        uvpData.differentiation,
        'Customer-centric approach',
        'Proven track record',
        'Continuous improvement'
      ]
    : fullProfile.uvps?.slice(0, 4) ||
      fullProfile.competitive_advantages?.slice(0, 4) ||
      fullProfile.differentiators?.slice(0, 4) ||
      fullProfile.brand_values?.slice(0, 4) ||
      brandData?.uvps?.slice(0, 4) ||
      ['Innovative solutions', 'Customer-first approach', 'Quality-driven', 'Data-informed decisions']

  const how = {
    title: 'HOW',
    subtitle: 'Unique Approach',
    items: howItems,
    icon: Lightbulb,
    color: 'from-blue-500 to-indigo-600',
    textColor: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
  }

  // WHAT - Products & Services
  // If UVP is complete, use unique_solution. Otherwise fallback to brand data
  const whatItems = uvpData && uvpData.unique_solution
    ? [
        uvpData.unique_solution,
        `Designed specifically for ${uvpData.target_customer || 'our customers'}`,
        `Delivers ${uvpData.key_benefit || 'exceptional value'}`,
      ]
    : fullProfile.offerings?.slice(0, 4) ||
      fullProfile.products_services?.slice(0, 4) ||
      fullProfile.value_propositions?.slice(0, 4) ||
      brandData?.content_pillars?.map((p: any) => p.title || p.name || p).slice(0, 4) ||
      fullProfile.content_pillars?.map((p: any) => p.title || p.name || p).slice(0, 4) ||
      ['Product/service offering 1', 'Product/service offering 2', 'Product/service offering 3']

  const what = {
    title: 'WHAT',
    subtitle: 'Products & Services',
    items: whatItems,
    icon: Package,
    color: 'from-green-500 to-emerald-600',
    textColor: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
  }

  console.log('[WWH] Extracted data:', { why: whyContent, how: howItems, what: whatItems })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Why, What, How
              {uvpData && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                  ✓ UVP Complete
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {uvpData
                ? 'Powered by your completed Unique Value Proposition'
                : 'Your brand purpose, approach, and offerings'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Visual Representation - Concentric Circles */}
        <div className="relative w-full aspect-square max-w-2xl mx-auto mb-8">
          {/* Outermost Circle - WHAT */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-100/50 to-emerald-100/50 dark:from-green-900/20 dark:to-emerald-900/20 flex items-center justify-center">
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${what.bgColor} ${what.textColor} font-semibold text-sm`}>
                  <what.icon className="h-4 w-4" />
                  {what.title}
                </div>
              </div>
            </div>

            {/* Middle Circle - HOW */}
            <div className="absolute inset-[15%] rounded-full bg-gradient-to-br from-blue-100/70 to-indigo-100/70 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
              <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${how.bgColor} ${how.textColor} font-semibold text-sm`}>
                    <how.icon className="h-4 w-4" />
                    {how.title}
                  </div>
                </div>
              </div>

              {/* Innermost Circle - WHY */}
              <div className="absolute inset-[20%] rounded-full bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 flex items-center justify-center p-6 shadow-lg">
                <div className="text-center space-y-2">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${why.bgColor} ${why.textColor} font-semibold text-sm mb-2`}>
                    <why.icon className="h-4 w-4" />
                    {why.title}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    {why.content}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* WHY Card */}
          <div className={`rounded-lg border-2 ${why.bgColor} border-yellow-200 dark:border-yellow-800 p-4 space-y-3`}>
            <div className="flex items-center gap-2">
              <div className={`rounded-full p-2 ${why.bgColor}`}>
                <why.icon className={`h-5 w-5 ${why.textColor}`} />
              </div>
              <div>
                <h4 className="font-semibold">{why.title}</h4>
                <p className="text-xs text-muted-foreground">{why.subtitle}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed">{why.content}</p>
          </div>

          {/* HOW Card */}
          <div className={`rounded-lg border-2 ${how.bgColor} border-blue-200 dark:border-blue-800 p-4 space-y-3`}>
            <div className="flex items-center gap-2">
              <div className={`rounded-full p-2 ${how.bgColor}`}>
                <how.icon className={`h-5 w-5 ${how.textColor}`} />
              </div>
              <div>
                <h4 className="font-semibold">{how.title}</h4>
                <p className="text-xs text-muted-foreground">{how.subtitle}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {how.items.map((item: string, index: number) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full ${how.bgColor} flex-shrink-0`} />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* WHAT Card */}
          <div className={`rounded-lg border-2 ${what.bgColor} border-green-200 dark:border-green-800 p-4 space-y-3`}>
            <div className="flex items-center gap-2">
              <div className={`rounded-full p-2 ${what.bgColor}`}>
                <what.icon className={`h-5 w-5 ${what.textColor}`} />
              </div>
              <div>
                <h4 className="font-semibold">{what.title}</h4>
                <p className="text-xs text-muted-foreground">{what.subtitle}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {what.items.map((item: string, index: number) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full ${what.bgColor} flex-shrink-0`} />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-muted-foreground text-center">
            <strong>Start with WHY:</strong> People don't buy what you do, they buy why you do it.
            Your WHY is your purpose, cause, or belief. Your HOW is your unique approach and values.
            Your WHAT is the tangible result - your products and services.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
