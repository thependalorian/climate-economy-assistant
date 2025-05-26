# ACT Brand Implementation Guide

This guide explains how to implement the Alliance for Climate Transition (ACT) brand guidelines in the Climate Ecosystem Assistant platform.

## 🎨 Brand Colors

### Primary Colors
- **Midnight Forest**: `#001818` - Primary dark color for text and backgrounds
- **Moss Green**: `#394816` - Secondary green for accents and buttons
- **Spring Green**: `#B2DE26` - Primary accent color for CTAs and highlights
- **Seafoam Blue**: `#E0FFFF` - Light accent for backgrounds and highlights
- **Sand Gray**: `#EBE9E1` - Neutral background color

### Usage in Code
```tsx
// Using Tailwind classes
<div className="bg-midnight-forest text-white">
<button className="bg-spring-green text-midnight-forest">
<span className="text-moss-green">

// Using CSS custom properties
.custom-element {
  background-color: var(--midnight-forest);
  color: var(--spring-green);
}
```

## 📝 Typography

### Font Families
- **Headings**: Helvetica (Thin, Light, Regular, Medium)
- **Body Text**: Inter (8 weights: 100-900)

### Implementation
```tsx
// Headings
<h1 className="font-display font-light text-5xl tracking-act-tight leading-act-tight">
<h2 className="font-display font-normal text-4xl tracking-act-tight leading-act-tight">

// Body text
<p className="font-body font-normal text-base tracking-act-tight leading-act-normal">
<span className="font-body font-medium text-sm">
```

### Typography Hierarchy
```css
h1: 3-6xl, font-light (300), Helvetica
h2: 3-5xl, font-light (300), Helvetica  
h3: 2-4xl, font-normal (400), Helvetica
h4: xl-3xl, font-normal (400), Helvetica
h5: lg-2xl, font-medium (500), Helvetica
h6: base-xl, font-medium (500), Helvetica
body: base, font-normal (400), Inter
```

## 🧩 Components

### Buttons
```tsx
// Primary button (Spring Green)
<button className="btn-primary">Get Started</button>

// Secondary button (Moss Green)
<button className="btn-secondary">Learn More</button>

// Outline button
<button className="btn-outline">Contact Us</button>

// Ghost button
<button className="btn-ghost">Cancel</button>

// Using utility function
import { getButtonClasses } from '@/utils/actBrand';
<button className={getButtonClasses('primary', 'lg', 'w-full')}>
```

### Cards
```tsx
// Basic card
<div className="card">
  <div className="card-body">
    <h3 className="card-title">Card Title</h3>
    <p>Card content...</p>
  </div>
</div>

// Card with hover effect
<div className="card act-card-hover">

// Card with ACT frame
<div className="card act-frame">

// Card with ACT brackets
<div className="card act-bracket">
```

### Form Elements
```tsx
// Input field
<input className="input" type="text" placeholder="Enter text..." />

// Select dropdown
<select className="select">
  <option>Choose option</option>
</select>

// Textarea
<textarea className="textarea" rows={4} placeholder="Enter message..."></textarea>
```

### Badges
```tsx
<span className="badge-primary">Primary</span>
<span className="badge-secondary">Secondary</span>
<span className="badge-accent">Accent</span>
<span className="badge-neutral">Neutral</span>
```

## 🎭 ACT Brand Elements

### Logo Frame
```tsx
// Green border frame from ACT logo
<div className="act-frame">
  <h2>Framed Content</h2>
  <p>This content has the signature ACT green frame.</p>
</div>
```

### Open Brackets
```tsx
// Signature ACT graphic element
<div className="act-bracket">
  <h3>Bracketed Content</h3>
  <p>Content with open bracket corners.</p>
</div>

// Size variants
<div className="act-bracket act-bracket-sm">Small brackets</div>
<div className="act-bracket act-bracket-lg">Large brackets</div>
```

### Blur Background
```tsx
// For overlays and modal backgrounds
<div className="act-blur-bg">
  <div className="p-8">
    <h3>Overlay Content</h3>
    <p>Content with blurred background.</p>
  </div>
</div>
```

### Hero Sections
```tsx
<section className="act-hero section-lg">
  <div className="container">
    <h1>Hero Title</h1>
    <p>Hero description with gradient background.</p>
  </div>
</section>
```

## 📐 Layout & Spacing

### Container
```tsx
<div className="container">
  <!-- Content automatically centered with proper padding -->
</div>
```

### Sections
```tsx
<section className="section">Standard section</section>
<section className="section-sm">Small section</section>
<section className="section-lg">Large section</section>
```

### ACT Spacing Scale
```tsx
<!-- Use ACT spacing for consistent layout -->
<div className="p-act-md">Medium padding</div>
<div className="m-act-lg">Large margin</div>
<div className="gap-act-sm">Small gap</div>
```

## ✨ Animations

### CSS Classes
```tsx
// Fade in animation
<div className="act-fade-in">Content fades in</div>

// Slide up animation  
<div className="act-slide-up">Content slides up</div>
```

### JavaScript Utilities
```tsx
import { ACT_ANIMATIONS } from '@/utils/actBrand';

// Animate single element
ACT_ANIMATIONS.fadeIn(element, 300); // 300ms delay

// Stagger multiple elements
const cards = document.querySelectorAll('.card');
ACT_ANIMATIONS.stagger(Array.from(cards), 'slideUp', 100);
```

## 🎯 Focus States

```tsx
// Apply consistent focus styling
<button className="btn-primary act-focus">Accessible Button</button>
<input className="input act-focus" />
```

## 📱 Responsive Design

The ACT brand system includes responsive typography and spacing:

```tsx
// Responsive headings (automatically scale)
<h1>Responsive Heading</h1>

// Responsive containers
<div className="container"> <!-- Responsive padding -->

// Mobile-specific adjustments are built into the base styles
```

## 🔍 Brand Validation

```tsx
import { ACT_VALIDATION } from '@/utils/actBrand';

// Validate component compliance
const result = ACT_VALIDATION.validateComponent(element);
if (!result.valid) {
  console.warn('Brand compliance issues:', result.issues);
}

// Check color validity
const isValid = ACT_VALIDATION.isValidColor('#B2DE26'); // true
```

## 📋 Best Practices

### Do's ✅
- Use ACT brand colors exclusively
- Apply proper letter spacing (-0.02em for most text)
- Use Helvetica for headings, Inter for body text
- Implement ACT graphic elements (frames, brackets)
- Follow the spacing scale (act-xs through act-3xl)
- Use consistent border radius (act, act-lg, act-xl)

### Don'ts ❌
- Don't use colors outside the ACT palette
- Don't use fonts other than Helvetica/Inter
- Don't ignore letter spacing and line height
- Don't create custom spacing values
- Don't mix different design systems

### Accessibility
- All ACT components include proper focus states
- Color contrast meets WCAG AA standards
- Typography scales appropriately for readability
- Interactive elements have sufficient touch targets

## 🛠️ Development Workflow

1. **Import utilities**: Use `@/utils/actBrand` for consistent implementation
2. **Use CSS classes**: Prefer ACT brand classes over custom styles
3. **Validate compliance**: Use validation utilities during development
4. **Test responsiveness**: Ensure components work across devices
5. **Check accessibility**: Verify focus states and contrast ratios

## 📚 Resources

- [ACT Brand Guidelines](../brand.md) - Complete brand documentation
- [Tailwind Config](../tailwind.config.js) - Brand color and spacing definitions
- [CSS Components](../src/index.css) - Pre-built component styles
- [Brand Utilities](../src/utils/actBrand.ts) - Helper functions and constants
