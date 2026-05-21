import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CollabCode — Realtime Collaborative Coding Platform",
  description: "A production-grade realtime collaborative coding and technical interview platform with OT-based synchronization, live code execution, and interview rooms.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='25' fill='url(%23g)'/><path d='M30 35 L45 50 L30 65 M52 65 L70 65' stroke='white' stroke-width='10' stroke-linecap='round' stroke-linejoin='round' fill='none'/><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%238b5cf6'/><stop offset='100%25' stop-color='%2322d3ee'/></linearGradient></defs></svg>"/>
      </head>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
