import type { Metadata, Viewport } from "next";
import "./globals.css";
import { story } from "@/story";

export const metadata: Metadata = {
  title: `A Kingdom for ${story.herName}`,
  description: "A little 3D castle with ten memories waiting inside.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f7dfe2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
