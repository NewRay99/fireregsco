import "./globals.css";
import type { Metadata } from "next";
import { Inter, Roboto, Raleway } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

// Initialize fonts
const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

const raleway = Raleway({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-raleway',
});

export const metadata: Metadata = {
  title: "Fire Regs Co - Professional Fire Safety Services",
  description: "Expert fire safety services, compliance, and consulting. Ensuring your property meets all fire safety standards and regulations.",
  icons: {
    icon: [
      {
        url: '/images/fireregsco image.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/images/fireregsco image.png',
        sizes: '16x16',
        type: 'image/png',
      }
    ],
    apple: {
      url: '/images/fireregsco image.png',
      sizes: '180x180',
      type: 'image/png',
    },
    shortcut: '/images/fireregsco image.png',
  },
  manifest: '/site.webmanifest',
  themeColor: '#ffffff',
  viewport: 'width=device-width, initial-scale=1.0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${roboto.variable} ${raleway.variable} scroll-smooth`}>
      <body className="font-sans bg-background text-foreground min-h-screen">
        <Toaster />
        {children}
      </body>
    </html>
  );
}
