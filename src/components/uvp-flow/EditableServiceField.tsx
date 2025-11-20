/**
 * Editable Service Field Component
 *
 * Allows inline editing and AI improvement of extracted services/products
 * with JTBD outcome enhancement
 */

import React, { useState } from 'react';
import {
  TextField,
  IconButton,
  Tooltip,
  Box,
  CircularProgress,
  Typography,
  Chip,
  Paper,
  Collapse
} from '@mui/material';
import {
  Edit as EditIcon,
  AutoFixHigh as AutoFixIcon,
  Psychology as PsychologyIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  InfoOutlined as InfoIcon
} from '@mui/icons-material';
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
        description: enhanced.outcomes.valueStatement,
        metadata: {
          ...service.metadata,
          outcome: enhanced.outcomes.desiredOutcome,
          painPoint: enhanced.outcomes.painPoint,
          emotionalJob: enhanced.outcomes.emotionalJob
        }
      });

      // Show outcome details after improvement
      setShowOutcomeDetails(true);
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mb: 2,
        backgroundColor: outcomes.confidence > 70 ? 'success.50' : 'background.paper',
        border: '1px solid',
        borderColor: outcomes.confidence > 70 ? 'success.200' : 'divider'
      }}
    >
      <Box display="flex" alignItems="flex-start" gap={1}>
        {/* Service Name Field */}
        <Box flex={1}>
          {isEditing ? (
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                size="small"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                autoFocus
                label="Service/Product Name"
              />
              <IconButton size="small" onClick={handleSave} color="primary">
                <CheckIcon />
              </IconButton>
              <IconButton size="small" onClick={handleCancel}>
                <CloseIcon />
              </IconButton>
            </Box>
          ) : (
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle1" fontWeight="medium">
                  {service.name}
                </Typography>
                {outcomes.confidence > 70 && (
                  <Chip
                    size="small"
                    label={`${outcomes.confidence}% match`}
                    color="success"
                    variant="outlined"
                  />
                )}
              </Box>

              {/* Description/Value Statement */}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {service.description}
              </Typography>

              {/* Category and Confidence */}
              <Box display="flex" gap={1} mt={1}>
                <Chip
                  size="small"
                  label={service.category || 'Service'}
                  variant="outlined"
                />
                {service.confidence && (
                  <Chip
                    size="small"
                    label={`${service.confidence}% confident`}
                    variant="outlined"
                    color={service.confidence > 80 ? 'success' : 'default'}
                  />
                )}
              </Box>
            </Box>
          )}
        </Box>

        {/* Action Buttons */}
        {!isEditing && (
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Tooltip title="Edit service name">
              <IconButton size="small" onClick={handleEdit}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Transform to customer outcome">
              <IconButton
                size="small"
                onClick={handleImprove}
                disabled={isImproving}
                color="primary"
              >
                {isImproving ? (
                  <CircularProgress size={18} />
                ) : (
                  <AutoFixIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>

            {showOutcomes && (
              <Tooltip title={showOutcomeDetails ? "Hide JTBD analysis" : "Show JTBD analysis"}>
                <IconButton
                  size="small"
                  onClick={() => setShowOutcomeDetails(!showOutcomeDetails)}
                  color={showOutcomeDetails ? "primary" : "default"}
                >
                  <PsychologyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      {/* JTBD Outcome Details */}
      <Collapse in={showOutcomeDetails}>
        <Box
          sx={{
            mt: 2,
            p: 2,
            backgroundColor: 'background.default',
            borderRadius: 1,
            borderLeft: '3px solid',
            borderLeftColor: 'primary.main'
          }}
        >
          <Typography variant="subtitle2" gutterBottom color="primary">
            Jobs-to-be-Done Analysis
          </Typography>

          <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" gap={1}>
              <InfoIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Customer Pain:
                </Typography>
                <Typography variant="body2">
                  {outcomes.painPoint}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" gap={1}>
              <InfoIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Desired Outcome:
                </Typography>
                <Typography variant="body2">
                  {outcomes.desiredOutcome}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" gap={1}>
              <InfoIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Emotional Job:
                </Typography>
                <Typography variant="body2">
                  {outcomes.emotionalJob}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" gap={1}>
              <InfoIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Social Job:
                </Typography>
                <Typography variant="body2">
                  {outcomes.socialJob}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Suggested Value Statement */}
          <Paper
            elevation={0}
            sx={{
              mt: 2,
              p: 1.5,
              backgroundColor: 'primary.50'
            }}
          >
            <Typography variant="caption" color="primary.main" fontWeight="medium">
              Suggested Value Statement:
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              "{outcomes.valueStatement}"
            </Typography>
            <Box mt={1}>
              <Chip
                size="small"
                label="Click 'Transform' to apply"
                icon={<AutoFixIcon />}
                color="primary"
                variant="outlined"
              />
            </Box>
          </Paper>
        </Box>
      </Collapse>
    </Paper>
  );
};