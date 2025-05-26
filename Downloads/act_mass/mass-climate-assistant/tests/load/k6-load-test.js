import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const chatResponseTime = new Trend('chat_response_time');
const resourceResponseTime = new Trend('resource_response_time');
const errorRate = new Rate('error_rate');
const chatRequests = new Counter('chat_requests');
const resourceRequests = new Counter('resource_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'chat_response_time': ['p(95)<2000'],  // 95% of chat requests must complete below 2s
    'resource_response_time': ['p(95)<1000'],  // 95% of resource requests must complete below 1s
    'error_rate': ['rate<0.01'],  // Less than 1% of requests can fail
    'http_req_duration': ['p(95)<3000'],  // 95% of all requests must complete below 3s
  },
};

// Sample chat messages
const chatMessages = [
  'Tell me about clean energy jobs in Boston',
  'What training programs are available for solar installation?',
  'How can I transition from IT to renewable energy?',
  'What skills do I need for a wind energy career?',
  'Are there any environmental justice programs in Chelsea?',
  'What certifications are valuable for green building?',
  'Tell me about offshore wind projects in Massachusetts',
  'What are the highest paying clean energy jobs?',
  'How can I use my military experience in clean energy?',
  'What resources are available for international professionals?'
];

// Sample resource queries
const resourceQueries = [
  'solar', 'wind', 'energy efficiency', 'green building',
  'environmental justice', 'climate policy', 'renewable',
  'certification', 'training', 'education', 'career transition'
];

export default function () {
  const BASE_URL = __ENV.TARGET_URL || 'https://staging.climate-assistant.joinact.org';
  
  group('Chat API', function () {
    // Test chat endpoint with random message
    const message = randomItem(chatMessages);
    const chatRes = http.post(`${BASE_URL}/api/chat`, JSON.stringify({
      message: message,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    chatRequests.add(1);
    chatResponseTime.add(chatRes.timings.duration);
    
    const chatSuccess = check(chatRes, {
      'chat status is 200': (r) => r.status === 200,
      'chat response has content': (r) => r.json().hasOwnProperty('content'),
    });
    
    if (!chatSuccess) {
      errorRate.add(1);
      console.log(`Chat request failed: ${chatRes.status}, ${chatRes.body}`);
    }
  });
  
  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
  
  group('Resource API', function () {
    // Test resource search endpoint with random query
    const query = randomItem(resourceQueries);
    const resourceRes = http.get(`${BASE_URL}/api/rag?query=${query}`);
    
    resourceRequests.add(1);
    resourceResponseTime.add(resourceRes.timings.duration);
    
    const resourceSuccess = check(resourceRes, {
      'resource search status is 200': (r) => r.status === 200,
      'resource search returns results': (r) => r.json().hasOwnProperty('results'),
    });
    
    if (!resourceSuccess) {
      errorRate.add(1);
      console.log(`Resource request failed: ${resourceRes.status}, ${resourceRes.body}`);
    }
  });
  
  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
  
  group('Health Check', function () {
    // Test health endpoint
    const healthRes = http.get(`${BASE_URL}/health`);
    
    check(healthRes, {
      'health check status is 200': (r) => r.status === 200,
      'health check returns ok': (r) => r.body.includes('ok'),
    });
  });
  
  sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds
}

// Handle test completion
export function handleSummary(data) {
  // Create a summary report
  const summary = {
    "avg_chat_response_time": data.metrics.chat_response_time.values.avg,
    "p95_chat_response_time": data.metrics.chat_response_time.values["p(95)"],
    "avg_resource_response_time": data.metrics.resource_response_time.values.avg,
    "p95_resource_response_time": data.metrics.resource_response_time.values["p(95)"],
    "error_rate": data.metrics.error_rate.values.rate,
    "total_chat_requests": data.metrics.chat_requests.values.count,
    "total_resource_requests": data.metrics.resource_requests.values.count,
    "http_req_duration_p95": data.metrics.http_req_duration.values["p(95)"],
    "vus_max": data.metrics.vus_max.values.max,
    "iteration_duration_avg": data.metrics.iteration_duration.values.avg
  };
  
  return {
    'stdout': JSON.stringify(summary, null, 2),
    'load-test-summary.json': JSON.stringify(summary, null, 2),
  };
}
