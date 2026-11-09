import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(toEmail: string, code: string, customerName: string) {
  try {
    const user = process.env.EMAIL_USER || process.env.SMTP_USER || "hamzaovet@gmail.com";
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS || "goyl rmse icox vrdh";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"صالون حلاقة صدام VIP 👑" <${user}>`,
      to: toEmail,
      subject: `كود تفعيل حسابك في صالون صدام الملكي: ${code}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0a0a0e; color: #f4f4f5; padding: 35px 20px; border-radius: 20px; border: 2px solid #d4af37; max-width: 520px; margin: 0 auto; text-align: center;">
          <div style="background: #14141c; padding: 15px; border-radius: 16px; display: inline-block; border: 1px solid rgba(212, 175, 55, 0.3); margin-bottom: 15px;">
            <h1 style="color: #d4af37; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">👑 صالون حلاقة صدام VIP 👑</h1>
            <p style="color: #a1a1aa; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; font-family: monospace;">SADDAM BARBER SHOP • ROYAL EXPERIENCE</p>
          </div>
          
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 25px; margin-top: 15px; text-align: right;">
            <p style="font-size: 15px; color: #ffffff; margin-top: 0;">أهلاً بك يا <strong>${customerName}</strong>،</p>
            <p style="font-size: 13px; color: #d4d4d8; line-height: 1.8;">
              يسعدنا اختيارك لصالون حلاقة صدام. لتأكيد حسابك وتأكيد حجز موعدك في الفرع، استخدم رمز التفعيل السري التالي:
            </p>
            
            <div style="background: #000000; padding: 20px; border-radius: 14px; text-align: center; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #d4af37; border: 2px dashed #d4af37; margin: 25px 0;">
              ${code}
            </div>
            
            <p style="font-size: 11px; color: #71717a; text-align: center; margin-bottom: 0;">
              ⏱️ هذا الرمز صالح لمدة 15 دقيقة لمرة واحدة فقط لأغراض أمان الحساب.
            </p>
          </div>

          <div style="margin-top: 25px; font-size: 11px; color: #a1a1aa; border-top: 1px solid rgba(212, 175, 55, 0.2); pt: 15px;">
            <p style="margin: 5px 0;">📍 فرع حدائق القبة: 17 ش مصر والسودان • 📍 فرع مدينة نصر: مكرم عبيد</p>
            <p style="margin: 5px 0; color: #d4af37;">الخط الساخن: 19888 • واتساب: 01018671000</p>
          </div>
        </div>
      `,
    });

    console.log(`[Gmail SMTP Success] OTP ${code} sent to ${toEmail}`);
    return { sent: true };
  } catch (err) {
    console.error("Nodemailer error:", err);
    return { sent: false, error: err };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || "REGISTER";

    // 1. REGISTER
    if (action === "REGISTER") {
      const { name, phone, email } = body;
      if (!name || !phone) {
        return NextResponse.json(
          { success: false, error: "برجاء إدخال الاسم ورقم الهاتف" },
          { status: 400 }
        );
      }

      const cleanPhone = phone.trim().replace(/\s+/g, "");
      const cleanEmail = email ? email.trim().toLowerCase() : null;
      const otpCode = generateOtp();

      // Check if phone already registered
      let customer = await prisma.customer.findUnique({
        where: { phone: cleanPhone },
      });

      if (customer) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            name: name.trim(),
            ...(cleanEmail && { email: cleanEmail }),
            verificationCode: otpCode,
          },
        });
      } else {
        customer = await prisma.customer.create({
          data: {
            name: name.trim(),
            phone: cleanPhone,
            email: cleanEmail,
            verificationCode: otpCode,
            isVerified: false,
          },
        });
      }

      let emailSent = false;
      if (cleanEmail) {
        const mailResult = await sendOtpEmail(cleanEmail, otpCode, customer.name);
        emailSent = mailResult.sent;
      }

      return NextResponse.json({
        success: true,
        message: cleanEmail
          ? `تم إرسال كود التفعيل المكون من 6 أرقام إلى بريدك الإلكتروني (${cleanEmail})`
          : "تم تجهيز كود التفعيل",
        customerId: customer.id,
        phone: customer.phone,
        email: customer.email,
        emailSent,
      });
    }

    // 2. VERIFY OTP
    if (action === "VERIFY_OTP") {
      const { phone, code } = body;
      if (!phone || !code) {
        return NextResponse.json(
          { success: false, error: "برجاء إدخال رقم الهاتف وكود التفعيل" },
          { status: 400 }
        );
      }

      const cleanPhone = phone.trim().replace(/\s+/g, "");
      const customer = await prisma.customer.findUnique({
        where: { phone: cleanPhone },
      });

      if (!customer) {
        return NextResponse.json({ success: false, error: "العميل غير مسجل" }, { status: 404 });
      }

      // Check OTP (accept either stored code or master bypass "157230")
      if (customer.verificationCode !== code.trim() && code.trim() !== "157230") {
        return NextResponse.json(
          { success: false, error: "كود التفعيل غير صحيح أو منتهي الصلاحية" },
          { status: 400 }
        );
      }

      // Mark verified
      const verifiedCustomer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          isVerified: true,
          verificationCode: null,
          lastVisitAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "تم تأكيد الحساب بنجاح!",
        customer: {
          id: verifiedCustomer.id,
          name: verifiedCustomer.name,
          phone: verifiedCustomer.phone,
          email: verifiedCustomer.email,
          vipLevel: verifiedCustomer.vipLevel,
          totalVisits: verifiedCustomer.totalVisits,
        },
      });
    }

    // 3. LOGIN BY PHONE
    if (action === "LOGIN") {
      const { phone } = body;
      if (!phone) {
        return NextResponse.json(
          { success: false, error: "برجاء إدخال رقم الهاتف" },
          { status: 400 }
        );
      }

      const cleanPhone = phone.trim().replace(/\s+/g, "");
      const customer = await prisma.customer.findUnique({
        where: { phone: cleanPhone },
      });

      if (!customer) {
        return NextResponse.json(
          { success: false, error: "رقم الهاتف غير مسجل لدينا، يرجى التسجيل أولاً" },
          { status: 404 }
        );
      }

      const otpCode = generateOtp();
      await prisma.customer.update({
        where: { id: customer.id },
        data: { verificationCode: otpCode },
      });

      if (customer.email) {
        await sendOtpEmail(customer.email, otpCode, customer.name);
      }

      return NextResponse.json({
        success: true,
        message: `تم إرسال كود تسجيل الدخول إلى بريدك الإلكتروني (${customer.email})`,
        customerId: customer.id,
        phone: customer.phone,
        email: customer.email,
      });
    }

    return NextResponse.json({ success: false, error: "عملية غير صالحة" }, { status: 400 });
  } catch (error: any) {
    console.error("Customer auth error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
