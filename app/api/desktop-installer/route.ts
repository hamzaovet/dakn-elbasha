import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "dakn-elbasha.vercel.app";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const cleanOrigin = `${proto}://${host}`.replace(/\/+$/, "");
  const target = req.nextUrl.searchParams.get("target") || "app";

  const isCoordinator = target === "coordinator";
  const isAdmin = target === "admin";
  const urlPath = isCoordinator ? "/coordinator" : isAdmin ? "/login" : "/";
  const title = isCoordinator
    ? "منسق صالة الباشا VIP"
    : isAdmin
    ? "لوحة إدارة صالونات الباشا"
    : "صالونات وسبا الباشا VIP";

  const targetUrl = `${cleanOrigin}${urlPath}`;

  const batContent = [
    "@echo off",
    "chcp 65001 >nul",
    `title تثبيت ${title} على سطح المكتب`,
    "color 0E",
    "cls",
    "echo ==============================================================================",
    `echo          مجموعة صالونات وسبا الباشا VIP - ${title}`,
    "echo             تثبيت تطبيق سطح المكتب المستقل (Windows Standalone App)",
    "echo ==============================================================================",
    "echo.",
    "echo  [1/2] جاري تجهيز الأيقونة الرسمية وتحميلها محلياً...",
    "",
    `set "TARGET_URL=${targetUrl}"`,
    `set "DATA_DIR=%LOCALAPPDATA%\\DaknElBashaData"`,
    `set "ICO=%DATA_DIR%\\basha.ico"`,
    "",
    'if not exist "%DATA_DIR%" mkdir "%DATA_DIR%" 2>nul',
    `curl -s -L -o "%ICO%" "${cleanOrigin}/favicon.ico"`,
    "",
    'set "BROWSER="',
    'if exist "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" (',
    '    set "BROWSER=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"',
    ') else if exist "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" (',
    '    set "BROWSER=C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"',
    ') else if exist "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" (',
    '    set "BROWSER=C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"',
    ') else if exist "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe" (',
    '    set "BROWSER=C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"',
    ")",
    "",
    "echo.",
    `echo  [2/2] جاري إنشاء أيقونة ${title} على سطح المكتب وقائمة البرامج...`,
    "",
    "powershell -NoProfile -ExecutionPolicy Bypass -Command ^",
    '  "$ws = New-Object -ComObject WScript.Shell; ^',
    "   $d = [Environment]::GetFolderPath('Desktop'); ^",
    "   $p = [Environment]::GetFolderPath('Programs'); ^",
    "   $ico = '%ICO%'; ^",
    "   $browser = '%BROWSER%'; ^",
    "   $url = '%TARGET_URL%'; ^",
    `   $lnk1 = $ws.CreateShortcut((Join-Path $d '${title}.lnk')); ^`,
    "   if ($browser -and (Test-Path $browser)) { $lnk1.TargetPath = $browser; $lnk1.Arguments = '--app=' + $url + ' --window-size=1400,900' } else { $lnk1.TargetPath = $url }; ^",
    "   if (Test-Path $ico) { $lnk1.IconLocation = $ico + ',0' }; ^",
    `   $lnk1.Description = '${title}'; ^`,
    "   $lnk1.Save(); ^",
    `   $lnk2 = $ws.CreateShortcut((Join-Path $p '${title}.lnk')); ^`,
    "   if ($browser -and (Test-Path $browser)) { $lnk2.TargetPath = $browser; $lnk2.Arguments = '--app=' + $url + ' --window-size=1400,900' } else { $lnk2.TargetPath = $url }; ^",
    "   if (Test-Path $ico) { $lnk2.IconLocation = $ico + ',0' }; ^",
    "   $lnk2.Save(); ^",
    `   Write-Host '  [OK] تم بنجاح إنشاء أيقونة ${title} على سطح المكتب!' -ForegroundColor Green"`,
    "",
    "echo.",
    "echo ==============================================================================",
    `echo    🎉 مبروك! تم تثبيت ${title} بنجاح تام على الكمبيوتر.`,
    "echo ==============================================================================",
    "echo.",
    "if defined BROWSER (",
    '    start "" "%BROWSER%" --app="%TARGET_URL%"',
    ") else (",
    '    start "" "%TARGET_URL%"',
    ")",
    "pause",
    "exit /b 0",
  ].join("\r\n");

  return new NextResponse(batContent, {
    headers: {
      "Content-Type": "application/octet-stream; charset=utf-8",
      "Content-Disposition": `attachment; filename="Install-${title}.bat"`,
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
