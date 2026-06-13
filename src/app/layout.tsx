import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import AuthInitializer from "@/components/AuthInitializer";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "المكتب الفني لشركة رامون للتشطيبات والمقاولات",
  description: "نظام إدارة حصر وكميات المشاريع والبنود لمكتب رامون الفني",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-[#0d0e12] text-slate-100 font-sans antialiased flex flex-col selection:bg-[#c5a880]/30 selection:text-white">
        <AuthInitializer>{children}</AuthInitializer>
      </body>
    </html>
  );
}
