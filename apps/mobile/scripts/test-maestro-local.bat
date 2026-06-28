@echo off
REM Local Maestro E2E Test Runner for Windows
REM Usage: scripts\test-maestro-local.bat [auth|nurse|family|admin|all]

setlocal enabledelayedexpansion

set SHARD=%1
if "%SHARD%"=="" set SHARD=auth

set APP_ID=com.hanapkalinga.mobile
set ENV=staging
set TEST_PASSWORD=TestPass123!

REM ------------------------------------------------------------------
REM Seed test data if Supabase credentials are configured
REM ------------------------------------------------------------------
if not "%SUPABASE_URL%"=="" if not "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo.
    echo ^>^> Seeding E2E test data...
    echo.
    PowerShell -Command "& node '%~dp0seed-e2e.mjs' 2>&1" > "%TEMP%\maestro-seed-output.txt"
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo WARNING: Seed script failed. Check "%TEMP%\maestro-seed-output.txt" for details.
        echo Falling back to defaults (tests may fail if accounts don't exist).
        echo.
    ) else (
        for /f "usebackq tokens=1,* delims==" %%a in (`findstr /r "^[A-Z_][A-Z_]*=" "%TEMP%\maestro-seed-output.txt"`) do (
            if "%%a"=="FAMILY_EMAIL" set FAMILY_EMAIL=%%b
            if "%%a"=="NURSE_EMAIL" set NURSE_EMAIL=%%b
            if "%%a"=="ADMIN_EMAIL" set ADMIN_EMAIL=%%b
            if "%%a"=="PASSWORD" set TEST_PASSWORD=%%b
            if "%%a"=="BOOKING_ID" set BOOKING_ID=%%b
            if "%%a"=="NURSE_ID" set NURSE_ID=%%b
            if "%%a"=="VERIFICATION_ID" set VERIFICATION_ID=%%b
        )
        echo Seed complete. Using dynamically generated test accounts.
    )
) else (
    echo.
    echo NOTE: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY not set.
    echo To auto-seed test accounts, set these environment variables.
    echo Using default values (tests will fail if accounts don't exist).
    echo.
)

echo.
echo Running Maestro E2E tests for: %SHARD%
echo App ID: %APP_ID%
echo Environment: %ENV%
echo.

set MAESTRO_VERSION=1.39.0

REM Check if maestro is installed
where maestro >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Maestro CLI not found. Installing v%MAESTRO_VERSION%...
    PowerShell -Command "curl -Ls \"https://get.maestro.mobile.dev\" | bash -s -- --version %MAESTRO_VERSION%"
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install Maestro CLI. Please install manually: https://maestro.mobile.dev
        exit /b 1
    )
)

REM Check if emulator is running
adb devices | findstr "emulator" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo No emulator detected. Please start an emulator first.
    exit /b 1
)

echo Device info:
adb shell getprop ro.build.version.release
adb shell getprop ro.product.model
echo.

REM Check if app is installed
adb shell pm list packages | findstr "%APP_ID%" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo App not installed. Please run: npm run android
    exit /b 1
) else (
    echo App is installed
)

REM Pre-warm the app
echo Pre-warming the app...
adb shell am start -n %APP_ID%/.MainActivity
timeout /t 5 /nobreak >nul
adb shell am force-stop %APP_ID%
timeout /t 2 /nobreak >nul

REM Clear app data for clean state
echo Clearing app data...
adb shell pm clear %APP_ID%

echo.
echo Starting Maestro tests...
echo.

REM Determine email and IDs based on shard
if not "%FAMILY_EMAIL%"=="" (
    REM Using seeded values
    if "%SHARD%"=="nurse" (
        set TEST_EMAIL=!NURSE_EMAIL!
    ) else if "%SHARD%"=="admin" (
        set TEST_EMAIL=!ADMIN_EMAIL!
    ) else (
        set TEST_EMAIL=!FAMILY_EMAIL!
    )
) else (
    REM Fallback hardcoded defaults (these may not exist — run seed-e2e.mjs first)
    echo WARNING: Using hardcoded test emails. Run seed-e2e.mjs or set SUPABASE_URL first.
    if "%SHARD%"=="nurse" (
        set TEST_EMAIL=e2e-test-nurse@example.com
    ) else if "%SHARD%"=="admin" (
        set TEST_EMAIL=e2e-test-admin@example.com
    ) else (
        set TEST_EMAIL=e2e-test-family@example.com
    )
)

REM Ensure IDs are set (seed may have been skipped)
if "%BOOKING_ID%"=="" set BOOKING_ID=test-booking-id
if "%NURSE_ID%"=="" set NURSE_ID=test-nurse-id
if "%VERIFICATION_ID%"=="" set VERIFICATION_ID=test-verification-id

REM Run tests
if "%SHARD%"=="all" (
    echo Running all test suites...
    maestro test maestro\ --env APP_ID=%APP_ID% --env ENV=%ENV% --env TEST_EMAIL=%TEST_EMAIL% --env TEST_PASSWORD=%TEST_PASSWORD% --env TEST_EMAIL_PREFIX=e2e-test --env BOOKING_ID=%BOOKING_ID% --env NURSE_ID=%NURSE_ID% --env VERIFICATION_ID=%VERIFICATION_ID%
) else (
    echo Running %SHARD% tests...
    maestro test maestro\%SHARD%\ --env APP_ID=%APP_ID% --env ENV=%ENV% --env TEST_EMAIL=%TEST_EMAIL% --env TEST_PASSWORD=%TEST_PASSWORD% --env TEST_EMAIL_PREFIX=e2e-test --env BOOKING_ID=%BOOKING_ID% --env NURSE_ID=%NURSE_ID% --env VERIFICATION_ID=%VERIFICATION_ID%
)

echo.
echo Tests complete!
