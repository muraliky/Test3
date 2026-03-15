@echo off
SETLOCAL EnableDelayedExpansion

echo.
echo ═══════════════════════════════════════════════════════════════
echo     SELENIUM TO PLAYWRIGHT-BDD MIGRATION (Hybrid Approach)
echo ═══════════════════════════════════════════════════════════════
echo.

REM Step 1: Check Node.js
echo [1/4] Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo       X Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo       OK Node.js %%v

REM Step 2: Install dependencies
echo.
echo [2/4] Installing dependencies...
call npm install >nul 2>nul
echo       OK Dependencies installed

REM Step 3: Create directories
echo.
echo [3/4] Creating directories...
if not exist "_source-java\pages" mkdir "_source-java\pages"
if not exist "_source-java\steps" mkdir "_source-java\steps"
if not exist "_source-java\features" mkdir "_source-java\features"
if not exist "src\pages" mkdir "src\pages"
if not exist "src\steps" mkdir "src\steps"
if not exist "features" mkdir features
if not exist ".github\agents" mkdir ".github\agents"
echo       OK Directories created

REM Step 4: Copy agents
echo.
echo [4/4] Copying Copilot agents...
if exist "copilot-agents" (
    copy /Y copilot-agents\*.agent.md .github\agents\ >nul 2>nul
    echo       OK Agents copied to .github\agents\
)

REM Copy source files
echo.
echo ═══════════════════════════════════════════════════════════════
echo   Copy your Selenium Java source files
echo ═══════════════════════════════════════════════════════════════
echo.

set "PAGES_PATH="
set /p PAGES_PATH="Path to PAGES folder (or Enter to skip): "
if defined PAGES_PATH (
    if exist "!PAGES_PATH!" (
        xcopy /E /I /Y /Q "!PAGES_PATH!" "_source-java\pages\" >nul 2>nul
        for /f %%a in ('dir /b /s "_source-java\pages\*.java" 2^>nul ^| find /c /v ""') do echo       OK Copied %%a page files
    ) else (
        echo       X Path not found
    )
)

echo.
set "STEPS_PATH="
set /p STEPS_PATH="Path to STEPS folder (or Enter to skip): "
if defined STEPS_PATH (
    if exist "!STEPS_PATH!" (
        xcopy /E /I /Y /Q "!STEPS_PATH!" "_source-java\steps\" >nul 2>nul
        for /f %%a in ('dir /b /s "_source-java\steps\*.java" 2^>nul ^| find /c /v ""') do echo       OK Copied %%a step files
    ) else (
        echo       X Path not found
    )
)

echo.
set "FEATURES_PATH="
set /p FEATURES_PATH="Path to FEATURES folder (or Enter to skip): "
if defined FEATURES_PATH (
    if exist "!FEATURES_PATH!" (
        xcopy /E /I /Y /Q "!FEATURES_PATH!" "_source-java\features\" >nul 2>nul
        for /f %%a in ('dir /b /s "_source-java\features\*.feature" 2^>nul ^| find /c /v ""') do echo       OK Copied %%a feature files
    ) else (
        echo       X Path not found
    )
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo                        SETUP COMPLETE
echo ═══════════════════════════════════════════════════════════════
echo.
echo   WORKFLOW:
echo.
echo   PHASE 1 - Run Node.js migration (creates skeleton):
echo       npm run migrate
echo.
echo   PHASE 2 - Implement methods using Copilot agent:
echo       Open VS Code Copilot Chat (Ctrl+Shift+I)
echo       @pw-implement src/pages/login.page.ts
echo       @pw-implement src/steps/login.steps.ts
echo.
echo   PHASE 3 - Fix failing tests:
echo       npm test
echo       @pw-debug ^<paste error^>
echo.
echo ═══════════════════════════════════════════════════════════════
pause
ENDLOCAL
