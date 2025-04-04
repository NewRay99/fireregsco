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
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-raleway',
});

export const metadata: Metadata = {
  title: "Professional Fire Safety Services | Fire Door Inspections for HMOs & Commercial Properties",
  description: "Certified fire door inspections and fire safety assessments for HMOs, hotels, and commercial properties. Compliance with RRO 2005 and BS9999 standards.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${roboto.variable} ${raleway.variable} scroll-smooth`}>
      <body className="font-sans bg-background text-foreground min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
