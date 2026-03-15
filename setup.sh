#!/bin/bash

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "    SELENIUM TO PLAYWRIGHT-BDD MIGRATION (Hybrid Approach)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Step 1: Check Node.js
echo "[1/4] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "      ❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi
echo "      ✅ Node.js $(node -v)"

# Step 2: Install dependencies
echo ""
echo "[2/4] Installing dependencies..."
npm install > /dev/null 2>&1
echo "      ✅ Dependencies installed"

# Step 3: Create directories
echo ""
echo "[3/4] Creating directories..."
mkdir -p _source-java/pages _source-java/steps _source-java/features
mkdir -p src/pages src/steps features
mkdir -p .github/agents
echo "      ✅ Directories created"

# Step 4: Copy agents
echo ""
echo "[4/4] Copying Copilot agents..."
if [ -d "copilot-agents" ]; then
    cp copilot-agents/*.agent.md .github/agents/
    echo "      ✅ Agents copied to .github/agents/"
fi

# Copy source files
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Copy your Selenium Java source files"
echo "═══════════════════════════════════════════════════════════════"
echo ""

read -p "Path to PAGES folder (or Enter to skip): " PAGES_PATH
if [ -n "$PAGES_PATH" ] && [ -d "$PAGES_PATH" ]; then
    cp -R "$PAGES_PATH"/* _source-java/pages/ 2>/dev/null
    COUNT=$(find _source-java/pages -name "*.java" 2>/dev/null | wc -l | tr -d ' ')
    echo "      ✅ Copied $COUNT page files"
fi

echo ""
read -p "Path to STEPS folder (or Enter to skip): " STEPS_PATH
if [ -n "$STEPS_PATH" ] && [ -d "$STEPS_PATH" ]; then
    cp -R "$STEPS_PATH"/* _source-java/steps/ 2>/dev/null
    COUNT=$(find _source-java/steps -name "*.java" 2>/dev/null | wc -l | tr -d ' ')
    echo "      ✅ Copied $COUNT step files"
fi

echo ""
read -p "Path to FEATURES folder (or Enter to skip): " FEATURES_PATH
if [ -n "$FEATURES_PATH" ] && [ -d "$FEATURES_PATH" ]; then
    cp -R "$FEATURES_PATH"/* _source-java/features/ 2>/dev/null
    COUNT=$(find _source-java/features -name "*.feature" 2>/dev/null | wc -l | tr -d ' ')
    echo "      ✅ Copied $COUNT feature files"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                      ✅ SETUP COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  WORKFLOW:"
echo ""
echo "  PHASE 1 - Run Node.js migration (creates skeleton):"
echo "      npm run migrate"
echo ""
echo "  PHASE 2 - Implement methods using Copilot agent:"
echo "      Open VS Code Copilot Chat (Ctrl+Shift+I)"
echo "      @pw-implement src/pages/login.page.ts"
echo "      @pw-implement src/steps/login.steps.ts"
echo ""
echo "  PHASE 3 - Fix failing tests:"
echo "      npm test"
echo "      @pw-debug <paste error>"
echo ""
echo "═══════════════════════════════════════════════════════════════"
