# Automation script to compile both Citizen and Officer App APKs locally using Gradle

Write-Host "==============================================" -ForegroundColor Green
Write-Host "Compiling Citizen App APK..." -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

# Kill Java locks to release files
taskkill /F /IM java.exe 2>$null

# Stop any running Gradle daemons to clear cached environment variables
if (Test-Path android) {
    cmd /c "cd android && gradlew --stop" 2>$null
}

# Rename existing android folder to bypass Windows EPERM locks
if (Test-Path android) {
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    Rename-Item -Path android -NewName "android_old_$timestamp" -ErrorAction SilentlyContinue
}

# 1. Clean build and prepare Android folder for Citizen Mode
$env:APP_MODE="citizen"
npx expo prebuild --platform android

# 2. Run Gradle Release compilation (bundles JS offline inside APK)
cmd /c "cd android && gradlew assembleRelease"

# 3. Copy the output APK
$citizenApk = "android/app/build/outputs/apk/release/app-release.apk"
if (Test-Path $citizenApk) {
    Copy-Item $citizenApk "outputs/crime-reporting-citizen.apk" -Force
    Write-Host "Citizen APK compiled successfully! Saved to outputs/crime-reporting-citizen.apk" -ForegroundColor Cyan
} else {
    Write-Error "Failed to locate compiled Citizen APK."
    Exit 1
}

Write-Host "==============================================" -ForegroundColor Green
Write-Host "Compiling Officer (Admin) App APK..." -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

# Kill Java locks again
taskkill /F /IM java.exe 2>$null

# Stop the Gradle daemon to force it to pick up APP_MODE=officer
if (Test-Path android) {
    cmd /c "cd android && gradlew --stop" 2>$null
}

# Rename existing android folder again
if (Test-Path android) {
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    Rename-Item -Path android -NewName "android_old_$timestamp" -ErrorAction SilentlyContinue
}

# 4. Clean build and prepare Android folder for Officer Mode
$env:APP_MODE="officer"
npx expo prebuild --platform android

# 5. Run Gradle Release compilation (bundles JS offline inside APK)
cmd /c "cd android && gradlew assembleRelease"

# 6. Copy the output APK
$officerApk = "android/app/build/outputs/apk/release/app-release.apk"
if (Test-Path $officerApk) {
    Copy-Item $officerApk "outputs/crime-reporting-officer.apk" -Force
    Write-Host "Officer APK compiled successfully! Saved to outputs/crime-reporting-officer.apk" -ForegroundColor Cyan
} else {
    Write-Error "Failed to locate compiled Officer APK."
    Exit 1
}

Write-Host "==============================================" -ForegroundColor Green
Write-Host "ALL APKS COMPILED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "Outputs saved in outputs/ directory." -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
