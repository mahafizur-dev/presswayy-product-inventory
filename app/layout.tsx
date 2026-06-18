import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventory · Admin",
  description: "Product inventory dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}