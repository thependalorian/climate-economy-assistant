/**
 * ACT Brand Utilities
 *
 * This file contains utilities and constants for implementing
 * the Alliance for Climate Transition (ACT) brand guidelines
 * consistently throughout the application.
 */

// ACT Brand Colors (from brand guidelines)
export const ACT_COLORS = {
  // Primary Colors
  MIDNIGHT_FOREST: '#001818',
  MOSS_GREEN: '#394816',
  SPRING_GREEN: '#B2DE26',
  SEAFOAM_BLUE: '#E0FFFF',
  SAND_GRAY: '#EBE9E1',

  // Secondary Colors (tints)
  MINT: '#B2DE26', // Spring Green 30% tint
  SAGE: '#6B8A3A', // Moss Green 60% tint
  SILVER: '#4D5A5A', // Midnight Forest 30% tint

  // Utility Colors
  WHITE: '#FFFFFF',
  BLACK: '#001818', // Use Midnight Forest instead of pure black
} as const;

// ACT Brand Typography
export const ACT_TYPOGRAPHY = {
  // Font Families
  TITLE_FONT: 'Helvetica, Arial, sans-serif',
  BODY_FONT: 'Inter, ui-sans-serif, system-ui',

  // Font Weights (Helvetica)
  TITLE_WEIGHTS: {
    THIN: 100,
    LIGHT: 300,
    REGULAR: 400,
    MEDIUM: 500,
  },

  // Font Weights (Inter)
  BODY_WEIGHTS: {
    THIN: 100,
    EXTRA_LIGHT: 200,
    LIGHT: 300,
    REGULAR: 400,
    MEDIUM: 500,
    SEMI_BOLD: 600,
    BOLD: 700,
    EXTRA_BOLD: 800,
    BLACK: 900,
  },

  // Letter Spacing
  TRACKING: {
    TIGHT: '-0.02em',
    NORMAL: '0em',
    WIDE: '0.025em',
  },

  // Line Heights
  LEADING: {
    TIGHT: 1.15, // For headings
    NORMAL: 1.25, // For body text
    RELAXED: 1.5, // For large text blocks
  },
} as const;

// ACT Brand Spacing (based on logo grid system)
export const ACT_SPACING = {
  XS: '0.25rem',
  SM: '0.5rem',
  MD: '1rem',
  LG: '1.5rem',
  XL: '2rem',
  '2XL': '3rem',
  '3XL': '4rem',
} as const;

// ACT Brand Border Radius
export const ACT_RADIUS = {
  DEFAULT: '0.5rem',
  LG: '0.75rem',
  XL: '1rem',
} as const;

// ACT Brand Component Classes
export const ACT_CLASSES = {
  // Buttons
  BTN_PRIMARY: 'btn-primary',
  BTN_SECONDARY: 'btn-secondary',
  BTN_OUTLINE: 'btn-outline',
  BTN_GHOST: 'btn-ghost',

  // Cards
  CARD: 'card',
  CARD_TITLE: 'card-title',
  CARD_BODY: 'card-body',

  // Forms
  INPUT: 'input',
  SELECT: 'select',
  TEXTAREA: 'textarea',

  // Badges
  BADGE: 'badge',
  BADGE_PRIMARY: 'badge-primary',
  BADGE_SECONDARY: 'badge-secondary',
  BADGE_ACCENT: 'badge-accent',
  BADGE_NEUTRAL: 'badge-neutral',

  // Layout
  CONTAINER: 'container',
  SECTION: 'section',
  SECTION_SM: 'section-sm',
  SECTION_LG: 'section-lg',

  // ACT Brand Elements
  FRAME: 'act-frame',
  BRACKET: 'act-bracket',
  BRACKET_SM: 'act-bracket-sm',
  BRACKET_LG: 'act-bracket-lg',
  BLUR_BG: 'act-blur-bg',
  HERO: 'act-hero',
  DIVIDER: 'act-divider',
  CARD_HOVER: 'act-card-hover',
  FOCUS: 'act-focus',
  FADE_IN: 'act-fade-in',
  SLIDE_UP: 'act-slide-up',
} as const;

/**
 * Generate ACT brand-compliant button classes
 */
export function getButtonClasses(
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md',
  additionalClasses: string = ''
): string {
  const baseClasses = ACT_CLASSES[`BTN_${variant.toUpperCase()}` as keyof typeof ACT_CLASSES];
  const sizeClasses = {
    sm: 'px-act-sm py-act-xs text-sm',
    md: 'px-act-lg py-act-sm text-base',
    lg: 'px-act-xl py-act-md text-lg',
  };

  return `${baseClasses} ${sizeClasses[size]} ${additionalClasses}`.trim();
}

/**
 * Generate ACT brand-compliant card classes
 */
