import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

// CORS headers to permit local loopback from cloud dashboard (e.g. dakn-elbasha.vercel.app -> localhost:3098)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function runPowerShellScript(script: string): Promise<string> {
  const utf16le = Buffer.from(script, "utf16le").toString("base64");
  return new Promise((resolve, reject) => {
    exec(
      `powershell.exe -NoProfile -NonInteractive -EncodedCommand ${utf16le}`,
      { timeout: 12000, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          // Even if there is an error, check if stdout has output
          if (stdout && stdout.trim().length > 0) {
            resolve(stdout);
          } else {
            reject(new Error(stderr || error.message));
          }
        } else {
          resolve(stdout);
        }
      }
    );
  });
}

export async function GET(req: NextRequest) {
  try {
    const isWindows = process.platform === "win32";

    if (!isWindows) {
      return NextResponse.json(
        {
          success: true,
          isCloud: true,
          platform: process.platform,
          message:
            "المنظومة تعمل حالياً من خادم السحابة (Vercel/Linux). للوصول إلى منافذ USB والهاردوير الفيزيائي المحلي، يمكنك تشغيل السيستم من جهاز الكاشير المحلي (http://localhost:3098) أو تجربة بون الاختبار الحراري 80mm المباشر من المتصفح.",
          spooler: { status: "Cloud/N/A", startType: "Cloud", isHealthy: true },
          printers: [],
          jobs: [],
          stuckFilesCount: 0,
          thermalPrinterDetected: false,
          health: {
            score: 90,
            status: "CLOUD_MODE",
            issues: [
              "الخادم سحابي، يتم إرسال أوامر الطباعة عبر نافذة المتصفح المباشرة للـ POS.",
            ],
            tips: [
              "تأكد من اختيار طابعة الإيصالات الحرارية في شاشة الطباعة وحفظها كافتراضية.",
              "اضبط مقاس الورق في المتصفح على 80mm أو Roll Paper والهوامش على None.",
            ],
          },
        },
        { headers: corsHeaders }
      );
    }

    // Windows Native Live Diagnostic Script
    const psScript = `
$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'SilentlyContinue'

# 1. Print Spooler Service
$spooler = Get-Service -Name Spooler
$spoolerStatus = if ($spooler) { $spooler.Status.ToString() } else { "NotFound" }
$spoolerStartType = if ($spooler) { $spooler.StartType.ToString() } else { "Unknown" }

# 2. Installed Printers
$printers = @()
$rawPrinters = Get-CimInstance Win32_Printer
foreach ($p in $rawPrinters) {
    $isThermal = ($p.Name -match '(?i)xprinter|xp-|pos|thermal|receipt|rongta|epson|citizen|star|80mm|58mm|barcode|label') -or ($p.DriverName -match '(?i)xprinter|xp-|pos|thermal|receipt|rongta|epson|citizen|star|80mm|58mm')
    $statusText = "Ready"
    if ($p.WorkOffline) { 
        $statusText = "Offline" 
    } elseif ($p.PrinterStatus -eq 7) { 
        $statusText = "Offline" 
    } elseif ($p.PrinterStatus -eq 4) { 
        $statusText = "Printing" 
    } elseif ($p.PrinterStatus -eq 1 -or $p.PrinterStatus -eq 2) { 
        $statusText = "Unknown" 
    }

    $printers += [PSCustomObject]@{
        name = $p.Name
        portName = $p.PortName
        driverName = $p.DriverName
        isDefault = [bool]$p.Default
        isOffline = [bool]$p.WorkOffline
        statusText = $statusText
        isThermal = [bool]$isThermal
    }
}

# 3. Stuck Print Jobs
$jobs = @()
$rawJobs = Get-CimInstance Win32_PrintJob
foreach ($j in $rawJobs) {
    $jobs += [PSCustomObject]@{
        jobId = $j.JobId
        document = $j.Document
        printerName = $j.Name
        jobStatus = $j.JobStatus
        totalPages = $j.TotalPages
    }
}

# 4. Spool directory stuck files
$spoolDir = "$env:windir\\System32\\spool\\PRINTERS"
$stuckCount = 0
if (Test-Path $spoolDir) {
    $stuckFiles = @(Get-ChildItem -Path $spoolDir -File)
    $stuckCount = $stuckFiles.Count
}

# 5. Connected Devices & Ports (USB, COM, PrintQueue)
$pnpList = @()
$pnp = Get-PnpDevice | Where-Object { ($_.Class -in @('Printer', 'PrintQueue', 'Ports', 'USB')) -and ($_.FriendlyName -match '(?i)print|pos|xprinter|thermal|receipt|serial|com') }
foreach ($d in $pnp) {
    $pnpList += [PSCustomObject]@{
        friendlyName = $d.FriendlyName
        status = $d.Status
        class = $d.Class
        instanceId = $d.InstanceId
    }
}

[PSCustomObject]@{
    spoolerStatus = $spoolerStatus
    spoolerStartType = $spoolerStartType
    printers = $printers
    jobs = $jobs
    stuckFilesCount = $stuckCount
    pnpDevices = $pnpList
} | ConvertTo-Json -Depth 4 -Compress
`;

    const rawOutput = await runPowerShellScript(psScript);
    let parsed: any = {};
    try {
      parsed = JSON.parse(rawOutput.trim());
    } catch {
      // In case extra text was emitted, extract json substring
      const start = rawOutput.indexOf("{");
      const end = rawOutput.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        parsed = JSON.parse(rawOutput.substring(start, end + 1));
      }
    }

    const printers = Array.isArray(parsed.printers) ? parsed.printers : parsed.printers ? [parsed.printers] : [];
    const jobs = Array.isArray(parsed.jobs) ? parsed.jobs : parsed.jobs ? [parsed.jobs] : [];
    const pnpDevices = Array.isArray(parsed.pnpDevices) ? parsed.pnpDevices : parsed.pnpDevices ? [parsed.pnpDevices] : [];
    const spoolerRunning = parsed.spoolerStatus === "Running";
    const stuckCount = Number(parsed.stuckFilesCount || 0) + jobs.length;

    const thermalPrinters = printers.filter((p: any) => p.isThermal);
    const defaultPrinter = printers.find((p: any) => p.isDefault);
    const defaultIsThermal = Boolean(defaultPrinter?.isThermal);

    // Health Evaluation & Diagnostics Score
    let score = 100;
    const issues: string[] = [];
    const tips: string[] = [];

    if (!spoolerRunning) {
      score -= 50;
      issues.push("خدمة إدارة الطباعة (Print Spooler) متوقفة تماماً في الويندوز!");
      tips.push("اضغط على زر (إعادة تشغيل خدمة الطباعة) لإعادة تشغيلها فوراً.");
    }

    if (stuckCount > 0) {
      score -= 25;
      issues.push(`تم اكتشاف ${stuckCount} أمر طباعة معلق يسد منفذ الطابعة في الويندوز.`);
      tips.push("اضغط على زر (تفريغ طابور الطباعة) لمسح الملفات العالقة وفك تعليق المنفذ.");
    }

    if (printers.length === 0) {
      score -= 30;
      issues.push("لم يتم العثور على أي طابعات مثبتة على هذا الجهاز!");
      tips.push("قم بتحميل وتثبيت سائق Xprinter أو الطابعة المتصلة من قسم التعريفات أدناه.");
    } else if (thermalPrinters.length === 0) {
      score -= 15;
      issues.push("لا توجد طابعة إيصالات حرارية (Thermal / POS) معروفة مثبتة حالياً.");
      tips.push("إذا كانت الطابعة موصلة، قم بتثبيت تعريف Xprinter Windows Driver XP-80.");
    } else if (!defaultIsThermal) {
      score -= 10;
      issues.push(`طابعة الويندوز الافتراضية الحالية هي (${defaultPrinter?.name || "غير محددة"}) وليست طابعة إيصالات حرارية.`);
      tips.push(`اضغط على زر (تعيين كافتراضية) بجوار طابعة ${thermalPrinters[0]?.name} لتطبع الفواتير بضغطة واحدة.`);
    }

    let healthStatus: "EXCELLENT" | "WARNING" | "CRITICAL" = "EXCELLENT";
    if (score < 60) healthStatus = "CRITICAL";
    else if (score < 90) healthStatus = "WARNING";

    return NextResponse.json(
      {
        success: true,
        isCloud: false,
        platform: "win32",
        spooler: {
          status: parsed.spoolerStatus || "Unknown",
          startType: parsed.spoolerStartType || "Unknown",
          isHealthy: spoolerRunning,
        },
        printers,
        thermalPrinters,
        defaultPrinter: defaultPrinter || null,
        defaultIsThermal,
        jobs,
        stuckFilesCount: stuckCount,
        pnpDevices,
        health: {
          score: Math.max(0, score),
          status: healthStatus,
          issues,
          tips,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "حدث خطأ أثناء فحص الطابعات",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const isWindows = process.platform === "win32";
    if (!isWindows) {
      return NextResponse.json(
        {
          success: false,
          error: "هذا الإجراء يتطلب الاتصال بالنظام المحلي على الويندوز (http://localhost:3098).",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { action, printerName } = body;

    if (action === "RESTART_SPOOLER") {
      const psScript = `
$ProgressPreference = 'SilentlyContinue'
Restart-Service -Name Spooler -Force
Get-Service -Name Spooler | Select-Object -ExpandProperty Status
`;
      const out = await runPowerShellScript(psScript);
      const isRunning = out.includes("Running");
      return NextResponse.json(
        {
          success: true,
          message: isRunning
            ? "تم إعادة تشغيل خدمة إدارة الطباعة (Print Spooler) بنجاح 🟢"
            : "تم إرسال أمر إعادة التشغيل.",
        },
        { headers: corsHeaders }
      );
    }

    if (action === "CLEAR_QUEUE") {
      const psScript = `
$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'SilentlyContinue'
Stop-Service -Name Spooler -Force
$dir = "$env:windir\\System32\\spool\\PRINTERS"
if (Test-Path $dir) {
    Remove-Item "$dir\\*" -Force -Recurse -ErrorAction SilentlyContinue
}
Start-Service -Name Spooler
Get-CimInstance Win32_PrintJob -ErrorAction SilentlyContinue | Remove-CimInstance -ErrorAction SilentlyContinue
`;
      await runPowerShellScript(psScript);
      return NextResponse.json(
        {
          success: true,
          message: "تم تفريغ طابور الطباعة بالكامل وحذف كافة الملفات والأوامر العالقة بنجاح 🗑️✨",
        },
        { headers: corsHeaders }
      );
    }

    if (action === "SET_DEFAULT") {
      if (!printerName) {
        return NextResponse.json(
          { success: false, error: "اسم الطابعة مطلوب." },
          { status: 400, headers: corsHeaders }
        );
      }

      // Escape single quotes for PowerShell
      const safeName = printerName.replace(/'/g, "''");
      const psScript = `
$ProgressPreference = 'SilentlyContinue'
(Get-CimInstance Win32_Printer -Filter "Name = '$safeName'").SetDefaultPrinter()
`;
      await runPowerShellScript(psScript);
      return NextResponse.json(
        {
          success: true,
          message: `تم تعيين الطابعة [${printerName}] كطابعة افتراضية للويندوز بنجاح ⭐🖨️`,
        },
        { headers: corsHeaders }
      );
    }

    if (action === "WINDOWS_TEST_PAGE") {
      if (!printerName) {
        return NextResponse.json(
          { success: false, error: "اسم الطابعة مطلوب." },
          { status: 400, headers: corsHeaders }
        );
      }

      const safeName = printerName.replace(/'/g, "''");
      const psScript = `
$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'SilentlyContinue'
$printClass = [wmiclass]"Win32_Printer"
$p = $printClass.GetInstances() | Where-Object { $_.Name -eq '$safeName' }
if ($p) {
    $p.PrintTestPage() | Out-Null
    Write-Output "OK"
} else {
    rundll32 printui.dll,PrintUIEntry /k /n "$safeName"
    Write-Output "RUNDLL"
}
`;
      await runPowerShellScript(psScript);
      return NextResponse.json(
        {
          success: true,
          message: `تم إرسال صفحة اختبار ويندوز الأصلية إلى الطابعة [${printerName}] بنجاح! راجع خروج الورقة 📄🖨️`,
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: false, error: "إجراء غير معروف." },
      { status: 400, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "فشل تنفيذ الإجراء",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
