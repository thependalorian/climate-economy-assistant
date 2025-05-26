/**
 * Comprehensive tracing and debugging utilities for development
 */

interface TraceConfig {
  enabled: boolean;
  verbose: boolean;
  categories: {
    auth: boolean;
    api: boolean;
    database: boolean;
    ai: boolean;
    navigation: boolean;
    performance: boolean;
    errors: boolean;
  };
}

class TracingSystem {
  private config: TraceConfig;
  private startTime: number;
  private traces: Array<{
    timestamp: number;
    category: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: Record<string, unknown>;
    duration?: number;
  }> = [];

  constructor() {
    this.startTime = Date.now();
    this.config = {
      enabled: import.meta.env.VITE_TRACE_ENABLED === 'true' || import.meta.env.DEV,
      verbose: import.meta.env.VITE_VERBOSE === 'true',
      categories: {
        auth: true,
        api: true,
        database: true,
        ai: true,
        navigation: true,
        performance: true,
        errors: true,
      }
    };

    if (this.config.enabled) {
      this.initializeTracing();
    }
  }

  private initializeTracing() {
    console.log(
      '%c🔍 TRACING SYSTEM INITIALIZED',
      'background: #4F46E5; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
    );

    console.log(
      '%cTracing Configuration:',
      'color: #6366F1; font-weight: bold;',
      this.config
    );

    // Override console methods to capture all logs (disabled to prevent conflicts)
    // this.interceptConsoleLogs();

    // Monitor performance
    this.monitorPerformance();

    // Monitor network requests
    this.monitorNetworkRequests();

    // Monitor errors
    this.monitorErrors();
  }

  private interceptConsoleLogs() {
    // Disabled to prevent infinite loops and conflicts
    // Console interception can be enabled later if needed
    return;
  }

  private monitorPerformance() {
    if (!this.config.categories.performance) return;

    // Monitor page load performance
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.trace('performance', 'Page Load Complete', {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        totalTime: perfData.loadEventEnd - perfData.fetchStart,
      });
    });

    // Monitor resource loading
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          this.trace('performance', `Resource Loaded: ${resource.name}`, {
            duration: resource.duration,
            size: resource.transferSize,
            type: resource.initiatorType,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  private monitorNetworkRequests() {
    if (!this.config.categories.api) return;

    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] instanceof Request ? args[0].url : args[0];
      const method = args[1]?.method || 'GET';

      this.trace('api', `🌐 ${method} ${url}`, {
        request: args[1],
        timestamp: new Date().toISOString()
      });

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        this.trace('api', `✅ ${method} ${url} - ${response.status}`, {
          status: response.status,
          statusText: response.statusText,
          duration: `${duration.toFixed(2)}ms`,
          headers: Object.fromEntries(response.headers.entries()),
        });

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.trace('api', `❌ ${method} ${url} - Failed`, {
          error: error instanceof Error ? error.message : String(error),
          duration: `${duration.toFixed(2)}ms`,
        }, 'error');
        throw error;
      }
    };
  }

  private monitorErrors() {
    if (!this.config.categories.errors) return;

    window.addEventListener('error', (event) => {
      this.trace('errors', '💥 JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      }, 'error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trace('errors', '💥 Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise,
      }, 'error');
    });
  }

  public trace(
    category: keyof TraceConfig['categories'],
    message: string,
    data?: Record<string, unknown>,
    level: 'info' | 'warn' | 'error' | 'debug' = 'info'
  ) {
    if (!this.config.enabled || !this.config.categories[category]) return;

    const timestamp = Date.now();
    const relativeTime = timestamp - this.startTime;

    const trace = {
      timestamp,
      category,
      level,
      message,
      data,
      duration: relativeTime,
    };

    this.traces.push(trace);

    // Console output with styling
    const categoryColors = {
      auth: '#10B981',      // Green
      api: '#3B82F6',       // Blue
      database: '#8B5CF6',  // Purple
      ai: '#F59E0B',        // Amber
      navigation: '#EF4444', // Red
      performance: '#06B6D4', // Cyan
      errors: '#DC2626',    // Red
    };

    const levelIcons = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
    };

    const color = categoryColors[category] || '#6B7280';
    const icon = levelIcons[level];
    const timeStr = `+${relativeTime}ms`;

    console.groupCollapsed(
      `%c${icon} [${category.toUpperCase()}] ${message} %c${timeStr}`,
      `color: ${color}; font-weight: bold;`,
      'color: #6B7280; font-size: 0.8em;'
    );

    if (data && this.config.verbose) {
      console.log('Data:', data);
    }

    console.log('Trace:', trace);
    console.groupEnd();
  }

  public auth(message: string, data?: Record<string, unknown>, level?: 'info' | 'warn' | 'error' | 'debug') {
    this.trace('auth', message, data, level);
  }

  public api(message: string, data?: Record<string, unknown>, level?: 'info' | 'warn' | 'error' | 'debug') {
    this.trace('api', message, data, level);
  }

  public database(message: string, data?: Record<string, unknown>, level?: 'info' | 'warn' | 'error' | 'debug') {
    this.trace('database', message, data, level);
  }

  public ai(message: string, data?: Record<string, unknown>, level?: 'info' | 'warn' | 'error' | 'debug') {
    this.trace('ai', message, data, level);
  }

  public navigation(message: string, data?: Record<string, unknown>, level?: 'info' | 'warn' | 'error' | 'debug') {
    this.trace('navigation', message, data, level);
  }

  public performance(message: string, data?: Record<string, unknown>, level?: 'info' | 'warn' | 'error' | 'debug') {
    this.trace('performance', message, data, level);
  }

  public error(message: string, data?: Record<string, unknown>) {
    this.trace('errors', message, data, 'error');
  }

  public getTraces() {
    return [...this.traces];
  }

  public exportTraces() {
    const exportData = {
      session: {
        startTime: this.startTime,
        duration: Date.now() - this.startTime,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      config: this.config,
      traces: this.traces,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traces-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  public clearTraces() {
    this.traces = [];
    console.clear();
    console.log(
      '%c🧹 TRACES CLEARED',
      'background: #EF4444; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
    );
  }
}

// Create global tracing instance
export const tracer = new TracingSystem();

// Make tracer available globally for debugging
if (typeof window !== 'undefined') {
  (window as Record<string, unknown>).tracer = tracer;
}

// Utility functions for common tracing patterns
export const traceFunction = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  category: keyof TraceConfig['categories'],
  name?: string
): T => {
  return ((...args: unknown[]) => {
    const functionName = name || fn.name || 'anonymous';
    const startTime = performance.now();

    tracer.trace(category, `🚀 Function Start: ${functionName}`, { args });

    try {
      const result = fn(...args);

      if (result instanceof Promise) {
        return result
          .then((value) => {
            const duration = performance.now() - startTime;
            tracer.trace(category, `✅ Function Complete: ${functionName}`, {
              duration: `${duration.toFixed(2)}ms`,
              result: value
            });
            return value;
          })
          .catch((error) => {
            const duration = performance.now() - startTime;
            tracer.trace(category, `❌ Function Error: ${functionName}`, {
              duration: `${duration.toFixed(2)}ms`,
              error: error.message
            }, 'error');
            throw error;
          });
      } else {
        const duration = performance.now() - startTime;
        tracer.trace(category, `✅ Function Complete: ${functionName}`, {
          duration: `${duration.toFixed(2)}ms`,
          result
        });
        return result;
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      tracer.trace(category, `❌ Function Error: ${functionName}`, {
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : String(error)
      }, 'error');
      throw error;
    }
  }) as T;
};

export default tracer;
