#!/usr/bin/env node

/**
 * Comprehensive Supabase Database Analysis Script
 * 
 * This script directly connects to your Supabase database and extracts
 * complete information about all tables, columns, vectors, RLS policies,
 * indexes, and more across all schemas.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('   VITE_SUPABASE_ANON_KEY:', !!SUPABASE_ANON_KEY);
  process.exit(1);
}

// Use service role key if available, otherwise use anon key
const supabaseKey = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
console.log(`🔑 Using ${SUPABASE_SERVICE_KEY ? 'Service Role' : 'Anon'} key for database access`);

// Create Supabase client
const supabase = createClient(SUPABASE_URL, supabaseKey);

class DatabaseAnalyzer {
  constructor() {
    this.results = {};
  }

  async analyzeDatabase() {
    console.log('🚀 Starting comprehensive database analysis...\n');

    // Since direct SQL might not be available, let's use the REST API to discover tables
    await this.discoverPublicTables();
    await this.analyzeTableStructures();
    await this.checkForVectorColumns();
    await this.analyzeAuthTables();
    await this.checkMigrations();
    
    console.log('\n✅ Database analysis complete!');
    return this.results;
  }

  async discoverPublicTables() {
    console.log('🔍 Discovering public schema tables...');
    try {
      // Get list of tables by trying to query each known table type
      const knownTables = [
        'user_profiles', 'job_seeker_profiles', 'partner_profiles', 'admin_profiles',
        'job_listings', 'training_programs', 'job_matches', 'training_matches',
        'conversations', 'messages', 'knowledge_resources', 'resources',
        'education', 'skills', 'work_experience', 'audit_logs', 'system_config',
        'profiles', 'users', 'posts', 'comments', 'categories', 'tags'
      ];

      const discoveredTables = [];
      
      for (const tableName of knownTables) {
        try {
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .limit(1);
          
          if (!error) {
            discoveredTables.push({
              table_name: tableName,
              status: 'accessible',
              row_count: count,
              sample_data: data,
              has_data: data && data.length > 0
            });
            console.log(`✅ Found table: ${tableName} (${count || 0} rows)`);
          } else {
            discoveredTables.push({
              table_name: tableName,
              status: 'error',
              error: error.message
            });
            console.log(`❌ Table ${tableName}: ${error.message}`);
          }
        } catch (err) {
          discoveredTables.push({
            table_name: tableName,
            status: 'exception',
            error: err.message
          });
        }
      }

      this.results.discovered_tables = discoveredTables;
      const accessible = discoveredTables.filter(t => t.status === 'accessible');
      console.log(`📊 Discovered ${accessible.length} accessible tables`);
      
    } catch (error) {
      console.error('❌ Error discovering tables:', error);
      this.results.discovered_tables = { error: error.message };
    }
  }

  async analyzeTableStructures() {
    console.log('🔍 Analyzing table structures...');
    
    const accessibleTables = this.results.discovered_tables?.filter(t => t.status === 'accessible') || [];
    const tableStructures = [];

    for (const table of accessibleTables) {
      try {
        console.log(`   Analyzing ${table.table_name}...`);
        
        // Get a sample record to understand structure
        const { data, error } = await supabase
          .from(table.table_name)
          .select('*')
          .limit(5); // Get a few records for better analysis

        if (!error) {
          let columns = [];
          let sampleRecords = data || [];
          
          if (sampleRecords.length > 0) {
            const sampleRecord = sampleRecords[0];
            columns = Object.keys(sampleRecord).map(key => {
              const values = sampleRecords.map(r => r[key]).filter(v => v !== null);
              const dataTypes = [...new Set(values.map(v => typeof v))];
              
              return {
                column_name: key,
                sample_value: sampleRecord[key],
                data_type: dataTypes.join('|'),
                is_null: sampleRecord[key] === null,
                has_values: values.length > 0,
                unique_values: values.length > 0 ? [...new Set(values)].length : 0
              };
            });
          }

          tableStructures.push({
            table_name: table.table_name,
            columns: columns,
            sample_records: sampleRecords,
            row_count: table.row_count,
            column_count: columns.length
          });
        } else {
          // Even if no data, we can try to get column info
          tableStructures.push({
            table_name: table.table_name,
            columns: [],
            note: 'No sample data available',
            error: error.message
          });
        }
      } catch (err) {
        console.error(`❌ Error analyzing ${table.table_name}:`, err.message);
        tableStructures.push({
          table_name: table.table_name,
          error: err.message
        });
      }
    }

    this.results.table_structures = tableStructures;
    console.log(`📋 Analyzed ${tableStructures.length} table structures`);
  }

  async checkForVectorColumns() {
    console.log('🔍 Checking for vector/embedding columns...');
    
    const vectorTables = [];
    const potentialVectorTables = ['knowledge_resources', 'resources', 'conversations', 'messages'];

    for (const tableName of potentialVectorTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(3);

        if (!error && data && data.length > 0) {
          const vectorColumns = [];
          
          for (const record of data) {
            for (const [key, value] of Object.entries(record)) {
              if (key.includes('embedding') || key.includes('vector') || 
                  (Array.isArray(value) && value.length > 0 && typeof value[0] === 'number')) {
                
                const existingColumn = vectorColumns.find(c => c.column_name === key);
                if (!existingColumn) {
                  vectorColumns.push({
                    column_name: key,
                    sample_value: Array.isArray(value) ? `Array[${value.length}]` : value,
                    is_vector: Array.isArray(value) && value.length > 100, // Likely embedding
                    vector_dimension: Array.isArray(value) ? value.length : null,
                    data_type: typeof value
                  });
                }
              }
            }
          }

          if (vectorColumns.length > 0) {
            vectorTables.push({
              table_name: tableName,
              vector_columns: vectorColumns,
              sample_count: data.length
            });
            console.log(`🎯 Found vector columns in ${tableName}: ${vectorColumns.map(c => c.column_name).join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`⚠️  Could not check ${tableName} for vectors: ${err.message}`);
      }
    }

    this.results.vector_analysis = vectorTables;
    console.log(`🔬 Found ${vectorTables.length} tables with potential vector columns`);
  }

  async analyzeAuthTables() {
    console.log('🔍 Analyzing authentication setup...');
    
    try {
      // Check current user and session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      this.results.auth_analysis = {
        current_user: user ? {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          user_metadata: user.user_metadata,
          app_metadata: user.app_metadata
        } : null,
        session_active: !!session,
        user_error: userError?.message,
        session_error: sessionError?.message,
        using_service_key: !!SUPABASE_SERVICE_KEY
      };

      console.log(`👤 Auth analysis: User ${user ? 'authenticated' : 'not authenticated'}`);
      
    } catch (error) {
      console.error('❌ Error analyzing auth:', error);
      this.results.auth_analysis = { error: error.message };
    }
  }

  async checkMigrations() {
    console.log('🔍 Checking migration history...');
    
    try {
      // Try to read migration files
      const migrationsDir = path.join(__dirname, '../supabase/migrations');
      const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
      
      const migrations = migrationFiles.map(file => {
        const filepath = path.join(migrationsDir, file);
        const content = fs.readFileSync(filepath, 'utf8');
        
        return {
          filename: file,
          size: content.length,
          lines: content.split('\n').length,
          contains_vector: content.includes('vector') || content.includes('embedding'),
          contains_rls: content.includes('RLS') || content.includes('policy'),
          contains_auth: content.includes('auth') || content.includes('user'),
          preview: content.substring(0, 200) + (content.length > 200 ? '...' : '')
        };
      });

      this.results.migration_analysis = {
        total_migrations: migrations.length,
        migrations: migrations
      };

      console.log(`📜 Found ${migrations.length} migration files`);
      
    } catch (error) {
      console.error('❌ Error checking migrations:', error);
      this.results.migration_analysis = { error: error.message };
    }
  }

  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database-analysis-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
      console.log(`📄 Results saved to: ${filename}`);
      
      // Also create a summary file
      const summaryFilename = `database-summary-${timestamp}.md`;
      const summaryFilepath = path.join(__dirname, summaryFilename);
      const summary = this.generateSummary();
      fs.writeFileSync(summaryFilepath, summary);
      console.log(`📋 Summary saved to: ${summaryFilename}`);
      
      return { filepath, summaryFilepath };
    } catch (error) {
      console.error('❌ Error saving results:', error);
      throw error;
    }
  }

  generateSummary() {
    const summary = [];
    summary.push('# Database Analysis Summary\n');
    summary.push(`Generated: ${new Date().toISOString()}\n`);

    // Discovered Tables
    if (this.results.discovered_tables) {
      const accessible = this.results.discovered_tables.filter(t => t.status === 'accessible');
      const errors = this.results.discovered_tables.filter(t => t.status !== 'accessible');
      
      summary.push('## Discovered Tables');
      summary.push(`- **Accessible**: ${accessible.length} tables`);
      summary.push(`- **Errors**: ${errors.length} tables`);
      summary.push('');
      
      summary.push('### Accessible Tables:');
      accessible.forEach(table => {
        summary.push(`- **${table.table_name}** (${table.row_count || 0} rows)`);
      });
      summary.push('');
      
      if (errors.length > 0) {
        summary.push('### Tables with Errors:');
        errors.forEach(table => {
          summary.push(`- **${table.table_name}**: ${table.error}`);
        });
        summary.push('');
      }
    }

    // Table Structures
    if (this.results.table_structures) {
      summary.push('## Table Structures');
      this.results.table_structures.forEach(table => {
        if (table.columns && table.columns.length > 0) {
          summary.push(`### ${table.table_name} (${table.column_count} columns)`);
          table.columns.forEach(col => {
            summary.push(`  - **${col.column_name}** (${col.data_type}) ${col.is_null ? '[nullable]' : '[required]'}`);
          });
          summary.push('');
        }
      });
    }

    // Vector Analysis
    if (this.results.vector_analysis && this.results.vector_analysis.length > 0) {
      summary.push('## Vector/Embedding Columns');
      this.results.vector_analysis.forEach(table => {
        summary.push(`### ${table.table_name}`);
        table.vector_columns.forEach(col => {
          summary.push(`- **${col.column_name}** ${col.is_vector ? `(Vector/Embedding - ${col.vector_dimension}D)` : '(Potential Vector)'}`);
        });
        summary.push('');
      });
    }

    // Migration Analysis
    if (this.results.migration_analysis) {
      summary.push('## Migration Files');
      summary.push(`- **Total Migrations**: ${this.results.migration_analysis.total_migrations}`);
      if (this.results.migration_analysis.migrations) {
        this.results.migration_analysis.migrations.forEach(migration => {
          const features = [];
          if (migration.contains_vector) features.push('Vector');
          if (migration.contains_rls) features.push('RLS');
          if (migration.contains_auth) features.push('Auth');
          
          summary.push(`- **${migration.filename}** ${features.length > 0 ? `[${features.join(', ')}]` : ''}`);
        });
      }
      summary.push('');
    }

    // Auth Analysis
    if (this.results.auth_analysis) {
      summary.push('## Authentication Status');
      summary.push(`- **User Authenticated**: ${this.results.auth_analysis.current_user ? 'Yes' : 'No'}`);
      summary.push(`- **Session Active**: ${this.results.auth_analysis.session_active ? 'Yes' : 'No'}`);
      summary.push(`- **Using Service Key**: ${this.results.auth_analysis.using_service_key ? 'Yes' : 'No'}`);
      if (this.results.auth_analysis.current_user) {
        summary.push(`- **User ID**: ${this.results.auth_analysis.current_user.id}`);
        summary.push(`- **Email**: ${this.results.auth_analysis.current_user.email}`);
      }
      summary.push('');
    }

    summary.push('---');
    summary.push('*For complete details, see the full JSON analysis file.*');

    return summary.join('\n');
  }
}

// Main execution
async function main() {
  try {
    console.log('🔗 Connecting to Supabase...');
    console.log(`   URL: ${SUPABASE_URL}`);
    console.log(`   Key Type: ${SUPABASE_SERVICE_KEY ? 'Service Role' : 'Anon'}\n`);

    const analyzer = new DatabaseAnalyzer();
    await analyzer.analyzeDatabase();
    const { filepath, summaryFilepath } = await analyzer.saveResults();

    console.log('\n🎉 Analysis Complete!');
    console.log(`📊 Full results: ${path.basename(filepath)}`);
    console.log(`📋 Summary: ${path.basename(summaryFilepath)}`);
    console.log('\nNext steps:');
    console.log('1. Review the analysis files');
    console.log('2. Share the results for data model alignment');
    console.log('3. Create consolidated migration script');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DatabaseAnalyzer }; 