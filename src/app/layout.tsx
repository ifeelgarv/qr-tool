import type { Metadata } from "next";
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Code Generator",
  description: "Generate QR codes for your business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistMono.variable} antialiased cz-shortcut-listen="true"` }>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={true}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
