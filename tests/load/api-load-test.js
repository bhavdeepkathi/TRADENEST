import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const requestCount = new Counter('requests_total');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Spike to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests < 1s
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/api';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  ...(AUTH_TOKEN && { Authorization: `Bearer ${AUTH_TOKEN}` }),
};

export default function () {
  // Test product listing
  const listStart = new Date();
  const listRes = http.get(`${BASE_URL}/products?page=1&limit=20`, { headers });
  apiLatency.add(new Date() - listStart);
  requestCount.add(1);

  const listSuccess = check(listRes, {
    'product list status 200': (r) => r.status === 200,
    'product list has data': (r) => r.json('data') !== undefined,
  });
  errorRate.add(!listSuccess);

  sleep(1);

  // Test product detail
  const detailStart = new Date();
  const detailRes = http.get(`${BASE_URL}/products/prod-1`, { headers });
  apiLatency.add(new Date() - detailStart);
  requestCount.add(1);

  const detailSuccess = check(detailRes, {
    'product detail status 200': (r) => r.status === 200,
    'product detail has title': (r) => r.json('title') !== undefined,
  });
  errorRate.add(!detailSuccess);

  sleep(1);

  // Test categories
  const catStart = new Date();
  const catRes = http.get(`${BASE_URL}/categories`, { headers });
  apiLatency.add(new Date() - catStart);
  requestCount.add(1);

  const catSuccess = check(catRes, {
    'categories status 200': (r) => r.status === 200,
    'categories is array': (r) => Array.isArray(r.json()),
  });
  errorRate.add(!catSuccess);

  sleep(2);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  const lines = [];
  lines.push('Load Test Summary');
  lines.push('=================');
  lines.push(`Total Requests: ${data.metrics.http_reqs?.values?.count || 0}`);
  lines.push(`Failed Requests: ${data.metrics.http_req_failed?.values?.passes || 0}`);
  lines.push(`Avg Latency: ${data.metrics.http_req_duration?.values?.avg?.toFixed(2)}ms`);
  lines.push(`P95 Latency: ${data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2)}ms`);
  lines.push(`Max Latency: ${data.metrics.http_req_duration?.values?.max?.toFixed(2)}ms`);
  return lines.join('\n');
}