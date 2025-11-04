import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Dock } from "@/components/layout/dock";
import { PageLoader } from "@/components/loading/page-loader";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tunibet - Cash Out Before the Crash",
  description: "Tunisia's premier provably fair crash game platform. Play in demo mode or with real money. Multiply your wins up to 100x!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${inter.variable} min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <PageLoader />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#0F172A',
                color: '#F5F5F0',
                border: '1px solid #D4AF37',
              },
            }}
          />
          <main className="flex-1 pb-32">
            {children}
          </main>
          <Dock />
        </AuthProvider>
      </body>
    </html>
  );
}
