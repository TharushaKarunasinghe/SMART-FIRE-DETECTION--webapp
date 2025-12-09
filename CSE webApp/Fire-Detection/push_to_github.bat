@echo off
echo ========================================
echo Smart Fire Detection System
echo GitHub Push Script
echo ========================================
echo.

REM Navigate to project directory
cd /d "%~dp0"

echo [1/8] Configuring Git user...
git config --global user.name "rumethnadawa"
git config --global user.email "rumethnadawa@example.com"

echo [2/8] Initializing Git repository...
git init

echo [3/8] Adding files to staging...
git add .

echo [4/8] Checking status...
git status

echo [5/8] Creating first commit...
git commit -m "Initial commit: Smart Fire Detection System with ML, Firebase, and ThingSpeak integration"

echo [6/8] Setting main branch...
git branch -M main

echo [7/8] Adding remote repository...
git remote add origin https://github.com/rumethnadawa/Fire-Detection.git

echo [8/8] Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo Push Complete!
echo Visit: https://github.com/rumethnadawa/Fire-Detection
echo ========================================
pause
