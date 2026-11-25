import { NextRequest, NextResponse } from "next/server";
import net from "net";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// Check TCP socket connection to DVR IP and Port
function testTcpPort(ip: string, port: number, timeoutMs = 2500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      settled = true;
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(false);
      }
    });

    socket.on("error", () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(false);
      }
    });

    try {
      socket.connect(port, ip);
    } catch {
      resolve(false);
    }
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "ping";
  const ip = searchParams.get("ip") || "192.168.1.108";
  const port = parseInt(searchParams.get("port") || "80");
  const user = searchParams.get("user") || "admin";
  const pass = searchParams.get("pass") || "admin";
  const channel = parseInt(searchParams.get("channel") || "1");
  const type = searchParams.get("type") || "hikvision";

  // 1. PING / TEST CONNECTION ACTION
  if (action === "ping") {
    try {
      // Test common ports: 80 (HTTP Web GUI), 8000 (Hikvision SDK), 554 (RTSP Stream)
      const isHttpOpen = await testTcpPort(ip, port, 2000);
      let isRtspOpen = false;
      let isSdkOpen = false;

      if (!isHttpOpen) {
        // Try port 8000 or 554
        isSdkOpen = await testTcpPort(ip, 8000, 1500);
        isRtspOpen = await testTcpPort(ip, 554, 1500);
      }

      const reachable = isHttpOpen || isSdkOpen || isRtspOpen;

      return NextResponse.json(
        {
          success: true,
          reachable,
          ip,
          checkedPort: port,
          ports: {
            httpWeb: isHttpOpen,
            hikSdk: isSdkOpen,
            rtspStream: isRtspOpen,
          },
          message: reachable
            ? `جهاز الـ DVR متصل ويستجيب بنجاح على الشبكة المحلية (${ip}) 🟢`
            : `لم يتم العثور على استجابة من الـ IP (${ip}). تأكد من أنك متصل بنفس شبكة الواي فاي للصالون وأن الجهاز مضاء 🔴`,
        },
        { headers: corsHeaders }
      );
    } catch (e: any) {
      return NextResponse.json(
        { success: false, reachable: false, error: e.message },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // 2. LIVE SNAPSHOT PROXY (Hikvision / Dahua HTTP Picture API)
  if (action === "snapshot") {
    try {
      let targetUrl = "";
      if (type === "dahua") {
        targetUrl = `http://${ip}:${port}/cgi-bin/snapshot.cgi?channel=${channel}`;
      } else {
        // Hikvision ISAPI snapshot
        targetUrl = `http://${ip}:${port}/ISAPI/Streaming/channels/${channel}01/picture`;
      }

      const authHeader = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(targetUrl, {
        headers: {
          Authorization: authHeader,
          Accept: "image/jpeg, image/*",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `DVR returned HTTP status ${response.status} (${response.statusText})`,
          },
          { status: 502, headers: corsHeaders }
        );
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      const buffer = await response.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          error: "تعذر جلب لقطة الكاميرا المباشرة من الـ DVR",
          details: err.message,
        },
        { status: 504, headers: corsHeaders }
      );
    }
  }

  return NextResponse.json(
    { success: false, error: "إجراء غير معروف" },
    { status: 400, headers: corsHeaders }
  );
}
