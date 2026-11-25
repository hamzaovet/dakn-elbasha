import type { Metadata, Viewport } from "next";
import "./globals.css";
import MobilePwaPrompt from "@/components/MobilePwaPrompt";

export const metadata: Metadata = {
  title: "مجموعة صالونات وسبا وعيادات الباشا VIP | دقن الباشا • حمام الباشا • نيو سكين",
  description:
    "مجموعة الباشا VIP: صالون دقن الباشا للحلاقة الرجالية الفاخرة • مركز حمام الباشا للحمام المغربي والسبا النسائي • عيادات نيو سكين التخصصية",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "الباشا VIP",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900;1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0a0a0e] text-slate-100 antialiased selection:bg-amber-500 selection:text-black font-sans">
        {children}
        <MobilePwaPrompt />
      </body>
    </html>
  );
}
