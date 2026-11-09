import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مجموعة صالونات وسبا الباشا VIP | دقن الباشا & حمام الباشا",
  description:
    "مجموعة الباشا VIP: صالون دقن الباشا للحلاقة الرجالية الفاخرة • مركز حمام الباشا للحمام المغربي والسبا والتجميل النسائي بحدائق القبة",
  manifest: "/manifest.json",
  icons: {
    icon: "/dakn-logo.jpg",
    apple: "/dakn-logo.jpg",
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
      </body>
    </html>
  );
}
