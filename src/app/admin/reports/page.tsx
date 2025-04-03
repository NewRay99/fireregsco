'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

export default function ReportsPage() {
  const [salesByStatus, setSalesByStatus] = useState([]);
  const [salesByMonth, setSalesByMonth] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchReportData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use the API route instead of direct Supabase client
        const response = await fetch('/api/admin/reports-data');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Error fetching reports data: ${errorData.error || response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`API error: ${result.error}`);
        }
        
        setSalesByStatus(result.salesByStatus);
        setSalesByMonth(result.salesByMonth);
      } catch (err) {
        console.error("Error fetching report data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchReportData();
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold pb-6">Reports</h1>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sales by Status */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Sales by Status</h2>
              <div className="space-y-4">
                {salesByStatus.map(item => (
                  <div key={item.status} className="flex items-center">
                    <div className="w-32 text-gray-600">{item.status}</div>
                    <div className="flex-1">
                      <div className="relative h-8 bg-gray-200 rounded">
                        <div 
                          className="absolute top-0 left-0 h-8 bg-red-600 rounded"
                          style={{ width: `${Math.min(100, (item.count / Math.max(...salesByStatus.map(s => s.count))) * 100)}%` }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-end pr-3">
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Sales by Month */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Sales by Month</h2>
              <div className="space-y-4">
                {salesByMonth.map(item => (
                  <div key={item.monthYear} className="flex items-center">
                    <div className="w-40 text-gray-600">{item.label}</div>
                    <div className="flex-1">
                      <div className="relative h-8 bg-gray-200 rounded">
                        <div 
                          className="absolute top-0 left-0 h-8 bg-blue-600 rounded"
                          style={{ width: `${Math.min(100, (item.count / Math.max(...salesByMonth.map(m => m.count))) * 100)}%` }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-end pr-3">
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 