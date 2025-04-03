'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

interface Metrics {
  currentMonth: {
    totalSales: number;
    completedSales: number;
    voidedSales: number;
    averageSalesCycle: number;
    averageTimeInStatus: Record<string, number>;
  };
  lastMonth: {
    totalSales: number;
    completedSales: number;
    voidedSales: number;
    averageSalesCycle: number;
    averageTimeInStatus: Record<string, number>;
  };
  overall: {
    totalSales: number;
    completedSales: number;
    voidedSales: number;
    averageSalesCycle: number;
    averageTimeInStatus: Record<string, number>;
    statusTransitionTimes: Array<{
      from: string;
      to: string;
      days: number;
    }>;
  };
}

interface SalesByStatus {
  status: string;
  count: number;
  percentage: string;
}

interface SalesByMonth {
  monthYear: string;
  count: number;
  label: string;
}

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [salesByStatus, setSalesByStatus] = useState<SalesByStatus[]>([]);
  const [salesByMonth, setSalesByMonth] = useState<SalesByMonth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReportData() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/admin/reports-data');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Error fetching reports data: ${errorData.error || response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`API error: ${result.error}`);
        }
        
        setMetrics(result.metrics);
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

  // Helper function to calculate percentage change
  const getPercentageChange = (current: number, previous: number): string => {
    if (previous === 0) return 'N/A';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  // Helper function to format days
  const formatDays = (days: number): string => {
    return days.toFixed(1) + ' days';
  };

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
          <div className="space-y-8">
            {/* Monthly Performance Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">Sales Overview</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total Sales (Current Month)</span>
                      <span className="font-medium">{metrics?.currentMonth.totalSales}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      vs Last Month: {getPercentageChange(
                        metrics?.currentMonth.totalSales || 0,
                        metrics?.lastMonth.totalSales || 0
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Completed Sales</span>
                      <span className="font-medium">{metrics?.currentMonth.completedSales}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      vs Last Month: {getPercentageChange(
                        metrics?.currentMonth.completedSales || 0,
                        metrics?.lastMonth.completedSales || 0
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Voided Sales</span>
                      <span className="font-medium">{metrics?.currentMonth.voidedSales}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      vs Last Month: {getPercentageChange(
                        metrics?.currentMonth.voidedSales || 0,
                        metrics?.lastMonth.voidedSales || 0
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">Sales Cycle Times</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600">Average Sales Cycle</div>
                    <div className="text-2xl font-semibold">
                      {formatDays(metrics?.overall.averageSalesCycle || 0)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-600">Average Time in Status:</div>
                    {metrics?.overall.averageTimeInStatus && 
                      Object.entries(metrics.overall.averageTimeInStatus)
                        .sort((a, b) => b[1] - a[1])
                        .map(([status, days]) => (
                          <div key={status} className="flex justify-between text-sm">
                            <span className="text-gray-600">{status}</span>
                            <span className="font-medium">{formatDays(days)}</span>
                          </div>
                        ))
                    }
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">Conversion Metrics</h2>
                <div className="space-y-4">
                  {salesByStatus.map(item => (
                    <div key={item.status} className="flex items-center">
                      <div className="w-32 text-sm text-gray-600">{item.status}</div>
                      <div className="flex-1">
                        <div className="relative h-8 bg-gray-200 rounded">
                          <div 
                            className="absolute top-0 left-0 h-8 bg-red-600 rounded"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-end pr-3">
                            <span className="text-sm font-medium">
                              {item.count} ({item.percentage}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sales Trend */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Monthly Sales Trend</h2>
              <div className="space-y-4">
                {salesByMonth.map(item => (
                  <div key={item.monthYear} className="flex items-center">
                    <div className="w-40 text-sm text-gray-600">{item.label}</div>
                    <div className="flex-1">
                      <div className="relative h-8 bg-gray-200 rounded">
                        <div 
                          className="absolute top-0 left-0 h-8 bg-blue-600 rounded"
                          style={{ 
                            width: `${Math.min(100, (item.count / Math.max(...salesByMonth.map(m => m.count))) * 100)}%` 
                          }}
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

            {/* Status Transition Analysis */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Status Transition Analysis</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        From Status
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        To Status
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metrics?.overall.statusTransitionTimes
                      .reduce((acc, curr) => {
                        const key = `${curr.from}-${curr.to}`;
                        if (!acc[key]) {
                          acc[key] = { ...curr, count: 1 };
                        } else {
                          acc[key].days += curr.days;
                          acc[key].count += 1;
                        }
                        return acc;
                      }, {} as Record<string, any>)
                      .map((transition: any) => ({
                        ...transition,
                        averageDays: transition.days / transition.count
                      }))
                      .sort((a: { averageDays: number }, b: { averageDays: number }) => b.averageDays - a.averageDays)
                      .map((transition: any) => (
                        <tr key={`${transition.from}-${transition.to}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transition.from}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transition.to}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDays(transition.averageDays)}
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 