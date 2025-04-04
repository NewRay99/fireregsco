'use client';

import { useState, useEffect } from "react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  FunnelChart, Funnel, LabelList
} from 'recharts';
import { AdminIcons } from '@/lib/admin-icons';
import AdminPageTitle from '@/components/AdminPageTitle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

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
    doorCountDistribution: any[];
    propertyTypeDistribution: any[];
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
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

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

  const renderStatusDistribution = (salesByStatus: SalesByStatus[]) => (
    <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Status Distribution</h2>
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={salesByStatus}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={120}
              fill="#8884d8"
              dataKey="count"
              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {salesByStatus.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} records`, 'Count']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderSalesFunnel = (salesByStatus: SalesByStatus[]) => {
    const funnelData = [
      { name: 'Total Leads', value: data?.metrics.overall.totalSales || 0 },
      { name: 'Contacted', value: salesByStatus.find(s => s.status === 'contacted')?.count || 0 },
      { name: 'Interested', value: salesByStatus.find(s => s.status === 'interested')?.count || 0 },
      { name: 'Payment Received', value: salesByStatus.find(s => s.status === 'payment received')?.count || 0 },
      { name: 'Closed', value: data?.metrics.overall.completedSales || 0 }
    ];

    return (
      <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Sales Funnel</h2>
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip formatter={(value) => [`${value} sales`, 'Count']} />
              <Funnel
                dataKey="value"
                data={funnelData}
                isAnimationActive
              >
                <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderDoorCountDistribution = (doorCountDistribution: any[]) => (
    <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Door Count Distribution</h2>
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={doorCountDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis label={{ value: 'Number of Sales', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" name="Completed Sales" fill="#00C49F" stackId="a" />
            <Bar dataKey="voided" name="Voided Sales" fill="#FF8042" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTimeToClose = () => {
    // Group time-to-close data by month
    const monthlyData = data?.metrics.overall.statusTransitionTimes
      .filter(t => (t.from === 'pending' && (t.to === 'payment received' || t.to === 'void')))
      .reduce((acc: any, curr) => {
        if (!curr.month) return acc;
        
        if (!acc[curr.month]) {
          acc[curr.month] = {
            month: new Date(curr.month + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
            timeToPayment: [],
            timeToVoid: []
          };
        }
        
        if (curr.to === 'payment received') {
          acc[curr.month].timeToPayment.push(curr.days);
        } else if (curr.to === 'void') {
          acc[curr.month].timeToVoid.push(curr.days);
        }
        
        return acc;
      }, {});

    // Calculate averages for each month
    const timeToCloseData = Object.values(monthlyData).map((month: any) => ({
      month: month.month,
      avgTimeToPayment: month.timeToPayment.length > 0 
        ? month.timeToPayment.reduce((a: number, b: number) => a + b, 0) / month.timeToPayment.length 
        : 0,
      avgTimeToVoid: month.timeToVoid.length > 0 
        ? month.timeToVoid.reduce((a: number, b: number) => a + b, 0) / month.timeToVoid.length 
        : 0
    }));

    return (
      <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Average Time to Close by Month</h2>
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeToCloseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => [`${value.toFixed(1)} days`, '']} />
              <Legend />
              <Bar dataKey="avgTimeToPayment" name="Time to Payment" fill="#00C49F" />
              <Bar dataKey="avgTimeToVoid" name="Time to Void" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderMonthlySales = (salesByMonth: SalesByMonth[]) => (
    <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow">
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Monthly Sales Trend</h2>
        <Select
          value={selectedStatus}
          onValueChange={(value) => setSelectedStatus(value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {data?.salesByStatus.map((status) => (
              <SelectItem key={status.status} value={status.status}>
                {status.status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={salesByMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis label={{ value: 'Sales Count', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={selectedStatus === 'all' ? 'count' : `count_${selectedStatus}`}
              stroke="#8884d8" 
              name={selectedStatus === 'all' ? 'All Sales' : `${selectedStatus} Sales`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderClientDemographics = (doorCountDistribution: any[]) => {
    // Calculate total clients for each range
    const demographicsData = doorCountDistribution.map(range => ({
      range: range.range,
      totalClients: range.completed + range.voided,
      percentage: 0 // Will be calculated below
    }));

    // Calculate percentages
    const total = demographicsData.reduce((sum, item) => sum + item.totalClients, 0);
    demographicsData.forEach(item => {
      item.percentage = total > 0 ? (item.totalClients / total * 100).toFixed(1) : '0';
    });

    return (
      <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Client Size Distribution</h2>
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demographicsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="range" 
                label={{ value: 'Door Count Range', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                yAxisId="left"
                label={{ value: 'Number of Clients', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                label={{ value: 'Percentage', angle: 90, position: 'insideRight' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'percentage' ? `${value}%` : value,
                  name === 'percentage' ? 'Percentage' : 'Total Clients'
                ]}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="totalClients" 
                fill="#8884d8" 
                name="Total Clients"
              >
                <LabelList 
                  dataKey="totalClients" 
                  position="top"
                />
              </Bar>
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="percentage" 
                stroke="#82ca9d" 
                name="Percentage"
                dot={{ fill: '#82ca9d' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderPropertyTypeDistribution = (propertyTypeDistribution: any[]) => {
    // Calculate total for each property type
    const propertyData = propertyTypeDistribution.map(item => ({
      type: item.type || 'Unknown',
      totalClients: item.completed + item.voided,
      completed: item.completed,
      voided: item.voided,
      percentage: 0
    }));

    // Calculate percentages
    const total = propertyData.reduce((sum, item) => sum + item.totalClients, 0);
    propertyData.forEach(item => {
      item.percentage = total > 0 ? (item.totalClients / total * 100).toFixed(1) : '0';
    });

    return (
      <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Property Type Distribution</h2>
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={propertyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="type" 
                label={{ value: 'Property Type', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                yAxisId="left"
                label={{ value: 'Number of Properties', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                label={{ value: 'Percentage', angle: 90, position: 'insideRight' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'percentage' ? `${value}%` : value,
                  name === 'percentage' ? 'Percentage' : 
                  name === 'completed' ? 'Completed' : 
                  name === 'voided' ? 'Voided' : 'Total'
                ]}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="completed" 
                fill="#00C49F" 
                name="Completed"
                stackId="a"
              >
                <LabelList 
                  dataKey="completed" 
                  position="inside"
                  fill="#fff"
                />
              </Bar>
              <Bar 
                yAxisId="left"
                dataKey="voided" 
                fill="#FF8042" 
                name="Voided"
                stackId="a"
              >
                <LabelList 
                  dataKey="voided" 
                  position="inside"
                  fill="#fff"
                />
              </Bar>
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="percentage" 
                stroke="#8884d8" 
                name="Percentage"
                dot={{ fill: '#8884d8' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminPageTitle 
          icon={AdminIcons.Reports}
          title="Reports"
        />
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminPageTitle 
          icon={AdminIcons.Reports}
          title="Reports"
        />
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error || 'No data available'}
        </div>
      </div>
    );
  }

  const { metrics, salesByStatus, salesByMonth } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <AdminPageTitle 
        icon={AdminIcons.Reports}
        title="Reports"
      />
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'funnel', 'trends', 'timing', 'demographics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Monthly Performance Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sales Overview Card */}
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

            {/* Sales Cycle Times Card */}
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

            {/* Conversion Metrics Card */}
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

          {/* Status Distribution Chart */}
          {renderStatusDistribution(salesByStatus)}

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
      )}

      {/* Funnel Tab */}
      {activeTab === 'funnel' && (
        <div className="space-y-6">
          {renderSalesFunnel(salesByStatus)}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {renderMonthlySales(salesByMonth)}
        </div>
      )}

      {/* Timing Tab */}
      {activeTab === 'timing' && (
        <div className="space-y-6">
          {renderTimeToClose()}
          {renderDoorCountDistribution(metrics.overall.doorCountDistribution)}
        </div>
      )}

      {/* Demographics Tab */}
      {activeTab === 'demographics' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Client Demographics</h2>
          
          {/* Door Count Distribution */}
          {renderDoorCountDistribution(metrics.overall.doorCountDistribution)}
          
          {/* Property Type Distribution */}
          {renderPropertyTypeDistribution(metrics.overall.propertyTypeDistribution)}
        </div>
      )}
    </div>
  );
}
