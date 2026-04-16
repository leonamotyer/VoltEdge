import type { Metadata, Viewport } from "next";
import { AppShell } from "@/ui/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoltEdge Dashboard",
  description: "Curtailment intelligence, load and storage sizing, and network feasibility.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
