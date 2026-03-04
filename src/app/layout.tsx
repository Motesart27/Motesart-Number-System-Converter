import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Motesart Converter - See Your Sheet Music in Numbers",
  description:
    "Upload your sheet music and see it instantly in the Motesart Number System. Visualize chords, detect progressions, and transpose to any key in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>
          <div className="noise-overlay" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
