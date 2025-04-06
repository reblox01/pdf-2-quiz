import "./globals.css";
import { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { Geist } from "next/font/google";
import { FaviconHandler } from "./favicon-theme";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://pdf2quiiz.vercel.app"),
  title: "PDF2Quiz - AI-Powered Quiz Generator",
  icons: {
    icon: [
      { url: '/favicon-dark.svg', media: '(prefers-color-scheme: light)' },
      { url: '/favicon-light.svg', media: '(prefers-color-scheme: dark)' },
      { url: '/favicon.ico' }
    ],
  },
  description: "Generate intelligent quizzes from your PDFs using AI. Create custom quizzes with adjustable difficulty levels and multiple language support.",
  openGraph: {
    title: "PDF2Quiz - AI-Powered Quiz Generator",
    description: "Generate intelligent quizzes from your PDFs using AI. Create custom quizzes with adjustable difficulty levels and multiple language support.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF2Quiz - AI-Powered Quiz Generator",
    description: "Generate intelligent quizzes from your PDFs using AI. Create custom quizzes with adjustable difficulty levels and multiple language support.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.className}`}>
      <head>
        <link 
          rel="icon" 
          href="/favicon-dark.svg" 
          media="(prefers-color-scheme: dark)" 
          type="image/svg+xml"
        />
        <link 
          rel="icon" 
          href="/favicon-light.svg" 
          media="(prefers-color-scheme: light)" 
          type="image/svg+xml"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <ThemeProvider attribute="class" enableSystem defaultTheme="dark">
          <FaviconHandler />
          <Toaster position="top-center" richColors />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
