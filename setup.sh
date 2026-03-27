#!/bin/bash

echo ""
echo "================================================================"
echo "   SELENIUM TO PLAYWRIGHT MIGRATION - Setup"
echo "================================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "   ❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

echo "[1/3] Installing dependencies..."
npm install > /dev/null 2>&1
echo "      ✅"

echo ""
echo "[2/3] Creating directories..."
mkdir -p _source-java/pages _source-java/steps _source-java/features
mkdir -p .github/agents
echo "      ✅"

echo ""
echo "[3/3] Copying agents..."
if [ -d "copilot-agents" ]; then
    cp copilot-agents/*.agent.md .github/agents/
    echo "      ✅"
fi

echo ""
echo "================================================================"
echo "   Copy your Java source files:"
echo "================================================================"
echo ""

read -p "Path to PAGES folder (Enter to skip): " PAGES_PATH
if [ -n "$PAGES_PATH" ] && [ -d "$PAGES_PATH" ]; then
    cp -R "$PAGES_PATH"/* _source-java/pages/ 2>/dev/null
    echo "      Copied pages"
fi

read -p "Path to STEPS folder (Enter to skip): " STEPS_PATH
if [ -n "$STEPS_PATH" ] && [ -d "$STEPS_PATH" ]; then
    cp -R "$STEPS_PATH"/* _source-java/steps/ 2>/dev/null
    echo "      Copied steps"
fi

read -p "Path to FEATURES folder (Enter to skip): " FEATURES_PATH
if [ -n "$FEATURES_PATH" ] && [ -d "$FEATURES_PATH" ]; then
    cp -R "$FEATURES_PATH"/* _source-java/features/ 2>/dev/null
    echo "      Copied features"
fi

echo ""
echo "================================================================"
echo "   SETUP COMPLETE"
echo "================================================================"
echo ""
echo "   Next: @pw-orchestrator start"
echo ""
