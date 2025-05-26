# 🎯 Data Model Alignment Plan

## Executive Summary

**CRITICAL MISALIGNMENTS IDENTIFIED**: There are significant inconsistencies between:
1. **Database Schema** (Supabase migrations)
2. **Zod Models** (`src/agents/models.ts`) 
3. **TypeScript Interfaces** (`src/types/unified.ts`)
4. **Frontend Forms** (Various components)

This document provides a comprehensive plan to align all data models for consistency and reliability.

## 🚨 Critical Misalignments Found

### 1. **User Profile Structure**

#### **Issues:**
- **Location Structure**: Database uses `jsonb`, Zod uses `Record<string, string>`, Frontend uses `LocationData` interface
- **Required Fields**: Zod requires `first_name`/`last_name`, but database allows null
- **Missing Fields**: Zod missing `resume_url`, `skills`, `interests`, `industry` from database
- **Date Types**: Zod uses `Date`, TypeScript uses `string`, database uses `timestamp`

#### **Database Schema** (Current):
```sql
user_profiles:
- id: uuid (primary key)
- first_name: text | null
- last_name: text | null
- email: text (not null)
- phone: text | null
- location: jsonb | null
- user_type: enum('job_seeker', 'partner', 'admin')
- organization_name: text | null
- organization_type: text | null
- website: text | null
- resume_url: text | null
- skills: text[] | null
- interests: text[] | null
- industry: text[] | null
- profile_completed: boolean
- created_at: timestamp
- updated_at: timestamp
```

#### **Zod Model** (Current):
```typescript
UserProfile = z.object({
  id: z.string().uuid(),
  first_name: z.string(),           // ❌ Required but DB allows null
  last_name: z.string(),            // ❌ Required but DB allows null
  phone: z.string().optional(),
  location: z.record(z.string()).optional(), // ❌ Different structure
  user_type: z.enum(['job_seeker', 'partner', 'admin']),
  created_at: z.date(),             // ❌ Date vs string
  updated_at: z.date(),             // ❌ Date vs string
  // ❌ Missing: resume_url, skills, interests, industry, organization fields
});
```

### 2. **Job Seeker Profile Structure**

#### **Issues:**
- **Complex Objects**: Zod has `Education[]` and `Skill[]` arrays, but database stores differently
- **Missing Fields**: Database has fields not in Zod model
- **Type Mismatches**: Different data types for same fields

#### **Database Schema** (Current):
```sql
job_seeker_profiles:
- id: uuid (foreign key to user_profiles)
- resume_url: text | null
- resume_processed_at: timestamp | null
- climate_relevance_score: numeric | null
- climate_relevance_explanation: text | null
- veteran: boolean (default false)
- international_professional: boolean (default false)
- ej_community_resident: boolean (default false)
- returning_citizen: boolean (default false)
- onboarding_completed: boolean (default false)
- onboarding_step: integer (default 1)
- barriers: text[] | null
- interests: text[] | null
- preferred_job_types: text[] | null
- preferred_locations: text[] | null
- preferred_work_environment: text[] | null
- willing_to_relocate: boolean (default false)
- salary_expectations: jsonb | null
- career_goals: text | null
- highest_education: text | null
- years_of_experience: text | null
- resume_filename: text | null
- resume_parsed: boolean (default false)
- has_resume: boolean (default false)
- will_upload_later: boolean (default false)
```

#### **Zod Model** (Current):
```typescript
JobSeekerProfile = z.object({
  id: z.string().uuid(),
  background: z.record(z.any()).default({}), // ❌ Not in database
  experience_level: z.string().optional(),   // ❌ Not in database
  education: z.array(Education).default([]), // ❌ Complex object, not in main table
  skills: z.array(Skill).default([]),        // ❌ Complex object, not in main table
  interests: z.array(z.string()).default([]),
  barriers: z.array(z.string()).default([]),
  preferred_locations: z.array(z.string()).default([]),
  resume_url: z.string().optional(),
  climate_relevance_score: z.number().optional(),
  veteran: z.boolean().default(false),
  international_professional: z.boolean().default(false),
  ej_community_resident: z.boolean().default(false),
  returning_citizen: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date(),
  // ❌ Missing many database fields
});
```

