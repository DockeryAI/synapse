/**
 * RealTimeScoring Component
 * Live UVP quality scoring with debouncing
 * Provides instant feedback on clarity, conversion potential, power words, and jargon
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Sparkles, AlertTriangle, CheckCircle2, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RealTimeScoringProps {
  text: string
  className?: string
}

interface Scores {
  clarity: number // 0-100
  conversion: number // 0-100
  overall: number // 0-100
  powerWords: number
  jargonWords: number
  readabilityGrade: string
  suggestions: string[]
}

// Power words that increase conversion
const POWER_WORDS = [
  'proven',
  'guaranteed',
  'results',
  'instant',
  'exclusive',
  'limited',
  'free',
  'save',
  'boost',
  'transform',
  'revolutionary',
  'innovative',
  'powerful',
  'simple',
  'easy',
  'fast',
  'quick',
  'unlock',
  'discover',
  'master',
  'breakthrough',
  'cutting-edge',
  'premium',
  'professional',
  'expert',
  'trusted',
  'certified',
]

// Jargon words that reduce clarity
const JARGON_WORDS = [
  'synergy',
  'leverage',
  'paradigm',
  'disrupt',
  'innovate',
  'scalable',
  'robust',
  'holistic',
  'ecosystem',
  'utilize',
  'facilitate',
  'streamline',
  'optimize',
  'next-generation',
  'best-in-class',
  'world-class',
  'enterprise-grade',
  'mission-critical',
  'value-added',
  'turnkey',
  'bleeding-edge',
]

export const RealTimeScoring: React.FC<RealTimeScoringProps> = ({ text, className }) => {
  const [scores, setScores] = React.useState<Scores>({
    clarity: 0,
    conversion: 0,
    overall: 0,
    powerWords: 0,
    jargonWords: 0,
    readabilityGrade: 'N/A',
    suggestions: [],
  })

  // Debounce scoring calculation
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!text || text.length < 10) {
        setScores({
          clarity: 0,
          conversion: 0,
          overall: 0,
          powerWords: 0,
          jargonWords: 0,
          readabilityGrade: 'N/A',
          suggestions: [],
        })
        return
      }

      const calculated = calculateScores(text)
      setScores(calculated)
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [text])

  const calculateScores = (inputText: string): Scores => {
    const words = inputText.toLowerCase().split(/\s+/)
    const sentences = inputText.split(/[.!?]+/).filter((s) => s.trim().length > 0)

    // Count power words
    const powerWordsCount = words.filter((word) =>
      POWER_WORDS.some((pw) => word.includes(pw))
    ).length

    // Count jargon words
    const jargonWordsCount = words.filter((word) =>
      JARGON_WORDS.some((jw) => word.includes(jw))
    ).length

    // Calculate clarity score (0-100)
    let clarityScore = 100

    // Penalize for length (ideal: 10-30 words)
    if (words.length < 10) clarityScore -= (10 - words.length) * 3
    if (words.length > 30) clarityScore -= (words.length - 30) * 2

    // Penalize for jargon
    clarityScore -= jargonWordsCount * 10

    // Penalize for long sentences
    const avgSentenceLength = words.length / (sentences.length || 1)
    if (avgSentenceLength > 20) clarityScore -= (avgSentenceLength - 20) * 2

    // Penalize for complex words (>3 syllables approximation: >8 characters)
    const complexWords = words.filter((w) => w.length > 8).length
    const complexWordRatio = complexWords / words.length
    if (complexWordRatio > 0.3) clarityScore -= (complexWordRatio - 0.3) * 100

    clarityScore = Math.max(0, Math.min(100, clarityScore))

    // Calculate conversion potential (0-100)
    let conversionScore = 50 // Base score

    // Boost for power words
    conversionScore += powerWordsCount * 8

    // Boost for specific benefits (numbers, percentages)
    const hasNumbers = /\d+/.test(inputText)
    const hasPercentage = /%/.test(inputText)
    if (hasNumbers) conversionScore += 15
    if (hasPercentage) conversionScore += 10

    // Boost for emotional triggers
    const emotionalWords = ['you', 'your', 'save', 'gain', 'grow', 'win']
    const emotionalCount = words.filter((w) => emotionalWords.includes(w)).length
    conversionScore += emotionalCount * 5

    // Penalize for being too generic
    const genericPhrases = ['best', 'great', 'good', 'nice', 'quality']
    const genericCount = words.filter((w) => genericPhrases.includes(w)).length
    conversionScore -= genericCount * 5

    conversionScore = Math.max(0, Math.min(100, conversionScore))

    // Calculate overall score (weighted average)
    const overallScore = Math.round(clarityScore * 0.6 + conversionScore * 0.4)

    // Calculate readability grade (Flesch-Kincaid approximation)
    const avgWordsPerSentence = words.length / (sentences.length || 1)
    const avgSyllablesPerWord = words.reduce((acc, w) => acc + estimateSyllables(w), 0) / words.length
    const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
    let readabilityGrade = 'College'
    if (fleschScore >= 90) readabilityGrade = '5th Grade'
    else if (fleschScore >= 80) readabilityGrade = '6th Grade'
    else if (fleschScore >= 70) readabilityGrade = '7th Grade'
    else if (fleschScore >= 60) readabilityGrade = '8th-9th Grade'
    else if (fleschScore >= 50) readabilityGrade = '10th-12th Grade'

    // Generate suggestions
    const suggestions: string[] = []
    if (words.length < 10) suggestions.push('Add more detail to make your message clearer')
    if (words.length > 30) suggestions.push('Simplify your message - shorter is more powerful')
    if (jargonWordsCount > 0)
      suggestions.push(`Remove ${jargonWordsCount} jargon word${jargonWordsCount > 1 ? 's' : ''}`)
    if (powerWordsCount < 2) suggestions.push('Add more compelling power words')
    if (!hasNumbers) suggestions.push('Include specific numbers or metrics for credibility')
    if (emotionalCount < 2) suggestions.push('Use more "you" language to connect emotionally')

    return {
      clarity: Math.round(clarityScore),
      conversion: Math.round(conversionScore),
      overall: overallScore,
      powerWords: powerWordsCount,
      jargonWords: jargonWordsCount,
      readabilityGrade,
      suggestions,
    }
  }

  // Estimate syllables in a word (simple heuristic)
  const estimateSyllables = (word: string): number => {
    word = word.toLowerCase()
    if (word.length <= 3) return 1
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    word = word.replace(/^y/, '')
    const matches = word.match(/[aeiouy]{1,2}/g)
    return matches ? matches.length : 1
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (!text || text.length < 10) {
    return (
      <Card className={cn('opacity-50', className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            UVP Quality Score
          </CardTitle>
          <CardDescription className="text-xs">Write at least 10 characters to see your score</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            UVP Quality Score
          </CardTitle>
          <Badge
            variant="secondary"
            className={cn('text-lg font-bold', getScoreBgColor(scores.overall), getScoreColor(scores.overall))}
          >
            {scores.overall}/100
          </Badge>
        </div>
        <CardDescription className="text-xs">Real-time analysis of your value proposition</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Clarity Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={cn('h-4 w-4', getScoreColor(scores.clarity))} />
              <span className="font-medium">Clarity</span>
            </div>
            <span className={cn('font-semibold', getScoreColor(scores.clarity))}>{scores.clarity}%</span>
          </div>
          <Progress value={scores.clarity} className="h-2">
            <div className={cn('h-full transition-all', getProgressColor(scores.clarity))} />
          </Progress>
          <p className="text-xs text-muted-foreground">Readability: {scores.readabilityGrade}</p>
        </div>

        {/* Conversion Potential */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className={cn('h-4 w-4', getScoreColor(scores.conversion))} />
              <span className="font-medium">Conversion Potential</span>
            </div>
            <span className={cn('font-semibold', getScoreColor(scores.conversion))}>{scores.conversion}%</span>
          </div>
          <Progress value={scores.conversion} className="h-2">
            <div className={cn('h-full transition-all', getProgressColor(scores.conversion))} />
          </Progress>
        </div>

        {/* Word Analysis */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Power Words</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{scores.powerWords}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Jargon Words</span>
            </div>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{scores.jargonWords}</p>
          </div>
        </div>

        {/* Suggestions */}
        {scores.suggestions.length > 0 && (
          <div className="pt-4 border-t space-y-2">
            <p className="text-sm font-medium">Suggestions to improve:</p>
            <ul className="space-y-1">
              {scores.suggestions.map((suggestion, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Overall Assessment */}
        <div
          className={cn(
            'rounded-lg p-3 border-2',
            scores.overall >= 80
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
              : scores.overall >= 60
                ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
          )}
        >
          <p
            className={cn(
              'text-sm font-medium',
              scores.overall >= 80
                ? 'text-green-900 dark:text-green-100'
                : scores.overall >= 60
                  ? 'text-yellow-900 dark:text-yellow-100'
                  : 'text-red-900 dark:text-red-100'
            )}
          >
            {scores.overall >= 80
              ? '✓ Excellent UVP! Clear, compelling, and conversion-focused.'
              : scores.overall >= 60
                ? '⚠ Good start, but there is room for improvement.'
                : '✗ Needs work. Focus on clarity and specific benefits.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
