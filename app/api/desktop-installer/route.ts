import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "dakn-elbasha.vercel.app";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const cleanOrigin = `${proto}://${host}`.replace(/\/+$/, "");

  const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
$ProgressPreference = 'SilentlyContinue'

$ws = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$programs = [Environment]::GetFolderPath('Programs')

# Find Browser
$browser = ''
$paths = @(
    "$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe",
    "\${env:ProgramFiles(x86)}\\Google\\Chrome\\Application\\chrome.exe",
    "\${env:ProgramFiles(x86)}\\Microsoft\\Edge\\Application\\msedge.exe",
    "$env:ProgramFiles\\Microsoft\\Edge\\Application\\msedge.exe"
)
foreach ($pth in $paths) {
    if (Test-Path $pth) { $browser = $pth; break }
}

$dirApp = Join-Path $env:LOCALAPPDATA "DaknElBashaStandalone"
if (-not (Test-Path $dirApp)) { New-Item -ItemType Directory -Force -Path $dirApp | Out-Null }
$icoApp = Join-Path $dirApp "basha.ico"
try {
    Invoke-WebRequest -Uri "${cleanOrigin}/basha.ico" -OutFile $icoApp -UseBasicParsing -TimeoutSec 5
} catch {
    try { Invoke-WebRequest -Uri "${cleanOrigin}/favicon.ico" -OutFile $icoApp -UseBasicParsing -TimeoutSec 5 } catch {}
}

$apps = @(
    @{ name = "Dakn El Basha VIP.lnk"; url = "${cleanOrigin}/"; desc = "Dakn El Basha VIP Salon & Spa" },
    @{ name = "Dakn El Basha Admin.lnk"; url = "${cleanOrigin}/login"; desc = "Dakn El Basha Admin" },
    @{ name = "Dakn El Basha Coordinator.lnk"; url = "${cleanOrigin}/coordinator"; desc = "Dakn El Basha Coordinator" }
)

foreach ($app in $apps) {
    foreach ($folder in @($desktop, $programs)) {
        $p = Join-Path $folder $app.name
        $sc = $ws.CreateShortcut($p)
        if ($browser) {
            $sc.TargetPath = $browser
            $sc.Arguments = "--app=" + $app.url + " --start-maximized"
        } else {
            $sc.TargetPath = $app.url
        }
        if (Test-Path $icoApp) { $sc.IconLocation = "$icoApp,0" }
        $sc.Description = $app.desc
        $sc.Save()
    }
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "  [OK] تم بنجاح تثبيت صالونات وسبا الباشا VIP على الكمبيوتر!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host ""

if ($browser) {
    Start-Process $browser -ArgumentList ("--app=${cleanOrigin}/ --start-maximized")
}
`;

  const encoded = Buffer.from(psScript, "utf16le").toString("base64");

  const batContent = [
    "@echo off",
    "chcp 65001 >nul",
    "title Dakn El Basha VIP - Desktop Installer",
    "color 0E",
    "cls",
    "echo ==============================================================================",
    "echo           مجموعة صالونات وسبا الباشا VIP (دقن الباشا ^& حمام الباشا)",
    "echo             تثبيت تطبيق سطح المكتب المستقل (Windows Standalone App)",
    "echo ==============================================================================",
    "echo.",
    "echo  جاري تجهيز الأيقونة عالية الدقة وتثبيت التطبيق على سطح المكتب...",
    "echo.",
    `powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`,
    "echo.",
    "echo ==============================================================================",
    "echo        مبروك! تم تثبيت تطبيق الباشا المستقل بنجاح على سطح المكتب.",
    "echo ==============================================================================",
    "echo.",
    "timeout /t 3 >nul",
    "exit /b 0",
  ].join("\r\n");

  return new NextResponse(batContent, {
    headers: {
      "Content-Type": "application/octet-stream; charset=utf-8",
      "Content-Disposition": 'attachment; filename="Install-DaknElBasha.bat"',
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
