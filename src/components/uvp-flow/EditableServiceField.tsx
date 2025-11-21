/**
 * Editable Service Field Component
 *
 * Allows inline editing and AI improvement of extracted services/products
 * with JTBD outcome enhancement
 */

import React, { useState } from 'react';
import {
  Pencil as EditIcon,
  Sparkles as AutoFixIcon,
  Brain as PsychologyIcon,
  Check as CheckIcon,
  X as CloseIcon,
  Info as InfoIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { outcomeMapper } from '@/services/intelligence/outcome-mapper.service';
import type { ProductService } from '@/types/uvp-flow.types';

interface EditableServiceFieldProps {
  service: ProductService;
  onUpdate: (updatedService: ProductService) => void;
  onDelete?: (serviceId: string) => void;
  showOutcomes?: boolean;
}

export const EditableServiceField: React.FC<EditableServiceFieldProps> = ({
  service,
  onUpdate,
  onDelete,
  showOutcomes = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(service.name);
  const [isImproving, setIsImproving] = useState(false);
  const [showOutcomeDetails, setShowOutcomeDetails] = useState(false);

  // Get JTBD outcomes for this service
  const outcomes = outcomeMapper.transformToOutcome(service);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(service.name);
  };

  const handleSave = () => {
    if (editValue.trim() && editValue !== service.name) {
      // Re-calculate outcomes for edited service
      const updatedService = {
        ...service,
        name: editValue.trim()
      };
      const newOutcomes = outcomeMapper.transformToOutcome(updatedService);

      onUpdate({
        ...updatedService,
        description: newOutcomes.confidence > 70
          ? newOutcomes.valueStatement
          : updatedService.description
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(service.name);
    setIsEditing(false);
  };

  const handleImprove = async () => {
    setIsImproving(true);
    try {
      // Transform to outcome-focused version
      const enhanced = outcomeMapper.enhanceWithOutcomes(service);

      // Update with value statement
      onUpdate({
        ...service,
        name: service.name, // Keep original name
        description: enhanced.outcomes.valueStatement
      });

      // Show outcome details after improvement
      setShowOutcomeDetails(true);
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <Card
      className={`mb-4 ${
        outcomes.confidence > 70
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-white dark:bg-slate-800'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-2">
          {/* Service Name Field */}
          <div className="flex-1">
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                  autoFocus
                  placeholder="Service/Product Name"
                  className="flex-1"
                />
                <Button size="sm" variant="ghost" onClick={handleSave}>
                  <CheckIcon className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  <CloseIcon className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {service.name}
                  </span>
                  {outcomes.confidence > 70 && (
                    <Badge variant="outline" className="text-green-700 border-green-700">
                      {outcomes.confidence}% match
                    </Badge>
                  )}
                </div>

                {/* Description/Value Statement */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {service.description}
                </p>

                {/* Category and Confidence */}
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">
                    {service.category || 'Service'}
                  </Badge>
                  {service.confidence && (
                    <Badge
                      variant="outline"
                      className={service.confidence > 80 ? 'text-green-700 border-green-700' : ''}
                    >
                      {service.confidence}% confident
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isEditing && (
            <TooltipProvider>
              <div className="flex flex-col gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={handleEdit}>
                      <EditIcon className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit service name</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleImprove}
                      disabled={isImproving}
                    >
                      {isImproving ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      ) : (
                        <AutoFixIcon className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Transform to customer outcome</TooltipContent>
                </Tooltip>

                {showOutcomes && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowOutcomeDetails(!showOutcomeDetails)}
                        className={showOutcomeDetails ? 'text-blue-600' : ''}
                      >
                        <PsychologyIcon className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {showOutcomeDetails ? "Hide JTBD analysis" : "Show JTBD analysis"}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          )}
        </div>

        {/* JTBD Outcome Details */}
        <Collapsible open={showOutcomeDetails} onOpenChange={setShowOutcomeDetails}>
          <CollapsibleContent>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border-l-4 border-blue-600">
              <h4 className="text-sm font-semibold text-blue-600 mb-3">
                Jobs-to-be-Done Analysis
              </h4>

              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <InfoIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Customer Pain:
                    </span>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {outcomes.painPoint}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <InfoIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Desired Outcome:
                    </span>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {outcomes.desiredOutcome}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <InfoIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Emotional Job:
                    </span>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {outcomes.emotionalJob}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <InfoIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Social Job:
                    </span>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {outcomes.socialJob}
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggested Value Statement */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Suggested Value Statement:
                </span>
                <p className="text-sm mt-1 text-gray-900 dark:text-white">
                  "{outcomes.valueStatement}"
                </p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-blue-700 border-blue-700">
                    <AutoFixIcon className="w-3 h-3 mr-1" />
                    Click 'Transform' to apply
                  </Badge>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
