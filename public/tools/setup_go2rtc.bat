@echo off
chcp 65001 >nul
title منظومة الباشا VIP - سيرفر بث كاميرات هيكفيجن (go2rtc)
color 0E

echo ===============================================================================
echo        👑 صالونات وسبا وعيادات الباشا VIP - سيرفر كاميرات هيكفيجن 📹
echo                تحويل بث RTSP إلى WebRTC مباشر وفائق السرعة
echo ===============================================================================
echo.

set "INSTALL_DIR=C:\BashaCCTV"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
cd /d "%INSTALL_DIR%"

echo [1/4] إدخال بيانات جهاز الـ DVR الخاص بك في الصالون:
echo ----------------------------------------------------
set /p "DVR_IP=أدخل عنوان IP جهاز هيكفيجن [اضغط Enter للافتراضي 192.168.1.108]: "
if "%DVR_IP%"=="" set "DVR_IP=192.168.1.108"

set /p "DVR_PASS=أدخل كلمة سر جهاز هيكفيجن (DVR Password): "
if "%DVR_PASS%"=="" (
    echo [!] تنبيه: لم يتم إدخال كلمة سر! سيتم استخدام القيمة الافتراضية 123456
    set "DVR_PASS=123456"
)

echo.
echo [2/4] التحقق من ملف سيرفر البث (go2rtc.exe)...
if not exist "%INSTALL_DIR%\go2rtc.exe" (
    echo [~] جاري تنزيل برنامج go2rtc (حجمه 15 ميجابايت فقط من GitHub)...
    powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $url = 'https://github.com/AlexxIT/go2rtc/releases/latest/download/go2rtc_win64.zip'; $zip = Join-Path '%INSTALL_DIR%' 'go2rtc.zip'; Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing; Expand-Archive -Path $zip -DestinationPath '%INSTALL_DIR%' -Force; Remove-Item $zip -Force"
    if exist "%INSTALL_DIR%\go2rtc.exe" (
        echo [OK] تم تنزيل واستخراج go2rtc.exe بنجاح!
    ) else (
        echo [ERROR] فشل التنزيل التلقائي! تأكد من اتصال الإنترنت.
        pause
        exit /b 1
    )
) else (
    echo [OK] برنامج go2rtc.exe موجود ومكتمل.
)

echo.
echo [3/4] إنشاء ملف الإعدادات الذكي (go2rtc.yaml) لكاميرات الباشا...
(
echo streams:
echo   cam1: rtsp://admin:%DVR_PASS%@%DVR_IP%:554/Streaming/Channels/101
echo   cam2: rtsp://admin:%DVR_PASS%@%DVR_IP%:554/Streaming/Channels/201
echo   cam3: rtsp://admin:%DVR_PASS%@%DVR_IP%:554/Streaming/Channels/301
echo   cam4: rtsp://admin:%DVR_PASS%@%DVR_IP%:554/Streaming/Channels/401
echo   cam5: rtsp://admin:%DVR_PASS%@%DVR_IP%:554/Streaming/Channels/501
echo   cam6: rtsp://admin:%DVR_PASS%@%DVR_IP%:554/Streaming/Channels/601
echo.
echo api:
echo   listen: ":1984"
echo   origin: "*"
echo.
echo webrtc:
echo   listen: ":8555"
) > "%INSTALL_DIR%\go2rtc.yaml"

echo [OK] تم إعداد القنوات الـ 6 لكاميرات هيكفيجن بنجاح!

echo.
echo [4/4] جاري تشغيل سيرفر البث في الخلفية...
taskkill /F /IM go2rtc.exe >nul 2>&1
start "" /min "%INSTALL_DIR%\go2rtc.exe" -config "%INSTALL_DIR%\go2rtc.yaml"

timeout /t 2 >nul

echo ===============================================================================
echo       🎉 مبروك يا معلم! سيرفر البث يعمل الآن بنجاح على المنفذ 1984!
echo ===============================================================================
echo.
echo الروابط المباشرة لكل كاميرا على المتصفح:
echo   الكاميرا 1: http://localhost:1984/webrtc.html?src=cam1
echo   الكاميرا 2: http://localhost:1984/webrtc.html?src=cam2
echo   الكاميرا 3: http://localhost:1984/webrtc.html?src=cam3
echo   الكاميرا 4: http://localhost:1984/webrtc.html?src=cam4
echo   الكاميرا 5: http://localhost:1984/webrtc.html?src=cam5
echo   الكاميرا 6: http://localhost:1984/webrtc.html?src=cam6
echo.
echo جاري فتح لوحة تحكم البث الآن...
start http://localhost:1984
echo.
echo اضغط أي مفتاح للإغلاق (السيرفر سيظل يعمل في الخلفية بهدوء)...
pause >nul
