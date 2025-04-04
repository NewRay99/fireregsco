'use client';

import { useState, useEffect } from "react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

// Chart.js default options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
};

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

interface ReportsDataResponse {
  success: boolean;
  metrics: Metrics;
  salesByStatus: SalesByStatus[];
  salesByMonth: SalesByMonth[];
  error?: string;
}

// Helper function to calculate percentage change
const getPercentageChange = (
  current: number,
  previous: number
): { value: string; color: string; icon: JSX.Element | null } => {
  if (previous === 0)
    return { value: "N/A", color: "text-gray-500", icon: null };
  const change = ((current - previous) / previous) * 100;
  const formattedChange = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  let color = "text-gray-500"; // Default to gray
  let icon = null;
  if (change > 0) {
    color = "text-green-500";
    icon = <ArrowUpIcon className="h-4 w-4 text-green-500 inline-block" />;
  } else if (change < 0) {
    color = "text-red-500";
    icon = <ArrowDownIcon className="h-4 w-4 text-red-500 inline-block" />;
  } else {
    icon = (
      <ArrowRightIcon className="h-4 w-4 text-gray-500 inline-block" />
    );
  }
  return { value: formattedChange, color, icon };
};

// Helper function to format days
const formatDays = (days: number): string => {
  return days.toFixed(1) + " days";
};

async function getReportsData(): Promise<ReportsDataResponse> {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/reports-data`;
    console.log('Fetching reports data from:', apiUrl);
    
    const response = await fetch(apiUrl);
    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Error fetching reports data: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('API Response data:', result);
    
    if (!result.success) {
      throw new Error(`API error: ${result.error}`);
    }
    return result as ReportsDataResponse;
  } catch (err) {
    console.error("Error fetching report data:", err);
    throw err;
  }
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsDataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getReportsData();
        setData(result);
        setError(null);
      } catch (err) {
        console.error("Error fetching report data:", err);
        setError(err instanceof Error ? err.message : "An error occurred while loading the reports");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold pb-6">Reports</h1>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold pb-6">Reports</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold pb-6">Reports</h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          No data available
        </div>
      </div>
    );
  }

  const { metrics, salesByStatus, salesByMonth } = data;

  // Prepare chart data
  const lineChartData = {
    labels: salesByMonth.map((item) => item.label),
    datasets: [
      {
        label: "Sales Count",
        data: salesByMonth.map((item) => item.count),
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const pieChartData = {
    labels: salesByStatus.map((item) => item.status),
    datasets: [
      {
        label: "Sales Count",
        data: salesByStatus.map((item) => item.count),
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
          "rgba(153, 102, 255, 0.2)",
          "rgba(255, 159, 64, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold pb-6">Reports</h1>
      <div className="space-y-8">
        {/* Monthly Performance Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Sales Overview</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total Sales (Current Month)</span>
                  <span className="font-medium">
                    {metrics.currentMonth.totalSales}
                  </span>
                </div>
                <div className="text-xs">
                  vs Last Month:{" "}
                  {(() => {
                    const { value, color, icon } = getPercentageChange(
                      metrics.currentMonth.totalSales,
                      metrics.lastMonth.totalSales
                    );
                    return (
                      <span className={color}>
                        {value} {icon}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Completed Sales</span>
                  <span className="font-medium">
                    {metrics.currentMonth.completedSales}
                  </span>
                </div>
                <div className="text-xs">
                  vs Last Month:{" "}
                  {(() => {
                    const { value, color, icon } = getPercentageChange(
                      metrics.currentMonth.completedSales,
                      metrics.lastMonth.completedSales
                    );
                    return (
                      <span className={color}>
                        {value} {icon}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Voided Sales</span>
                  <span className="font-medium">
                    {metrics.currentMonth.voidedSales}
                  </span>
                </div>
                <div className="text-xs">
                  vs Last Month:{" "}
                  {(() => {
                    const { value, color, icon } = getPercentageChange(
                      metrics.currentMonth.voidedSales,
                      metrics.lastMonth.voidedSales
                    );
                    return (
                      <span className={color}>
                        {value} {icon}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Sales Cycle Times</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">
                  Average Sales Cycle
                </div>
                <div className="text-2xl font-semibold">
                  {formatDays(metrics.overall.averageSalesCycle || 0)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">
                  Average Time in Status:
                </div>
                {metrics.overall.averageTimeInStatus &&
                  Object.entries(metrics.overall.averageTimeInStatus)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, days]) => {
                      const color =
                        days < 10
                          ? "text-green-500"
                          : days < 20
                          ? "text-yellow-500"
                          : "text-red-500";
                      return (
                        <div
                          key={status}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">{status}</span>
                          <span className={`font-medium ${color}`}>
                            {formatDays(days)}
                          </span>
                        </div>
                      );
                    })}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Conversion Metrics</h2>
            <div className="space-y-4">
              {salesByStatus.map((item) => (
                <div key={item.status} className="flex items-center">
                  <div className="w-32 text-sm text-gray-600">
                    {item.status}
                  </div>
                  <div className="flex-1">
                    <div className="relative h-10 bg-gray-200 rounded-full">
                      <div
                        className="absolute top-0 left-0 h-10 bg-red-600 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-end pr-3">
                        <span className="text-sm font-medium text-white">
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
          <div className="h-[400px]">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Sales by Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Sales by Status</h2>
          <div className="h-[400px]">
            <Pie data={pieChartData} options={chartOptions} />
          </div>
        </div>

        {/* Status Transition Analysis */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">
            Status Transition Analysis
          </h2>
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
                {metrics.overall.statusTransitionTimes &&
                  Object.values(
                    metrics.overall.statusTransitionTimes.reduce(
                      (acc, curr) => {
                        const key = `${curr.from}-${curr.to}`;
                        if (!acc[key]) {
                          acc[key] = { ...curr, count: 1 };
                        } else {
                          acc[key].days += curr.days;
                          acc[key].count += 1;
                        }
                        return acc;
                      },
                      {} as Record<string, any>
                    )
                  )
                    .map((transition: any) => ({
                      ...transition,
                      averageDays: transition.days / transition.count,
                    }))
                    .sort(
                      (
                        a: { averageDays: number },
                        b: { averageDays: number }
                      ) => b.averageDays - a.averageDays
                    )
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
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
