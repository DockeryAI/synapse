/**
 * SmartConfirmation Component
 *
 * Shows detected business data in 4 quick confirmation cards:
 * 1. What You Offer - Services (toggle on/off, add missing)
 * 2. Who You Serve - Customer types (pick primary)
 * 3. Your Value - Value proposition (edit inline)
 * 4. Location & Details - Confirm location and business name
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Plus, Edit2, MapPin, Building2, Target, Sparkles, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ExtractedUVPData } from '@/types/smart-uvp.types';

interface SmartConfirmationProps {
  businessName: string;
  specialization: string;
  location: string;
  uvpData: ExtractedUVPData;
  websiteAnalysis: {
    valuePropositions: string[];
    targetAudience: string[];
    solutions: string[];
  };
  onConfirm: (refinedData: RefinedBusinessData) => void;
  onBack?: () => void;
}

export interface RefinedBusinessData {
  businessName: string;
  specialization: string;
  location: string;
  selectedServices: string[];
  selectedCustomers: string[];
  selectedValueProps: string[];
  selectedTestimonials: string[];
}

export const SmartConfirmation: React.FC<SmartConfirmationProps> = ({
  businessName,
  specialization,
  location,
  uvpData,
  websiteAnalysis,
  onConfirm,
  onBack
}) => {
  // Card 1: Services (toggle selection)
  const allServices = [
    ...uvpData.services.map(s => s.text),
    ...websiteAnalysis.solutions.slice(0, 8) // Add more from website analysis
  ].filter((service, index, self) =>
    service && self.indexOf(service) === index // Deduplicate
  ).slice(0, 12); // Limit to 12 services

  const [selectedServices, setSelectedServices] = useState<string[]>(
    allServices.slice(0, 6) // Pre-select first 6
  );
  const [customService, setCustomService] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);

  // Card 2: Customer types (multi-select)
  const allCustomerTypes = [
    ...uvpData.customerTypes.map(c => c.text),
    ...websiteAnalysis.targetAudience.slice(0, 8)
  ].filter((customer, index, self) =>
    customer && self.indexOf(customer) === index
  ).slice(0, 12);

  const [selectedCustomers, setSelectedCustomers] = useState<string[]>(
    allCustomerTypes.slice(0, 3) // Pre-select first 3
  );
  const [customCustomer, setCustomCustomer] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  // Card 3: Value propositions (multi-select)
  const allValueProps = [
    ...websiteAnalysis.valuePropositions,
    ...uvpData.differentiators.map(d => d.text)
  ].filter((prop, index, self) =>
    prop && self.indexOf(prop) === index
  ).slice(0, 10);

  const [selectedValueProps, setSelectedValueProps] = useState<string[]>(
    allValueProps.slice(0, 2) // Pre-select first 2
  );
  const [customValueProp, setCustomValueProp] = useState('');
  const [isAddingValueProp, setIsAddingValueProp] = useState(false);

  // Card 4: Testimonials/Case Studies (optional - only if detected)
  const allTestimonials = uvpData.testimonials.map(t => t.text).filter(t => t && t.length > 10).slice(0, 10);
  const hasTestimonials = allTestimonials.length > 0;

  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>(
    allTestimonials.slice(0, Math.min(2, allTestimonials.length)) // Pre-select first 2
  );
  const [customTestimonial, setCustomTestimonial] = useState('');
  const [isAddingTestimonial, setIsAddingTestimonial] = useState(false);

  // Card 5: Location & Business name
  const [editedBusinessName, setEditedBusinessName] = useState(businessName);
  const [editedLocation, setEditedLocation] = useState(location);
  const [isEditingBusinessName, setIsEditingBusinessName] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  const toggleService = (service: string) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter(s => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const addCustomService = () => {
    if (customService.trim()) {
      setSelectedServices([...selectedServices, customService.trim()]);
      setCustomService('');
      setIsAddingService(false);
    }
  };

  const toggleCustomer = (customer: string) => {
    if (selectedCustomers.includes(customer)) {
      setSelectedCustomers(selectedCustomers.filter(c => c !== customer));
    } else {
      setSelectedCustomers([...selectedCustomers, customer]);
    }
  };

  const addCustomCustomer = () => {
    if (customCustomer.trim()) {
      setSelectedCustomers([...selectedCustomers, customCustomer.trim()]);
      setCustomCustomer('');
      setIsAddingCustomer(false);
    }
  };

  const toggleValueProp = (prop: string) => {
    if (selectedValueProps.includes(prop)) {
      setSelectedValueProps(selectedValueProps.filter(p => p !== prop));
    } else {
      setSelectedValueProps([...selectedValueProps, prop]);
    }
  };

  const addCustomValueProp = () => {
    if (customValueProp.trim()) {
      setSelectedValueProps([...selectedValueProps, customValueProp.trim()]);
      setCustomValueProp('');
      setIsAddingValueProp(false);
    }
  };

  const toggleTestimonial = (testimonial: string) => {
    if (selectedTestimonials.includes(testimonial)) {
      setSelectedTestimonials(selectedTestimonials.filter(t => t !== testimonial));
    } else {
      setSelectedTestimonials([...selectedTestimonials, testimonial]);
    }
  };

  const addCustomTestimonial = () => {
    if (customTestimonial.trim()) {
      setSelectedTestimonials([...selectedTestimonials, customTestimonial.trim()]);
      setCustomTestimonial('');
      setIsAddingTestimonial(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      businessName: editedBusinessName,
      specialization,
      location: editedLocation,
      selectedServices,
      selectedCustomers,
      selectedValueProps,
      selectedTestimonials
    });
  };

  const canContinue = selectedServices.length > 0 && selectedCustomers.length > 0 && selectedValueProps.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Almost There!
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Confirm Your Business Details
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            We found this information from your website. Please confirm it's accurate.
          </p>
        </div>

        {/* Confirmation Cards */}
        <div className="space-y-6 mb-8">
          {/* Card 1: What You Offer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">What You Offer</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select the services you want to promote
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {allServices.map((service) => {
                const isSelected = selectedServices.includes(service);
                return (
                  <button
                    key={service}
                    onClick={() => toggleService(service)}
                    className={`
                      px-4 py-2 rounded-lg border-2 transition-all min-h-[44px]
                      ${isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-slate-500'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-4 h-4 inline mr-1" />}
                    {service}
                  </button>
                );
              })}
            </div>

            {!isAddingService ? (
              <button
                onClick={() => setIsAddingService(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                Add a service we missed
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customService}
                  onChange={(e) => setCustomService(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomService()}
                  placeholder="Enter service name"
                  className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white min-h-[44px]"
                  autoFocus
                />
                <Button onClick={addCustomService} className="min-h-[44px] min-w-[44px]">
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => { setIsAddingService(false); setCustomService(''); }}
                  variant="outline"
                  className="min-h-[44px] min-w-[44px]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </motion.div>

          {/* Card 2: Who You Serve */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Who You Serve</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select all your target customers
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {allCustomerTypes.map((customer) => {
                const isSelected = selectedCustomers.includes(customer);
                return (
                  <button
                    key={customer}
                    onClick={() => toggleCustomer(customer)}
                    className={`
                      px-4 py-2 rounded-lg border-2 transition-all min-h-[44px]
                      ${isSelected
                        ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300'
                        : 'bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-slate-500'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-4 h-4 inline mr-1" />}
                    {customer}
                  </button>
                );
              })}
            </div>

            {!isAddingCustomer ? (
              <button
                onClick={() => setIsAddingCustomer(true)}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                Add a customer type we missed
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCustomer}
                  onChange={(e) => setCustomCustomer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomCustomer()}
                  placeholder="Enter customer type"
                  className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:border-purple-500 dark:focus:border-purple-500 focus:outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white min-h-[44px]"
                  autoFocus
                />
                <Button onClick={addCustomCustomer} className="min-h-[44px] min-w-[44px]">
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => { setIsAddingCustomer(false); setCustomCustomer(''); }}
                  variant="outline"
                  className="min-h-[44px] min-w-[44px]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </motion.div>

          {/* Card 3: Your Value */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Value</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select what makes you different
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {allValueProps.map((prop) => {
                const isSelected = selectedValueProps.includes(prop);
                return (
                  <button
                    key={prop}
                    onClick={() => toggleValueProp(prop)}
                    className={`
                      px-4 py-2 rounded-lg border-2 transition-all min-h-[44px] text-left
                      ${isSelected
                        ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300'
                        : 'bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-slate-500'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-4 h-4 inline mr-1" />}
                    {prop}
                  </button>
                );
              })}
            </div>

            {!isAddingValueProp ? (
              <button
                onClick={() => setIsAddingValueProp(true)}
                className="text-sm text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                Add your own value proposition
              </button>
            ) : (
              <div className="flex gap-2">
                <textarea
                  value={customValueProp}
                  onChange={(e) => setCustomValueProp(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addCustomValueProp();
                    }
                  }}
                  placeholder="Enter your value proposition"
                  className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:border-green-500 dark:focus:border-green-500 focus:outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white min-h-[44px] resize-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex flex-col gap-2">
                  <Button onClick={addCustomValueProp} className="min-h-[44px] min-w-[44px]">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => { setIsAddingValueProp(false); setCustomValueProp(''); }}
                    variant="outline"
                    className="min-h-[44px] min-w-[44px]"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Card 4: Testimonials (optional - only if detected) */}
          {hasTestimonials && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <Quote className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Customer Testimonials</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select testimonials to feature (optional)
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {allTestimonials.map((testimonial, index) => {
                  const isSelected = selectedTestimonials.includes(testimonial);
                  return (
                    <button
                      key={index}
                      onClick={() => toggleTestimonial(testimonial)}
                      className={`
                        w-full text-left px-4 py-3 rounded-lg border-2 transition-all min-h-[44px]
                        ${isSelected
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-300'
                          : 'bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-slate-500'
                        }
                      `}
                    >
                      <div className="flex items-start gap-2">
                        {isSelected && <Check className="w-4 h-4 flex-shrink-0 mt-1" />}
                        <span className="text-sm italic">"{testimonial}"</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {!isAddingTestimonial ? (
                <button
                  onClick={() => setIsAddingTestimonial(true)}
                  className="text-sm text-yellow-600 dark:text-yellow-400 hover:underline flex items-center gap-1 min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  Add your own testimonial or case study
                </button>
              ) : (
                <div className="flex gap-2">
                  <textarea
                    value={customTestimonial}
                    onChange={(e) => setCustomTestimonial(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addCustomTestimonial();
                      }
                    }}
                    placeholder="Enter customer testimonial or case study"
                    className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:border-yellow-500 dark:focus:border-yellow-500 focus:outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white min-h-[44px] resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex flex-col gap-2">
                    <Button onClick={addCustomTestimonial} className="min-h-[44px] min-w-[44px]">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => { setIsAddingTestimonial(false); setCustomTestimonial(''); }}
                      variant="outline"
                      className="min-h-[44px] min-w-[44px]"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Card 5: Location & Business Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: hasTestimonials ? 0.4 : 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Location & Details</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Confirm your business info
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Name
                </label>
                {isEditingBusinessName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editedBusinessName}
                      onChange={(e) => setEditedBusinessName(e.target.value)}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white min-h-[44px]"
                      autoFocus
                    />
                    <Button
                      onClick={() => setIsEditingBusinessName(false)}
                      className="min-h-[44px] min-w-[44px]"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 min-h-[44px]">
                    <span className="text-gray-900 dark:text-white">{editedBusinessName}</span>
                    <button
                      onClick={() => setIsEditingBusinessName(true)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Service Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service Area
                </label>
                {isEditingLocation ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editedLocation}
                      onChange={(e) => setEditedLocation(e.target.value)}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white min-h-[44px]"
                      autoFocus
                    />
                    <Button
                      onClick={() => setIsEditingLocation(false)}
                      className="min-h-[44px] min-w-[44px]"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 min-h-[44px]">
                    <span className="text-gray-900 dark:text-white">{editedLocation}</span>
                    <button
                      onClick={() => setIsEditingLocation(true)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Specialization (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Specialization
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
                  <span className="text-gray-900 dark:text-white">{specialization}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 min-h-[56px]"
            >
              Back
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={!canContinue}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Content
          </Button>
        </div>

        {/* Helper text */}
        {!canContinue && (
          <p className="text-center text-sm text-red-600 dark:text-red-400 mt-4">
            Please select at least one service, one customer type, and one value proposition to continue
          </p>
        )}
      </div>
    </div>
  );
};
