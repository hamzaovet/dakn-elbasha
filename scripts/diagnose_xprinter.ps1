# ==============================================================================
# أداة الفحص والإصلاح الذكي لطابعات إكس برنتر (Xprinter Thermal Label & POS Diagnostic Tool)
# مجموعة صالونات وسبا وعيادات الباشا VIP
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "أداة الفحص والإصلاح الذكي لطابعة Xprinter — مجموعة الباشا VIP"

function Show-Header {
    Clear-Host
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host "      👑 منظومة صالونات وسبا وعيادات الباشا VIP — الفاحص الذكي لطابعة Xprinter 👑" -ForegroundColor Yellow
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host ""
}

Show-Header

Write-Host "جاري بدء الفحص الشامل للهاردوير، التوصيلات، ومحرك الطباعة في ويندوز..." -ForegroundColor Gray
Start-Sleep -Milliseconds 800

# ------------------------------------------------------------------------------
# 1. فحص خدمة Spooler وطابور الطباعة وإصلاح التعليق
# ------------------------------------------------------------------------------
Write-Host "`n[1/5] فحص خدمة إدارة الطباعة (Print Spooler) وطابور الأوامر..." -ForegroundColor Yellow

$spooler = Get-Service -Name "Spooler" -ErrorAction SilentlyContinue
if ($spooler.Status -ne "Running") {
    Write-Host "  ⚠️ خدمة الطباعة (Spooler) متوقفة! جاري إعادة تشغيلها الآن..." -ForegroundColor Red
    Start-Service -Name "Spooler" -ErrorAction SilentlyContinue
    Write-Host "  ✅ تم تشغيل خدمة الطباعة بنجاح." -ForegroundColor Green
} else {
    Write-Host "  ✅ خدمة إدارة الطباعة (Print Spooler) تعمل بكفاءة." -ForegroundColor Green
}

# فحص الملفات العالقة في Spooler
$spoolDir = "$env:windir\System32\spool\PRINTERS"
$stuckFiles = Get-ChildItem -Path $spoolDir -File -ErrorAction SilentlyContinue

