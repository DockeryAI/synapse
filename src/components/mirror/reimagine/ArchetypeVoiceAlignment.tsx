/**
 * Archetype Voice Alignment Component
 * Displays brand archetype with platform-specific voice guidance
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  MessageSquare,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react'

interface ArchetypeVoiceAlignmentProps {
  brandData: any
}

export function ArchetypeVoiceAlignment({ brandData }: ArchetypeVoiceAlignmentProps) {
  const fullProfile = brandData?.full_profile_data || {}
  const archetype = fullProfile.brand_archetype || {
    primary: 'The Hero',
    secondary: 'The Sage'
  }
  const brandVoice = fullProfile.brand_voice || 'Professional, authoritative'

  // Platform-specific guidance
  const platformGuidance = [
    {
      platform: 'Instagram',
      icon: Instagram,
      tone: getInstagramTone(archetype.primary),
      dos: getInstagramDos(archetype.primary),
      donts: getInstagramDonts(archetype.primary),
      example: getInstagramExample(archetype.primary)
    },
    {
      platform: 'LinkedIn',
      icon: Linkedin,
      tone: getLinkedInTone(archetype.primary),
      dos: getLinkedInDos(archetype.primary),
      donts: getLinkedInDonts(archetype.primary),
      example: getLinkedInExample(archetype.primary)
    },
    {
      platform: 'Facebook',
      icon: Facebook,
      tone: getFacebookTone(archetype.primary),
      dos: getFacebookDos(archetype.primary),
      donts: getFacebookDonts(archetype.primary),
      example: getFacebookExample(archetype.primary)
    },
    {
      platform: 'Twitter/X',
      icon: Twitter,
      tone: getTwitterTone(archetype.primary),
      dos: getTwitterDos(archetype.primary),
      donts: getTwitterDonts(archetype.primary),
      example: getTwitterExample(archetype.primary)
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Brand Archetype & Voice Alignment
        </CardTitle>
        <CardDescription>
          Platform-specific voice guidance based on your brand personality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Archetype Overview */}
        <div className="rounded-lg bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-1">Primary Archetype</div>
              <div className="text-2xl font-bold">{archetype.primary}</div>
            </div>
            {archetype.secondary && (
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">Secondary</div>
                <div className="text-xl font-semibold">{archetype.secondary}</div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-sm text-muted-foreground min-w-[100px]">Values:</span>
              <span className="text-sm font-medium">
                {getArchetypeValues(archetype.primary)}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm text-muted-foreground min-w-[100px]">Promise:</span>
              <span className="text-sm font-medium">
                {getArchetypePromise(archetype.primary)}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm text-muted-foreground min-w-[100px]">Voice:</span>
              <span className="text-sm font-medium">{brandVoice}</span>
            </div>
          </div>
        </div>

        {/* Platform-Specific Guidance */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            VOICE BY PLATFORM
          </h4>

          <div className="grid gap-4">
            {platformGuidance.map((guide, index) => {
              const Icon = guide.icon
              return (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  {/* Platform Header */}
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <h5 className="font-semibold">{guide.platform}</h5>
                  </div>

                  {/* Tone */}
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Tone</div>
                    <div className="text-sm">{guide.tone}</div>
                  </div>

                  {/* Dos and Donts */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Do
                      </div>
                      <ul className="space-y-1 text-xs">
                        {guide.dos.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-red-600 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Don't
                      </div>
                      <ul className="space-y-1 text-xs">
                        {guide.donts.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-red-600 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Example */}
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground mb-2">Example Post</div>
                    <div className="rounded bg-muted/50 p-3 text-sm italic">
                      "{guide.example}"
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full">
                    <Sparkles className="h-3 w-3 mr-2" />
                    Generate Content for {guide.platform}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper functions for archetype values
function getArchetypeValues(archetype: string): string {
  const values: Record<string, string> = {
    'The Hero': 'Courage, determination, making a difference',
    'The Sage': 'Knowledge, wisdom, expertise, truth',
    'The Caregiver': 'Compassion, generosity, nurturing',
    'The Rebel': 'Liberation, revolution, disruption',
    'The Lover': 'Passion, intimacy, beauty, pleasure',
    'The Creator': 'Innovation, imagination, self-expression',
    'The Jester': 'Joy, fun, spontaneity, lightness',
    'The Everyperson': 'Belonging, realism, down-to-earth',
    'The Ruler': 'Control, stability, order, success',
    'The Magician': 'Transformation, vision, charisma',
    'The Innocent': 'Optimism, purity, simplicity, faith',
    'The Explorer': 'Freedom, discovery, authenticity'
  }
  return values[archetype] || 'Integrity, excellence, dedication'
}

function getArchetypePromise(archetype: string): string {
  const promises: Record<string, string> = {
    'The Hero': "We'll help you overcome challenges",
    'The Sage': 'Expert guidance you can trust',
    'The Caregiver': 'We take care of you like family',
    'The Rebel': 'Break the rules with us',
    'The Lover': 'Indulge in the experience',
    'The Creator': 'Express your unique vision',
    'The Jester': 'Make life more fun',
    'The Everyperson': 'One of you, working for you',
    'The Ruler': 'Excellence and control',
    'The Magician': 'Make dreams reality',
    'The Innocent': 'Simple, honest solutions',
    'The Explorer': 'Find your path'
  }
  return promises[archetype] || 'Quality and reliability'
}

// Platform-specific tone functions
function getInstagramTone(archetype: string): string {
  if (archetype.includes('Sage')) return 'Educational but approachable, visual storytelling'
  if (archetype.includes('Hero')) return 'Inspiring and motivational with bold visuals'
  if (archetype.includes('Lover')) return 'Beautiful, aspirational, sensory-rich'
  return 'Authentic, engaging, visually compelling'
}

function getLinkedInTone(archetype: string): string {
  if (archetype.includes('Sage')) return 'Professional authority, thought leadership'
  if (archetype.includes('Hero')) return 'Achievement-focused, results-driven'
  if (archetype.includes('Ruler')) return 'Executive, strategic, commanding'
  return 'Professional, insightful, value-driven'
}

function getFacebookTone(archetype: string): string {
  if (archetype.includes('Caregiver')) return 'Warm, community-focused, helpful'
  if (archetype.includes('Everyperson')) return 'Relatable, friendly, conversational'
  if (archetype.includes('Jester')) return 'Fun, entertaining, shareable'
  return 'Conversational, engaging, community-oriented'
}

function getTwitterTone(archetype: string): string {
  if (archetype.includes('Rebel')) return 'Bold, provocative, trend-setting'
  if (archetype.includes('Sage')) return 'Informative, quick insights, expert takes'
  if (archetype.includes('Jester')) return 'Witty, humorous, timely'
  return 'Concise, timely, conversational'
}

// Platform-specific dos
function getInstagramDos(archetype: string): string[] {
  return [
    'Share tips and behind-the-scenes',
    'Use strong visual storytelling',
    'Engage with comments quickly',
    'Use Stories for daily updates'
  ]
}

function getLinkedInDos(archetype: string): string[] {
  return [
    'Share data and case studies',
    'Post thought leadership articles',
    'Engage with industry discussions',
    'Highlight achievements and wins'
  ]
}

function getFacebookDos(archetype: string): string[] {
  return [
    'Build community engagement',
    'Share customer stories',
    'Post helpful tips regularly',
    'Respond to all comments'
  ]
}

function getTwitterDos(archetype: string): string[] {
  return [
    'Jump on trending topics',
    'Share quick insights',
    'Use relevant hashtags',
    'Engage with industry leaders'
  ]
}

// Platform-specific donts
function getInstagramDonts(archetype: string): string[] {
  return [
    'Avoid overly technical jargon',
    "Don't post low-quality photos",
    'Avoid too much promotion',
    "Don't ignore user comments"
  ]
}

function getLinkedInDonts(archetype: string): string[] {
  return [
    'Avoid casual or silly content',
    "Don't oversell products",
    'Avoid controversial topics',
    "Don't ignore engagement"
  ]
}

function getFacebookDonts(archetype: string): string[] {
  return [
    'Avoid being too corporate',
    "Don't post walls of text",
    'Avoid excessive promotion',
    "Don't argue with critics publicly"
  ]
}

function getTwitterDonts(archetype: string): string[] {
  return [
    'Avoid long-winded threads',
    "Don't spam hashtags",
    'Avoid controversial debates',
    "Don't ignore mentions"
  ]
}

// Platform-specific examples
function getInstagramExample(archetype: string): string {
  if (archetype.includes('Sage')) {
    return 'Pro tip: Change your filter monthly 🏠 Your wallet (and your lungs) will thank you. Swipe for our quick how-to guide ➡️'
  }
  if (archetype.includes('Hero')) {
    return '2am emergency? We\'re already on the way. 💪 Because families deserve peace of mind, not panic. Available 24/7/365.'
  }
  return 'Behind the scenes: Our team preparing for today\'s installs. Quality work starts with quality people. ✨'
}

function getLinkedInExample(archetype: string): string {
  if (archetype.includes('Sage')) {
    return 'Why 40% of HVAC failures happen during the first cold snap: Our analysis of 10,000 service calls reveals a pattern most homeowners miss. [Read full insights]'
  }
  if (archetype.includes('Hero')) {
    return 'Case Study: How one apartment complex reduced emergency calls by 85% through preventive maintenance. The results speak for themselves.'
  }
  return 'Industry insight: The rising cost of refrigerant and what it means for your maintenance budget in 2024.'
}

function getFacebookExample(archetype: string): string {
  if (archetype.includes('Caregiver')) {
    return 'Thank you to the Martinez family for trusting us with your AC replacement! 🏡 Nothing makes us happier than keeping local families comfortable. See what our customers are saying →'
  }
  return 'Quick tip for homeowners: Before calling for emergency service, check your thermostat batteries! Simple fix that saves time and money. 💡'
}

function getTwitterExample(archetype: string): string {
  if (archetype.includes('Sage')) {
    return 'PSA: If your AC is running but not cooling, check these 3 things before calling: 1) Thermostat setting 2) Air filter 3) Circuit breaker. Could save you a service call!'
  }
  return 'Heat wave incoming 🌡️ Is your AC ready? Same-day service available for system check-ups. Don\'t wait until it breaks.'
}
