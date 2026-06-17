import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { ChatWidget } from "@/components/ChatWidget";
import { WriteArticleButton } from "@/components/WriteArticle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mashiro Chat",
  description: "Mashiro Chat — 技术与生活博客",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {user && (
          <div className="fixed bottom-20 right-3 sm:bottom-24 sm:right-6 z-50">
            <WriteArticleButton />
          </div>
        )}
        <ChatWidget
          user={user ? { id: user.id, name: user.name || "User" } : null}
        />
      </body>
    </html>
  );
}