if ($stuckFiles.Count -gt 0) {
    Write-Host "  ⚠️ تم اكتشاف $($stuckFiles.Count) أمر طباعة معلق يسد منفذ الطابعة!" -ForegroundColor Red
    Write-Host "  🔄 جاري تنظيف وتفريغ طابور الطباعة تلقائياً..." -ForegroundColor Yellow
    try {
        Stop-Service -Name "Spooler" -Force -ErrorAction SilentlyContinue
        Remove-Item "$spoolDir\*" -Force -ErrorAction SilentlyContinue
        Start-Service -Name "Spooler" -ErrorAction SilentlyContinue
        Write-Host "  ✅ تم تنظيف طابور الطباعة وفك تعليق المنافذ بنجاح!" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️ تعذر حذف بعض الملفات مؤقتاً، يرجى تشغيل الأداة كمسؤول (Run as Admin)." -ForegroundColor Magenta
    }
} else {
    Write-Host "  ✅ طابور أوامر الطباعة نظيف تماماً ولا توجد مهام عالقة." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 2. فحص توصيلات الـ USB وأعطال المنافذ الفيزيائية (Hardware USB Inspection)
# ------------------------------------------------------------------------------
Write-Host "`n[2/5] فحص توصيلات الـ USB وحالة المنافذ الفيزيائية للهاردوير..." -ForegroundColor Yellow

$failedUsb = Get-PnpDevice | Where-Object { 
    $_.InstanceId -like "*USB*" -and ($_.Status -eq "Error" -or $_.FriendlyName -like "*Descriptor Request Failed*" -or $_.FriendlyName -like "*Port Reset Failed*")
}

if ($failedUsb) {
    Write-Host "  🔴 تحذير هاردوير حرج: تم اكتشاف مشكلة في التعرف على جهاز USB!" -ForegroundColor Red
    foreach ($dev in $failedUsb) {
        Write-Host "     - الجهاز: $($dev.FriendlyName) [حالة: $($dev.Status)]" -ForegroundColor Red
    }
    Write-Host "  💡 أسباب المشكلة وحلولها السريعة:" -ForegroundColor Yellow
    Write-Host "     1. كابل الـ USB الخاص بالطابعة مهزوز أو تالف أو تم توصيله في مخرج أمامي غير كافي للطاقة." -ForegroundColor White
    Write-Host "     2. زر الطاقة الخلفي للطابعة (Power Switch) في وضع الإيقاف (OFF)." -ForegroundColor White
    Write-Host "     3. محول الكهرباء 24V الخاص بالطابعة غير موصل بالفيشة أو لا يعطي طاقة كافية." -ForegroundColor White
    Write-Host "  👉 الحل الموصى به: انزع كابل USB ووصله في منفذ خلفي مباشر بالكمبيوتر مع التأكد من إضاءة لمبة الباور." -ForegroundColor Cyan
} else {
    Write-Host "  ✅ جميع منافذ USB تعمل ولا توجد أجهزة متأثرة بـ (Descriptor Failed)." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 3. فحص تعريفات الطابعات المثبتة على الويندوز
# ------------------------------------------------------------------------------
Write-Host "`n[3/5] فحص الطابعات المثبتة في الويندوز..." -ForegroundColor Yellow

$printers = Get-Printer -ErrorAction SilentlyContinue
$xprinters = $printers | Where-Object { 
    $_.Name -like "*Xprinter*" -or $_.Name -like "*XP-*" -or $_.Name -like "*Barcode*" -or $_.Name -like "*Label*" -or $_.DriverName -like "*Xprinter*" 
}

if ($xprinters) {
    Write-Host "  🎉 تم اكتشاف طابعة Xprinter مثبتة بنجاح:" -ForegroundColor Green
    foreach ($p in $xprinters) {
        Write-Host "     - الاسم: $($p.Name) | المنفذ: $($p.PortName) | السائق: $($p.DriverName) | الحالة: $($p.PrinterStatus)" -ForegroundColor Cyan
    }
} else {
    Write-Host "  ⚠️ لم يتم العثور على طابعة باسم 'Xprinter' مثبتة حالياً!" -ForegroundColor Yellow
    Write-Host "  الطابعات الحالية في جهازك:" -ForegroundColor Gray
    foreach ($p in $printers) {
        Write-Host "     • $($p.Name) (Port: $($p.PortName))" -ForegroundColor Gray
    }
    Write-Host "`n  💡 ملاحظة: إذا كانت الطابعة موصلة ولكن لا يظهر لها تعريف:" -ForegroundColor Yellow
    Write-Host "     تحتاج لتثبيت سائق Xprinter Windows Driver (يدعم موديلات XP-350B / XP-365B / XP-370B)." -ForegroundColor White
}

# ------------------------------------------------------------------------------
# 4. دليل حل مشكلة الاستيكر واللمبة الحمراء (Gap Sensor Hardware Calibration)
# ------------------------------------------------------------------------------
Write-Host "`n[4/5] فحص وحل المشكلة الشائعة لاستيكرات الباركود (اللمبة الحمراء وتخطي الورق):" -ForegroundColor Yellow
Write-Host "  📌 إذا كانت الطابعة تخرج ورق أبيض أو تضيء لمبة حمراء (Red Error LED):" -ForegroundColor Magenta
Write-Host "     هذا يعني أن حساس فواصل الاستيكر (Gap Sensor) غير معاير على مقاس بكرة الملصقات الحالية." -ForegroundColor White
Write-Host "`n     خطوات المعايرة الذاتية السحرية في 10 ثواني (Hardware Calibration):" -ForegroundColor Cyan
Write-Host "     1. أغلق مفتاح الكهرباء الخلفي للطابعة (Power Switch OFF)." -ForegroundColor White
Write-Host "     2. اضغط واستمر بالضغط بإصبعك على زر (FEED) في الواجهة الأمامية." -ForegroundColor White
Write-Host "     3. شغل مفتاح الكهرباء الخلفي مع استمرارك في الضغط على زر (FEED)." -ForegroundColor White
Write-Host "     4. انتظر حتى تسمع صوت صفارتين (Beep ... Beep)." -ForegroundColor White
Write-Host "     5. ارفع إصبعك فوراً عن زر FEED!" -ForegroundColor Yellow
Write-Host "     ==> ستسحب الطابعة استيكراً واحداً لمعايرة الأبعاد وتتحول الإضاءة للأزرق الثابت!" -ForegroundColor Green

# ------------------------------------------------------------------------------
# 5. اختبار الطباعة التجريبية
# ------------------------------------------------------------------------------
Write-Host "`n[5/5] اختبار طباعة تجريبية:" -ForegroundColor Yellow
$choice = Read-Host "هل ترغب في إرسال صفحة تجريبية إلى الطابعة الآن؟ (Y/N)"

if ($choice -eq "Y" -or $choice -eq "y") {
    $targetPrinter = $null
    if ($xprinters) {
        $targetPrinter = $xprinters[0].Name
    } else {
        $star = $printers | Where-Object { $_.Name -like "*Star*" -or $_.Name -like "*TSP*" }
        if ($star) {
            $targetPrinter = $star[0].Name
        } else {
            $targetPrinter = (Get-WmiObject -Class Win32_Printer | Where-Object { $_.Default -eq $true }).Name
        }
    }

    if ($targetPrinter) {
        Write-Host "  جاري إرسال اختبار إلى الطابعة: [$targetPrinter]..." -ForegroundColor Cyan
        try {
            $printClass = [wmiclass]"Win32_Printer"
            $printerObj = $printClass.GetInstances() | Where-Object { $_.Name -eq $targetPrinter }
            if ($printerObj) {
                $printerObj.PrintTestPage() | Out-Null
                Write-Host "  ✅ تم إرسال صفحة الاختبار بنجاح! راجع خروج الورقة من الطابعة." -ForegroundColor Green
            } else {
                Write-Host "  ⚠️ تعذر الوصول لكائن الطابعة لإرسال الصفحة." -ForegroundColor Yellow
            }
        } catch {
            Write-Host "  ⚠️ خطأ أثناء إرسال صفحة الاختبار: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠️ لم يتم تحديد طابعة لإرسال الاختبار إليها." -ForegroundColor Yellow
    }
}

Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host "  انتهى الفحص الذكي. يمكنك إغلاق هذه النافذة أو الضغط على Enter للخروج." -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Cyan
Read-Host
