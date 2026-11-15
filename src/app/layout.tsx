import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AQUA8086 | Intel 8086 Automatic Water Level Controller Simulation",
  description:
    "Design and Simulation of an Automatic Water Level Controller Using the Intel 8086 Microprocessor and 8255 PPI. Interactive 3D educational engineering simulation.",
  keywords: [
    "Intel 8086",
    "8255 PPI",
    "Water Level Controller",
    "Microprocessor Simulation",
    "Assembly Language",
    "Embedded Systems",
    "Engineering Education",
  ],
  authors: [{ name: "AQUA8086 Engineering Team" }],
};

export const viewport: Viewport = {
  themeColor: "#060913",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-[#070b14] text-slate-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        {children}
      </body>
    </html>
  );
}
