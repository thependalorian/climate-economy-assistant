/**
 * Development startup utilities - health checks, API validation, and system initialization
 */

import { tracer } from './tracing';

interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: Record<string, unknown>;
}

class DevStartupSystem {
  private healthChecks: HealthCheckResult[] = [];

  constructor() {
    if (import.meta.env.DEV) {
      this.initialize();
    }
  }

  private async initialize() {
    console.log(
      '%c🚀 DEVELOPMENT STARTUP SYSTEM',
      'background: linear-gradient(90deg, #4F46E5, #7C3AED); color: white; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 14px;'
    );

    await this.runHealthChecks();
    this.displayHealthSummary();
    this.setupDevTools();
    this.monitorSystemHealth();
  }

  private async runHealthChecks() {
    tracer.performance('🔍 Running development health checks');

    const checks = [
      this.checkEnvironmentVariables(),
      this.checkSupabaseConnection(),
      this.checkOpenAIKey(),
      this.checkLocalStorage(),
      this.checkBrowserFeatures(),
      this.checkNetworkConnectivity(),
    ];

    const results = await Promise.allSettled(checks);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.healthChecks.push(result.value);
      } else {
        this.healthChecks.push({
          name: `Health Check ${index + 1}`,
          status: 'fail',
          message: `Check failed: ${result.reason}`,
        });
      }
    });
  }

  private async checkEnvironmentVariables(): Promise<HealthCheckResult> {
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_OPENAI_API_KEY',
    ];

    const missing = requiredVars.filter(varName => !import.meta.env[varName]);

    if (missing.length === 0) {
      tracer.auth('✅ All required environment variables present');
      return {
        name: 'Environment Variables',
        status: 'pass',
        message: 'All required variables present',
        details: {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.substring(0, 30) + '...',
          hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          hasOpenAIKey: !!import.meta.env.VITE_OPENAI_API_KEY,
        }
      };
    } else {
      tracer.auth('❌ Missing environment variables', { missing }, 'error');
      return {
        name: 'Environment Variables',
        status: 'fail',
        message: `Missing: ${missing.join(', ')}`,
        details: { missing }
      };
    }
  }

  private async checkSupabaseConnection(): Promise<HealthCheckResult> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return {
          name: 'Supabase Connection',
          status: 'fail',
          message: 'Missing Supabase credentials'
        };
      }

      // Test connection with a simple request
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (response.ok) {
        tracer.database('✅ Supabase connection successful');
        return {
          name: 'Supabase Connection',
          status: 'pass',
          message: 'Connection successful',
          details: {
            url: supabaseUrl,
            status: response.status,
            responseTime: response.headers.get('x-response-time')
          }
        };
      } else {
        tracer.database('❌ Supabase connection failed', { status: response.status }, 'error');
        return {
          name: 'Supabase Connection',
          status: 'fail',
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      tracer.database('❌ Supabase connection error', { error }, 'error');
      return {
        name: 'Supabase Connection',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkOpenAIKey(): Promise<HealthCheckResult> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      return {
        name: 'OpenAI API Key',
        status: 'warn',
        message: 'API key not configured - AI features will not work'
      };
    }

    try {
      // Test with a simple models request
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        tracer.ai('✅ OpenAI API key valid', { modelCount: data.data?.length });
        return {
          name: 'OpenAI API Key',
          status: 'pass',
          message: 'API key valid and accessible',
          details: {
            modelCount: data.data?.length || 0,
            hasGPT4: data.data?.some((m: { id: string }) => m.id.includes('gpt-4')) || false
          }
        };
      } else {
        tracer.ai('❌ OpenAI API key invalid', { status: response.status }, 'error');
        return {
          name: 'OpenAI API Key',
          status: 'fail',
          message: `Invalid API key: HTTP ${response.status}`
        };
      }
    } catch (error) {
      tracer.ai('❌ OpenAI API check failed', { error }, 'error');
      return {
        name: 'OpenAI API Key',
        status: 'warn',
        message: 'Could not verify API key - network issue?'
      };
    }
  }

  private async checkLocalStorage(): Promise<HealthCheckResult> {
    try {
      const testKey = '__dev_test__';
      localStorage.setItem(testKey, 'test');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (value === 'test') {
        tracer.performance('✅ LocalStorage working');
        return {
          name: 'LocalStorage',
          status: 'pass',
          message: 'LocalStorage accessible',
          details: {
            storageQuota: this.getStorageQuota(),
            existingKeys: Object.keys(localStorage).length
          }
        };
      } else {
        return {
          name: 'LocalStorage',
          status: 'fail',
          message: 'LocalStorage not working properly'
        };
      }
    } catch (error) {
      tracer.performance('❌ LocalStorage error', { error }, 'error');
      return {
        name: 'LocalStorage',
        status: 'fail',
        message: 'LocalStorage not available'
      };
    }
  }

  private async checkBrowserFeatures(): Promise<HealthCheckResult> {
    const features = {
      fetch: typeof fetch !== 'undefined',
      websockets: typeof WebSocket !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator,
      webWorkers: typeof Worker !== 'undefined',
      notifications: 'Notification' in window,
      geolocation: 'geolocation' in navigator,
    };

    const missingFeatures = Object.entries(features)
      .filter(([, supported]) => !supported)
      .map(([feature]) => feature);

    tracer.performance('🔍 Browser features check', features);

    if (missingFeatures.length === 0) {
      return {
        name: 'Browser Features',
        status: 'pass',
        message: 'All required features supported',
        details: features
      };
    } else {
      return {
        name: 'Browser Features',
        status: 'warn',
        message: `Some features missing: ${missingFeatures.join(', ')}`,
        details: features
      };
    }
  }

  private async checkNetworkConnectivity(): Promise<HealthCheckResult> {
    try {
      const startTime = performance.now();
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        cache: 'no-cache'
      });
      const endTime = performance.now();
      const latency = endTime - startTime;

      if (response.ok) {
        tracer.api('✅ Network connectivity good', { latency: `${latency.toFixed(2)}ms` });
        return {
          name: 'Network Connectivity',
          status: latency < 1000 ? 'pass' : 'warn',
          message: `Network latency: ${latency.toFixed(2)}ms`,
          details: {
            latency,
            status: response.status,
            online: navigator.onLine
          }
        };
      } else {
        return {
          name: 'Network Connectivity',
          status: 'warn',
          message: 'Network issues detected'
        };
      }
    } catch (error) {
      tracer.api('❌ Network connectivity check failed', { error }, 'error');
      return {
        name: 'Network Connectivity',
        status: 'fail',
        message: 'No network connectivity'
      };
    }
  }

  private getStorageQuota(): string {
    try {
      let used = 0;
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          used += localStorage[key].length + key.length;
        }
      }
      return `${(used / 1024).toFixed(2)} KB used`;
    } catch {
      return 'Unknown';
    }
  }

  private displayHealthSummary() {
    console.log('\n' + '='.repeat(60));
    console.log(
      '%c📊 DEVELOPMENT HEALTH SUMMARY',
      'background: #059669; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
    );
    console.log('='.repeat(60));

    const passed = this.healthChecks.filter(check => check.status === 'pass').length;
    const warned = this.healthChecks.filter(check => check.status === 'warn').length;
    const failed = this.healthChecks.filter(check => check.status === 'fail').length;

    this.healthChecks.forEach(check => {
      const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
      const color = check.status === 'pass' ? '#059669' : check.status === 'warn' ? '#D97706' : '#DC2626';

      console.log(
        `%c${icon} ${check.name}: ${check.message}`,
        `color: ${color}; font-weight: ${check.status === 'fail' ? 'bold' : 'normal'};`
      );

      if (check.details && import.meta.env.VITE_VERBOSE === 'true') {
        console.log('   Details:', check.details);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log(
      `%c📈 Summary: ${passed} passed, ${warned} warnings, ${failed} failed`,
      `color: ${failed > 0 ? '#DC2626' : warned > 0 ? '#D97706' : '#059669'}; font-weight: bold;`
    );
    console.log('='.repeat(60) + '\n');
  }

  private setupDevTools() {
    // Add global dev utilities
    (window as Record<string, unknown>).devTools = {
      healthChecks: this.healthChecks,
      tracer,
      clearAll: () => {
        localStorage.clear();
        sessionStorage.clear();
        tracer.clearTraces();
        console.clear();
        console.log('🧹 All development data cleared');
      },
      exportLogs: () => tracer.exportTraces(),
      runHealthCheck: () => this.runHealthChecks(),
    };

    console.log(
      '%c🛠️ Dev tools available: window.devTools',
      'background: #7C3AED; color: white; padding: 4px 8px; border-radius: 4px;'
    );
  }

  private monitorSystemHealth() {
    // Monitor for critical errors
    let errorCount = 0;
    const originalError = console.error;

    console.error = (...args) => {
      errorCount++;
      if (errorCount > 10) {
        console.log(
          '%c🚨 HIGH ERROR COUNT DETECTED - Consider checking system health',
          'background: #DC2626; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
        );
      }
      originalError.apply(console, args);
    };

    // Monitor network status
    window.addEventListener('online', () => {
      tracer.api('🌐 Network connection restored');
    });

    window.addEventListener('offline', () => {
      tracer.api('📡 Network connection lost', {}, 'warn');
    });
  }
}

// Initialize development startup system
export const devStartup = new DevStartupSystem();

export default devStartup;
