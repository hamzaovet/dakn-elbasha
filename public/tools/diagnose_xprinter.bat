@echo off
chcp 65001 >nul
title فاحص ومصلح طابعة Xprinter — صالونات وسبا الباشا VIP
echo ================================================================
echo  👑 صالونات وسبا وعيادات الباشا VIP — أداة فحص وإصلاح الطابعة 👑
echo ================================================================
echo جاري تشغيل الفحص الذكي بصلاحيات المدير...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0diagnose_xprinter.ps1"
if %errorlevel% neq 0 (
    echo.
    echo حدث خطأ أثناء تشغيل الفحص. اضغط أي مفتاح للخروج...
    pause >nul
)
