/**
 * Universal Templates
 *
 * Starter templates for content generation.
 * These templates work across all industries and can be customized.
 */

import type { Template } from '../../types/template.types';

export const UNIVERSAL_TEMPLATES: Template[] = [
  {
    id: 'promo-001',
    name: 'Special Offer Announcement',
    description: 'Promote a special offer or discount',
    contentType: 'promotional',
    platform: ['facebook', 'instagram', 'linkedin'],
    industryTags: ['all'],
    structure: 'offer',
    variables: [
      {
        key: 'business_name',
        label: 'Business Name',
        required: true,
        type: 'text',
      },
      {
        key: 'offer',
        label: 'Offer Details',
        required: true,
        type: 'text',
      },
      {
        key: 'cta',
        label: 'Call to Action',
        required: false,
        type: 'text',
        defaultValue: 'Learn more',
      },
    ],
    averageSynapseScore: 75,
    useCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'edu-001',
    name: 'Educational Tip',
    description: 'Share valuable industry knowledge',
    contentType: 'educational',
    platform: ['linkedin', 'facebook'],
    industryTags: ['all'],
    structure: 'authority',
    variables: [
      {
        key: 'business_name',
        label: 'Business Name',
        required: true,
        type: 'text',
      },
      {
        key: 'topic',
        label: 'Topic',
        required: true,
        type: 'text',
      },
      {
        key: 'benefit',
        label: 'Main Benefit',
        required: true,
        type: 'text',
      },
    ],
    averageSynapseScore: 80,
    useCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'comm-001',
    name: 'Community Engagement',
    description: 'Engage with your local community',
    contentType: 'community',
    platform: ['facebook', 'instagram'],
    industryTags: ['all'],
    structure: 'announcement',
    variables: [
      {
        key: 'business_name',
        label: 'Business Name',
        required: true,
        type: 'text',
      },
      {
        key: 'offering',
        label: 'What to announce',
        required: true,
        type: 'text',
      },
      {
        key: 'benefit',
        label: 'Benefit to community',
        required: true,
        type: 'text',
      },
    ],
    averageSynapseScore: 70,
    useCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'auth-001',
    name: 'Authority Builder',
    description: 'Establish expertise in your field',
    contentType: 'authority',
    platform: ['linkedin', 'facebook'],
    industryTags: ['all'],
    structure: 'list',
    variables: [
      {
        key: 'business_name',
        label: 'Business Name',
        required: true,
        type: 'text',
      },
      {
        key: 'business_type',
        label: 'Business Type',
        required: true,
        type: 'text',
      },
      {
        key: 'benefit',
        label: 'Key Benefit',
        required: true,
        type: 'text',
      },
    ],
    averageSynapseScore: 78,
    useCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'announce-001',
    name: 'General Announcement',
    description: 'Share business news and updates',
    contentType: 'announcement',
    platform: ['facebook', 'instagram', 'linkedin'],
    industryTags: ['all'],
    structure: 'announcement',
    variables: [
      {
        key: 'business_name',
        label: 'Business Name',
        required: true,
        type: 'text',
      },
      {
        key: 'offering',
        label: 'What to announce',
        required: true,
        type: 'text',
      },
      {
        key: 'benefit',
        label: 'Customer benefit',
        required: true,
        type: 'text',
      },
    ],
    averageSynapseScore: 72,
    useCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'engage-001',
    name: 'Engagement Post',
    description: 'Drive interaction and conversation',
    contentType: 'engagement',
    platform: ['facebook', 'instagram', 'linkedin'],
    industryTags: ['all'],
    structure: 'faq',
    variables: [
      {
        key: 'question',
        label: 'Question to ask',
        required: true,
        type: 'text',
      },
      {
        key: 'answer',
        label: 'Your answer',
        required: true,
        type: 'text',
      },
    ],
    averageSynapseScore: 68,
    useCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
