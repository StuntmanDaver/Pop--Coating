import type { Metadata } from "next";
import { Archivo_Black, Inter } from "next/font/google";
import "./globals.css";

const display = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const text = Inter({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://popsindustrial.com"),
  title: {
    default: "Pop's Industrial Coatings: Industrial Paint & Powder Coating",
    template: "%s | Pop's Industrial Coatings",
  },
  description:
    "Serving the greater Lakeland & Polk County FL area for Industrial Painting, Powder Coating, and Sandblasting since 1972.",
  openGraph: {
    type: "website",
    siteName: "Pop's Industrial Coatings",
    images: [{ url: "/images/pops-logo-header-footer.png", width: 682, height: 1024, alt: "Pop's Industrial Coatings" }],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${display.variable} ${text.variable}`}>
      <body className="font-text" suppressHydrationWarning>{children}</body>
    </html>
  );
}
