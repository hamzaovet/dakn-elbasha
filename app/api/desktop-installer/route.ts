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
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ws = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$programs = [Environment]::GetFolderPath('Programs')

# Find Browser (Chrome or Edge)
$browser = ''
$chrome64 = "$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe"
$chrome32 = "\${env:ProgramFiles(x86)}\\Google\\Chrome\\Application\\chrome.exe"
$edge32 = "\${env:ProgramFiles(x86)}\\Microsoft\\Edge\\Application\\msedge.exe"
$edge64 = "$env:ProgramFiles\\Microsoft\\Edge\\Application\\msedge.exe"

if (Test-Path $chrome64) { $browser = $chrome64 }
elseif (Test-Path $chrome32) { $browser = $chrome32 }
elseif (Test-Path $edge32) { $browser = $edge32 }
elseif (Test-Path $edge64) { $browser = $edge64 }

$dirApp = Join-Path $env:LOCALAPPDATA "DaknElBashaStandalone"
if (-not (Test-Path $dirApp)) { New-Item -ItemType Directory -Force -Path $dirApp | Out-Null }
$icoApp = Join-Path $dirApp "basha.ico"
try {
  Invoke-WebRequest -Uri "${cleanOrigin}/favicon.ico" -OutFile $icoApp -UseBasicParsing -TimeoutSec 5
} catch {}

$apps = @(
  @{ id = "portal"; title = "صالونات وسبا الباشا VIP"; url = "${cleanOrigin}/"; desc = "مجموعة صالونات وسبا الباشا VIP - دقن الباشا وحمام الباشا" },
  @{ id = "admin"; title = "لوحة إدارة صالونات الباشا"; url = "${cleanOrigin}/login"; desc = "لوحة إدارة صالونات وطاقم الباشا" },
  @{ id = "coord"; title = "منسق صالة الباشا VIP"; url = "${cleanOrigin}/coordinator"; desc = "شاشة منسق صالة وحجوزات الباشا" }
)

foreach ($app in $apps) {
  foreach ($folder in @($desktop, $programs)) {
    $tempPath = Join-Path $folder ("temp_" + $app.id + ".lnk")
    $finalPath = Join-Path $folder ($app.title + ".lnk")
    if (Test-Path $tempPath) { Remove-Item -Path $tempPath -Force -ErrorAction SilentlyContinue }
    $lnk = $ws.CreateShortcut($tempPath)
    if ($browser) {
      $lnk.TargetPath = $browser
      $lnk.Arguments = "--app=" + $app.url + " --start-maximized"
    } else {
      $lnk.TargetPath = $app.url
    }
    if (Test-Path $icoApp) { $lnk.IconLocation = "$icoApp,0" }
    $lnk.Description = $app.desc
    $lnk.Save()
    Move-Item -Path $tempPath -Destination $finalPath -Force
  }
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Yellow
Write-Host "  [OK] تم بنجاح تثبيت تطبيق صالونات وسبا الباشا VIP على سطح المكتب وقائمة Start!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Yellow
Write-Host ""

if ($browser) {
  Start-Process $browser -ArgumentList ("--app=${cleanOrigin}/ --start-maximized")
}
`;

  const encoded = Buffer.from(psScript, "utf16le").toString("base64");

  const batContent = [
    "@echo off",
    "chcp 65001 >nul",
    "title صالونات وسبا الباشا VIP",
    "color 0E",
    "cls",
    "echo ==============================================================================",
    "echo             صالونات وسبا الباشا VIP",
    "echo       تثبيت تطبيق سطح المكتب المستقل (Windows Standalone App)",
    "echo ==============================================================================",
    "echo.",
    "echo  جاري إعداد وتحميل الأيقونة وإنشاء الاختصارات على سطح المكتب وقائمة Start...",
    "echo.",
    `powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`,
    "echo.",
    "echo ==============================================================================",
    "echo        مبروك! تم تثبيت التطبيق المستقل بنجاح على سطح المكتب.",
    "echo ==============================================================================",
    "echo.",
    "pause",
  ].join("\r\n");

  return new NextResponse(batContent, {
    headers: {
      "Content-Type": "application/octet-stream; charset=utf-8",
      "Content-Disposition": 'attachment; filename="Install-DaknElBasha.bat"',
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
