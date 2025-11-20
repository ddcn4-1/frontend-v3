#!/bin/bash
# GoCD Agent Setup Script
# Node.js, pnpm 설치 및 환경 설정

set -e

echo "=== GoCD Agent Setup Script ==="

# 1. Node.js 설치 확인
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

# 2. Corepack 활성화
echo "Enabling corepack..."
corepack enable

# 3. pnpm 설치
echo "Installing pnpm 9.15.0..."
corepack prepare pnpm@9.15.0 --activate

# 4. 설치 확인
echo ""
echo "=== Installation Verification ==="
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "pnpm: $(pnpm --version)"

echo ""
echo "=== Setup Complete ==="
