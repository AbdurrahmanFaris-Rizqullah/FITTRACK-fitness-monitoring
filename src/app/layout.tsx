import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FitTrack — Body Metrics Monitor",
    template: "%s · FitTrack",
  },
  description:
    "Track your body composition with precision. US Navy method body fat calculation, progress charts, and personal records.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
