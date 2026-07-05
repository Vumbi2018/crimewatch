# Workspace Customization Rules: Deployment and APK Build SOP

Always follow this Standard Operating Procedure (SOP) when building APKs or deploying updates to the VPS.

---

## 1. Local APK Compilation SOP

To compile both Citizen and Officer App APKs locally using Gradle, use the pre-configured automation script inside the project directory:

```powershell
cd Citizen-Witness
.\scripts\compile-apks.ps1
```

If running manually in PowerShell:
```powershell
# For Citizen flavor
$env:APP_MODE="citizen"
npx expo prebuild --platform android --clean
cd android && .\gradlew.bat assembleRelease && cd ..

# For Officer flavor (Stop daemon to clear env caching)
cd android && .\gradlew.bat --stop && cd ..
Rename-Item -Path android -NewName "android_old_$(Get-Date -Format 'yyyyMMddHHmmss')"
$env:APP_MODE="officer"
npx expo prebuild --platform android --clean
cd android && .\gradlew.bat assembleRelease && cd ..
```

---

## 2. VPS Deployment SOP (Non-Destructive)

To deploy updates to the production Hostinger VPS:

1. **Target Directory**: The application is located at `/var/www/crimewatch` on the VPS. Always `cd` there first:
   ```bash
   cd /var/www/crimewatch
   ```

2. **Git Update**:
   ```bash
   git fetch origin
   git checkout fix/admin-and-mobile-fixes
   git pull origin fix/admin-and-mobile-fixes
   ```

3. **Install Dependencies**: Always use `--legacy-peer-deps` to bypass React 19 / react-native peer conflicts:
   ```bash
   npm install --legacy-peer-deps
   ```

4. **Build client static files**: You MUST prefix this build with the `EXPO_PUBLIC_DOMAIN` environment variable so the build script registers the production domain:
   ```bash
   EXPO_PUBLIC_DOMAIN=crimewatch.lamtoninvestments.com npm run expo:static:build
   ```

5. **Build server bundle**:
   ```bash
   npm run server:build
   ```

6. **Sync database schema**: Apply additive and safe Drizzle schema updates:
   ```bash
   npm run db:push
   ```

7. **Targeted Process Restart (DO NOT TOUCH OTHER APPS)**:
   Never run `pm2 restart all` or touch other applications. Restart only the `crimewatch` process (ID `3`):
   ```bash
   pm2 restart crimewatch
   pm2 save
   ```
