/**
 * Welcome Screen Component
 *
 * Introduction screen for the UVP wizard explaining the process
 * and what users will accomplish.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Target,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  Zap,
  CheckCircle,
  ArrowRight,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * WelcomeScreen component props
 */
interface WelcomeScreenProps {
  onStart: () => void
  brandName?: string
  industry?: string
  className?: string
}

/**
 * Welcome Screen Component
 */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStart,
  brandName,
  industry,
  className,
}) => {
  const [isStarting, setIsStarting] = React.useState(false)

  const handleStart = () => {
    setIsStarting(true)
    onStart()
  }
  const steps = [
    {
      icon: <Target className="h-5 w-5" />,
      title: 'Target Customer',
      description: 'Define who you serve',
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-950',
    },
    {
      icon: <AlertCircle className="h-5 w-5" />,
      title: 'Customer Problem',
      description: 'Identify their pain points',
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-950',
    },
    {
      icon: <Lightbulb className="h-5 w-5" />,
      title: 'Unique Solution',
      description: 'Your approach to solving it',
      color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950',
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: 'Key Benefit',
      description: 'Measurable outcomes',
      color: 'text-green-600 bg-green-100 dark:bg-green-950',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Differentiation',
      description: 'What makes you unique',
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-950',
    },
  ]

  const features = [
    {
      icon: <Sparkles className="h-5 w-5 text-purple-600" />,
      title: 'AI-Powered Suggestions',
      description: 'Get intelligent recommendations based on your industry and market',
    },
    {
      icon: <Target className="h-5 w-5 text-blue-600" />,
      title: 'Drag & Drop Interface',
      description: 'Intuitive interaction - drag suggestions or type your own',
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      title: 'Real-Time Validation',
      description: 'Instant feedback and quality scoring as you build',
    },
  ]

  return (
    <div className={cn('max-w-4xl mx-auto py-12 px-6', className)}>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">
          Build Your Unique Value Proposition
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {brandName ? (
            <>
              Create a compelling Unique Value Proposition (UVP) for <strong>{brandName}</strong>
              {industry && <> in the {industry} industry</>}
            </>
          ) : (
            'Create a compelling Unique Value Proposition (UVP) that clearly communicates why customers should choose you'
          )}
        </p>
      </div>

      {/* Time Estimate */}
      <div className="flex items-center justify-center gap-2 mb-8 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Takes about 5 minutes • Saves automatically</span>
      </div>

      {/* Steps Overview */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold mb-6 text-center">What You'll Create</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="p-4 text-center hover:shadow-md transition-shadow"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3',
                  step.color
                )}
              >
                {step.icon}
              </div>
              <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-sm mb-2">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What Happens After */}
      <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          What Happens After Completion
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>
              Your Unique Value Proposition (UVP) will unlock the full MARBA framework (Roadmap, Broadcast, Assess)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>
              Get AI-generated marketing strategies based on your value proposition
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>
              Access personalized campaign recommendations and tactical plans
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>You can always come back and refine your Unique Value Proposition anytime</span>
          </li>
        </ul>
      </Card>

      {/* CTA */}
      <div className="text-center">
        {isStarting ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="py-8"
          >
            <div className="relative inline-block">
              <Sparkles className="h-12 w-12 text-primary" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-t-2 border-primary" />
              </motion.div>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground mt-4"
            >
              Analyzing your website and industry data...
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-muted-foreground mt-2"
            >
              Preparing personalized suggestions
            </motion.p>
          </motion.div>
        ) : (
          <>
            <Button size="lg" onClick={handleStart} className="px-8">
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              No credit card required • Your progress saves automatically
            </p>
          </>
        )}
      </div>
    </div>
  )
}
