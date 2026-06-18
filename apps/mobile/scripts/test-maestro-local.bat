@echo off
REM Local Maestro E2E Test Runner for Windows
REM Usage: scripts\test-maestro-local.bat [auth|nurse|family|admin|all]

setlocal enabledelayedexpansion

set SHARD=%1
if "%SHARD%"=="" set SHARD=auth

set APP_ID=com.hanapkalinga.mobile
set ENV=staging
set TEST_PASSWORD=TestPass123!
set BOOKING_ID=test-booking-id
set NURSE_ID=test-nurse-id
set VERIFICATION_ID=test-verification-id

echo.
echo Running Maestro E2E tests for: %SHARD%
echo App ID: %APP_ID%
echo Environment: %ENV%
echo.

REM Check if maestro is installed
where maestro >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Maestro CLI not found. Please install from: https://maestro.mobile.dev
    exit /b 1
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

REM Adjust email based on shard
if "%SHARD%"=="nurse" (
    set TEST_EMAIL=e2e-test-nurse@example.com
) else if "%SHARD%"=="admin" (
    set TEST_EMAIL=e2e-test-admin@example.com
) else (
    set TEST_EMAIL=e2e-test-family@example.com
)

REM Run tests
if "%SHARD%"=="all" (
    echo Running all test suites...
    maestro test maestro\ --env APP_ID=%APP_ID% --env ENV=%ENV% --env TEST_EMAIL=%TEST_EMAIL% --env TEST_PASSWORD=%TEST_PASSWORD% --env BOOKING_ID=%BOOKING_ID% --env NURSE_ID=%NURSE_ID% --env VERIFICATION_ID=%VERIFICATION_ID%
) else (
    echo Running %SHARD% tests...
    maestro test maestro\%SHARD%\ --env APP_ID=%APP_ID% --env ENV=%ENV% --env TEST_EMAIL=%TEST_EMAIL% --env TEST_PASSWORD=%TEST_PASSWORD% --env BOOKING_ID=%BOOKING_ID% --env NURSE_ID=%NURSE_ID% --env VERIFICATION_ID=%VERIFICATION_ID%
)

echo.
echo Tests complete!
