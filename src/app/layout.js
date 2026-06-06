import { Outfit, Space_Grotesk, Space_Mono, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata = {
  title: "Synapse | Enterprise Agentic Vault",
  description: "Your company's private intelligence vault. Zero-scrape grounding, multimodal reasoning, and absolute business memory seamlessly blended.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${outfit.variable} ${spaceGrotesk.variable} ${spaceMono.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased selection:bg-indigo-500/30 selection:text-indigo-100 relative bg-background overflow-x-hidden min-h-screen">
        {children}
      </body>
    </html>
  );
}
