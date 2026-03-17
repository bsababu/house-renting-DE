import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import ChatWidget from "@/components/chat/ChatWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Housing Germany | Find Your Verified Home",
  description: "Modern, AI-powered housing platform for Germany. Verified listings, automated applications, and scam protection.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HousingDE",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
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
    <html lang="en" style={{ colorScheme: 'light' }}>
      <body className={`${inter.className} antialiased selection:bg-teal-100 selection:text-teal-900`}>
        <AuthProvider>
          <div className="relative min-h-screen flex flex-col">
            <Navbar />
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-teal-500/5 blur-[120px] -z-10 pointer-events-none" />

            <main className="flex-grow">
              {children}
            </main>

            <footer className="py-12 px-6 border-t border-slate-200 text-center text-slate-500 text-sm">
              <p>© {new Date().getFullYear()} Housing Germany Platform. Built with Trust.</p>
            </footer>
          </div>
          <ChatWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
