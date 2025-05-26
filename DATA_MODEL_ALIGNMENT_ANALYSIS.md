# Data Model Alignment Analysis 🔍

## Executive Summary

**CRITICAL ISSUE IDENTIFIED**: There are significant misalignments between frontend forms, Pydantic models (Zod schemas), and Supabase database schema that could cause data integrity issues and runtime errors.

## 🚨 Critical Misalignments Found

### 1. **User Profile Structure**

#### **Supabase Schema** (`user_profiles` table):
```sql
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
- industry: text[] | null
- profile_completed: boolean
```

#### **Pydantic Model** (`UserProfile` in models.ts):
```typescript
- id: string (uuid)
- email: string (email)
- first_name: string (required)
- last_name: string (required)
- phone: string (optional)
- location: Record<string, string> (optional)
- user_type: enum('job_seeker', 'partner', 'admin')
- created_at: date
- updated_at: date
```

#### **Frontend Forms** (PersonalInfoForm.tsx):
```typescript
- id: string
- first_name: string
- last_name: string
- email: string
- phone: string
- location: { city: string, state: string, zip: string }
```

**🔥 ISSUES:**
1. **Location structure mismatch**: Supabase uses `jsonb`, Pydantic uses `Record<string, string>`, Frontend uses specific `{city, state, zip}` structure
2. **Missing fields**: Frontend missing `organization_name`, `organization_type`, `website`, `industry` from Supabase
3. **Required vs Optional**: Pydantic requires `first_name`/`last_name`, but Supabase allows null
4. **Missing timestamps**: Frontend doesn't handle `created_at`/`updated_at`

### 2. **Job Seeker Profile Structure**

#### **Supabase Schema** (`job_seeker_profiles` table):
```sql
- climate_relevance_score: number | null
- barriers: text[] | null
- interests: text[] | null
- veteran: boolean (default false)
- international_professional: boolean (default false)
- ej_community_resident: boolean (default false)
- preferred_job_types: text[] | null
- preferred_locations: text[] | null
- salary_expectations: jsonb | null
- willing_to_relocate: boolean (default false)
- preferred_work_environment: text[] | null
- career_goals: text | null
```

#### **Pydantic Model** (`JobSeekerProfile` in models.ts):
```typescript
- background: Record<any, any> (default {})
- experience_level: string (optional)
- education: Education[] (default [])
- skills: Skill[] (default [])
- interests: string[] (default [])
- barriers: string[] (default [])
- preferred_locations: string[] (default [])
- returning_citizen: boolean (default false) // NOT IN SUPABASE!
```

#### **Frontend Forms** (Step3.tsx, PreferencesForm.tsx):
```typescript
- skills: string[]
- interests: string[]
- preferred_job_types: string[]
- preferred_work_environment: string[]
- willing_to_relocate: boolean
- preferred_locations: string[]
- salary_expectations: { min: string, max: string, type: string }
```

**🔥 ISSUES:**
1. **Missing fields**: Pydantic has `returning_citizen` but Supabase doesn't
2. **Structure mismatch**: Pydantic has complex `Education[]` and `Skill[]` but Supabase stores differently
3. **Salary structure**: Frontend uses `{min, max, type}` but Supabase uses generic `jsonb`
4. **Missing fields**: Frontend missing `climate_relevance_score`, `career_goals`

### 3. **Partner Profile Structure**

#### **Supabase Schema** (`partner_profiles` table):
```sql
- organization_name: string (required)
- organization_type: string (required)
- website: string | null
- description: string | null
- partnership_level: string (default 'standard')
- climate_focus: string[] (default [])
- verified: boolean (default false)
- embedding: unknown | null
```

#### **Pydantic Model** (`PartnerProfile` in models.ts):
```typescript
- organization_name: string
- organization_type: string
- website: string (url, optional)
- description: string (optional)
- partnership_level: string (default 'standard')
- climate_focus: string[] (default [])
- verified: boolean (default false)
- embedding: number[] (optional) // TYPE MISMATCH!
```

#### **Frontend Forms** (PartnerStep1.tsx):
```typescript
- organization_name: string
- organization_type: string
- website: string
- description: string
- industry: string[] // NOT IN PARTNER_PROFILES TABLE!
```

**🔥 ISSUES:**
1. **Table confusion**: Frontend uses `industry` field but that's in `user_profiles`, not `partner_profiles`
2. **Embedding type**: Pydantic expects `number[]` but Supabase has `unknown`
3. **Missing fields**: Frontend missing `partnership_level`, `climate_focus`, `verified`

## 📋 Required Actions

### **Priority 1: Critical Fixes**

1. **Standardize Location Structure**
2. **Fix Partner Profile Table Usage**
3. **Align Salary Expectations Structure**
4. **Remove Non-existent Fields**

### **Priority 2: Data Integrity**

1. **Add Missing Required Fields**
2. **Standardize Array Types**
3. **Fix Type Mismatches**
4. **Add Proper Validation**

### **Priority 3: Enhancement**

