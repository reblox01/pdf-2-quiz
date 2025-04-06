import "./globals.css";
import { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { Geist } from "next/font/google";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://pdf2quiiz.vercel.app"),
  title: "PDF2Quiz - AI-Powered Quiz Generator",
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
      <body>
        <ThemeProvider attribute="class" enableSystem defaultTheme="dark">
          <Toaster position="top-center" richColors />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
