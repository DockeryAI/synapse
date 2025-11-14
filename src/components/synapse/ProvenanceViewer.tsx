/**
 * Provenance Viewer
 *
 * Shows users the complete process of how content was built:
 * - Psychology triggers used
 * - Data sources matched
 * - Framework stages and their source fields
 * - Content assembly breakdown
 * - Key decisions made during generation
 *
 * Created: 2025-11-11
 */

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { ContentProvenance } from '@/types/synapseContent.types';

interface ProvenanceViewerProps {
  provenance: ContentProvenance;
}

export function ProvenanceViewer({ provenance }: ProvenanceViewerProps) {
  const [expanded, setExpanded] = useState(true);  // Start expanded by default

  return (
    <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
      >
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        🔍 How This Was Built
      </button>

      {expanded && (
        <div className="mt-4 space-y-6 text-sm bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
          {/* DEEP PROVENANCE SECTION */}
          <div className="pb-4 border-b-2 border-blue-300 dark:border-blue-700">
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
              🔬 Deep Provenance: How The Magic Happened
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Trace the complete journey from raw data to final content</p>
          </div>

          {/* Raw Data Sources */}
          {provenance.rawDataSources && provenance.rawDataSources.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border-l-4 border-green-500">
              <div className="font-bold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                📊 Raw Data Sources
              </div>
              <div className="space-y-3">
                {provenance.rawDataSources.map((source, idx) => (
                  <div key={idx} className="pl-3 border-l-2 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded text-xs font-medium">
                        {source.platform}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded text-xs">
                        {source.type}
                      </span>
                      {source.sentiment && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          source.sentiment === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' :
                          source.sentiment === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {source.sentiment}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 italic text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      "{source.content}"
                    </div>
                    {source.author && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Author: {source.author}</div>
                    )}
                    {source.relevanceScore !== undefined && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Relevance: {Math.round(source.relevanceScore * 100)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Psychology Selection Process */}
          {provenance.psychologySelection && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border-l-4 border-purple-500">
              <div className="font-bold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
                🧠 Psychology Selection Process
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">Selected Principle:</div>
                  <div className="text-gray-700 dark:text-gray-300 font-medium">{provenance.psychologySelection.selectedPrinciple}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">Why This Psychology?</div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs italic">{provenance.psychologySelection.selectionReasoning}</div>
                </div>
                {provenance.psychologySelection.candidatePrinciples && provenance.psychologySelection.candidatePrinciples.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">Other Candidates Considered:</div>
                    <div className="space-y-2">
                      {provenance.psychologySelection.candidatePrinciples.map((candidate, idx) => (
                        <div key={idx} className="text-xs pl-3 border-l border-purple-200 dark:border-purple-800">
                          <div className="font-medium text-gray-700 dark:text-gray-300">{candidate.principle}</div>
                          <div className="text-gray-500 dark:text-gray-400">Confidence: {Math.round(candidate.confidenceScore * 100)}%</div>
                          <div className="text-gray-600 dark:text-gray-400 italic">{candidate.reasoning}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Topic Correlation */}
          {provenance.topicCorrelation && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border-l-4 border-orange-500">
              <div className="font-bold text-orange-700 dark:text-orange-300 mb-2 flex items-center gap-2">
                🔗 Topic Correlation & Embeddings
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs font-semibold text-orange-600 dark:text-orange-400">Primary Topic:</div>
                  <div className="text-gray-700 dark:text-gray-300 font-medium">{provenance.topicCorrelation.primaryTopic}</div>
                </div>
                {provenance.topicCorrelation.relatedTopics && provenance.topicCorrelation.relatedTopics.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">Related Topics (via embeddings):</div>
                    <div className="space-y-1">
                      {provenance.topicCorrelation.relatedTopics.map((topic, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                          <span className="text-gray-700 dark:text-gray-300">{topic.topic}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-orange-600 dark:text-orange-400 font-mono">{(topic.similarityScore * 100).toFixed(1)}%</span>
                            <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 rounded text-xs">
                              {topic.source}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {provenance.topicCorrelation.embeddingModel && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Model: {provenance.topicCorrelation.embeddingModel}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Platform Breakdown */}
          {provenance.platformBreakdown && provenance.platformBreakdown.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border-l-4 border-cyan-500">
              <div className="font-bold text-cyan-700 dark:text-cyan-300 mb-2 flex items-center gap-2">
                📱 Platform Breakdown
              </div>
              <div className="space-y-3">
                {provenance.platformBreakdown.map((platform, idx) => (
                  <div key={idx} className="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-cyan-700 dark:text-cyan-300">{platform.platform}</span>
                      <span className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-200 rounded text-xs font-bold">
                        {platform.dataPoints} data points
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="font-semibold text-cyan-600 dark:text-cyan-400">Key Insights:</div>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-0.5">
                        {platform.keyInsights.map((insight, i) => (
                          <li key={i}>{insight}</li>
                        ))}
                      </ul>
                      <div className="mt-2 pt-2 border-t border-cyan-200 dark:border-cyan-800">
                        <div className="font-semibold text-cyan-600 dark:text-cyan-400">Contribution:</div>
                        <div className="text-gray-600 dark:text-gray-400 italic">{platform.contributionToFinalContent}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision Pipeline */}
          {provenance.decisionPipeline && provenance.decisionPipeline.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border-l-4 border-pink-500">
              <div className="font-bold text-pink-700 dark:text-pink-300 mb-2 flex items-center gap-2">
                🎯 Decision Pipeline: The Complete Journey
              </div>
              <div className="space-y-3">
                {provenance.decisionPipeline.map((step, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute left-0 top-0 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {step.step}
                    </div>
                    <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded">
                      <div className="font-semibold text-pink-700 dark:text-pink-300 mb-1">{step.action}</div>
                      <div className="text-xs space-y-1">
                        <div>
                          <span className="font-medium text-pink-600 dark:text-pink-400">Input:</span>
                          <span className="text-gray-600 dark:text-gray-400 ml-2">{step.input}</span>
                        </div>
                        <div>
                          <span className="font-medium text-pink-600 dark:text-pink-400">Output:</span>
                          <span className="text-gray-700 dark:text-gray-300 ml-2 font-medium">{step.output}</span>
                        </div>
                        <div>
                          <span className="font-medium text-pink-600 dark:text-pink-400">Reasoning:</span>
                          <span className="text-gray-600 dark:text-gray-400 ml-2 italic">{step.reasoning}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STANDARD PROVENANCE SECTION */}
          <div className="pt-4 border-t-2 border-blue-300 dark:border-blue-700">
            <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3">Standard Provenance Tracking</h4>
          </div>

          {/* Psychology Trigger */}
          {provenance.psychologyTrigger && (
            <div>
              <div className="font-medium text-gray-700 dark:text-slate-300">Psychology Trigger</div>
              <div className="text-gray-600 dark:text-slate-400 mt-1">{provenance.psychologyTrigger}</div>
            </div>
          )}

          {/* Data Sources */}
          {provenance.dataSourcesUsed && provenance.dataSourcesUsed.length > 0 && (
            <div>
              <div className="font-medium text-gray-700 dark:text-slate-300">Data Sources Used</div>
              <div className="flex flex-wrap gap-2 mt-1">
                {provenance.dataSourcesUsed.map((source, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded text-xs">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Trending Topic */}
          {provenance.trendingTopicMatched && (
            <div>
              <div className="font-medium text-gray-700">Trending Topic Matched</div>
              <div className="text-gray-600 mt-1">{provenance.trendingTopicMatched}</div>
            </div>
          )}

          {/* Framework Stages */}
          {provenance.frameworkStagesUsed && provenance.frameworkStagesUsed.length > 0 && (
            <div>
              <div className="font-medium text-gray-700 dark:text-slate-300">Framework Stages</div>
              <div className="space-y-2 mt-2">
                {provenance.frameworkStagesUsed.map((stage, idx) => (
                  <div key={idx} className="pl-4 border-l-2 border-blue-400 dark:border-blue-500">
                    <div className="font-medium text-sm text-gray-700 dark:text-slate-300">{stage.stage}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">
                      Source: <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">{stage.sourceField}</code>
                    </div>
                    {stage.content && (
                      <div className="text-xs text-gray-600 dark:text-slate-400 mt-1 italic">"{stage.content}..."</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Assembly */}
          {provenance.contentAssembly && (
            <div>
              <div className="font-medium text-gray-700 dark:text-slate-300">Content Assembly</div>
              <div className="space-y-2 mt-2">
                {provenance.contentAssembly.headline && (
                  <div className="text-xs">
                    <strong className="text-gray-700 dark:text-slate-300">Headline:</strong> <span className="text-gray-600 dark:text-slate-400">{provenance.contentAssembly.headline.source}</span>
                    <div className="text-gray-600 dark:text-slate-400 italic mt-0.5">"{provenance.contentAssembly.headline.preview}"</div>
                  </div>
                )}
                {provenance.contentAssembly.hook && (
                  <div className="text-xs">
                    <strong className="text-gray-700 dark:text-slate-300">Hook:</strong> <span className="text-gray-600 dark:text-slate-400">{provenance.contentAssembly.hook.source}</span>
                    <div className="text-gray-600 dark:text-slate-400 italic mt-0.5">"{provenance.contentAssembly.hook.preview}"</div>
                  </div>
                )}
                {provenance.contentAssembly.body && (
                  <div className="text-xs">
                    <strong className="text-gray-700 dark:text-slate-300">Body:</strong> <span className="text-gray-600 dark:text-slate-400">{provenance.contentAssembly.body.source}</span>
                    <div className="text-gray-600 dark:text-slate-400 italic mt-0.5">"{provenance.contentAssembly.body.preview}"</div>
                  </div>
                )}
                {provenance.contentAssembly.cta && (
                  <div className="text-xs">
                    <strong className="text-gray-700 dark:text-slate-300">CTA:</strong> <span className="text-gray-600 dark:text-slate-400">{provenance.contentAssembly.cta.source}</span>
                    <div className="text-gray-600 dark:text-slate-400 italic mt-0.5">"{provenance.contentAssembly.cta.preview}"</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Decisions */}
          {provenance.decisions && (
            <div>
              <div className="font-medium text-gray-700 dark:text-slate-300">Key Decisions</div>
              <div className="space-y-1 mt-2 text-xs text-gray-600 dark:text-slate-400">
                {provenance.decisions.whyThisFormat && (
                  <div>• {provenance.decisions.whyThisFormat}</div>
                )}
                {provenance.decisions.whyThisTone && (
                  <div>• {provenance.decisions.whyThisTone}</div>
                )}
                {provenance.decisions.whyThisCTA && (
                  <div>• {provenance.decisions.whyThisCTA}</div>
                )}
              </div>
            </div>
          )}

          {/* Debug: Show if no data */}
          {!provenance.psychologyTrigger && !provenance.frameworkStagesUsed?.length && !provenance.contentAssembly && (
            <div className="text-xs text-gray-500 dark:text-slate-500 italic">
              No provenance data available for this content.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