1. **Add Missing Timestamps**
2. **Implement Proper Error Handling**
3. **Add Data Migration Scripts**
4. **Create Validation Schemas**

## 🎯 Next Steps

1. **Create unified type definitions**
2. **Update frontend forms to match schema**
3. **Fix Pydantic model mismatches**
4. **Add proper validation**
5. **Test data flow end-to-end**

This alignment is critical for data integrity and preventing runtime errors in the application.

## 🚀 Implementation Progress

### ✅ **COMPLETED**

#### **1. Unified Type System Created**
- **File**: `src/types/unified.ts`
- **Status**: ✅ Complete
- **Impact**: Provides single source of truth for all data structures
- **Features**:
  - Aligned with Supabase database schema
  - Proper TypeScript interfaces
  - Type guards for validation
  - Form-specific data types

#### **2. PersonalInfoForm Updated**
- **File**: `src/components/profile/PersonalInfoForm.tsx`
- **Status**: ✅ Complete
- **Changes**:
  - Uses `UnifiedUserProfile` type
  - Proper `LocationData` handling
  - Type-safe form data management
  - Handles JSON location data from Supabase

#### **3. PreferencesForm Started**
- **File**: `src/components/profile/PreferencesForm.tsx`
- **Status**: 🔄 In Progress
- **Changes**:
  - Updated imports to use unified types
  - Changed form data type to `JobSeekerPreferencesFormData`
  - Added career_goals field

### 🔄 **IN PROGRESS**

#### **4. Complete PreferencesForm Update**
- **Remaining**: Update useEffect and form handling logic
- **Priority**: High
- **Impact**: Job seeker preferences data integrity

#### **5. Partner Onboarding Forms**
- **Files**: `src/pages/onboarding/partner/Step*.tsx`
- **Status**: 🔄 Pending
- **Priority**: High
- **Impact**: Partner registration data integrity

#### **6. Job Seeker Onboarding Forms**
- **Files**: `src/pages/onboarding/job-seeker/Step*.tsx`
- **Status**: 🔄 Pending
- **Priority**: High
- **Impact**: Job seeker registration data integrity

### ⏳ **PENDING**

#### **7. Service Layer Updates**
- **Files**: `src/services/*.ts`
- **Priority**: Medium
- **Impact**: API call type safety

#### **8. Pydantic Model Alignment**
- **File**: `src/agents/models.ts`
- **Priority**: Medium
- **Impact**: AI agent data consistency

#### **9. Database Migration Scripts**
- **Priority**: Low
- **Impact**: Existing data compatibility

## 🎯 **Critical Next Steps**

### **Immediate (Today)**
1. ✅ Complete PreferencesForm update
2. ✅ Fix partner onboarding forms
3. ✅ Fix job seeker onboarding forms

### **Short Term (This Week)**
1. Update all service layer functions
2. Align Pydantic models with unified types
3. Add comprehensive validation

### **Medium Term (Next Week)**
1. Create data migration scripts
2. Add integration tests
3. Update documentation

## 🔥 **Critical Issues to Address**

### **1. Partner Profile Table Confusion**
- **Issue**: Frontend uses `industry` field from `user_profiles` but should use `climate_focus` from `partner_profiles`
- **Impact**: Data stored in wrong table
- **Fix**: Update partner forms to use correct fields

### **2. Salary Expectations Structure**
- **Issue**: Inconsistent structure between frontend and database
- **Impact**: Data loss or corruption
- **Fix**: Standardize on `{min, max, type}` structure

### **3. Location Data Handling**
- **Issue**: Supabase stores as JSONB, frontend expects specific structure
- **Impact**: Location data not properly saved/retrieved
- **Fix**: ✅ Implemented in PersonalInfoForm

### **4. Missing Required Fields**
- **Issue**: Forms missing fields that exist in database
- **Impact**: Incomplete data collection
- **Fix**: Add all relevant fields to forms

## 📊 **Success Metrics**

### **Type Safety**
- ✅ Unified type definitions created
- 🔄 Frontend forms using unified types (50% complete)
- ⏳ Service layer using unified types (0% complete)
- ⏳ Pydantic models aligned (0% complete)

### **Data Integrity**
- ✅ Location data handling fixed
- 🔄 Salary expectations standardization (in progress)
- ⏳ Partner profile field alignment (pending)
- ⏳ Job seeker profile field alignment (pending)

### **Developer Experience**
- ✅ Single source of truth for types
- ✅ Type guards for validation
- ✅ Clear documentation
- 🔄 IDE support and autocomplete (improving)

## 🎉 **Expected Outcomes**

Once complete, this alignment will provide:

1. **🔒 Data Integrity**: All data flows through consistent types
2. **🚀 Developer Productivity**: Clear types and validation
3. **🐛 Fewer Bugs**: Compile-time error catching
4. **📈 Maintainability**: Single source of truth for data structures
5. **🔄 Scalability**: Easy to add new fields and features

**Status**: 25% Complete | **Next Milestone**: Complete all form alignments
