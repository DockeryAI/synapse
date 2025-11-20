/**
 * Manual Service Input Component
 *
 * Allows users to manually add services/products that weren't detected
 * Includes guided questions for JTBD-based value extraction
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Chip,
  Alert,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  LightbulbOutlined as LightbulbIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { outcomeMapper } from '@/services/intelligence/outcome-mapper.service';
import type { ProductService } from '@/types/uvp-flow.types';

interface ManualServiceInputProps {
  onAdd: (service: ProductService) => void;
  existingServices?: ProductService[];
  businessName?: string;
}

interface ServiceFormData {
  name: string;
  whatItDoes: string;
  whoItsFor: string;
  problemItSolves: string;
  transformation: string;
}

const GUIDED_QUESTIONS = [
  {
    field: 'name',
    label: 'What service or product are you offering?',
    helper: 'Be specific (e.g., "Tax Resolution Services" not just "Tax Help")',
    placeholder: 'e.g., IRS Debt Resolution, Estate Planning, Personal Injury Representation'
  },
  {
    field: 'whatItDoes',
    label: 'What does this service actually do?',
    helper: 'Describe the tangible actions or deliverables',
    placeholder: 'e.g., Negotiates payment plans with the IRS, Creates living trusts and wills'
  },
  {
    field: 'whoItsFor',
    label: 'Who specifically needs this service?',
    helper: 'Describe the person and their situation',
    placeholder: 'e.g., Small business owners facing IRS audits, Families planning their estate'
  },
  {
    field: 'problemItSolves',
    label: 'What painful problem does it solve?',
    helper: 'Focus on the emotional or financial pain',
    placeholder: 'e.g., Fear of losing business assets to IRS, Anxiety about family disputes after death'
  },
  {
    field: 'transformation',
    label: 'What transformation happens after using this service?',
    helper: 'Describe the "after" state - how is their life better?',
    placeholder: 'e.g., Peace of mind with manageable payments, Confidence that family is protected'
  }
];

export const ManualServiceInput: React.FC<ManualServiceInputProps> = ({
  onAdd,
  existingServices = [],
  businessName
}) => {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    whatItDoes: '',
    whoItsFor: '',
    problemItSolves: '',
    transformation: ''
  });
  const [quickAddName, setQuickAddName] = useState('');

  const handleOpen = () => {
    setOpen(true);
    setActiveStep(0);
    setFormData({
      name: '',
      whatItDoes: '',
      whoItsFor: '',
      problemItSolves: '',
      transformation: ''
    });
  };

  const handleClose = () => {
    setOpen(false);
    setShowQuickAdd(false);
    setQuickAddName('');
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleFieldChange = (field: keyof ServiceFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuickAdd = () => {
    if (!quickAddName.trim()) return;

    // Use outcome mapper to generate JTBD data
    const tempService: ProductService = {
      name: quickAddName.trim(),
      description: '',
      category: 'Manual',
      confidence: 100 // User-provided
    };

    const enhanced = outcomeMapper.enhanceWithOutcomes(tempService);

    onAdd({
      ...enhanced,
      description: enhanced.outcomes.valueStatement,
      source: 'manual'
    });

    setQuickAddName('');
    setShowQuickAdd(false);
  };

  const handleGuidedSubmit = () => {
    // Create value statement from form data
    const valueStatement = `Transform ${formData.problemItSolves} into ${formData.transformation}`;

    const newService: ProductService = {
      name: formData.name,
      description: valueStatement,
      category: 'Manual',
      confidence: 100, // User-provided is high confidence
      source: 'manual',
      metadata: {
        whatItDoes: formData.whatItDoes,
        targetCustomer: formData.whoItsFor,
        painPoint: formData.problemItSolves,
        outcome: formData.transformation
      }
    };

    onAdd(newService);
    handleClose();
  };

  const isStepComplete = (step: number) => {
    const field = GUIDED_QUESTIONS[step].field;
    return formData[field as keyof ServiceFormData].trim().length > 0;
  };

  return (
    <>
      {/* Add Service Button */}
      <Box sx={{ mt: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          fullWidth
          sx={{
            borderStyle: 'dashed',
            borderWidth: 2,
            py: 1.5,
            '&:hover': {
              borderStyle: 'dashed',
              borderWidth: 2,
              backgroundColor: 'action.hover'
            }
          }}
        >
          Add a service we missed
        </Button>

        {/* Quick Add Option */}
        <Collapse in={showQuickAdd}>
          <Paper sx={{ p: 2, mt: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter service name..."
                value={quickAddName}
                onChange={(e) => setQuickAddName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuickAdd();
                  if (e.key === 'Escape') setShowQuickAdd(false);
                }}
                autoFocus
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleQuickAdd}
                disabled={!quickAddName.trim()}
              >
                Add
              </Button>
              <IconButton
                size="small"
                onClick={() => setShowQuickAdd(false)}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Paper>
        </Collapse>

        {!showQuickAdd && (
          <Button
            size="small"
            sx={{ mt: 1 }}
            onClick={() => setShowQuickAdd(true)}
          >
            Quick add (name only)
          </Button>
        )}
      </Box>

      {/* Guided Input Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <LightbulbIcon color="primary" />
            <Typography variant="h6">
              Add a Service or Product
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Let's understand what value this service provides to customers
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            These questions help us create a powerful value proposition that focuses on customer outcomes, not just features.
          </Alert>

          <Stepper activeStep={activeStep} orientation="vertical">
            {GUIDED_QUESTIONS.map((question, index) => (
              <Step key={question.field}>
                <StepLabel
                  optional={
                    index === GUIDED_QUESTIONS.length - 1 ? (
                      <Typography variant="caption">Final step</Typography>
                    ) : null
                  }
                >
                  {question.label}
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {question.helper}
                  </Typography>

                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder={question.placeholder}
                    value={formData[question.field as keyof ServiceFormData]}
                    onChange={(e) => handleFieldChange(
                      question.field as keyof ServiceFormData,
                      e.target.value
                    )}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!isStepComplete(index)}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      {index === GUIDED_QUESTIONS.length - 1 ? 'Finish' : 'Continue'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {/* Summary after all steps */}
          {activeStep === GUIDED_QUESTIONS.length && (
            <Paper sx={{ p: 3, mt: 3, backgroundColor: 'success.50' }}>
              <Typography variant="h6" gutterBottom color="success.dark">
                Service Summary
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Chip label="Service" color="primary" size="small" sx={{ mr: 1 }} />
                <Typography variant="subtitle1" component="span">
                  {formData.name}
                </Typography>
              </Box>

              <Typography variant="body2" paragraph>
                <strong>What it does:</strong> {formData.whatItDoes}
              </Typography>

              <Typography variant="body2" paragraph>
                <strong>For:</strong> {formData.whoItsFor}
              </Typography>

              <Typography variant="body2" paragraph>
                <strong>Solves:</strong> {formData.problemItSolves}
              </Typography>

              <Typography variant="body2" paragraph>
                <strong>Creates:</strong> {formData.transformation}
              </Typography>

              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'primary.50', mt: 2 }}>
                <Typography variant="subtitle2" color="primary.dark" gutterBottom>
                  Generated Value Statement:
                </Typography>
                <Typography variant="body1">
                  "Transform {formData.problemItSolves} into {formData.transformation}"
                </Typography>
              </Paper>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleGuidedSubmit}
                  fullWidth
                >
                  Add This Service
                </Button>
              </Box>
            </Paper>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};