### 3. **Partner Profile Structure**

#### **Issues:**
- **Embedding Type**: Zod expects `number[]`, database has `vector` type
- **Missing Fields**: Several database fields not in Zod model

#### **Database Schema** (Current):
```sql
partner_profiles:
- id: uuid (foreign key to user_profiles)
- organization_name: text (not null)
- organization_type: text (not null)
- website: text | null
- description: text | null
- partnership_level: text (default 'standard')
- climate_focus: text[] (default [])
- verified: boolean (default false)
- industry: text[] | null
- contact_email: text | null
- contact_phone: text | null
- location: jsonb | null
- partnership_benefits: text[] | null
- partnership_requirements: text[] | null
- embedding: vector(1536) | null
```

#### **Zod Model** (Current):
```typescript
PartnerProfile = z.object({
  id: z.string().uuid(),
  organization_name: z.string(),
  organization_type: z.string(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  partnership_level: z.string().default('standard'),
  climate_focus: z.array(z.string()).default([]),
  verified: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date(),
  embedding: z.array(z.number()).optional(), // ❌ Type mismatch with vector
  // ❌ Missing: industry, contact_email, contact_phone, location, benefits, requirements
});
```

## 🎯 Alignment Strategy

### **Phase 1: Update Zod Models** ⚡ (Priority: Critical)

1. **Update UserProfile Zod Model**:
```typescript
export const UserProfile = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().email(),
  phone: z.string().nullable(),
  location: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
    country: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }).nullable(),
  user_type: z.enum(['job_seeker', 'partner', 'admin']),
  profile_completed: z.boolean(),
  organization_name: z.string().nullable(),
  organization_type: z.enum(['employer', 'training_provider', 'educational_institution', 'government_agency', 'nonprofit', 'industry_association']).nullable(),
  website: z.string().nullable(),
  resume_url: z.string().nullable(),
  skills: z.array(z.string()).nullable(),
  interests: z.array(z.string()).nullable(),
  industry: z.array(z.string()).nullable(),
});
```

2. **Update JobSeekerProfile Zod Model**:
```typescript
export const JobSeekerProfile = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  resume_url: z.string().nullable(),
  resume_processed_at: z.string().datetime().nullable(),
  climate_relevance_score: z.number().nullable(),
  climate_relevance_explanation: z.string().nullable(),
  veteran: z.boolean().default(false),
  international_professional: z.boolean().default(false),
  ej_community_resident: z.boolean().default(false),
  returning_citizen: z.boolean().default(false),
  onboarding_completed: z.boolean().default(false),
  onboarding_step: z.number().default(1),
  barriers: z.array(z.string()).nullable(),
  interests: z.array(z.string()).nullable(),
  preferred_job_types: z.array(z.string()).nullable(),
  preferred_locations: z.array(z.string()).nullable(),
  preferred_work_environment: z.array(z.string()).nullable(),
  willing_to_relocate: z.boolean().default(false),
  salary_expectations: z.object({
    min: z.string(),
    max: z.string(),
    type: z.enum(['hourly', 'annual', 'contract']),
    currency: z.string().optional(),
  }).nullable(),
  career_goals: z.string().nullable(),
  highest_education: z.string().nullable(),
  years_of_experience: z.string().nullable(),
  resume_filename: z.string().nullable(),
  resume_parsed: z.boolean().default(false),
  has_resume: z.boolean().default(false),
  will_upload_later: z.boolean().default(false),
});
```

