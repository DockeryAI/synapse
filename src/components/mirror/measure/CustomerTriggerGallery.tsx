/**
 * Customer Trigger Gallery Component
 * Showcases emotional triggers, psychological hooks, and customer avatars
 * from the 475K+ word industry psychology database
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Heart, Brain, Users, Zap, Target, ChevronDown, ChevronRight } from 'lucide-react'

interface CustomerTriggerGalleryProps {
  triggers: any[]
  psychologicalHooks?: any[]
  customerAvatars?: any[]
}

export function CustomerTriggerGallery({
  triggers,
  psychologicalHooks = [],
  customerAvatars = [],
}: CustomerTriggerGalleryProps) {
  const [openTriggers, setOpenTriggers] = React.useState<Record<number, boolean>>({})
  const [openHooks, setOpenHooks] = React.useState<Record<number, boolean>>({})
  const [openAvatars, setOpenAvatars] = React.useState<Record<number, boolean>>({})

  const toggleTrigger = (index: number) => {
    setOpenTriggers(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const toggleHook = (index: number) => {
    setOpenHooks(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const toggleAvatar = (index: number) => {
    setOpenAvatars(prev => ({ ...prev, [index]: !prev[index] }))
  }

  if ((!triggers || triggers.length === 0) && psychologicalHooks.length === 0 && customerAvatars.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Customer Psychology
          </CardTitle>
          <CardDescription>No psychology data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Customer Psychology Insights
        </CardTitle>
        <CardDescription>
          Industry-specific emotional triggers and psychological patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="triggers" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="triggers">
              <Heart className="h-4 w-4 mr-2" />
              Emotional Triggers
            </TabsTrigger>
            <TabsTrigger value="hooks">
              <Zap className="h-4 w-4 mr-2" />
              Psychological Hooks
            </TabsTrigger>
            <TabsTrigger value="avatars">
              <Users className="h-4 w-4 mr-2" />
              Customer Avatars
            </TabsTrigger>
          </TabsList>

          {/* Emotional Triggers Tab */}
          <TabsContent value="triggers" className="space-y-4 mt-4">
            {triggers && triggers.length > 0 ? (
              <div className="grid gap-3">
                {triggers.slice(0, 8).map((trigger, index) => {
                  const triggerText = typeof trigger === 'string' ? trigger : trigger.trigger || trigger.emotion
                  const psychology = typeof trigger === 'object' ? trigger.psychology : null
                  const application = typeof trigger === 'object' ? trigger.application : null
                  const intensity = typeof trigger === 'object' ? trigger.intensity : null

                  return (
                    <Collapsible
                      key={index}
                      open={openTriggers[index]}
                      onOpenChange={() => toggleTrigger(index)}
                    >
                      <div className="rounded-lg border hover:bg-accent/50 transition-colors">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start p-4 h-auto text-left font-normal hover:bg-transparent"
                          >
                            <div className="flex items-center gap-2 w-full">
                              {openTriggers[index] ? (
                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                              )}
                              <Heart className="h-4 w-4 text-pink-500 flex-shrink-0" />
                              <span className="font-semibold flex-1">{triggerText}</span>
                              {intensity && (
                                <Badge variant="outline" className="ml-auto">
                                  {intensity}/10
                                </Badge>
                              )}
                            </div>
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-4 space-y-2">
                          {psychology && (
                            <div className="pl-8">
                              <p className="text-sm text-muted-foreground">
                                <strong className="text-foreground">Why it works:</strong> {psychology}
                              </p>
                            </div>
                          )}
                          {application && (
                            <div className="pl-8">
                              <p className="text-sm text-muted-foreground">
                                <strong className="text-foreground">How to use:</strong> {application}
                              </p>
                            </div>
                          )}
                          {!psychology && !application && (
                            <div className="pl-8">
                              <p className="text-sm text-muted-foreground">
                                Click to learn more about this emotional trigger
                              </p>
                            </div>
                          )}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No emotional triggers found for this industry
              </p>
            )}
          </TabsContent>

          {/* Psychological Hooks Tab */}
          <TabsContent value="hooks" className="space-y-4 mt-4">
            {psychologicalHooks && psychologicalHooks.length > 0 ? (
              <div className="grid gap-3">
                {psychologicalHooks.slice(0, 6).map((hook, index) => {
                  const principle = hook.principle || hook.name || `Hook ${index + 1}`
                  const description = hook.description || hook.explanation
                  const examples = hook.examples || []

                  return (
                    <div
                      key={index}
                      className="rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <Zap className="h-4 w-4 text-yellow-500 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{principle}</h4>
                          {description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {description}
                            </p>
                          )}
                          {examples.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium mb-1">Examples:</p>
                              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                                {examples.slice(0, 3).map((ex: string, i: number) => (
                                  <li key={i}>{ex}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No psychological hooks found for this industry
              </p>
            )}
          </TabsContent>

          {/* Customer Avatars Tab */}
          <TabsContent value="avatars" className="space-y-4 mt-4">
            {customerAvatars && customerAvatars.length > 0 ? (
              <div className="grid gap-4">
                {customerAvatars.slice(0, 4).map((avatar, index) => {
                  const name = avatar.name || `Customer Segment ${index + 1}`
                  const description = avatar.description || avatar.demographics
                  const painPoints = avatar.pain_points || avatar.painPoints || []
                  const goals = avatar.goals || []
                  const psychographics = avatar.psychographics

                  return (
                    <div
                      key={index}
                      className="rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">{name}</h4>
                          {description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {description}
                            </p>
                          )}

                          <div className="grid gap-3">
                            {painPoints.length > 0 && (
                              <div>
                                <p className="text-xs font-medium mb-1">Pain Points:</p>
                                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                                  {painPoints.slice(0, 3).map((pain: string, i: number) => (
                                    <li key={i}>{pain}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {goals.length > 0 && (
                              <div>
                                <p className="text-xs font-medium mb-1">Goals:</p>
                                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                                  {goals.slice(0, 3).map((goal: string, i: number) => (
                                    <li key={i}>{goal}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {psychographics && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-xs font-medium">Psychographics:</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {psychographics}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No customer avatars found for this industry
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-pink-600">{triggers?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Emotional Triggers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {psychologicalHooks?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Psychological Hooks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {customerAvatars?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Customer Avatars</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
