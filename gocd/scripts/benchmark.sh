#!/bin/bash
set -e

# Benchmark script for GoCD
# Usage: ./benchmark.sh <config_name> <pnpm_cache> <turbo_cache> <s3_remote> <s3_region> <parallel_build>

CONFIG_NAME="${1:-baseline}"
USE_PNPM_CACHE="${2:-false}"
USE_TURBO_CACHE="${3:-false}"
USE_S3_REMOTE="${4:-false}"
S3_REGION="${5:-}"
USE_PARALLEL_BUILD="${6:-false}"

PNPM_VERSION="${PNPM_VERSION:-9.15.0}"
NODE_VERSION="${NODE_VERSION:-22}"

# Unset any Turborepo env vars that might interfere
unset TURBO_CACHE

cd repo

# Disable turbo cache if not using it
if [ "$USE_TURBO_CACHE" != "true" ]; then
  export TURBO_FORCE=true
  rm -rf .turbo node_modules/.cache/turbo 2>/dev/null || true
  echo "Turbo cache disabled (TURBO_FORCE=true)"
fi

START_TIME=$(date +%s%3N)
echo "=== Benchmark: ${CONFIG_NAME} ==="
echo "Start: $(date -u +'%Y-%m-%d %H:%M:%S UTC')"

# Collect runner specs
CPU_CORES=$(nproc)
CPU_MODEL=$(lscpu | grep 'Model name:' | cut -d: -f2 | xargs || echo "unknown")
TOTAL_MEMORY=$(free -h | awk '/^Mem:/ {print $2}')
DISK_SPACE=$(df -h / | awk 'NR==2 {print $4}')

echo "Runner Specs: ${CPU_CORES} cores, ${TOTAL_MEMORY} RAM, ${DISK_SPACE} disk"

# Setup pnpm
PNPM_START=$(date +%s%3N)
corepack enable
corepack prepare pnpm@${PNPM_VERSION} --activate
PNPM_END=$(date +%s%3N)
PNPM_TIME=$(echo "scale=2; ($PNPM_END - $PNPM_START) / 1000" | bc)

# Install dependencies
DEPS_START=$(date +%s%3N)
pnpm install --frozen-lockfile
DEPS_END=$(date +%s%3N)
DEPS_TIME=$(echo "scale=2; ($DEPS_END - $DEPS_START) / 1000" | bc)

# Setup S3 cache if enabled
if [ "$USE_S3_REMOTE" = "true" ] && [ -n "$S3_REGION" ]; then
  CACHE_BUCKET="turbo-cache-${S3_REGION}"
  PORT=8080 \
  AWS_REGION=${S3_REGION} \
  S3_BUCKET=$CACHE_BUCKET \
  node scripts/turbo-s3-cache-server.js > /tmp/cache-server.log 2>&1 &
  CACHE_PID=$!

  sleep 3
  curl -f http://localhost:8080/v8/artifacts/status || (cat /tmp/cache-server.log && exit 1)

  export TURBO_API=http://localhost:8080
  export TURBO_TOKEN=no-token
  export TURBO_TEAM=no-team

  echo "S3 cache server started (PID: $CACHE_PID)"
fi

# Build apps
if [ "$USE_PARALLEL_BUILD" = "true" ]; then
  echo "Running parallel builds..."
  BUILD_START=$(date +%s%3N)

  pnpm run build --filter=@apps/client > /tmp/client.log 2>&1 &
  CLIENT_PID=$!

  pnpm run build --filter=@apps/admin > /tmp/admin.log 2>&1 &
  ADMIN_PID=$!

  pnpm run build --filter=@apps/accounts > /tmp/accounts.log 2>&1 &
  ACCOUNTS_PID=$!

  wait $CLIENT_PID || (cat /tmp/client.log && exit 1)
  wait $ADMIN_PID || (cat /tmp/admin.log && exit 1)
  wait $ACCOUNTS_PID || (cat /tmp/accounts.log && exit 1)

  BUILD_END=$(date +%s%3N)
  CLIENT_TIME=$(echo "scale=2; ($BUILD_END - $BUILD_START) / 1000" | bc)
  ADMIN_TIME=$CLIENT_TIME
  ACCOUNTS_TIME=$CLIENT_TIME
  BUILD_TOTAL=$CLIENT_TIME
