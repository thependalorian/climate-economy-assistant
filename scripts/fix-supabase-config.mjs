#!/usr/bin/env node

/**
 * Supabase Configuration Fix Script
 * 
 * This script provides step-by-step instructions to fix common
 * Supabase authentication and email confirmation issues.
 */

import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const projectId = supabaseUrl?.split('//')[1]?.split('.')[0];

console.log('🔧 Supabase Configuration Fix Guide');
console.log('=' .repeat(50));

console.log('\n📋 Your Project Details:');
console.log(`🔗 Project ID: ${projectId}`);
console.log(`🔗 Supabase URL: ${supabaseUrl}`);

console.log('\n🚨 CRITICAL FIXES NEEDED:');
console.log('=' .repeat(30));

console.log('\n1️⃣ ADD REDIRECT URLs (MOST IMPORTANT):');
console.log(`🔗 Go to: https://app.supabase.com/project/${projectId}/auth/url-configuration`);
console.log('\n📝 Add these URLs to "Redirect URLs":');
console.log('  ✅ http://localhost:3000/auth/callback');
console.log('  ✅ http://localhost:5173/auth/callback');
console.log('  ✅ https://cea.georgenekwaya.com/auth/callback');
console.log('  ✅ https://climate-economy-assistant.vercel.app/auth/callback');

console.log('\n2️⃣ ENABLE EMAIL CONFIRMATIONS:');
console.log(`🔗 Go to: https://app.supabase.com/project/${projectId}/auth/providers`);
console.log('\n📝 Configure Email Provider:');
console.log('  ✅ Enable "Email" provider');
console.log('  ✅ Turn ON "Enable email confirmations"');
console.log('  ✅ Turn ON "Confirm email"');
console.log('  ✅ Use Supabase SMTP for now (built-in)');

console.log('\n3️⃣ FIX SITE URL:');
console.log(`🔗 Go to: https://app.supabase.com/project/${projectId}/settings/general`);
console.log('\n📝 Set Site URL to:');
console.log('  ✅ https://cea.georgenekwaya.com');

console.log('\n4️⃣ RUN SQL FIX:');
console.log(`🔗 Go to: https://app.supabase.com/project/${projectId}/sql/new`);
console.log('\n📝 Run this SQL to fix RLS policies:');
console.log(`
-- Fix RLS infinite recursion
DROP POLICY IF EXISTS "user_profiles_admin_access" ON user_profiles;
DROP POLICY IF EXISTS "job_seeker_profiles_admin_access" ON job_seeker_profiles;
DROP POLICY IF EXISTS "partner_profiles_admin_access" ON partner_profiles;
DROP POLICY IF EXISTS "admin_profiles_admin_access" ON admin_profiles;

-- Recreate simpler policies
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "job_seeker_profiles_select" ON job_seeker_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "job_seeker_profiles_update" ON job_seeker_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "partner_profiles_select" ON partner_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "partner_profiles_update" ON partner_profiles FOR UPDATE USING (auth.uid() = user_id);
`);

console.log('\n5️⃣ TEST THE FIX:');
console.log('After making the above changes:');
console.log('  1. Wait 2-3 minutes for changes to propagate');
console.log('  2. Try registering a new account');
console.log('  3. Check your email (including spam folder)');
console.log('  4. Click the confirmation link');

console.log('\n🔗 Quick Access Links:');
console.log(`Auth Settings: https://app.supabase.com/project/${projectId}/auth/providers`);
console.log(`URL Config: https://app.supabase.com/project/${projectId}/auth/url-configuration`);
console.log(`Site Settings: https://app.supabase.com/project/${projectId}/settings/general`);
console.log(`SQL Editor: https://app.supabase.com/project/${projectId}/sql/new`);
console.log(`Email Templates: https://app.supabase.com/project/${projectId}/auth/templates`);

console.log('\n⚡ IMMEDIATE WORKAROUND:');
console.log('If you need to test right now, run:');
console.log('  npm run test-manual-confirm');

console.log('\n✅ After fixing, your email confirmation should work!'); 