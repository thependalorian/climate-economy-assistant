import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean().optional(),
});

export const registerSchema = z.object({
  userType: z.enum(['job_seeker', 'partner'], {
    required_error: 'Please select your user type',
  }),
  organization: z.string().min(1, 'Organization name is required').optional().nullable(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  terms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

export const partnerOnboardingSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required'),
  organizationType: z.enum([
    'employer',
    'training_provider',
    'educational_institution',
    'government_agency',
    'nonprofit',
    'industry_association'
  ], {
    required_error: 'Please select an organization type',
  }),
  website: z.string().url('Please enter a valid website URL'),
  description: z.string().min(50, 'Please provide a detailed description (at least 50 characters)'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  industry: z.array(z.string()).min(1, 'Please select at least one industry'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type PartnerOnboardingData = z.infer<typeof partnerOnboardingSchema>;