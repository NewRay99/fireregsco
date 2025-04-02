import React from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm">© {new Date().getFullYear()} Fire Regulations Co. All rights reserved.</p>
            </div>
            <div className="flex space-x-4">
              <a href="/privacy" className="text-sm text-gray-300 hover:text-white transition">Privacy Policy</a>
              <a href="/terms" className="text-sm text-gray-300 hover:text-white transition">Terms of Service</a>
              <a href="/contact" className="text-sm text-gray-300 hover:text-white transition">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 