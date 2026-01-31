#!/bin/bash

# Manual Responsive Testing Script
# Run this while dev server is running at localhost:3000

echo "🧪 Journey Tracker - Manual Responsive Testing"
echo "=============================================="
echo ""
echo "Prerequisites:"
echo "1. Dev server running at http://localhost:3000"
echo "2. Playwright installed"
echo ""

# Kill any existing Playwright processes
pkill -f playwright || true

# Run tests with reuseExistingServer
PWTEST_SKIP_TEST_OUTPUT=1 npx playwright test responsive-design.spec.ts \
  --config=playwright.config.ts \
  --reporter=list \
  --max-failures=5

echo ""
echo "✅ Tests complete! Check results above."
