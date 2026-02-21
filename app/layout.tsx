import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import AuthProvider from "@/components/providers/SessionProvider";
import { SettingsProvider } from "@/lib/providers/SettingsProvider";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "측량 법령 조회",
  description: "국가법령정보센터 연동 측량 관련 법령 기준 자동 조회 서비스",
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
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
