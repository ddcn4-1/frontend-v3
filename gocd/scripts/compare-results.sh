#!/bin/bash
set -e

# Compare benchmark results script for GoCD
# Usage: ./compare-results.sh

echo "=== Combining Benchmark Results ==="

# Collect all JSON files
mkdir -p combined
find all-results -name "*.json" -type f -exec cp {} combined/ \;

ls -la combined/

# Get runner specs from first result
FIRST_FILE=$(find combined -name "*.json" -type f | head -1)
CPU_CORES=$(jq -r '.runner.cpu_cores' "$FIRST_FILE")
CPU_MODEL=$(jq -r '.runner.cpu_model' "$FIRST_FILE")
TOTAL_MEM=$(jq -r '.runner.total_memory' "$FIRST_FILE")
DISK_SPACE=$(jq -r '.runner.disk_space' "$FIRST_FILE")

mkdir -p comparison-report

# Generate report header
cat > comparison-report/report.md << ENDREPORT
# GoCD Benchmark Comparison Report

## Environment
- **Runner**: GoCD Agent
- **CPU**: ${CPU_MODEL}
- **CPU Cores**: ${CPU_CORES}
- **Memory**: ${TOTAL_MEM}
- **Disk**: ${DISK_SPACE}
- **Pipeline Counter**: ${GO_PIPELINE_COUNTER:-0}

## Configuration Comparison

| Configuration | Cache Config | Build Mode | Setup | Build | Total |
|---------------|--------------|------------|-------|-------|-------|
ENDREPORT

