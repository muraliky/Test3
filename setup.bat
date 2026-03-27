@echo off
SETLOCAL EnableDelayedExpansion

echo.
echo ================================================================
echo    SELENIUM TO PLAYWRIGHT MIGRATION - Setup
echo ================================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo    X Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

echo [1/3] Installing dependencies...
call npm install >nul 2>nul
echo       OK

echo.
echo [2/3] Creating directories...
if not exist "_source-java\pages" mkdir "_source-java\pages"
if not exist "_source-java\steps" mkdir "_source-java\steps"
if not exist "_source-java\features" mkdir "_source-java\features"
if not exist ".github\agents" mkdir ".github\agents"
echo       OK

echo.
echo [3/3] Copying agents...
if exist "copilot-agents" (
    copy /Y copilot-agents\*.agent.md .github\agents\ >nul 2>nul
    echo       OK
)

echo.
echo ================================================================
echo    Copy your Java source files:
echo ================================================================
echo.

set /p PAGES_PATH="Path to PAGES folder (Enter to skip): "
if defined PAGES_PATH if exist "!PAGES_PATH!" (
    xcopy /E /I /Y /Q "!PAGES_PATH!" "_source-java\pages\" >nul
    echo       Copied pages
)

set /p STEPS_PATH="Path to STEPS folder (Enter to skip): "
if defined STEPS_PATH if exist "!STEPS_PATH!" (
    xcopy /E /I /Y /Q "!STEPS_PATH!" "_source-java\steps\" >nul
    echo       Copied steps
)

set /p FEATURES_PATH="Path to FEATURES folder (Enter to skip): "
if defined FEATURES_PATH if exist "!FEATURES_PATH!" (
    xcopy /E /I /Y /Q "!FEATURES_PATH!" "_source-java\features\" >nul
    echo       Copied features
)

echo.
echo ================================================================
echo    SETUP COMPLETE
echo ================================================================
echo.
echo    Next: @pw-orchestrator start
echo.
pause
ENDLOCAL
