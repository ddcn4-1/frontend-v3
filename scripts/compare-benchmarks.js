#!/usr/bin/env node

/**
 * Benchmark Comparison Tool
 *
 * 두 개의 벤치마크 결과를 비교하여 성능 개선/저하를 분석합니다.
 *
 * Usage:
 *   node scripts/compare-benchmarks.js <baseline-id> <optimized-id>
 *   node scripts/compare-benchmarks.js baseline-20250124-120000 optimized-v1-20250124-130000
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function formatPercentage(value) {
  const sign = value > 0 ? '+' : '';
  const color = value < 0 ? colors.green : value > 0 ? colors.red : colors.reset;
  return `${color}${sign}${value.toFixed(1)}%${colors.reset}`;
}

function calculateImprovement(baseline, optimized) {
  return ((optimized - baseline) / baseline) * 100;
}

function loadBenchmark(benchmarkId) {
  const filePath = path.join(__dirname, '..', 'benchmarks', `${benchmarkId}.json`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Benchmark file not found: ${filePath}`);
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function compareTimings(baselineTiming, optimizedTiming, label, indent = '') {
  const improvement = calculateImprovement(baselineTiming, optimizedTiming);
  const saved = baselineTiming - optimizedTiming;

  console.log(
    `${indent}${label.padEnd(20)} | ` +
    `${String(baselineTiming).padStart(4)}s → ${String(optimizedTiming).padStart(4)}s | ` +
    `${formatPercentage(improvement)} | ` +
    `${saved > 0 ? colors.green : saved < 0 ? colors.red : ''}${saved > 0 ? '+' : ''}${saved}s${colors.reset}`
  );

  return { improvement, saved };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node scripts/compare-benchmarks.js <baseline-id> <optimized-id>');
    console.log('');
    console.log('Available benchmarks:');
    const benchmarksDir = path.join(__dirname, '..', 'benchmarks');
    if (fs.existsSync(benchmarksDir)) {
      const files = fs.readdirSync(benchmarksDir)
        .filter(f => f.endsWith('.json') && f !== 'index.json')
        .map(f => f.replace('.json', ''));
      files.forEach(f => console.log(`  - ${f}`));
    }
    process.exit(1);
  }

  const [baselineId, optimizedId] = args;

  console.log(`\n${colors.bright}📊 Benchmark Comparison${colors.reset}\n`);
  console.log(`Baseline:  ${colors.blue}${baselineId}${colors.reset}`);
  console.log(`Optimized: ${colors.blue}${optimizedId}${colors.reset}\n`);

  const baseline = loadBenchmark(baselineId);
  const optimized = loadBenchmark(optimizedId);

  // 평균 타이밍 계산
  const baselineAvg = {
    checkout: Math.floor(baseline.results.reduce((sum, r) => sum + r.timings.checkout, 0) / baseline.results.length),
    pnpm_setup: Math.floor(baseline.results.reduce((sum, r) => sum + r.timings.pnpm_setup, 0) / baseline.results.length),
    node_setup: Math.floor(baseline.results.reduce((sum, r) => sum + r.timings.node_setup, 0) / baseline.results.length),
    dependencies: Math.floor(baseline.results.reduce((sum, r) => sum + r.timings.dependencies, 0) / baseline.results.length),
    setup_total: Math.floor(baseline.results.reduce((sum, r) => sum + r.timings.setup_total, 0) / baseline.results.length),
    client_build: Math.floor(baseline.results.reduce((sum, r) => sum + r.timings.client_build, 0) / baseline.results.length),
    admin_build: Math.floor(baseline.results.reduce((sum, r) => sum + r.timings.admin_build, 0) / baseline.results.length),
    accounts_build: Math.floor(baseline.results.reduce((sum, r) => sum + r.timings.accounts_build, 0) / baseline.results.length),
    build_total: Math.floor(baseline.results.reduce((sum, r) => sum + r.timings.build_total, 0) / baseline.results.length),
    total: Math.floor(baseline.results.reduce((sum, r) => sum + r.timings.total, 0) / baseline.results.length),
  };

  const optimizedAvg = {
    checkout: Math.floor(optimized.results.reduce((sum, r) => sum + r.timings.checkout, 0) / optimized.results.length),
    pnpm_setup: Math.floor(optimized.results.reduce((sum, r) => sum + r.timings.pnpm_setup, 0) / optimized.results.length),
    node_setup: Math.floor(optimized.results.reduce((sum, r) => sum + r.timings.node_setup, 0) / optimized.results.length),
    dependencies: Math.floor(optimized.results.reduce((sum, r) => sum + r.timings.dependencies, 0) / optimized.results.length),
    setup_total: Math.floor(optimized.results.reduce((sum, r) => sum + r.timings.setup_total, 0) / optimized.results.length),
    client_build: Math.floor(optimized.results.reduce((sum, r) => sum + r.timings.client_build, 0) / optimized.results.length),
    admin_build: Math.floor(optimized.results.reduce((sum, r) => sum + r.timings.admin_build, 0) / optimized.results.length),
    accounts_build: Math.floor(optimized.results.reduce((sum, r) => sum + r.timings.accounts_build, 0) / optimized.results.length),
    build_total: Math.floor(optimized.results.reduce((sum, r) => sum + r.timings.build_total, 0) / optimized.results.length),
    total: Math.floor(optimized.results.reduce((sum, r) => sum + r.timings.total, 0) / optimized.results.length),
  };

  console.log(`${colors.bright}Environment${colors.reset}`);
  console.log(`  Runner: ${baseline.environment.runner}`);
  console.log(`  Node.js: ${baseline.environment.node_version}`);
  console.log(`  pnpm: ${baseline.environment.pnpm_version}\n`);

  console.log(`${colors.bright}Phase                | Before →  After | Change     | Time Saved${colors.reset}`);
  console.log('─'.repeat(70));

  // Setup 단계
  compareTimings(baselineAvg.checkout, optimizedAvg.checkout, 'Checkout', '  ');
  compareTimings(baselineAvg.pnpm_setup, optimizedAvg.pnpm_setup, 'pnpm Setup', '  ');
  compareTimings(baselineAvg.node_setup, optimizedAvg.node_setup, 'Node.js Setup', '  ');
  compareTimings(baselineAvg.dependencies, optimizedAvg.dependencies, 'Dependencies', '  ');

  console.log('─'.repeat(70));
  const setupResult = compareTimings(baselineAvg.setup_total, optimizedAvg.setup_total, `${colors.bright}Setup Total${colors.reset}`);
  console.log('─'.repeat(70));

  // Build 단계
  compareTimings(baselineAvg.client_build, optimizedAvg.client_build, 'Client Build', '  ');
  compareTimings(baselineAvg.admin_build, optimizedAvg.admin_build, 'Admin Build', '  ');
  compareTimings(baselineAvg.accounts_build, optimizedAvg.accounts_build, 'Accounts Build', '  ');

  console.log('─'.repeat(70));
  const buildResult = compareTimings(baselineAvg.build_total, optimizedAvg.build_total, `${colors.bright}Build Total${colors.reset}`);
  console.log('─'.repeat(70));

  // 전체
  compareTimings(baselineAvg.total, optimizedAvg.total, `${colors.bright}TOTAL${colors.reset}`);
  console.log('═'.repeat(70));

  // 요약
  console.log(`\n${colors.bright}📈 Summary${colors.reset}\n`);

  const totalSaved = baselineAvg.total - optimizedAvg.total;
  const totalImprovement = calculateImprovement(baselineAvg.total, optimizedAvg.total);

  if (totalSaved > 0) {
    console.log(`${colors.green}✓ Build 속도가 ${Math.abs(totalSaved)}초 (${Math.abs(totalImprovement).toFixed(1)}%) 개선되었습니다!${colors.reset}`);
  } else if (totalSaved < 0) {
    console.log(`${colors.red}✗ Build 속도가 ${Math.abs(totalSaved)}초 (${Math.abs(totalImprovement).toFixed(1)}%) 느려졌습니다.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ Build 속도에 변화가 없습니다.${colors.reset}`);
  }

  console.log(`\n${colors.bright}주요 개선 영역:${colors.reset}`);

  const improvements = [
    { name: 'Setup', saved: setupResult.saved, improvement: setupResult.improvement },
    { name: 'Build', saved: buildResult.saved, improvement: buildResult.improvement },
  ].sort((a, b) => b.saved - a.saved);

  improvements.forEach((item, idx) => {
    if (item.saved > 0) {
      console.log(`  ${idx + 1}. ${item.name}: ${colors.green}${item.saved}s (${Math.abs(item.improvement).toFixed(1)}%)${colors.reset} 개선`);
    } else if (item.saved < 0) {
      console.log(`  ${idx + 1}. ${item.name}: ${colors.red}${Math.abs(item.saved)}s (${Math.abs(item.improvement).toFixed(1)}%)${colors.reset} 저하`);
    }
  });

  console.log('');
}

main();
