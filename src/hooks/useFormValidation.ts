/**
 * Enhanced Form Validation Hook
 * 
 * Provides comprehensive form validation with real-time feedback.
 * Supports authentication-specific validation rules and patterns.
 * 
 * Features:
 * - Real-time field validation
 * - Touch state tracking
 * - Submit handling with validation
 * - Pre-configured validation sets
 * - Custom validation rules
 */

import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  match?: string;
  custom?: (value: unknown) => string | null;
  message?: string;
}

export interface ValidationRules {
  [field: string]: ValidationRule | ValidationRule[];
}

export interface FormValidationResult {
  isValid: boolean;
  errors: { [field: string]: string };
  touchedFields: string[];
}

interface UseFormValidationProps {
  rules: ValidationRules | 'registration' | 'login' | 'profile' | 'password_reset';
  initialValues?: Record<string, unknown>;
}

interface ValidationErrors {
  [field: string]: string;
}

export function useFormValidation({ rules, initialValues = {} }: UseFormValidationProps) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get validation rules based on preset or custom rules
  const getValidationRules = useCallback((): ValidationRules => {
    if (typeof rules === 'string') {
      return getPresetRules(rules);
    }
    return rules;
  }, [rules]);

  const validateField = useCallback((fieldName: string, value: unknown): string | null => {
    const fieldRules = getValidationRules()[fieldName];
    if (!fieldRules) return null;

    const rulesToApply = Array.isArray(fieldRules) ? fieldRules : [fieldRules];

    for (const rule of rulesToApply) {
      // Required validation
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        return rule.message || `${fieldName} is required`;
      }

      // Skip other validations if field is empty and not required
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        continue;
      }

      const stringValue = String(value);

      // Length validations
      if (rule.minLength && stringValue.length < rule.minLength) {
        return rule.message || `${fieldName} must be at least ${rule.minLength} characters`;
      }

      if (rule.maxLength && stringValue.length > rule.maxLength) {
        return rule.message || `${fieldName} must be no more than ${rule.maxLength} characters`;
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(stringValue)) {
        return rule.message || `${fieldName} format is invalid`;
      }

      // Match validation (for password confirmation)
      if (rule.match) {
        const matchValue = getFieldValue(rule.match, initialValues);
        if (stringValue !== matchValue) {
          return rule.message || `${fieldName} does not match ${rule.match}`;
        }
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          return customError;
        }
      }
    }

    return null;
  }, [getValidationRules, initialValues]);

  const setFieldError = useCallback((fieldName: string, error: string | null) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[fieldName] = error;
      } else {
        delete newErrors[fieldName];
      }
      return newErrors;
    });
  }, []);

  const validateFieldAndSet = useCallback((fieldName: string, value: unknown) => {
    const error = validateField(fieldName, value);
    setFieldError(fieldName, error);

    // Mark field as touched
    setTouchedFields(prev => 
      prev.includes(fieldName) ? prev : [...prev, fieldName]
    );

    return error === null;
  }, [validateField, setFieldError]);

  const validateForm = useCallback((formData: Record<string, unknown>): FormValidationResult => {
    const formErrors: { [field: string]: string } = {};
    const validationRules = getValidationRules();

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        formErrors[fieldName] = error;
      }
    });

    setErrors(formErrors);
    return {
      isValid: Object.keys(formErrors).length === 0,
      errors: formErrors,
      touchedFields
    };
  }, [getValidationRules, validateField, touchedFields]);

  const handleSubmit = useCallback(async (
    formData: Record<string, unknown>, 
    onSubmit: (data: Record<string, unknown>) => Promise<void> | void
  ) => {
    setIsSubmitting(true);
    
    try {
      const validation = validateForm(formData);
      if (validation.isValid) {
        await onSubmit(formData);
      }
      return validation;
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouchedFields([]);
  }, []);

  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return touchedFields.includes(fieldName) ? errors[fieldName] : undefined;
  }, [errors, touchedFields]);

  return {
    errors,
    touchedFields,
    isSubmitting,
    validateField: validateFieldAndSet,
    validateForm,
    handleSubmit,
    clearErrors,
    getFieldError,
    setFieldError
  };
}

// Helper function to get field value from form data
function getFieldValue(fieldName: string, formData: Record<string, unknown>): string {
  return String(formData[fieldName] || '');
}

// Preset validation rules
function getPresetRules(preset: string): ValidationRules {
  switch (preset) {
    case 'registration':
      return {
        email: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Please enter a valid email address'
        },
        password: {
          required: true,
          minLength: 8,
          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          message: 'Password must contain at least 8 characters with uppercase, lowercase, number and special character'
        },
        confirmPassword: {
          required: true,
          match: 'password',
          message: 'Passwords must match'
        },
        firstName: {
          required: true,
          minLength: 2,
          message: 'First name must be at least 2 characters'
        },
        lastName: {
          required: true,
          minLength: 2,
          message: 'Last name must be at least 2 characters'
        },
        userType: {
          required: true,
          custom: (value) => {
            const validTypes = ['job_seeker', 'partner', 'admin'];
            return validTypes.includes(String(value)) ? null : 'Please select a valid user type';
          }
        },
        acceptedTerms: {
          required: true,
          custom: (value) => value === true ? null : 'You must accept the terms of service'
        },
        acceptedPrivacy: {
          required: true,
          custom: (value) => value === true ? null : 'You must accept the privacy policy'
        }
      };

    case 'login':
      return {
        email: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Please enter a valid email address'
        },
        password: {
          required: true,
          message: 'Password is required'
        }
      };

    case 'profile':
      return {
        firstName: {
          required: true,
          minLength: 2,
          maxLength: 50
        },
        lastName: {
          required: true,
          minLength: 2,
          maxLength: 50
        },
        bio: {
          maxLength: 500,
          message: 'Bio must be less than 500 characters'
        },
        phone: {
          pattern: /^\+?[\d\s\-()]+$/,
          message: 'Please enter a valid phone number'
        },
        website: {
          pattern: /^https?:\/\/.+/,
          message: 'Please enter a valid website URL'
        }
      };

    case 'password_reset':
      return {
        email: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Please enter a valid email address'
        },
        otp: {
          required: true,
          pattern: /^\d{6}$/,
          message: 'Please enter a valid 6-digit code'
        },
        newPassword: {
          required: true,
          minLength: 8,
          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          message: 'Password must contain at least 8 characters with uppercase, lowercase, number and special character'
        },
        confirmPassword: {
          required: true,
          match: 'newPassword',
          message: 'Passwords must match'
        }
      };

    default:
      return {};
  }
}

// Common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  phone: /^\+?[\d\s\-()]+$/,
  url: /^https?:\/\/.+/,
  zipCode: /^\d{5}(-\d{4})?$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  letters: /^[a-zA-Z\s]+$/,
  numbers: /^\d+$/
};

// Validation utility functions
export const validationUtils = {
  isEmail: (value: string): boolean => validationPatterns.email.test(value),
  isStrongPassword: (value: string): boolean => validationPatterns.password.test(value),
  isPhone: (value: string): boolean => validationPatterns.phone.test(value),
  isUrl: (value: string): boolean => validationPatterns.url.test(value),
  
  // Custom validators
  isValidUserType: (value: string): boolean => {
    return ['job_seeker', 'partner', 'admin'].includes(value);
  },
  
  isValidOTP: (value: string): boolean => {
    return /^\d{6}$/.test(value);
  },
  
  isMinAge: (birthDate: string, minAge: number): boolean => {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    return age >= minAge;
  }
}; 