else
  echo "Running sequential builds..."

  CLIENT_START=$(date +%s%3N)
  pnpm run build --filter=@apps/client
  CLIENT_END=$(date +%s%3N)
  CLIENT_TIME=$(echo "scale=2; ($CLIENT_END - $CLIENT_START) / 1000" | bc)

  ADMIN_START=$(date +%s%3N)
  pnpm run build --filter=@apps/admin
  ADMIN_END=$(date +%s%3N)
  ADMIN_TIME=$(echo "scale=2; ($ADMIN_END - $ADMIN_START) / 1000" | bc)

  ACCOUNTS_START=$(date +%s%3N)
  pnpm run build --filter=@apps/accounts
  ACCOUNTS_END=$(date +%s%3N)
  ACCOUNTS_TIME=$(echo "scale=2; ($ACCOUNTS_END - $ACCOUNTS_START) / 1000" | bc)

  BUILD_TOTAL=$(echo "scale=2; $CLIENT_TIME + $ADMIN_TIME + $ACCOUNTS_TIME" | bc)
fi

# Stop S3 cache server if running
if [ -n "$CACHE_PID" ]; then
  kill $CACHE_PID 2>/dev/null || true
fi

# Calculate totals
END_TIME=$(date +%s%3N)
TOTAL_TIME=$(echo "scale=2; ($END_TIME - $START_TIME) / 1000" | bc)
SETUP_TOTAL=$(echo "scale=2; $PNPM_TIME + $DEPS_TIME" | bc)

# Save results
mkdir -p benchmark-results
cat > benchmark-results/${CONFIG_NAME}.json << ENDJSON
{
  "benchmark_name": "${CONFIG_NAME}",
  "timestamp": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "configuration": {
    "pnpm_cache": ${USE_PNPM_CACHE},
    "turbo_cache": ${USE_TURBO_CACHE},
    "s3_remote": ${USE_S3_REMOTE},
    "s3_region": "${S3_REGION}",
    "parallel_build": ${USE_PARALLEL_BUILD}
  },
  "runner": {
    "os": "gocd-agent",
    "node_version": "${NODE_VERSION}",
    "pnpm_version": "${PNPM_VERSION}",
    "cpu_cores": "${CPU_CORES}",
    "cpu_model": "${CPU_MODEL}",
    "total_memory": "${TOTAL_MEMORY}",
    "disk_space": "${DISK_SPACE}"
  },
  "timings": {
    "pnpm_setup": ${PNPM_TIME},
    "dependencies": ${DEPS_TIME},
    "setup_total": ${SETUP_TOTAL},
    "client_build": ${CLIENT_TIME},
    "admin_build": ${ADMIN_TIME},
    "accounts_build": ${ACCOUNTS_TIME},
    "build_total": ${BUILD_TOTAL},
    "total": ${TOTAL_TIME}
  },
  "gocd_pipeline_counter": "${GO_PIPELINE_COUNTER:-0}",
  "gocd_stage_counter": "${GO_STAGE_COUNTER:-0}"
}
ENDJSON

echo "=== Results ==="
echo "Setup: ${SETUP_TOTAL}s (pnpm: ${PNPM_TIME}s, deps: ${DEPS_TIME}s)"
echo "Build: ${BUILD_TOTAL}s (client: ${CLIENT_TIME}s, admin: ${ADMIN_TIME}s, accounts: ${ACCOUNTS_TIME}s)"
echo "Total: ${TOTAL_TIME}s"
