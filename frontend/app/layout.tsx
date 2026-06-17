import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerApex AI — AI Career Operating System",
  description: "AI-powered career coaching, mock interviews, skill gap analysis, and salary negotiation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;450;500;550;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
