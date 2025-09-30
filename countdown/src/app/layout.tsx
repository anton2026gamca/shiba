import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monday Countdown",
  description: "Countdown to Monday at 4:30 PM PST",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
