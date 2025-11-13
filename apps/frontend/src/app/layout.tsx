import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "DnD Companion",
  description: "Your ultimate D&D 5e campaign management tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <div
          id="dice-box"
          className="fixed inset-0 pointer-events-none z-60"
        ></div>
      </body>
    </html>
  );
}
