'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatSaleFromSupabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface SupabaseSale {
  id: string;
  name: string;
  email: string;
  phone: string;
  property_type: string;
  door_count: number;
  message?: string;
  status: string;
  preferred_date?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

interface DashboardStats {
  total: number;
  pending: number;
  contacted: number;
  sent_invoice: number;
  payment_received: number;
  closed: number;
}

interface DashboardResponse {
  success: boolean;
  error?: string;
  recentSales: SupabaseSale[];
  stats: DashboardStats;
}

export default function AdminDashboard() {
  const [recentSales, setRecentSales] = useState<ReturnType<typeof formatSaleFromSupabase>[]>([]);
  const [salesStats, setSalesStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    contacted: 0,
    sent_invoice: 0,
    payment_received: 0,
    closed: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use the API route instead of direct Supabase client
        const response = await fetch('/api/admin/dashboard-data');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Error fetching dashboard data: ${errorData.error || response.statusText}`);
        }
        
        const result = await response.json() as DashboardResponse;
        
        if (!result.success) {
          throw new Error(`API error: ${result.error}`);
        }
        
        // Format the sales data
        const formattedSales = result.recentSales.map((sale: SupabaseSale) => formatSaleFromSupabase(sale));
        setRecentSales(formattedSales);
        
        // Set the stats
        setSalesStats(result.stats);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>
      
      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Dashboard Content */}
      {!isLoading && !error && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Sales Overview</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sales:</span>
                  <span className="font-semibold">{salesStats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-semibold">{salesStats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contacted:</span>
                  <span className="font-semibold">{salesStats.contacted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Qualified:</span>
                  <span className="font-semibold">{salesStats.sent_invoice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Converted:</span>
                  <span className="font-semibold">{salesStats.payment_received}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Closed:</span>
                  <span className="font-semibold">{salesStats.closed}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Quick Links</h2>
              <div className="space-y-3">
                <Link href="/admin/sales" className="block text-red-700 hover:text-red-800">
                  Sales Management
                </Link>
                <Link href="/admin/support" className="block text-red-700 hover:text-red-800">
                  Support Tickets
                </Link>
                <Link href="/admin/setup" className="block text-red-700 hover:text-red-800">
                  System Setup
                </Link>
                <Link href="/admin/reports" className="block text-red-700 hover:text-red-800">
                  Reports
                </Link>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">System Status</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span>Supabase Connection: Active</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span>API Endpoints: Operational</span>
                </div>
                <Link href="/admin/setup" className="text-sm text-red-700 hover:text-red-800 mt-4 block">
                  View detailed system status →
                </Link>
              </div>
            </div>
          </div>
          
          {/* Recent Sales Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Recent Sales</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentSales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sale.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sale.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              sale.status === 'contacted' ? 'bg-blue-100 text-blue-800' : 
                              sale.status === 'sent invoice' ? 'bg-green-100 text-green-800' : 
                              sale.status === 'payment received' ? 'bg-purple-100 text-purple-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {sale.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDistanceToNow(new Date(sale.timestamp))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Link href={`/admin/sales?id=${sale.id}`} className="text-red-700 hover:text-red-800">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 