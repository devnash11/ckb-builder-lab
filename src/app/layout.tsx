import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Builder Lab | Learn CKB",
  description: "Learn the CKB Cell Model through interactive challenges.",
  icons: {
    icon: "/builder-lab-mark.svg",
    shortcut: "/builder-lab-mark.svg",
  },
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
