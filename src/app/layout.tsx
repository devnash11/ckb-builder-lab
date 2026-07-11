import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CKB Builder Lab",
  description: "Interactive developer onboarding infrastructure for CKB.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
