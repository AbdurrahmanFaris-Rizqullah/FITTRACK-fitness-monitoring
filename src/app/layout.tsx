import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FitTrack — Body Metrics Monitor",
    template: "%s · FitTrack",
  },
  description:
    "Track your body composition with precision. US Navy method body fat calculation, progress charts, and personal records.",
};

/**
 * Viewport export — Next.js 13+ way to set the <meta name="viewport"> tag.
 * Without this, mobile browsers render the page at ~980 px desktop width
 * and scale it down, making the entire responsive system non-functional.
 * `interactive-widget=resizes-content` prevents the soft keyboard from
 * overlapping form inputs on Android Chrome.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,           // allow pinch-zoom for accessibility
  userScalable: true,
  viewportFit: "cover",      // respect notch / dynamic-island safe areas
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
