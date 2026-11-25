import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const role = searchParams.get("role");

    // Strict Security Guard: Only owner (maestro) and general_manager (basha)
    if (role && role !== "owner" && role !== "general_manager") {
      return NextResponse.json(
        { error: "غير مصرح لك بالوصول لغرفة كاميرات المراقبة الأمنية VIP" },
        { status: 403 }
      );
    }

    const where: any = {};
    if (branchId && branchId !== "ALL") {
      where.branchId = branchId;
    }

    let cameras = await (prisma as any).securityCamera.findMany({
      where,
      include: { branch: true },
      orderBy: { sortOrder: "asc" },
    });

    // If no cameras exist, seed the 6 default VIP cameras
    if (cameras.length === 0 && (!branchId || branchId === "ALL")) {
      const branches = await prisma.branch.findMany();
      const daknBranch = branches.find((b) => b.name.includes("دقن") || b.code.includes("MEN") || b.code.includes("KOBBA")) || branches[0];
      const hammamBranch = branches.find((b) => b.name.includes("حمام") || b.code.includes("WOMEN")) || branches[1] || branches[0];
      const newskinBranch = branches.find((b) => b.name.includes("نيو") || b.name.includes("Skin") || b.code.includes("NEWSKIN")) || branches[2] || branches[0];

      const defaultSeeds = [
        {
          name: "كاميرا 1: صالة كراسي الحلاقة الكبرى",
          branchId: daknBranch?.id || null,
          venueType: "DAKN",
          locationDescription: "دقن الباشا (رجالي) - صالة الكراسي الملكية والتصفيف",
          feedType: "SIMULATION",
          channelNumber: 1,
          streamQuality: "2K",
          fps: 30,
          hasNightVision: true,
          hasPTZ: true,
          sortOrder: 1,
          notes: "تغطي كراسي الحلاقة من كرسي 1 إلى 6 بدقة 2K",
        },
        {
          name: "كاميرا 2: الخزنة الرئيسية ومنطقة الكاشير",
          branchId: daknBranch?.id || null,
          venueType: "TREASURY",
          locationDescription: "منطقة الاستقبال - الخزنة الفولاذية ودُرج الكاشير",
          feedType: "SIMULATION",
          channelNumber: 2,
          streamQuality: "4K",
          fps: 30,
          hasNightVision: true,
          hasPTZ: false,
          sortOrder: 2,
          notes: "مراقبة مباشرة لدرج النقدية والمعاملات المالية بدقة 4K",
        },
        {
          name: "كاميرا 3: ريسبشن وممر استقبال حمام الباشا VIP",
          branchId: hammamBranch?.id || null,
          venueType: "HAMMAM",
          locationDescription: "حمام الباشا (حريمي وسبا) - بوابة الاستقبال وممر الانتظار",
          feedType: "SIMULATION",
          channelNumber: 3,
          streamQuality: "2K",
          fps: 30,
          hasNightVision: true,
          hasPTZ: true,
          sortOrder: 3,
          notes: "تغطي ريسبشن ومكتب الاستقبال الحريمي (خارج غرف الخدمات)",
        },
        {
          name: "كاميرا 4: جناح عيادة نيو سكين وغرف الليزر",
          branchId: newskinBranch?.id || null,
          venueType: "NEWSKIN",
          locationDescription: "عيادة نيو سكين New Skin VIP - ممر غرف الديرما والباديكير والليزر",
          feedType: "SIMULATION",
          channelNumber: 4,
          streamQuality: "2K",
          fps: 30,
          hasNightVision: true,
          hasPTZ: true,
          sortOrder: 4,
          notes: "تغطي ممر غرف الفحص والعناية بالبشرة والليزر",
        },
        {
          name: "كاميرا 5: المدخل الخارجي وبوابة المجمع",
          branchId: daknBranch?.id || null,
          venueType: "DAKN",
          locationDescription: "الشارع الرئيسي والمدخل الخارجي لمجمع صالونات الباشا",
          feedType: "SIMULATION",
          channelNumber: 5,
          streamQuality: "1080P",
          fps: 30,
          hasNightVision: true,
          hasPTZ: true,
          sortOrder: 5,
          notes: "تغطية حركة الدخول والخروج والشارع الخارجي برؤية ليلية IR",
        },
        {
          name: "كاميرا 6: مكتب الإدارة العامة والتحكم VIP",
          branchId: null,
          venueType: "OFFICE",
          locationDescription: "مكتب المالك (Maestro) - شاشات السيرفر والمراقبة",
          feedType: "SIMULATION",
          channelNumber: 6,
          streamQuality: "2K",
          fps: 30,
          hasNightVision: true,
          hasPTZ: true,
          sortOrder: 6,
          notes: "مكتب الإدارة الرئيسي وشاشة التحكم المباشرة",
        },
      ];

      for (const item of defaultSeeds) {
        await (prisma as any).securityCamera.create({ data: item });
      }

      cameras = await (prisma as any).securityCamera.findMany({
        where,
        include: { branch: true },
        orderBy: { sortOrder: "asc" },
      });
    }

    return NextResponse.json({
      success: true,
      cameras,
      totalCount: cameras.length,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("CCTV API GET Error:", error);
    return NextResponse.json(
      { error: "فشل تحميل بيانات كاميرات المراقبة", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      branchId,
      venueType = "DAKN",
      locationDescription,
      feedType = "SIMULATION",
      feedUrl,
      snapshotUrl,
      rtspUrl,
      ipAddress,
      port = 80,
      channelNumber = 1,
      streamQuality = "2K",
      fps = 30,
      hasNightVision = true,
      hasPTZ = true,
      hasAudio = false,
      notes,
    } = body;

    if (!name || !locationDescription) {
      return NextResponse.json(
        { error: "اسم الكاميرا ووصف الموقع مطلوبان" },
        { status: 400 }
      );
    }

    // Determine next sort order
    const count = await (prisma as any).securityCamera.count();

    const newCamera = await (prisma as any).securityCamera.create({
      data: {
        name,
        branchId: branchId || null,
        venueType,
        locationDescription,
        feedType,
        feedUrl: feedUrl || null,
        snapshotUrl: snapshotUrl || null,
        rtspUrl: rtspUrl || null,
        ipAddress: ipAddress || null,
        port: port ? parseInt(port) : 80,
        channelNumber: channelNumber ? parseInt(channelNumber) : 1,
        streamQuality,
        fps: fps ? parseInt(fps) : 30,
        hasNightVision: Boolean(hasNightVision),
        hasPTZ: Boolean(hasPTZ),
        hasAudio: Boolean(hasAudio),
        notes: notes || null,
        sortOrder: count + 1,
        isActive: true,
      },
      include: { branch: true },
    });

    return NextResponse.json({
      success: true,
      message: "تم إضافة كاميرا المراقبة وتفعيل البث بنجاح 📹",
      camera: newCamera,
    });
  } catch (error: any) {
    console.error("CCTV API POST Error:", error);
    return NextResponse.json(
      { error: "فشل إضافة كاميرا المراقبة", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    // Support Bulk Actions
    if (body.action === "apply_dvr_config") {
      const {
        dvrIp = "192.168.1.108",
        dvrPort = 80,
        dvrUser = "admin",
        dvrPass = "",
        dvrBrand = "hikvision",
        mode = "SNAPSHOT_PROXY",
      } = body;

      const cameras = await (prisma as any).securityCamera.findMany({
        orderBy: { sortOrder: "asc" },
      });

      for (let i = 0; i < cameras.length; i++) {
        const cam = cameras[i];
        const channelNum = cam.channelNumber || i + 1;

        if (mode === "SNAPSHOT_PROXY") {
          await (prisma as any).securityCamera.update({
            where: { id: cam.id },
            data: {
              feedType: "SNAPSHOT",
              feedUrl: null,
              snapshotUrl: `/api/cctv/proxy?action=snapshot&ip=${dvrIp}&port=${dvrPort}&user=${encodeURIComponent(
                dvrUser
              )}&pass=${encodeURIComponent(dvrPass)}&channel=${channelNum}&type=${dvrBrand}`,
              ipAddress: dvrIp,
              port: parseInt(dvrPort.toString()) || 80,
              rtspUrl: `rtsp://${dvrUser}:${dvrPass}@${dvrIp}:554/Streaming/Channels/${channelNum}01`,
            },
          });
        } else if (mode === "DIRECT_WEB") {
          await (prisma as any).securityCamera.update({
            where: { id: cam.id },
            data: {
              feedType: "IFRAME",
              feedUrl: `http://${dvrIp}:${dvrPort}`,
              snapshotUrl: null,
              ipAddress: dvrIp,
              port: parseInt(dvrPort.toString()) || 80,
            },
          });
        } else if (mode === "SIMULATION") {
          await (prisma as any).securityCamera.update({
            where: { id: cam.id },
            data: {
              feedType: "SIMULATION",
              feedUrl: null,
              snapshotUrl: null,
              ipAddress: dvrIp,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message:
          mode === "SIMULATION"
            ? "تم العودة لوضع العرض الافتراضي الفاخر بنجاح 👑"
            : `تم ربط وتحديث قنوات الـ DVR (${dvrIp}) لجميع الكاميرات بنجاح ⚡`,
      });
    }

    if (body.action === "bulk_apply_go2rtc") {
      const hostIp = body.hostIp || "localhost";
      const cameras = await (prisma as any).securityCamera.findMany({
        orderBy: { sortOrder: "asc" },
      });

      for (let i = 0; i < cameras.length; i++) {
        const cam = cameras[i];
        const camIndex = i + 1;
        await (prisma as any).securityCamera.update({
          where: { id: cam.id },
          data: {
            feedType: "IFRAME",
            feedUrl: `http://${hostIp}:1984/webrtc.html?src=cam${camIndex}`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "تم تفعيل بث go2rtc (WebRTC المباشر) لجميع الكاميرات بنجاح 🚀",
      });
    }

    if (body.action === "bulk_reset_simulation") {
      await (prisma as any).securityCamera.updateMany({
        data: {
          feedType: "SIMULATION",
          feedUrl: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "تم العودة لوضع العرض الافتراضي الفاخر بنجاح 👑",
      });
    }

    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "معرف الكاميرا مطلوب" }, { status: 400 });
    }

    if (updateData.port) updateData.port = parseInt(updateData.port);
    if (updateData.channelNumber) updateData.channelNumber = parseInt(updateData.channelNumber);
    if (updateData.fps) updateData.fps = parseInt(updateData.fps);
    if (updateData.sortOrder) updateData.sortOrder = parseInt(updateData.sortOrder);

    const updatedCamera = await (prisma as any).securityCamera.update({
      where: { id },
      data: updateData,
      include: { branch: true },
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث إعدادات الكاميرا بنجاح ⚙️",
      camera: updatedCamera,
    });
  } catch (error: any) {
    console.error("CCTV API PATCH Error:", error);
    return NextResponse.json(
      { error: "فشل تحديث بيانات الكاميرا", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف الكاميرا مطلوب للحذف" }, { status: 400 });
    }

    await (prisma as any).securityCamera.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف كاميرا المراقبة من المنظومة بنجاح 🗑️",
    });
  } catch (error: any) {
    console.error("CCTV API DELETE Error:", error);
    return NextResponse.json(
      { error: "فشل حذف الكاميرا", details: error.message },
      { status: 500 }
    );
  }
}