export function getCardClasses(
  variant: 'default' | 'hover' | 'frame' | 'bracket' = 'default',
  additionalClasses: string = ''
): string {
  const baseClasses = ACT_CLASSES.CARD;
  const variantClasses = {
    default: '',
    hover: ACT_CLASSES.CARD_HOVER,
    frame: ACT_CLASSES.FRAME,
    bracket: ACT_CLASSES.BRACKET,
  };

  return `${baseClasses} ${variantClasses[variant]} ${additionalClasses}`.trim();
}

/**
 * Generate ACT brand-compliant badge classes
 */
export function getBadgeClasses(
  variant: 'primary' | 'secondary' | 'accent' | 'neutral' = 'primary',
  additionalClasses: string = ''
): string {
  const baseClasses = ACT_CLASSES[`BADGE_${variant.toUpperCase()}` as keyof typeof ACT_CLASSES];

  return `${baseClasses} ${additionalClasses}`.trim();
}

/**
 * Generate ACT brand-compliant text classes
 */
export function getTextClasses(
  element: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span',
  variant: 'default' | 'light' | 'medium' | 'bold' = 'default',
  additionalClasses: string = ''
): string {
  const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(element);
  const baseClasses = isHeading ? 'font-display text-midnight-forest' : 'font-body text-midnight-forest';

  const variantClasses = {
    default: isHeading ? 'font-normal' : 'font-normal',
    light: 'font-light',
    medium: 'font-medium',
    bold: 'font-semibold',
  };

  const trackingClass = 'tracking-act-tight';
  const leadingClass = isHeading ? 'leading-act-tight' : 'leading-act-normal';

  return `${baseClasses} ${variantClasses[variant]} ${trackingClass} ${leadingClass} ${additionalClasses}`.trim();
}

/**
 * Generate ACT brand-compliant section classes
 */
export function getSectionClasses(
  size: 'sm' | 'md' | 'lg' = 'md',
  background: 'default' | 'hero' | 'blur' = 'default',
  additionalClasses: string = ''
): string {
  const sizeClasses = {
    sm: ACT_CLASSES.SECTION_SM,
    md: ACT_CLASSES.SECTION,
    lg: ACT_CLASSES.SECTION_LG,
  };

  const backgroundClasses = {
    default: '',
    hero: ACT_CLASSES.HERO,
    blur: ACT_CLASSES.BLUR_BG,
  };

  return `${sizeClasses[size]} ${backgroundClasses[background]} ${additionalClasses}`.trim();
}

/**
 * ACT Brand Animation Utilities
 */
export const ACT_ANIMATIONS = {
  /**
   * Apply fade-in animation to an element
   */
  fadeIn: (element: HTMLElement, delay: number = 0) => {
    setTimeout(() => {
      element.classList.add(ACT_CLASSES.FADE_IN);
    }, delay);
  },

  /**
   * Apply slide-up animation to an element
   */
  slideUp: (element: HTMLElement, delay: number = 0) => {
    setTimeout(() => {
      element.classList.add(ACT_CLASSES.SLIDE_UP);
    }, delay);
  },

  /**
   * Stagger animations for multiple elements
   */
  stagger: (elements: HTMLElement[], animation: 'fadeIn' | 'slideUp', staggerDelay: number = 100) => {
    elements.forEach((element, index) => {
      ACT_ANIMATIONS[animation](element, index * staggerDelay);
    });
  },
};

/**
 * ACT Brand Validation Utilities
 */
export const ACT_VALIDATION = {
  /**
   * Check if a color is part of the ACT brand palette
   */
  isValidColor: (color: string): boolean => {
    return Object.values(ACT_COLORS).includes(color as string);
  },

  /**
   * Check if a font family is ACT brand compliant
   */
  isValidFont: (fontFamily: string): boolean => {
    return fontFamily.includes('Helvetica') || fontFamily.includes('Inter');
  },

  /**
   * Validate ACT brand compliance for a component
   */
  validateComponent: (element: HTMLElement): { valid: boolean; issues: string[] } => {
    const issues: string[] = [];
    const computedStyle = window.getComputedStyle(element);

    // Check font family
    const fontFamily = computedStyle.fontFamily;
    if (!ACT_VALIDATION.isValidFont(fontFamily)) {
      issues.push(`Invalid font family: ${fontFamily}. Use Helvetica for headings or Inter for body text.`);
    }

    // Check letter spacing
    const letterSpacing = computedStyle.letterSpacing;
    if (letterSpacing !== '-0.02em' && letterSpacing !== '0em' && letterSpacing !== '0.025em') {
      issues.push(`Invalid letter spacing: ${letterSpacing}. Use ACT brand tracking values.`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  },
};

export default {
  COLORS: ACT_COLORS,
  TYPOGRAPHY: ACT_TYPOGRAPHY,
  SPACING: ACT_SPACING,
  RADIUS: ACT_RADIUS,
  CLASSES: ACT_CLASSES,
  getButtonClasses,
  getCardClasses,
  getBadgeClasses,
  getTextClasses,
  getSectionClasses,
  ANIMATIONS: ACT_ANIMATIONS,
  VALIDATION: ACT_VALIDATION,
};
