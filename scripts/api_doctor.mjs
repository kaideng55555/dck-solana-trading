#!/usr/bin/env node
/**
 * API Doctor - Health check and diagnostics for DCK$ backend
 * Usage: node api_doctor.mjs [--url https://api.dcktoken.com]
 */

const API_URL = process.argv.includes('--url') 
  ? process.argv[process.argv.indexOf('--url') + 1]
  : process.env.API_URL || 'http://localhost:3001';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

const log = {
  ok: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  fail: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  dim: (msg) => console.log(`${colors.dim}  ${msg}${colors.reset}`),
};

async function checkEndpoint(name, path, options = {}) {
  const url = `${API_URL}${path}`;
  const start = Date.now();
  
  try {
    const res = await fetch(url, {
      headers: options.headers || {},
      signal: AbortSignal.timeout(10000),
    });
    const latency = Date.now() - start;
    
    if (res.ok) {
      log.ok(`${name} ${colors.dim}(${latency}ms)${colors.reset}`);
      if (options.showBody) {
        const body = await res.json();
        log.dim(JSON.stringify(body, null, 2));
      }
      return { ok: true, latency };
    } else {
      log.fail(`${name} - ${res.status} ${res.statusText}`);
      return { ok: false, status: res.status };
    }
  } catch (err) {
    log.fail(`${name} - ${err.message}`);
    return { ok: false, error: err.message };
  }
}

async function runDiagnostics() {
  console.log(`\n${colors.cyan}🩺 DCK$ API Doctor${colors.reset}`);
  console.log(`${colors.dim}Target: ${API_URL}${colors.reset}\n`);

  const results = [];

  // Basic health
  console.log('── Core Health ──');
  results.push(await checkEndpoint('Health endpoint', '/healthz', { showBody: true }));
  
  // Public endpoints
  console.log('\n── Public Endpoints ──');
  results.push(await checkEndpoint('Root', '/'));
  results.push(await checkEndpoint('Price API', '/price/So11111111111111111111111111111111111111112'));
  results.push(await checkEndpoint('Risk API', '/risk/So11111111111111111111111111111111111111112'));

  // Admin endpoints (if token provided)
  if (ADMIN_TOKEN) {
    console.log('\n── Admin Endpoints ──');
    const adminHeaders = { 'x-admin-token': ADMIN_TOKEN };
    results.push(await checkEndpoint('Admin Config', '/admin/config', { headers: adminHeaders }));
    results.push(await checkEndpoint('Fee Stats', '/admin/fees/stats', { headers: adminHeaders }));
  } else {
    console.log('\n── Admin Endpoints ──');
    log.warn('Skipped (set ADMIN_TOKEN env var to test)');
  }

  // Summary
  const passed = results.filter(r => r.ok).length;
  const total = results.length;
  const avgLatency = Math.round(
    results.filter(r => r.latency).reduce((a, r) => a + r.latency, 0) / 
    results.filter(r => r.latency).length
  );

  console.log('\n── Summary ──');
  if (passed === total) {
    log.ok(`All ${total} checks passed`);
  } else {
    log.warn(`${passed}/${total} checks passed`);
  }
  log.info(`Avg latency: ${avgLatency}ms`);
  
  console.log('');
  process.exit(passed === total ? 0 : 1);
}

runDiagnostics();
