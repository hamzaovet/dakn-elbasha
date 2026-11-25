import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const DRIVER_CATALOG = [
  {
    id: "xprinter",
    name: "تعريف طابعات إكس برنتر الرسمية (Xprinter Official Windows Driver)",
    vendor: "Xprinter Technology / Seagull Scientific",
    version: "v8.0 / 2023.1",
    compatibility: "Windows 7, 8, 10, 11 (32-bit & 64-bit)",
    supportedModels: [
      "XP-80C",
      "XP-N160M",
      "XP-Q800",
      "XP-350B",
      "XP-365B",
      "XP-370B",
      "XP-420B",
      "XP-58IIH",
      "All POS-80 & POS-58 series",
    ],
    recommendedFor: "طابعات الفواتير والبصمة والباركود الحرارية الأكثر انتشاراً في مصر والوطن العربي",
    downloadUrl: "https://seagullscientific.azureedge.net/drivers/seagull/2023-1/Xprinter_2023.1.exe",
    fallbackUrl: "https://xprinter.net/download/XP_Windows_Driver_v8.0.exe",
    instructions: [
      "قم بتنزيل ملف التعريف وتشغيله كمسؤول (Run as Administrator).",
      "اختر موديل الطابعة: (POS-80C) لطابعات الإيصالات مقاس 80 مم، أو (XP-365B) لطابعات الباركود.",
      "حدد نوع المنفذ (Port): اختر USB واضغط على (Check USB Port) ليحدد المنفذ تلقائياً (مثلاً USB001).",
      "فعّل خيار (Set as Default Printer) ثم اضغط Install.",
      "بعد التثبيت، اضغط (Print Test Page) للتأكد من خروج ورقة الاختبار بنجاح.",
    ],
  },
  {
    id: "rongta",
    name: "تعريف طابعات رونجتا الحرارية (Rongta Thermal POS Driver)",
    vendor: "Rongta Technology Co.",
    version: "v7.17",
    compatibility: "Windows 7, 8, 10, 11 (32/64-bit)",
    supportedModels: ["RP326", "RP80", "RP58", "RP328", "Rongta 80mm Series"],
    recommendedFor: "طابعات الكاشير رونجتا الشائعة في الفروع",
    downloadUrl: "http://www.rongtatech.com/upload/driver/Rongta_Receipt_Printer_Driver.exe",
    fallbackUrl: "https://www.rongtatech.com/downloads.html",
    instructions: [
      "شغل ملف التثبيت واختر اللغة English.",
      "حدد طراز الطابعة (POS 80mm Series).",
      "اختر منفذ USB الموصل به الطابعة.",
      "اضغط Install وانتظر ثوانٍ معدودة حتى تكتمل الرسالة بنجاح.",
    ],
  },
  {
    id: "epson",
    name: "تعريف إبسون الرسمي (Epson Advanced Printer Driver APD)",
    vendor: "Seiko Epson Corp.",
    version: "APD v6.04",
    compatibility: "Windows 8, 10, 11 (32/64-bit)",
    supportedModels: ["TM-T20", "TM-T20II", "TM-T20III", "TM-T88V", "TM-T82", "TM-m30"],
    recommendedFor: "طابعات إبسون الأصلية عالية الاعتمادية",
    downloadUrl: "https://download.epson-biz.com/modules/pos/index.php?page=single_soft&cid=7016&scat=31&pcat=3",
    fallbackUrl: "https://epson.com",
    instructions: [
      "قم بتحميل وتثبيت حزمة Epson APD.",
      "اختر موديل TM-T20 أو TM-T88 واختر منفذ USB.",
      "اضغط Next لإنهاء التثبيت وفتح شاشة الخصائص.",
    ],
  },
  {
    id: "zadig",
    name: "أداة زاديج لمعالجة منافذ الـ USB (Zadig USB Virtual COM / WinUSB)",
    vendor: "Akeo Consulting / libusb",
    version: "v2.8",
    compatibility: "Windows 7, 8, 10, 11",
    supportedModels: ["جميع طابعات USB التي لا تظهر في الويندوز أو يظهر عليها رمز تعجب أصفر"],
    recommendedFor: "حل مشاكل (Device Descriptor Request Failed) والمنافذ الافتراضية",
    downloadUrl: "https://github.com/pbatard/libwdi/releases/download/b730/zadig-2.8.exe",
    fallbackUrl: "https://zadig.akeo.ie/",
    instructions: [
      "شغل برنامج Zadig واضغط على قائمة (Options) ثم اختر (List All Devices).",
      "اختر اسم طابعة الكاشير أو جهاز USB غير المعروف من القائمة المنسدلة.",
      "اختر التعريف المستهدف (WinUSB أو USB Serial).",
      "اضغط على (Install Driver) أو (Replace Driver) وانتظر حتى ينتهي.",
    ],
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const shouldDownload = searchParams.get("download") === "true";

  if (type) {
    const driver = DRIVER_CATALOG.find((d) => d.id === type.toLowerCase());
    if (!driver) {
      return NextResponse.json(
        { success: false, error: "نوع التعريف المطلوب غير موجود." },
        { status: 404, headers: corsHeaders }
      );
    }

    if (shouldDownload) {
      // Redirect directly to the official driver binary
      return NextResponse.redirect(driver.downloadUrl, { headers: corsHeaders });
    }

    return NextResponse.json({ success: true, driver }, { headers: corsHeaders });
  }

  return NextResponse.json(
    {
      success: true,
      catalog: DRIVER_CATALOG,
      totalDrivers: DRIVER_CATALOG.length,
      note: "يمكن تنزيل التعريف مباشرة بطلب /api/printer/driver?type=xprinter&download=true",
    },
    { headers: corsHeaders }
  );
}
