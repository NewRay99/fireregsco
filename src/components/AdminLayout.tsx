import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="py-10">
        {children}
      </main>
    </div>
  );
} 