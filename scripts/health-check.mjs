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
  logSection('Database Schema Discovery');
  
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Comprehensive list of tables from Supabase dashboard
    const potentialTables = [
      // Core user tables
      'user_profiles', 'job_seeker_profiles', 'partner_profiles', 'admin_profiles',
      'user_pii_data', 'user_activity', 'user_memory_state', 'user_overrides',
      
      // Job and training tables
      'job_listings', 'job_matches', 'training_programs', 'training_matches',
      
      // Profile detail tables
      'skills', 'skill_records', 'education', 'education_records', 
      'work_experience', 'experience_records',
      
      // Communication tables
      'conversations', 'messages',
      
      // Knowledge and resources
      'knowledge_resources', 'resources', 'resource_recommendations',
      
      // System tables
      'system_config', 'system_alerts', 'system_health', 'auth_config',
      
      // Audit and security
      'audit_logs', 'pii_access_logs', 'pii_encryption_keys',
      
      // Data management
      'data_export_requests', 'data_exports', 'database_operations',
      
      // Analysis and reporting
      'resume_analysis_results', 'reports',
      
      // Session management
      'admin_sessions',
      
      // Views (these might not be accessible via .from())
      'climate_ecosystem_view', 'complete_job_seeker_profiles', 'user_profiles_with_skills'
    ];

    const discoveredTables = [];
    let allTablesAccessible = true;

    logInfo('Discovering accessible tables...');

    for (const tableName of potentialTables) {
      try {
        // Test table accessibility and get sample data
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        
        if (error) {
          // Table doesn't exist or not accessible
          continue;
        }

        // Table exists and is accessible
        discoveredTables.push(tableName);

        // Get row count
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        const rowCount = countError ? 'Unknown' : count;

        // Get column information by examining the first row
        let columnInfo = 'Unknown columns';
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          columnInfo = `${columns.length} columns: ${columns.join(', ')}`;
          
          // Check for vector/embedding columns
          const vectorColumns = columns.filter(col => 
            col.includes('embedding') || 
            col.includes('vector') ||
            col.includes('similarity')
          );

          if (vectorColumns.length > 0) {
            logSuccess(`✅ Table '${tableName}': ${rowCount} rows, ${columnInfo}`);
            logInfo(`   🧠 Vector/Embedding columns: ${vectorColumns.join(', ')}`);
          } else {
            logSuccess(`✅ Table '${tableName}': ${rowCount} rows, ${columnInfo}`);
          }
        } else {
          logSuccess(`✅ Table '${tableName}': ${rowCount} rows (empty table)`);
        }

      } catch (err) {
        logError(`❌ Table '${tableName}': Access error - ${err.message}`);
        allTablesAccessible = false;
      }
    }

    logInfo(`\n📊 Discovery Summary: Found ${discoveredTables.length} accessible tables`);
    
    // Categorize discovered tables
    const categories = {
      'Core User Tables': discoveredTables.filter(t => t.includes('user_') || t.includes('admin_') || t.includes('job_seeker_') || t.includes('partner_')),
      'Job & Training': discoveredTables.filter(t => t.includes('job_') || t.includes('training_')),
      'Profile Details': discoveredTables.filter(t => ['skills', 'skill_records', 'education', 'education_records', 'work_experience', 'experience_records'].includes(t)),
      'Communication': discoveredTables.filter(t => ['conversations', 'messages'].includes(t)),
      'Knowledge & Resources': discoveredTables.filter(t => t.includes('knowledge_') || t.includes('resource')),
      'System & Config': discoveredTables.filter(t => t.includes('system_') || t.includes('auth_') || t.includes('config')),
      'Security & Audit': discoveredTables.filter(t => t.includes('audit_') || t.includes('pii_')),
      'Data Management': discoveredTables.filter(t => t.includes('data_') || t.includes('database_')),
      'Analysis & Reporting': discoveredTables.filter(t => ['resume_analysis_results', 'reports'].includes(t)),
      'Sessions': discoveredTables.filter(t => t.includes('session'))
    };

    logInfo('\n📋 Table Categories:');
    Object.entries(categories).forEach(([category, tables]) => {
      if (tables.length > 0) {
        logInfo(`   ${category}: ${tables.length} tables`);
        tables.forEach(table => logInfo(`     • ${table}`));
      }
    });

    // Try to get additional schema information using SQL
    await checkDatabaseExtensions(supabase);
    await checkDatabaseViews(supabase);
    await checkDatabaseFunctions(supabase);

    return discoveredTables.length > 0;
  } catch (error) {
    logError(`Database discovery error: ${error.message}`);
    return false;
  }
}

async function checkDatabaseExtensions(supabase) {
  logInfo('\n🔌 Database Extensions:');
  
  try {
    // Try to check for vector extension by testing vector operations
    const { data: vectorTest, error: vectorError } = await supabase
      .rpc('vector_similarity_test', { test: true })
      .then(() => ({ hasVector: true }))
      .catch(() => ({ hasVector: false }));

    if (vectorTest?.hasVector) {
      logSuccess(`   🧠 Vector extension detected - supports embeddings!`);
    } else {
      logWarning(`   Vector extension not detected or not accessible`);
    }

    // Check for other common extensions by testing functionality
    logInfo(`   📊 Checking for common PostgreSQL extensions...`);
    
    // Test for UUID extension
    try {
      const { data } = await supabase.rpc('gen_random_uuid');
      if (data) {
        logSuccess(`   🔑 UUID extension available`);
      }
    } catch {
      logWarning(`   UUID extension not available`);
    }

  } catch (err) {
    logWarning(`Extension check failed: ${err.message}`);
  }
}

async function checkDatabaseViews(supabase) {
  logInfo('\n👁️ Database Views:');
  
  const potentialViews = [
    'user_view', 'profile_view', 'job_view', 'training_view'
  ];

  let viewsFound = 0;

  for (const viewName of potentialViews) {
    try {
      const { data, error } = await supabase.from(viewName).select('*').limit(1);
      
      if (!error) {
        logSuccess(`   👁️ View '${viewName}': Accessible`);
        viewsFound++;
      }
    } catch (err) {
      // View doesn't exist, which is normal
    }
  }

  if (viewsFound === 0) {
    logInfo(`   No custom views found`);
  }
}

async function checkDatabaseFunctions(supabase) {
  logInfo('\n⚙️ Database Functions:');
  
  // Test for common RPC functions that might exist
  const potentialFunctions = [
    'search_knowledge_resources',
    'similarity_search',
    'vector_search',
    'match_documents',
    'get_user_profile',
    'update_user_profile',
    'create_conversation',
    'get_recommendations'
  ];

  let functionsFound = 0;

  for (const funcName of potentialFunctions) {
    try {
      // Try to call the function with minimal parameters to see if it exists
      const { data, error } = await supabase.rpc(funcName, {});
      
      if (error && !error.message.includes('function') && !error.message.includes('does not exist')) {
        // Function exists but failed due to parameters or permissions
        logSuccess(`   ⚙️ Function '${funcName}': Available`);
        functionsFound++;
        
        // Highlight vector/similarity functions
        if (funcName.includes('similarity') || 
            funcName.includes('vector') ||
            funcName.includes('search') ||
            funcName.includes('match')) {
          logInfo(`     🔍 Vector/Search function detected!`);
        }
      }
    } catch (err) {
      // Function doesn't exist, which is normal
    }
  }

  if (functionsFound === 0) {
    logInfo(`   No accessible RPC functions found`);
  } else {
    logInfo(`   Found ${functionsFound} accessible functions`);
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
    { name: 'Database Schema Discovery', fn: checkDatabaseTables },
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
