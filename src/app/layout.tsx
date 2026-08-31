import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Saira } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { RegisterSW } from "@/components/pwa/RegisterSW";

const saira = Saira({
  subsets: ["latin"],
  variable: "--font-saira",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "MARIVO",
  description:
    "Your intelligent marine assistant — weather, routes, fuel, maintenance and AI guidance for boaters.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MARIVO",
  },
};

export const viewport: Viewport = {
  themeColor: "#060D14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body
        className={`${saira.variable} ${inter.variable} ${jetbrains.variable}`}
      >
        <Providers>{children}</Providers>
        <RegisterSW />
      </body>
    </html>
  );
}
