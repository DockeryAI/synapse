/**
 * Brand Profile Page (/brand-profile)
 *
 * Phase D - Item #29: UVP Profile Page
 * Displays and allows editing of UVP (Unique Value Proposition) data.
 *
 * Features:
 * - Display current UVP (target customer, pain points, transformation)
 * - Show UVP relevance score
 * - Edit capability (triggers re-analysis)
 * - View data sources contributing to UVP
 *
 * Created: 2025-11-26
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Target,
  Sparkles,
  Award,
  FileText,
  Edit2,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  Building,
  Globe,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useBrand } from '@/contexts/BrandContext';
import { getUVPByBrand } from '@/services/database/marba-uvp.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';

export function BrandProfilePage() {
  const navigate = useNavigate();
  const { currentBrand: brand } = useBrand();
  const [uvp, setUVP] = useState<CompleteUVP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load UVP data on mount
  useEffect(() => {
    async function loadUVP() {
      if (!brand?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const uvpData = await getUVPByBrand(brand.id);
        setUVP(uvpData);
      } catch (err) {
        console.error('[BrandProfilePage] Error loading UVP:', err);
        setError(err instanceof Error ? err.message : 'Failed to load UVP data');
      } finally {
        setLoading(false);
      }
    }

    loadUVP();
  }, [brand?.id]);

  // Calculate overall confidence percentage
  const getConfidencePercent = (): number => {
    if (!uvp?.overallConfidence) return 0;
    if (typeof uvp.overallConfidence === 'number') return uvp.overallConfidence;
    return uvp.overallConfidence.overall || 0;
  };

  // Get confidence color
  const getConfidenceColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get confidence badge variant
  const getConfidenceBadge = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  // Handle re-run UVP analysis
  const handleReanalyze = () => {
    navigate('/onboarding');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading brand profile...</p>
        </div>
      </div>
    );
  }

  // No brand selected
  if (!brand) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">No Brand Selected</h3>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    Please complete the onboarding process to create your brand profile.
                  </p>
                  <Button
                    onClick={() => navigate('/onboarding')}
                    className="mt-4"
                    variant="default"
                  >
                    Start Onboarding
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No UVP data
  if (!uvp) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Brand Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{brand.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{brand.industry}</p>
          </div>

          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">No UVP Data Found</h3>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Your brand exists but no UVP analysis has been completed. Run the onboarding flow to generate your unique value proposition.
                  </p>
                  <Button
                    onClick={handleReanalyze}
                    className="mt-4"
                    variant="default"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate UVP
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const confidencePercent = getConfidencePercent();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Building className="w-8 h-8 text-purple-600" />
                {brand.name}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-gray-600 dark:text-gray-400">
                {brand.industry && (
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {brand.industry}
                  </span>
                )}
                {brand.website && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {brand.website}
                  </span>
                )}
                {brand.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {brand.location}
                  </span>
                )}
              </div>
            </div>
            <Button onClick={handleReanalyze} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-analyze
            </Button>
          </div>
        </motion.div>

        {/* UVP Confidence Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">UVP Confidence Score</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Based on data quality and source analysis</p>
                  </div>
                </div>
                <div className={`text-3xl font-bold ${getConfidenceColor(confidencePercent)}`}>
                  {confidencePercent}%
                </div>
              </div>
              <Progress value={confidencePercent} className="h-3" />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Needs Work</span>
                <span>Good</span>
                <span>Excellent</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Value Proposition Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Value Proposition
              </CardTitle>
              <CardDescription>Your synthesized unique value proposition statement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-purple-100 dark:border-purple-800">
                <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                  {uvp.valuePropositionStatement || 'No value proposition statement generated yet.'}
                </p>
              </div>

              {/* Why/What/How Statements */}
              {(uvp.whyStatement || uvp.whatStatement || uvp.howStatement) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {uvp.whyStatement && (
                    <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="text-sm font-semibold text-purple-600 mb-2">WHY</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{uvp.whyStatement}</p>
                    </div>
                  )}
                  {uvp.whatStatement && (
                    <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-600 mb-2">WHAT</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{uvp.whatStatement}</p>
                    </div>
                  )}
                  {uvp.howStatement && (
                    <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="text-sm font-semibold text-green-600 mb-2">HOW</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{uvp.howStatement}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* UVP Components Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Customer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-blue-600" />
                  Target Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {uvp.targetCustomer?.statement ? (
                  <>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {uvp.targetCustomer.statement}
                    </p>
                    {uvp.targetCustomer.industry && (
                      <Badge variant="secondary" className="mr-2">
                        {uvp.targetCustomer.industry}
                      </Badge>
                    )}
                    {uvp.targetCustomer.companySize && (
                      <Badge variant="secondary">
                        {uvp.targetCustomer.companySize}
                      </Badge>
                    )}
                    {uvp.targetCustomer.confidence && (
                      <div className="mt-4 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-500">
                          {typeof uvp.targetCustomer.confidence === 'number'
                            ? uvp.targetCustomer.confidence
                            : uvp.targetCustomer.confidence?.overall || 0}% confidence
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 italic">No target customer defined</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Transformation Goal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-green-600" />
                  Transformation Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                {uvp.transformationGoal?.statement ? (
                  <>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {uvp.transformationGoal.outcomeStatement || uvp.transformationGoal.statement}
                    </p>
                    {uvp.transformationGoal.eqScore && (
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">Emotional</div>
                          <Progress value={uvp.transformationGoal.eqScore.emotional} className="h-2" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">Rational</div>
                          <Progress value={uvp.transformationGoal.eqScore.rational} className="h-2" />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 italic">No transformation goal defined</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Unique Solution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Unique Solution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {uvp.uniqueSolution?.statement ? (
                  <>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {uvp.uniqueSolution.outcomeStatement || uvp.uniqueSolution.statement}
                    </p>
                    {uvp.uniqueSolution.differentiators && uvp.uniqueSolution.differentiators.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Differentiators:</h4>
                        {uvp.uniqueSolution.differentiators.slice(0, 3).map((diff, idx) => (
                          <div key={diff.id || idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{diff.statement}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 italic">No unique solution defined</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Key Benefit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Key Benefit
                </CardTitle>
              </CardHeader>
              <CardContent>
                {uvp.keyBenefit?.statement ? (
                  <>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {uvp.keyBenefit.outcomeStatement || uvp.keyBenefit.statement}
                    </p>
                    {uvp.keyBenefit.outcomeType && (
                      <Badge
                        variant={uvp.keyBenefit.outcomeType === 'quantifiable' ? 'default' : 'secondary'}
                      >
                        {uvp.keyBenefit.outcomeType}
                      </Badge>
                    )}
                    {uvp.keyBenefit.metrics && uvp.keyBenefit.metrics.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {uvp.keyBenefit.metrics.slice(0, 4).map((metric, idx) => (
                          <div key={metric.id || idx} className="p-2 bg-gray-50 dark:bg-slate-800 rounded text-center">
                            <div className="text-lg font-bold text-purple-600">{metric.value}</div>
                            <div className="text-xs text-gray-500">{metric.metric}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 italic">No key benefit defined</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Data Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-gray-600" />
                Data Sources
              </CardTitle>
              <CardDescription>Sources contributing to your UVP analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {/* Collect all unique sources */}
                {(() => {
                  const sources = new Set<string>();
                  if (uvp.targetCustomer?.sources) {
                    uvp.targetCustomer.sources.forEach(s => sources.add(s.platform || s.type || 'Unknown'));
                  }
                  if (uvp.transformationGoal?.sources) {
                    uvp.transformationGoal.sources.forEach(s => sources.add(s.platform || s.type || 'Unknown'));
                  }
                  if (uvp.uniqueSolution?.sources) {
                    uvp.uniqueSolution.sources.forEach(s => sources.add(s.platform || s.type || 'Unknown'));
                  }
                  if (uvp.keyBenefit?.sources) {
                    uvp.keyBenefit.sources.forEach(s => sources.add(s.platform || s.type || 'Unknown'));
                  }

                  if (sources.size === 0) {
                    return (
                      <p className="text-gray-500 italic">No data sources recorded</p>
                    );
                  }

                  return Array.from(sources).map((source, idx) => (
                    <Badge key={idx} variant="outline" className="capitalize">
                      {source}
                    </Badge>
                  ));
                })()}
              </div>

              {/* Last Updated */}
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Created: {uvp.createdAt ? new Date(uvp.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
                <span>
                  Updated: {uvp.updatedAt ? new Date(uvp.updatedAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default BrandProfilePage;
