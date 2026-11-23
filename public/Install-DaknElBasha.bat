@echo off
chcp 65001 >nul
title تثبيت برنامج صالونات وسبا الباشا VIP للكمبيوتر
color 0E
cls
echo ==============================================================================
echo           مجموعة صالونات وسبا الباشا VIP (دقن الباشا ^& حمام الباشا)
echo             تثبيت تطبيق سطح المكتب المستقل (Windows Standalone App)
echo ==============================================================================
echo.
echo  [1/2] جاري تجهيز الأيقونة الرسمية وتحميلها محلياً...

set "TARGET_URL=https://dakn-elbasha.vercel.app/"
set "ADMIN_URL=https://dakn-elbasha.vercel.app/login"
set "DATA_DIR=%LOCALAPPDATA%\DaknElBashaData"
set "ICO=%DATA_DIR%\basha.ico"

if not exist "%DATA_DIR%" mkdir "%DATA_DIR%" 2>nul
curl -s -L -o "%ICO%" "https://dakn-elbasha.vercel.app/favicon.ico"

:: Find Google Chrome or Microsoft Edge
set "BROWSER="
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

echo.
echo  [2/2] جاري إنشاء أيقونة المنظومة وأيقونة الإدارة على سطح المكتب وقائمة Start...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; ^
   $d = [Environment]::GetFolderPath('Desktop'); ^
   $p = [Environment]::GetFolderPath('Programs'); ^
   $ico = '%ICO%'; ^
   $browser = '%BROWSER%'; ^
   $urlPortal = '%TARGET_URL%'; ^
   $urlAdmin = '%ADMIN_URL%'; ^
   $lnk1 = $ws.CreateShortcut((Join-Path $d 'صالونات وسبا الباشا VIP.lnk')); ^
   if ($browser -and (Test-Path $browser)) { $lnk1.TargetPath = $browser; $lnk1.Arguments = '--app=' + $urlPortal + ' --window-size=1400,900' } else { $lnk1.TargetPath = $urlPortal }; ^
   if (Test-Path $ico) { $lnk1.IconLocation = $ico + ',0' }; ^
   $lnk1.Description = 'صالونات وسبا الباشا VIP - دقن الباشا وحمام الباشا'; ^
   $lnk1.Save(); ^
   $lnk2 = $ws.CreateShortcut((Join-Path $d 'لوحة إدارة صالونات الباشا.lnk')); ^
   if ($browser -and (Test-Path $browser)) { $lnk2.TargetPath = $browser; $lnk2.Arguments = '--app=' + $urlAdmin + ' --window-size=1400,900' } else { $lnk2.TargetPath = $urlAdmin }; ^
   if (Test-Path $ico) { $lnk2.IconLocation = $ico + ',0' }; ^
   $lnk2.Description = 'لوحة إدارة طاقم عمل صالونات وسبا الباشا'; ^
   $lnk2.Save(); ^
   $lnk3 = $ws.CreateShortcut((Join-Path $p 'صالونات وسبا الباشا VIP.lnk')); ^
   if ($browser -and (Test-Path $browser)) { $lnk3.TargetPath = $browser; $lnk3.Arguments = '--app=' + $urlPortal + ' --window-size=1400,900' } else { $lnk3.TargetPath = $urlPortal }; ^
   if (Test-Path $ico) { $lnk3.IconLocation = $ico + ',0' }; ^
   $lnk3.Save(); ^
   Write-Host '  [OK] تم بنجاح إنشاء الأيقونات على سطح المكتب وقائمة البرامج!' -ForegroundColor Green"

echo.
echo ==============================================================================
echo    🎉 مبروك! تم تثبيت تطبيق صالونات وسبا الباشا VIP بنجاح تام على الكمبيوتر.
echo ==============================================================================
echo.
if defined BROWSER (
    start "" "%BROWSER%" --app="%TARGET_URL%"
) else (
    start "" "%TARGET_URL%"
)
pause
exit /b 0
