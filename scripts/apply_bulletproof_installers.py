import base64
import os

def create_static_bat(brand_name, apps, base_url, out_path, icon_name, color="0E"):
    ps_lines = [
        "$ErrorActionPreference = 'SilentlyContinue'",
        "$ProgressPreference = 'SilentlyContinue'",
        "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
        "",
        "$ws = New-Object -ComObject WScript.Shell",
        "$desktop = [Environment]::GetFolderPath('Desktop')",
        "$programs = [Environment]::GetFolderPath('Programs')",
        "",
        "# Find Browser",
        "$browser = ''",
        '$chrome64 = "$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe"',
        '$chrome32 = "${env:ProgramFiles(x86)}\\Google\\Chrome\\Application\\chrome.exe"',
        '$edge32 = "${env:ProgramFiles(x86)}\\Microsoft\\Edge\\Application\\msedge.exe"',
        '$edge64 = "$env:ProgramFiles\\Microsoft\\Edge\\Application\\msedge.exe"',
        "",
        "if (Test-Path $chrome64) { $browser = $chrome64 }",
        "elseif (Test-Path $chrome32) { $browser = $chrome32 }",
        "elseif (Test-Path $edge32) { $browser = $edge32 }",
        "elseif (Test-Path $edge64) { $browser = $edge64 }",
        "",
        f'$dirApp = Join-Path $env:LOCALAPPDATA "{brand_name.replace(" ", "")}Standalone"',
        "if (-not (Test-Path $dirApp)) { New-Item -ItemType Directory -Force -Path $dirApp | Out-Null }",
        f'$icoApp = Join-Path $dirApp "{icon_name}"',
        "try {",
        f'  Invoke-WebRequest -Uri "{base_url}/favicon.ico" -OutFile $icoApp -UseBasicParsing -TimeoutSec 5',
        "} catch {}",
        "",
        "$apps = @(",
    ]
    app_lines = []
    for app in apps:
        app_lines.append(f'  @{{ id = "{app["id"]}"; title = "{app["title"]}"; url = "{app["url"]}"; desc = "{app["desc"]}" }}')
    ps_lines.append(",\r\n".join(app_lines))
    ps_lines += [
        ")",
        "",
        "foreach ($app in $apps) {",
        "  foreach ($folder in @($desktop, $programs)) {",
        '    $tempPath = Join-Path $folder ("temp_" + $app.id + ".lnk")',
        '    $finalPath = Join-Path $folder ($app.title + ".lnk")',
        '    if (Test-Path $tempPath) { Remove-Item -Path $tempPath -Force -ErrorAction SilentlyContinue }',
        '    $lnk = $ws.CreateShortcut($tempPath)',
        '    if ($browser) {',
        '      $lnk.TargetPath = $browser',
        '      $lnk.Arguments = "--app=" + $app.url + " --start-maximized"',
        '    } else {',
        '      $lnk.TargetPath = $app.url',
        '    }',
        '    if (Test-Path $icoApp) { $lnk.IconLocation = "$icoApp,0" }',
        '    $lnk.Description = $app.desc',
        '    $lnk.Save()',
        '    Move-Item -Path $tempPath -Destination $finalPath -Force',
        '  }',
        "}",
        "",
        "Write-Host ''",
        "Write-Host '=====================================================' -ForegroundColor Yellow",
        f"Write-Host '  [OK] تم بنجاح تثبيت تطبيق {brand_name} على سطح المكتب وقائمة Start!' -ForegroundColor Green",
        "Write-Host '=====================================================' -ForegroundColor Yellow",
        "Write-Host ''",
        "",
        "if ($browser) {",
        f'  Start-Process $browser -ArgumentList ("--app={base_url}/ --start-maximized")',
        "}",
    ]
    psScript = "\r\n".join(ps_lines)
    encoded = base64.b64encode(psScript.encode("utf-16le")).decode("ascii")

    batContent = f"""@echo off
chcp 65001 >nul
title {brand_name}
color {color}
cls
echo ==============================================================================
echo             {brand_name}
echo       تثبيت تطبيق سطح المكتب المستقل (Windows Standalone App)
echo ==============================================================================
echo.
echo  جاري إعداد وتحميل الأيقونة وإنشاء الاختصارات على سطح المكتب وقائمة Start...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand {encoded}
echo.
echo ==============================================================================
echo        مبروك! تم تثبيت التطبيق المستقل بنجاح على سطح المكتب.
echo ==============================================================================
echo.
pause
"""
    with open(out_path, "wb") as f:
        f.write(batContent.replace("\r\n", "\n").replace("\n", "\r\n").encode("utf-8"))
    print(f"Created: {out_path}")

# 1. Dakn El Basha
create_static_bat(
    brand_name="صالونات وسبا الباشا VIP",
    apps=[
        {"id": "portal", "title": "صالونات وسبا الباشا VIP", "url": "https://dakn-elbasha.vercel.app/", "desc": "مجموعة صالونات وسبا الباشا VIP - دقن الباشا وحمام الباشا"},
        {"id": "admin", "title": "لوحة إدارة صالونات الباشا", "url": "https://dakn-elbasha.vercel.app/login", "desc": "لوحة إدارة صالونات وطاقم الباشا"},
        {"id": "coord", "title": "منسق صالة الباشا VIP", "url": "https://dakn-elbasha.vercel.app/coordinator", "desc": "شاشة منسق صالة وحجوزات الباشا"}
    ],
    base_url="https://dakn-elbasha.vercel.app",
    out_path=r"D:\Work\dakn-elbasha\public\Install-DaknElBasha.bat",
    icon_name="basha.ico",
    color="0E"
)

# 2. Meraya
create_static_bat(
    brand_name="مراية - صالونات الحلاقة والكوافير",
    apps=[
        {"id": "meraya", "title": "تطبيق مراية للصالونات", "url": "https://meraya-six.vercel.app/", "desc": "مراية - صالونات الحلاقة والكوافير"},
        {"id": "admin", "title": "لوحة إدارة مراية", "url": "https://meraya-six.vercel.app/admin", "desc": "لوحة إدارة مراية للصالونات"}
    ],
    base_url="https://meraya-six.vercel.app",
    out_path=r"D:\Work\meraya\public\Install-Meraya.bat",
    icon_name="meraya.ico",
    color="0B"
)
