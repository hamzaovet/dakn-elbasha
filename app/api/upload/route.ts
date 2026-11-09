import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const base64Str = formData.get("base64") as string | null;

    const apiKey =
      process.env.IMGBB_API_KEY ||
      process.env.NEXT_PUBLIC_IMGBB_API_KEY ||
      "1705736b8f2b46dcbaeec8a6025aca83";

    let bodyPayload = new URLSearchParams();

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      bodyPayload.append("image", base64);
    } else if (base64Str) {
      // Remove data URL prefix if present
      const cleanBase64 = base64Str.replace(/^data:image\/\w+;base64,/, "");
      bodyPayload.append("image", cleanBase64);
    } else {
      return NextResponse.json({ success: false, error: "لم يتم إرسال أي صورة" }, { status: 400 });
    }

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: bodyPayload,
    });

    const data = await imgbbRes.json();
    if (data.success && data.data?.url) {
      return NextResponse.json({
        success: true,
        url: data.data.url,
        displayUrl: data.data.display_url || data.data.url,
        thumbUrl: data.data.thumb?.url || data.data.url,
      });
    } else {
      return NextResponse.json(
        { success: false, error: data.error?.message || "فشل رفع الصورة على ImgBB" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("ImgBB Upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "حدث خطأ أثناء رفع الصورة" },
      { status: 500 }
    );
  }
}
