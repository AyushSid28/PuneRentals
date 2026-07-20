import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { PostHogProvider } from "@/lib/analytics/PostHogProvider";

export const metadata: Metadata = {
  title: "Pune.rent — Rental intelligence map",
  description:
    "Map-first rental intelligence for Pune. Fair rents, Bachelor Reality Score, tenant insights.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
