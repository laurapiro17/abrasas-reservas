import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ABRASAS BLANES | Reservations",
  description: "Book your table at ABRASAS BLANES. The finest cuts of meat over charcoal fire.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${inter.className} bg-background text-foreground antialiased min-h-screen selection:bg-brand selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
