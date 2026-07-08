import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import AuthInitializer from "@/components/AuthInitializer";
import GlobalAIChat from "@/components/GlobalAIChat";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

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
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground font-sans antialiased flex flex-col selection:bg-primary/30 selection:text-primary-foreground relative">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthInitializer>{children}</AuthInitializer>
          <GlobalAIChat />
          <Toaster position="top-center" richColors theme="system" />
        </ThemeProvider>
      </body>
    </html>
  );
}
