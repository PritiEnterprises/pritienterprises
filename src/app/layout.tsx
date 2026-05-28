import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AppShell } from "@/components/layout/AppShell";
import { SessionGuard } from "@/components/SessionGuard";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Priti Enterprises | Contractor Management",
  description:
    "Employee, attendance, payroll, and builder payment management for construction contractors",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans`}>
        <Providers>
          <SessionGuard />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
