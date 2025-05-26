#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env') });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`🔍 ${title}`, colors.cyan + colors.bright);
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function checkEnvironmentVariables() {
  logSection('Environment Variables Check');
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_OPENAI_API_KEY',
    'JWT_SECRET'
  ];

  const optionalVars = [
    'VITE_ENVIRONMENT',
    'VITE_APP_VERSION',
    'VITE_TRACE_ENABLED',
    'VITE_VERBOSE',
    'DEBUG'
  ];

  let allRequired = true;

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      logSuccess(`${varName}: ${value.substring(0, 20)}...`);
    } else {
      logError(`${varName}: Missing!`);
      allRequired = false;
    }
  }

  // Check optional variables
  logInfo('\nOptional Variables:');
  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
      logInfo(`${varName}: ${value}`);
    } else {
      logWarning(`${varName}: Not set`);
    }
  }

  return allRequired;
}

async function checkSupabaseConnection() {
  logSection('Supabase Connection Check');
  
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      logError('Supabase credentials missing');
      return false;
    }

    logInfo(`Connecting to: ${supabaseUrl}`);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      logError(`Connection failed: ${error.message}`);
      return false;
    }

    logSuccess('Supabase connection successful');
    
    // Test auth
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      logWarning(`Auth check warning: ${authError.message}`);
    } else {
      logSuccess('Supabase Auth accessible');
    }

    return true;
  } catch (error) {
    logError(`Supabase connection error: ${error.message}`);
    return false;
  }
}

async function checkDatabaseTables() {
  logSection('Database Tables Check');
  
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const expectedTables = [
      'user_profiles',
      'job_seeker_profiles', 
      'partner_profiles',
      'admin_profiles',
      'job_listings',
      'training_programs',
      'skills',
      'education',
      'work_experience',
      'conversations',
      'messages',
      'knowledge_base',
      'system_config',
      'audit_logs'
    ];

    let allTablesExist = true;

    for (const table of expectedTables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          logError(`Table '${table}': ${error.message}`);
          allTablesExist = false;
        } else {
          logSuccess(`Table '${table}': Accessible`);
        }
      } catch (err) {
        logError(`Table '${table}': Error - ${err.message}`);
        allTablesExist = false;
      }
    }

    return allTablesExist;
  } catch (error) {
    logError(`Database check error: ${error.message}`);
    return false;
  }
}

async function checkOpenAIConnection() {
  logSection('OpenAI API Check');
  
  try {
    const apiKey = process.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      logError('OpenAI API key missing');
      return false;
    }

    logInfo('Testing OpenAI API connection...');
    
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      logSuccess(`OpenAI API accessible - ${data.data.length} models available`);
      
      // Check for specific models we use
      const requiredModels = ['gpt-4', 'gpt-3.5-turbo', 'text-embedding-ada-002'];
      const availableModels = data.data.map(model => model.id);
      
      for (const model of requiredModels) {
        if (availableModels.includes(model)) {
          logSuccess(`Model '${model}': Available`);
        } else {
          logWarning(`Model '${model}': Not found`);
        }
      }
      
      return true;
    } else {
      logError(`OpenAI API error: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    logError(`OpenAI connection error: ${error.message}`);
    return false;
  }
}

async function checkSystemHealth() {
  logSection('System Health Summary');
  
  const checks = [
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Supabase Connection', fn: checkSupabaseConnection },
    { name: 'Database Tables', fn: checkDatabaseTables },
    { name: 'OpenAI API', fn: checkOpenAIConnection }
  ];

  const results = [];
  
  for (const check of checks) {
    try {
      const result = await check.fn();
      results.push({ name: check.name, success: result });
    } catch (error) {
      logError(`${check.name} check failed: ${error.message}`);
      results.push({ name: check.name, success: false });
    }
  }

  console.log('\n' + '='.repeat(60));
  log('📊 HEALTH CHECK SUMMARY', colors.cyan + colors.bright);
  console.log('='.repeat(60));

  let allPassed = true;
  for (const result of results) {
    if (result.success) {
      logSuccess(`${result.name}: PASS`);
    } else {
      logError(`${result.name}: FAIL`);
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    logSuccess('🎉 ALL HEALTH CHECKS PASSED - System Ready!');
  } else {
    logError('💥 SOME HEALTH CHECKS FAILED - Check configuration');
  }
  console.log('='.repeat(60) + '\n');

  return allPassed;
}

// Run health check
if (import.meta.url === `file://${process.argv[1]}`) {
  checkSystemHealth()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logError(`Health check crashed: ${error.message}`);
      process.exit(1);
    });
}

export { checkSystemHealth };