for file in combined/*.json; do
  NAME=$(jq -r '.benchmark_name' "$file")
  PNPM=$(jq -r '.configuration.pnpm_cache' "$file")
  TURBO=$(jq -r '.configuration.turbo_cache' "$file")
  S3=$(jq -r '.configuration.s3_remote' "$file")
  S3_REGION=$(jq -r '.configuration.s3_region' "$file")
  PARALLEL=$(jq -r '.configuration.parallel_build' "$file")
  SETUP=$(jq -r '.timings.setup_total' "$file")
  BUILD=$(jq -r '.timings.build_total' "$file")
  TOTAL=$(jq -r '.timings.total' "$file")

  CACHE_CONFIG=""
  [ "$PNPM" = "true" ] && CACHE_CONFIG="${CACHE_CONFIG}pnpm "
  [ "$TURBO" = "true" ] && CACHE_CONFIG="${CACHE_CONFIG}turbo "
  if [ "$S3" = "true" ] && [ -n "$S3_REGION" ] && [ "$S3_REGION" != "null" ]; then
    CACHE_CONFIG="${CACHE_CONFIG}S3-${S3_REGION} "
  fi
  [ -z "$CACHE_CONFIG" ] && CACHE_CONFIG="none"

  BUILD_MODE=$( [ "$PARALLEL" = "true" ] && echo "parallel" || echo "sequential" )

  echo "| ${NAME} | ${CACHE_CONFIG} | ${BUILD_MODE} | ${SETUP}s | ${BUILD}s | **${TOTAL}s** |" >> comparison-report/report.md
done

# Find baseline for comparison
BASELINE_FILE=$(find combined -name "baseline.json" -type f | head -1)

if [ -n "$BASELINE_FILE" ]; then
  BASELINE_TOTAL=$(jq -r '.timings.total' "$BASELINE_FILE")

  echo "" >> comparison-report/report.md
  echo "## Performance vs Baseline" >> comparison-report/report.md
  echo "" >> comparison-report/report.md
  echo "| Configuration | Total | Improvement | Time Saved |" >> comparison-report/report.md
  echo "|---------------|-------|-------------|------------|" >> comparison-report/report.md

  for file in combined/*.json; do
    NAME=$(jq -r '.benchmark_name' "$file")
    TOTAL=$(jq -r '.timings.total' "$file")

    if [ "$NAME" = "baseline" ]; then
      echo "| ${NAME} | ${TOTAL}s | - | - |" >> comparison-report/report.md
    else
      IMPROVEMENT=$(echo "scale=1; (($BASELINE_TOTAL - $TOTAL) / $BASELINE_TOTAL) * 100" | bc)
      TIME_SAVED=$(echo "scale=2; $BASELINE_TOTAL - $TOTAL" | bc)
      echo "| ${NAME} | ${TOTAL}s | ${IMPROVEMENT}% | ${TIME_SAVED}s |" >> comparison-report/report.md
    fi
  done

  # Find best configuration
  BEST_TIME=$(find combined -name "*.json" -type f -exec jq -r '.timings.total' {} + | sort -n | head -1)
  BEST_CONFIG=$(find combined -name "*.json" -type f | while read f; do
    if [ "$(jq -r .timings.total "$f")" = "$BEST_TIME" ]; then
      jq -r .benchmark_name "$f"
      break
    fi
  done)

  BEST_IMPROVEMENT=$(echo "scale=1; (($BASELINE_TOTAL - $BEST_TIME) / $BASELINE_TOTAL) * 100" | bc)

  echo "" >> comparison-report/report.md
  echo "## Summary" >> comparison-report/report.md
  echo "" >> comparison-report/report.md
  echo "**Best Configuration**: \`${BEST_CONFIG}\` (${BEST_TIME}s)" >> comparison-report/report.md
  echo "" >> comparison-report/report.md
  echo "**Improvement**: ${BEST_IMPROVEMENT}% faster than baseline" >> comparison-report/report.md

  # S3 region comparison
  APNE2_FILE=$(find combined -name "with-s3-apne2.json" -type f | head -1)
  USEA1_FILE=$(find combined -name "with-s3-usea1.json" -type f | head -1)

  if [ -n "$APNE2_FILE" ] && [ -n "$USEA1_FILE" ]; then
    APNE2_TIME=$(jq -r '.timings.total' "$APNE2_FILE")
    USEA1_TIME=$(jq -r '.timings.total' "$USEA1_FILE")
    REGION_DIFF=$(echo "scale=1; (($USEA1_TIME - $APNE2_TIME) / $APNE2_TIME) * 100" | bc)

    echo "" >> comparison-report/report.md
    echo "### S3 Region Comparison" >> comparison-report/report.md
    echo "" >> comparison-report/report.md
    echo "- **ap-northeast-2**: ${APNE2_TIME}s" >> comparison-report/report.md
    echo "- **us-east-1**: ${USEA1_TIME}s" >> comparison-report/report.md
    echo "- **Difference**: ${REGION_DIFF}%" >> comparison-report/report.md
  fi

  # Visual comparison
  echo "" >> comparison-report/report.md
  echo "### Visual Performance Comparison" >> comparison-report/report.md
  echo "" >> comparison-report/report.md
  echo '```' >> comparison-report/report.md
  echo "Relative Performance (lower is better):" >> comparison-report/report.md
  echo "" >> comparison-report/report.md

  for file in combined/*.json; do
    NAME=$(jq -r '.benchmark_name' "$file")
    TOTAL=$(jq -r '.timings.total' "$file")

    PERCENT=$(echo "scale=2; $TOTAL * 100 / $BASELINE_TOTAL" | bc | cut -d. -f1)
    BAR_LENGTH=$((PERCENT / 2))
    BAR=$(printf '%*s' "$BAR_LENGTH" | tr ' ' '#')

    printf "%-25s %3d%% %s\n" "$NAME" "$PERCENT" "$BAR" >> comparison-report/report.md
  done

  echo '```' >> comparison-report/report.md
fi

# Save combined JSON
cat > comparison-report/summary.json << ENDJSON
{
  "timestamp": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "pipeline_counter": "${GO_PIPELINE_COUNTER:-0}",
  "results": $(find combined -name "*.json" -type f -exec cat {} \; | jq -s '.')
}
ENDJSON

echo "=== Report Generated ==="
cat comparison-report/report.md
