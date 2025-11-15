/**
 * MARBA Onboarding Page
 * Domain + Industry Selection with NAICS Codes
 */

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Check, AlertCircle, Sparkles, Globe } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import { createBrandWithIndustryData } from '@/services/industryService'
import { supabase } from '@/lib/supabase'
import Fuse from 'fuse.js'

interface NAICSCode {
  code: string
  title: string
  description?: string
  keywords?: string[]
  level: number
}

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate()
  const [domain, setDomain] = useState('')
  const [industrySearch, setIndustrySearch] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState<NAICSCode | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progressStep, setProgressStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [allIndustries, setAllIndustries] = useState<NAICSCode[]>([])
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(true)
  const [fuse, setFuse] = useState<Fuse<NAICSCode> | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { setCurrentBrand } = useBrand()

  // Load all NAICS codes from database on mount
  useEffect(() => {
    async function loadIndustries() {
      try {
        // Load from the new industry_search_index table which has better search keywords
        const { data, error } = await supabase
          .from('industry_search_index')
          .select('naics_code, display_name, category, keywords')
          .order('popularity', { ascending: false })

        if (error) throw error

        // Create unique industry entries (group by naics_code, take the most popular)
        const uniqueIndustries = new Map<string, NAICSCode>()

        ;(data || []).forEach(entry => {
          // If we haven't seen this code yet, or this entry is more popular, use it
          if (!uniqueIndustries.has(entry.naics_code)) {
            uniqueIndustries.set(entry.naics_code, {
              code: entry.naics_code,
              title: entry.display_name,
              description: entry.category || '',
              keywords: entry.keywords || [],
              level: entry.naics_code.length === 2 ? 2 : entry.naics_code.length === 3 ? 3 : entry.naics_code.length
            })
          }
        })

        const industries = Array.from(uniqueIndustries.values())
        setAllIndustries(industries)

        // Initialize Fuse.js with comprehensive fuzzy matching
        // Increase weight on keywords since we now have proper search terms
        const fuseInstance = new Fuse(industries, {
          keys: [
            { name: 'title', weight: 2 },
            { name: 'keywords', weight: 1.8 }, // Increased weight for keywords
            { name: 'description', weight: 1 },
            { name: 'code', weight: 0.5 }
          ],
          threshold: 0.4, // More lenient matching (0 = exact, 1 = match anything)
          distance: 100,
          minMatchCharLength: 2,
          includeScore: true,
          useExtendedSearch: true
        })

        setFuse(fuseInstance)
        setIsLoadingIndustries(false)
      } catch (err) {
        console.error('Error loading industries:', err)
        setError('Failed to load industries. Please refresh the page.')
        setIsLoadingIndustries(false)
      }
    }

    loadIndustries()
  }, [])

  // Fuzzy search with Fuse.js
  const filteredIndustries = React.useMemo(() => {
    if (!industrySearch.trim() || !fuse) return []

    const results = fuse.search(industrySearch)
    return results.slice(0, 10).map(result => result.item)
  }, [industrySearch, fuse])

  // Reset highlighted index when filtered results change
  React.useEffect(() => {
    setHighlightedIndex(-1)
  }, [filteredIndustries.length])

  // Auto-scroll to keep highlighted item visible
  React.useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('button')
      const highlightedItem = items[highlightedIndex]
      if (highlightedItem) {
        highlightedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }
    }
  }, [highlightedIndex])

  // Validate domain
  const isValidDomain = React.useMemo(() => {
    if (!domain.trim()) return false
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    return domainRegex.test(domain.replace(/^https?:\/\//, '').replace(/\/$/, ''))
  }, [domain])

  // Auto-submit when both are valid (with ref to prevent double-trigger)
  const hasSubmittedRef = useRef(false)

  useEffect(() => {
    console.log('[OnboardingPage] Auto-submit check:', {
      isValidDomain,
      hasSelectedIndustry: !!selectedIndustry,
      isAnalyzing,
      hasSubmitted: hasSubmittedRef.current,
      domain,
      industry: selectedIndustry?.title
    })

    if (isValidDomain && selectedIndustry && !isAnalyzing && !hasSubmittedRef.current) {
      console.log('[OnboardingPage] AUTO-SUBMITTING!')
      hasSubmittedRef.current = true
      handleAnalyze()
    }
  }, [isValidDomain, selectedIndustry, domain, isAnalyzing])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredIndustries.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => {
        // If nothing is selected yet, select the first item
        if (prev === -1) return 0
        // Otherwise move down if not at the end
        return prev < filteredIndustries.length - 1 ? prev + 1 : prev
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => {
        // If nothing is selected yet, select the last item
        if (prev === -1) return filteredIndustries.length - 1
        // Otherwise move up if not at the beginning
        return prev > 0 ? prev - 1 : 0
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && filteredIndustries[highlightedIndex]) {
        handleSelectIndustry(filteredIndustries[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setHighlightedIndex(-1)
    }
  }

  const handleSelectIndustry = (naics: NAICSCode) => {
    setSelectedIndustry(naics)
    setIndustrySearch(naics.title)
    setShowDropdown(false)
    setHighlightedIndex(-1)
  }

  const handleAnalyze = async () => {
    if (!isValidDomain || !selectedIndustry || isAnalyzing) return

    setIsAnalyzing(true)
    setError(null)
    setProgressStep('loading-profile')

    try {
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')

      console.log('[OnboardingPage] Starting brand creation:', {
        domain: cleanDomain,
        industry: selectedIndustry.title,
        naicsCode: selectedIndustry.code
      })

      // Create brand with industry data and populate MIRROR sections WITH WEBSITE ANALYSIS
      const result = await createBrandWithIndustryData(
        cleanDomain,
        selectedIndustry.code,
        undefined, // userId
        (step: string) => {
          setProgressStep(step)
          console.log('[OnboardingPage] Progress:', step)
        }
      )

      if (!result) {
        throw new Error('Failed to create brand. Please ensure industry profile data is available.')
      }

      console.log('[OnboardingPage] Brand created successfully:', result.brand.id)
      console.log('[OnboardingPage] Website data collected:', result.websiteData ? 'Yes' : 'No')

      // Set current brand
      setCurrentBrand(result.brand)

      // Navigate to MIRROR page (using React Router to preserve state)
      console.log('[OnboardingPage] SUCCESS! Brand created, redirecting to MIRROR...')
      console.log('[OnboardingPage] Brand data:', result.brand)
      setIsAnalyzing(false)
      setProgressStep('complete')
      setTimeout(() => {
        navigate('/mirror')
      }, 500)
    } catch (err: any) {
      console.error('[OnboardingPage] Error caught:', err)
      const errorMessage = err.message || 'Analysis failed. Please try again.'
      console.error('[OnboardingPage] Error message:', errorMessage)
      setError(errorMessage)
      setIsAnalyzing(false)
      setProgressStep('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl">
          <CardContent className="pt-12 pb-10 px-8">
            {/* Header */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">Welcome to MARBA.ai</h1>
              <p className="text-muted-foreground">
                Enter your website and industry to begin your MIRROR analysis
              </p>
            </div>

            {/* Domain Input */}
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Website Domain
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="pl-10 h-12 text-lg"
                    disabled={isAnalyzing}
                  />
                  {isValidDomain && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your website domain (without http://)
                </p>
              </div>

              {/* Industry Selector */}
              <div className="relative">
                <label className="text-sm font-medium mb-2 block">
                  Industry
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search industries..."
                    value={industrySearch}
                    onChange={(e) => {
                      setIndustrySearch(e.target.value)
                      setShowDropdown(true)
                      if (!e.target.value.trim()) {
                        setSelectedIndustry(null)
                      }
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 h-12 text-lg"
                    disabled={isAnalyzing}
                  />
                  {selectedIndustry && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isLoadingIndustries ? (
                    'Loading industries...'
                  ) : (
                    <>Type to search {allIndustries.length} industries • Use ↑↓ to navigate • Enter to select</>
                  )}
                </p>

                {/* Dropdown */}
                <AnimatePresence>
                  {showDropdown && filteredIndustries.length > 0 && (
                    <motion.div
                      ref={dropdownRef}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-2 bg-background border rounded-lg shadow-xl max-h-96 overflow-y-auto"
                    >
                      {filteredIndustries.map((naics, index) => (
                        <button
                          key={naics.code}
                          onClick={() => handleSelectIndustry(naics)}
                          className={`w-full text-left px-4 py-3 transition-colors border-b last:border-b-0 ${
                            index === highlightedIndex
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {naics.title}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {naics.description}
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              {naics.code}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Selected Industry */}
              {selectedIndustry && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-primary/5 rounded-lg border border-primary/20"
                >
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{selectedIndustry.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        NAICS: {selectedIndustry.code} • Level {selectedIndustry.level}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3"
                >
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-sm text-destructive">{error}</div>
                </motion.div>
              )}

              {/* Analysis Animation with Progress */}
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Analyzing Your Brand</h3>
                  <div className="space-y-2 mt-4">
                    <div className={`text-sm ${progressStep === 'loading-profile' ? 'text-primary font-medium' : progressStep.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <Check className="h-4 w-4 inline mr-2" />
                      Loading industry profile
                    </div>
                    <div className={`text-sm ${progressStep === 'scraping-website' ? 'text-primary font-medium' : progressStep === 'analyzing-website' || progressStep === 'creating-brand' || progressStep === 'generating-mirror' || progressStep === 'saving-data' || progressStep === 'complete' ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <Globe className="h-4 w-4 inline mr-2" />
                      Scraping website content
                    </div>
                    <div className={`text-sm ${progressStep === 'analyzing-website' ? 'text-primary font-medium' : progressStep === 'creating-brand' || progressStep === 'generating-mirror' || progressStep === 'saving-data' || progressStep === 'complete' ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <Sparkles className="h-4 w-4 inline mr-2" />
                      Analyzing with AI
                    </div>
                    <div className={`text-sm ${progressStep === 'creating-brand' ? 'text-primary font-medium' : progressStep === 'generating-mirror' || progressStep === 'saving-data' || progressStep === 'complete' ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <Check className="h-4 w-4 inline mr-2" />
                      Creating brand profile
                    </div>
                    <div className={`text-sm ${progressStep === 'generating-mirror' ? 'text-primary font-medium' : progressStep === 'saving-data' || progressStep === 'complete' ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <Sparkles className="h-4 w-4 inline mr-2" />
                      Generating MIRROR framework
                    </div>
                    <div className={`text-sm ${progressStep === 'saving-data' || progressStep === 'complete' ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <Check className="h-4 w-4 inline mr-2" />
                      Saving to database
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Status Indicators */}
              {!isAnalyzing && (
                <div className="flex items-center justify-center gap-6 pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    {isValidDomain ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted" />
                    )}
                    <span className={isValidDomain ? 'text-green-600' : 'text-muted-foreground'}>
                      Domain
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {selectedIndustry ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted" />
                    )}
                    <span className={selectedIndustry ? 'text-green-600' : 'text-muted-foreground'}>
                      Industry
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Enter your domain and industry to begin your MIRROR analysis
        </p>
      </motion.div>
    </div>
  )
}

export { OnboardingPage }