3. **Update PartnerProfile Zod Model**:
```typescript
export const PartnerProfile = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  organization_name: z.string(),
  organization_type: z.enum(['employer', 'training_provider', 'educational_institution', 'government_agency', 'nonprofit', 'industry_association']),
  website: z.string(),
  description: z.string(),
  partnership_level: z.enum(['basic', 'standard', 'premium', 'enterprise']).default('standard'),
  climate_focus: z.array(z.string()).default([]),
  verified: z.boolean().default(false),
  industry: z.array(z.string()).nullable(),
  contact_email: z.string().nullable(),
  contact_phone: z.string().nullable(),
  location: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
    country: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }).nullable(),
  partnership_benefits: z.array(z.string()).nullable(),
  partnership_requirements: z.array(z.string()).nullable(),
  embedding: z.array(z.number()).nullable(),
});
```

### **Phase 2: Create Separate Tables for Complex Objects** 🔧 (Priority: High)

1. **Create Education Table**:
```sql
CREATE TABLE education_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

2. **Create Experience Table**:
```sql
CREATE TABLE experience_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

3. **Create Skills Table**:
```sql
CREATE TABLE skill_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_of_experience INTEGER,
  climate_relevance INTEGER CHECK (climate_relevance >= 1 AND climate_relevance <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### **Phase 3: Update Frontend Forms** 🎨 (Priority: Medium)

1. **Update Form Validation**:
   - Use Zod schemas for form validation
   - Ensure all form fields match database structure
   - Add proper error handling for validation failures

2. **Update Form Components**:
   - Align field names with database columns
   - Use consistent data types
   - Add missing fields where appropriate

### **Phase 4: Create Migration Scripts** 📦 (Priority: Medium)

1. **Data Migration Script**:
```sql
-- Migrate existing complex data to new tables
-- This would need to be carefully planned based on existing data
```

2. **Validation Script**:
```sql
-- Verify data integrity after migration
-- Check for orphaned records
-- Validate foreign key relationships
```

## 🚀 Implementation Steps

### **Step 1: Update Zod Models** (1-2 hours)
- [ ] Update `src/agents/models.ts` with aligned schemas
- [ ] Add proper type exports
- [ ] Test schema validation

### **Step 2: Create Database Migration** (2-3 hours)
- [ ] Create new tables for education, experience, skills
- [ ] Add proper indexes and constraints
- [ ] Update RLS policies

### **Step 3: Update Frontend Forms** (3-4 hours)
- [ ] Update form validation to use new Zod schemas
- [ ] Align form fields with database structure
- [ ] Test form submission and validation

### **Step 4: Update API Endpoints** (2-3 hours)
- [ ] Update profile creation/update endpoints
- [ ] Add endpoints for education, experience, skills
- [ ] Test API responses

### **Step 5: Data Migration** (1-2 hours)
- [ ] Create migration script for existing data
- [ ] Test migration on development environment
- [ ] Plan production migration strategy

### **Step 6: Testing and Validation** (2-3 hours)
- [ ] End-to-end testing of data flow
- [ ] Validate all CRUD operations
- [ ] Test agent system with new data structure

## 📋 Success Criteria

- [ ] All Zod models match database schema exactly
- [ ] Frontend forms validate using Zod schemas
- [ ] No data type mismatches in API responses
- [ ] Agent system works with aligned data structure
- [ ] All existing functionality preserved
- [ ] Performance maintained or improved

## 🔍 Risk Mitigation

1. **Data Loss Prevention**:
   - Backup existing data before migration
   - Test migration scripts thoroughly
   - Have rollback plan ready

2. **Downtime Minimization**:
   - Plan migration during low-usage periods
   - Use feature flags for gradual rollout
   - Monitor system health during migration

3. **Compatibility**:
   - Maintain backward compatibility where possible
   - Update all dependent systems simultaneously
   - Comprehensive testing before production deployment

## 📊 Timeline

**Total Estimated Time**: 12-18 hours
**Recommended Timeline**: 2-3 days with proper testing
**Critical Path**: Zod Models → Database Migration → Frontend Updates → Testing

This alignment is critical for data integrity, type safety, and preventing runtime errors in the application. 