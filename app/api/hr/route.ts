import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Function to generate unique Application Code (e.g. APP-849201)
async function generateUniqueAppCode(): Promise<string> {
  let unique = false;
  let code = "";
  let attempts = 0;
  while (!unique && attempts < 20) {
    attempts++;
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    code = `APP-${randomDigits}`;
    const existing = await (prisma as any).jobApplication.findUnique({
      where: { code },
    });
    if (!existing) {
      unique = true;
    }
  }
  return code;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // "dossiers", "applications", "all"
    const status = searchParams.get("status");
    const department = searchParams.get("department");
    const branchId = searchParams.get("branchId");
    const search = searchParams.get("search");

    let dossiers: any[] = [];
    let applications: any[] = [];

    // 1. Fetch Dossiers
    if (type === "dossiers" || type === "all") {
      const dossierWhere: any = {};
      if (status && status !== "ALL") dossierWhere.status = status;
      if (department && department !== "ALL") dossierWhere.department = department;
      if (branchId && branchId !== "ALL") dossierWhere.branchId = branchId;
      if (search) {
        dossierWhere.OR = [
          { fullName: { contains: search, mode: "insensitive" } },
          { nationalId: { contains: search } },
          { phone: { contains: search } },
          { jobTitle: { contains: search, mode: "insensitive" } },
        ];
      }

      dossiers = await (prisma as any).staffDossier.findMany({
        where: dossierWhere,
        include: { branch: true },
        orderBy: { createdAt: "desc" },
      });

      // Auto-seed initial dossiers from existing specialists if empty
      if (dossiers.length === 0 && (!search || search === "")) {
        const specialists = await prisma.specialist.findMany({
          include: { branch: true, user: true },
        });

        if (specialists.length > 0) {
          for (const spec of specialists) {
            let dept = "DAKN";
            if (spec.branch?.name?.includes("حمام") || spec.title?.includes("سبا")) dept = "HAMMAM";
            if (spec.branch?.name?.includes("Skin") || spec.title?.includes("بشرة")) dept = "NEWSKIN";

            await (prisma as any).staffDossier.create({
              data: {
                fullName: spec.name,
                nationalId: `29${Math.floor(100000000000 + Math.random() * 899999999999)}`,
                phone: spec.phone || "01000000000",
                jobTitle: spec.title || "خبير حلاقة وتصفيف VIP",
                department: dept,
                branchId: spec.branchId,
                status: spec.isActive ? "ACTIVE" : "ON_LEAVE",
                salary: spec.baseSalary || 6000,
                commissionRate: spec.commissionRate || 20,
                contractType: spec.payType || "FULL_TIME",
                photoUrl: spec.photo || "/dakn-hero.jpg",
                hireDate: new Date(spec.createdAt).toISOString().split("T")[0],
                qualification: "دبلوم فني تصفيف وعناية معتمد",
                address: "القاهرة - مصر",
                healthCertExpiry: "2027-12-31",
                specialistId: spec.id,
                userId: spec.userId,
                notes: "تم استيراد الملف تلقائياً من سجلات كبار خبراء الصالون المعتمدين.",
              },
            });
          }

          dossiers = await (prisma as any).staffDossier.findMany({
            where: dossierWhere,
            include: { branch: true },
            orderBy: { createdAt: "desc" },
          });
        }
      }
    }

    // 2. Fetch Job Applications
    if (type === "applications" || type === "all") {
      const appWhere: any = {};
      if (status && status !== "ALL") appWhere.status = status;
      if (department && department !== "ALL") appWhere.targetDepartment = department;
      if (branchId && branchId !== "ALL") appWhere.targetBranchId = branchId;
      if (search) {
        appWhere.OR = [
          { fullName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { code: { contains: search } },
          { targetJob: { contains: search, mode: "insensitive" } },
        ];
      }

      applications = await (prisma as any).jobApplication.findMany({
        where: appWhere,
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      success: true,
      dossiers,
      applications,
      counts: {
        totalDossiers: dossiers.length,
        activeDossiers: dossiers.filter((d) => d.status === "ACTIVE").length,
        totalApplications: applications.length,
        pendingApplications: applications.filter((a) => a.status === "PENDING").length,
      },
    });
  } catch (error: any) {
    console.error("HR API GET Error:", error);
    return NextResponse.json(
      { error: "فشل تحميل سجلات شؤون العاملين والتوظيف", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Submit Public Job Application
    if (action === "submit_application") {
      const {
        fullName,
        phone,
        nationalId,
        age,
        address,
        targetJob,
        targetDepartment = "ALL",
        targetBranchId,
        experienceYears = 0,
        previousWorkplaces,
        qualification,
        expectedSalary,
        personalPhoto,
        nationalIdUrl,
        cvUrl,
        portfolioUrls,
        notes,
      } = body;

      if (!fullName || !phone || !targetJob) {
        return NextResponse.json(
          { error: "الاسم الكامل، رقم الهاتف، والوظيفة المطلوبة حقول إجبارية" },
          { status: 400 }
        );
      }

      const code = await generateUniqueAppCode();

      const newApp = await (prisma as any).jobApplication.create({
        data: {
          code,
          fullName,
          phone,
          nationalId: nationalId || null,
          age: age ? parseInt(age) : null,
          address: address || null,
          targetJob,
          targetDepartment,
          targetBranchId: targetBranchId || null,
          experienceYears: experienceYears ? parseInt(experienceYears) : 0,
          previousWorkplaces: previousWorkplaces || null,
          qualification: qualification || null,
          expectedSalary: expectedSalary ? parseFloat(expectedSalary) : null,
          personalPhoto: personalPhoto || null,
          nationalIdUrl: nationalIdUrl || null,
          cvUrl: cvUrl || null,
          portfolioUrls: portfolioUrls ? JSON.stringify(portfolioUrls) : null,
          notes: notes || null,
          status: "PENDING",
        },
      });

      return NextResponse.json({
        success: true,
        message: "تم تسجيل طلب التوظيف بنجاح! سيتم التواصل معك قريباً للمقابلة الشخصية 👑",
        code,
        application: newApp,
      });
    }

    // 2. Create Staff Dossier Directly
    if (action === "create_dossier") {
      const {
        fullName,
        nationalId,
        phone,
        phoneSecondary,
        birthDate,
        address,
        gender = "MALE",
        maritalStatus,
        militaryStatus,
        qualification,
        jobTitle,
        department = "DAKN",
        branchId,
        hireDate,
        status = "ACTIVE",
        salary = 0,
        commissionRate = 0,
        contractType = "FULL_TIME",
        photoUrl,
        nationalIdFront,
        nationalIdBack,
        certificates,
        healthCertUrl,
        healthCertExpiry,
        criminalRecordUrl,
        contractDocUrl,
        additionalDocs,
        notes,
      } = body;

      if (!fullName || !phone || !jobTitle) {
        return NextResponse.json(
          { error: "الاسم الكامل، رقم الهاتف، والمسمى الوظيفي حقول إجبارية" },
          { status: 400 }
        );
      }

      const newDossier = await (prisma as any).staffDossier.create({
        data: {
          fullName,
          nationalId: nationalId || null,
          phone,
          phoneSecondary: phoneSecondary || null,
          birthDate: birthDate || null,
          address: address || null,
          gender,
          maritalStatus: maritalStatus || null,
          militaryStatus: militaryStatus || null,
          qualification: qualification || null,
          jobTitle,
          department,
          branchId: branchId || null,
          hireDate: hireDate || new Date().toISOString().split("T")[0],
          status,
          salary: salary ? parseFloat(salary) : 0,
          commissionRate: commissionRate ? parseFloat(commissionRate) : 0,
          contractType,
          photoUrl: photoUrl || null,
          nationalIdFront: nationalIdFront || null,
          nationalIdBack: nationalIdBack || null,
          certificates: certificates ? (typeof certificates === "string" ? certificates : JSON.stringify(certificates)) : null,
          healthCertUrl: healthCertUrl || null,
          healthCertExpiry: healthCertExpiry || null,
          criminalRecordUrl: criminalRecordUrl || null,
          contractDocUrl: contractDocUrl || null,
          additionalDocs: additionalDocs ? (typeof additionalDocs === "string" ? additionalDocs : JSON.stringify(additionalDocs)) : null,
          notes: notes || null,
        },
        include: { branch: true },
      });

      return NextResponse.json({
        success: true,
        message: "تم حفظ ملف الموظف في الأرشيف الرسمي بنجاح 📁",
        dossier: newDossier,
      });
    }

    // 3. One-Click Onboard: Convert Job Application to Staff Dossier
    if (action === "accept_and_onboard") {
      const { applicationId, branchId, salary, commissionRate, hireDate } = body;

      if (!applicationId) {
        return NextResponse.json({ error: "معرف طلب التوظيف مطلوب" }, { status: 400 });
      }

      const app = await (prisma as any).jobApplication.findUnique({
        where: { id: applicationId },
      });

      if (!app) {
        return NextResponse.json({ error: "طلب التوظيف غير موجود" }, { status: 404 });
      }

      // Create Dossier
      const newDossier = await (prisma as any).staffDossier.create({
        data: {
          fullName: app.fullName,
          nationalId: app.nationalId || null,
          phone: app.phone,
          address: app.address || null,
          qualification: app.qualification || null,
          jobTitle: app.targetJob,
          department: app.targetDepartment === "ALL" ? "DAKN" : app.targetDepartment,
          branchId: branchId || app.targetBranchId || null,
          hireDate: hireDate || new Date().toISOString().split("T")[0],
          status: "ACTIVE",
          salary: salary ? parseFloat(salary) : (app.expectedSalary || 5000),
          commissionRate: commissionRate ? parseFloat(commissionRate) : 15,
          photoUrl: app.personalPhoto || null,
          nationalIdFront: app.nationalIdUrl || null,
          certificates: app.cvUrl ? JSON.stringify([{ title: "السيرة الذاتية والمستندات", url: app.cvUrl }]) : null,
          notes: `تم التعيين بناءً على طلب التوظيف رقم (${app.code}). الخبرة السابقة: ${app.previousWorkplaces || "لم تذكر"}`,
        },
        include: { branch: true },
      });

      // Update Application Status
      await (prisma as any).jobApplication.update({
        where: { id: applicationId },
        data: {
          status: "ACCEPTED",
          dossierId: newDossier.id,
          interviewNotes: "تم القبول والتعيين رسمياً في طاقم العمل وتجهيز الملف الأرشيفي.",
        },
      });

      return NextResponse.json({
        success: true,
        message: `تهانينا! تم قبول ${app.fullName} ونقل أوراقه إلى أرشيف طاقم العمل وتعيينه بنجاح 👑`,
        dossier: newDossier,
      });
    }

    // 4. Update Application Status (Interview, Reject, Archive)
    if (action === "update_application_status") {
      const { applicationId, status, interviewDate, interviewNotes } = body;

      if (!applicationId || !status) {
        return NextResponse.json({ error: "بيانات الحالة والطلب مطلوبة" }, { status: 400 });
      }

      const updatedApp = await (prisma as any).jobApplication.update({
        where: { id: applicationId },
        data: {
          status,
          interviewDate: interviewDate || undefined,
          interviewNotes: interviewNotes || undefined,
        },
      });

      return NextResponse.json({
        success: true,
        message: "تم تحديث حالة طلب التوظيف بنجاح 📝",
        application: updatedApp,
      });
    }

    // 5. Update Application Document / Details directly from Admin
    if (action === "update_application_doc") {
      const { id, nationalIdUrl, personalPhoto, cvUrl, notes } = body;
      const updateData: any = {};
      if (nationalIdUrl !== undefined) updateData.nationalIdUrl = nationalIdUrl;
      if (personalPhoto !== undefined) updateData.personalPhoto = personalPhoto;
      if (cvUrl !== undefined) updateData.cvUrl = cvUrl;
      if (notes !== undefined) updateData.notes = notes;

      const updated = await (prisma as any).jobApplication.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: "تم حفظ وتحديث مستندات المتقدم بنجاح ✓",
        application: updated,
      });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error: any) {
    console.error("HR API POST Error:", error);
    return NextResponse.json(
      { error: "فشل تنفيذ العملية", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "معرف الملف مطلوب للتحديث" }, { status: 400 });
    }

    if (updateData.salary !== undefined) updateData.salary = parseFloat(updateData.salary);
    if (updateData.commissionRate !== undefined) updateData.commissionRate = parseFloat(updateData.commissionRate);
    if (updateData.certificates && typeof updateData.certificates !== "string") {
      updateData.certificates = JSON.stringify(updateData.certificates);
    }
    if (updateData.additionalDocs && typeof updateData.additionalDocs !== "string") {
      updateData.additionalDocs = JSON.stringify(updateData.additionalDocs);
    }

    const updatedDossier = await (prisma as any).staffDossier.update({
      where: { id },
      data: updateData,
      include: { branch: true },
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث ملف الموظف في الأرشيف بنجاح 💾",
      dossier: updatedDossier,
    });
  } catch (error: any) {
    console.error("HR API PATCH Error:", error);
    return NextResponse.json(
      { error: "فشل تحديث بيانات الملف", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type") || "dossier"; // "dossier" or "application"

    if (!id) {
      return NextResponse.json({ error: "المعرف مطلوب للحذف" }, { status: 400 });
    }

    if (type === "dossier") {
      await (prisma as any).staffDossier.delete({ where: { id } });
    } else {
      await (prisma as any).jobApplication.delete({ where: { id } });
    }

    return NextResponse.json({
      success: true,
      message: "تم حذف السجل بنجاح 🗑️",
    });
  } catch (error: any) {
    console.error("HR API DELETE Error:", error);
    return NextResponse.json(
      { error: "فشل حذف السجل", details: error.message },
      { status: 500 }
    );
  }
}
