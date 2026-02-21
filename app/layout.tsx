import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import AuthProvider from "@/components/providers/SessionProvider";
import { SettingsProvider } from "@/lib/providers/SettingsProvider";
import PWAProvider from "@/components/providers/PWAProvider";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://survey-law-app.vercel.app"),
  title: "측량 법령 조회",
  description: "허용오차·장비기준·성과기준 등 측량 관련 법령 기준을 빠르게 조회하세요. 국가법령정보센터 연동으로 항상 최신 기준 제공.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "측량법령",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: "측량 법령 조회",
    description: "허용오차·장비기준·성과기준 등 측량 관련 법령 기준을 빠르게 조회하세요.",
    siteName: "측량 법령 조회",
    images: [
      {
        url: "/api/icons/512",
        width: 512,
        height: 512,
        alt: "측량 법령 조회",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "측량 법령 조회",
    description: "허용오차·장비기준·성과기준 등 측량 관련 법령 기준을 빠르게 조회하세요.",
    images: ["/api/icons/512"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="light" style={{ colorScheme: "light" }}>
      <body className={`${geist.variable} antialiased bg-gray-50`}>
        <AuthProvider>
          <SettingsProvider>
            <div className="flex flex-col h-screen overflow-hidden">
              <Header />
              <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
              </div>
            </div>
            <PWAProvider />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
