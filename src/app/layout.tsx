import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";
import { StoreProvider } from "@/store/StoreProvider";

export const metadata: Metadata = {
  title: "After Augmented Reality — Build an exhibition fish",
  description:
    "Scan works throughout the exhibition and build a fish from your path.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
