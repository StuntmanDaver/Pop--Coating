import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pop's Industrial Coatings",
  description:
    "Four generations of industrial finishing — powder coating, wet paint, abrasive media blasting, and more. Serving Lakeland, FL since 1972.",
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
