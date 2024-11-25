import type { Metadata } from "next";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { ParsedPDFProvider } from '@/lib/ParsedPDFContext';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "1resume",
  description: "Introducing 1Resume—your AI powered tool that turns your master resume into tailored job-specific applications at the click of a button. Simplify your applications. Secure your success.",
  icons: {
    icon: [
      {
        url: '/favicon.webp',
        type: 'image/webp',
      }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "antialiased min-h-screen bg-background"
        )}
      >
        <ParsedPDFProvider>
          {children}
        </ParsedPDFProvider>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          limit={3}
          containerId="main-toast"
          style={{ zIndex: 9999 }}
        />
      </body>
    </html>
  );
}
