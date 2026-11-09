import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

async function uploadToImgBB(filePath: string): Promise<string | null> {
  const apiKey = "1705736b8f2b46dcbaeec8a6025aca83";
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString("base64");

  const body = new URLSearchParams();
  body.append("image", base64);

  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body,
    });
    const data = await res.json();
    if (data.success && data.data?.url) {
      console.log(`Uploaded ${path.basename(filePath)} => ${data.data.url}`);
      return data.data.url;
    } else {
      console.error(`ImgBB failed for ${filePath}:`, data);
      return null;
    }
  } catch (e) {
    console.error(`Error uploading ${filePath}:`, e);
    return null;
  }
}

async function main() {
  console.log("Uploading services images to ImgBB and linking to DB...");

  const mappings = [
    {
      keyword: "باديكير",
      file: "public/services/service-pedicure.jpg",
      localUrl: "/services/service-pedicure.jpg",
    },
    {
      keyword: "تنظيف",
      file: "public/services/service-facial.webp",
      localUrl: "/services/service-facial.webp",
    },
    {
      keyword: "أطفال",
      file: "public/services/service-kids.jpg",
      localUrl: "/services/service-kids.jpg",
    },
    {
      keyword: "سيشوار",
      file: "public/services/service-styling.webp",
      localUrl: "/services/service-styling.webp",
    },
    {
      keyword: "صبغة",
      file: "public/services/service-color.jpg",
      localUrl: "/services/service-color.jpg",
    },
    {
      keyword: "بروتين",
      file: "public/services/service-protein.jpg",
      localUrl: "/services/service-protein.jpg",
    },
  ];

  for (const item of mappings) {
    let finalUrl = item.localUrl;
    const imgbbUrl = await uploadToImgBB(item.file);
    if (imgbbUrl) {
      finalUrl = imgbbUrl;
    }

    const srv = await prisma.service.findFirst({
      where: {
        nameAr: { contains: item.keyword },
      },
    });

    if (srv) {
      await prisma.service.update({
        where: { id: srv.id },
        data: { image: finalUrl },
      });
      console.log(`Updated service "${srv.nameAr}" with image: ${finalUrl}`);
    } else {
      console.log(`Service with keyword "${item.keyword}" not found`);
    }
  }

  console.log("All service images updated!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
