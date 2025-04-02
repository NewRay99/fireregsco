'use client';

import { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Define lead interface
interface Lead {
  id: string;
  email: string;
  name: string;
  status: string;
  timestamp: string; // API uses 'timestamp' rather than 'createdAt'
  updatedAt?: string; // This might not be present in all leads
  phone?: string;
  propertyType?: string;
  doorCount?: string;
  message?: string;
  trackingHistory?: Array<{
    leadId: string;
    contactId?: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    notes: string;
    timestamp: string;
  }>
}

// Time period for reports
type TimePeriod = 'month' | 'year' | 'total';

export default function ReportsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [dataSource, setDataSource] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch leads data
  useEffect(() => {
    const fetchLeads = async (forceFresh = false) => {
      try {
        setLoading(true);
        // Add forceFresh parameter if needed to bypass cache
        const freshParam = forceFresh ? '&fresh=true' : '';
        const response = await fetch(`/api/leads?_=${new Date().getTime()}${freshParam}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch leads data');
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setLeads(data.data);
          
          // Log data source info
          if (data.source) {
            setDataSource(data.source);
            console.log(`Data source: ${data.source}${data.cacheType ? ', type: ' + data.cacheType : ''}`);
          }
        } else {
          throw new Error(data.message || 'Failed to load leads');
        }
      } catch (err: any) {
        console.error('Error fetching leads:', err);
        setError(err.message || 'An error occurred while fetching leads');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    
    fetchLeads();
  }, []);
  
  // Function to manually refresh data with force fresh
  const handleRefresh = () => {
    setRefreshing(true);
    const fetchFreshLeads = async () => {
      try {
        // Force fresh data by adding fresh=true parameter
        const response = await fetch(`/api/leads?_=${new Date().getTime()}&fresh=true`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch leads data');
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setLeads(data.data);
          setError(null);
          
          // Log data source info
          if (data.source) {
            setDataSource(data.source);
            console.log(`Refreshed data source: ${data.source}`);
          }
        } else {
          throw new Error(data.message || 'Failed to refresh leads');
        }
      } catch (err: any) {
        console.error('Error refreshing leads:', err);
        setError(err.message || 'An error occurred while refreshing leads');
      } finally {
        setRefreshing(false);
      }
    };
    
    fetchFreshLeads();
  };
  
  // Prepare data for charts based on time period
  const getFilteredLeads = () => {
    if (timePeriod === 'total') {
      return leads;
    }
    
    const now = new Date();
    let filterDate = new Date();
    
    if (timePeriod === 'month') {
      filterDate.setMonth(now.getMonth() - 1);
    } else if (timePeriod === 'year') {
      filterDate.setFullYear(now.getFullYear() - 1);
    }
    
    return leads.filter(lead => {
      const leadDate = new Date(lead.timestamp);
      return leadDate >= filterDate;
    });
  };
  
  // Calculate statistics
  const getStatistics = () => {
    const filteredLeads = getFilteredLeads();
    
    return {
      total: filteredLeads.length,
      completedInvoices: filteredLeads.filter(lead => lead.status === 'completed').length,
      staleLeads: filteredLeads.filter(lead => {
        const createdDate = new Date(lead.timestamp);
        const updatedDate = new Date(lead.updatedAt || '');
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        
        return (lead.status === 'pending' || lead.status === 'contacted') && 
               updatedDate < fourteenDaysAgo;
      }).length,
      activeLeads: filteredLeads.filter(lead => 
        lead.status === 'pending' || lead.status === 'contacted'
      ).length,
      sentInvoices: filteredLeads.filter(lead => lead.status === 'sent invoice').length,
    };
  };
  
  // Get monthly data for charts
  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const lastSixMonths = months.slice(currentMonth - 5, currentMonth + 1);
    
    if (lastSixMonths.length < 6) {
      const remainingMonths = 6 - lastSixMonths.length;
      lastSixMonths.unshift(...months.slice(12 - remainingMonths));
    }
    
    const monthlyData = lastSixMonths.map(month => {
      const monthIndex = months.indexOf(month);
      const year = new Date().getFullYear() - (monthIndex > currentMonth ? 1 : 0);
      
      // Filter leads for this month
      const monthLeads = leads.filter(lead => {
        const leadDate = new Date(lead.timestamp);
        return leadDate.getMonth() === monthIndex && leadDate.getFullYear() === year;
      });
      
      return {
        month,
        completed: monthLeads.filter(lead => lead.status === 'completed').length,
        sentInvoice: monthLeads.filter(lead => lead.status === 'sent invoice').length,
        active: monthLeads.filter(lead => 
          lead.status === 'pending' || lead.status === 'contacted'
        ).length,
        stale: monthLeads.filter(lead => {
          const createdDate = new Date(lead.timestamp);
          const updatedDate = new Date(lead.updatedAt || '');
          const fourteenDaysAgo = new Date();
          fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
          
          return (lead.status === 'pending' || lead.status === 'contacted') && 
                 updatedDate < fourteenDaysAgo;
        }).length,
      };
    });
    
    return {
      labels: lastSixMonths,
      completed: monthlyData.map(d => d.completed),
      sentInvoice: monthlyData.map(d => d.sentInvoice),
      active: monthlyData.map(d => d.active),
      stale: monthlyData.map(d => d.stale),
    };
  };
  
  // Status distribution data for pie chart
  const getStatusDistributionData = () => {
    const filteredLeads = getFilteredLeads();
    const statusCounts = {
      pending: filteredLeads.filter(lead => lead.status === 'pending').length,
      contacted: filteredLeads.filter(lead => lead.status === 'contacted').length,
      sentInvoice: filteredLeads.filter(lead => lead.status === 'sent invoice').length,
      completed: filteredLeads.filter(lead => lead.status === 'completed').length,
      notAvailable: filteredLeads.filter(lead => lead.status === 'not available').length,
    };
    
    return {
      labels: ['Pending', 'Contacted', 'Sent Invoice', 'Completed', 'Not Available'],
      data: [
        statusCounts.pending,
        statusCounts.contacted,
        statusCounts.sentInvoice, 
        statusCounts.completed,
        statusCounts.notAvailable
      ],
      backgroundColor: [
        'rgba(255, 206, 86, 0.7)',  // Yellow for pending
        'rgba(54, 162, 235, 0.7)',   // Blue for contacted
        'rgba(153, 102, 255, 0.7)',  // Purple for sent invoice
        'rgba(75, 192, 192, 0.7)',   // Green for completed
        'rgba(201, 203, 207, 0.7)',  // Gray for not available
      ],
    };
  };
  
  // Chart configurations
  const monthlyDataConfig = getMonthlyData();
  
  const lineChartData = {
    labels: monthlyDataConfig.labels,
    datasets: [
      {
        label: 'Completed Invoices',
        data: monthlyDataConfig.completed,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
      },
      {
        label: 'Sent Invoices',
        data: monthlyDataConfig.sentInvoice,
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.3,
      }
    ],
  };
  
  const barChartData = {
    labels: monthlyDataConfig.labels,
    datasets: [
      {
        label: 'Active Leads',
        data: monthlyDataConfig.active,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
      },
      {
        label: 'Stale Leads',
        data: monthlyDataConfig.stale,
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
      }
    ],
  };
  
  const pieChartData = {
    labels: getStatusDistributionData().labels,
    datasets: [
      {
        data: getStatusDistributionData().data,
        backgroundColor: getStatusDistributionData().backgroundColor,
        borderWidth: 1,
      },
    ],
  };
  
  const stats = getStatistics();
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold pb-6">Lead Analytics</h1>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Loading report data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Lead Analytics</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50"
          >
            {refreshing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
          <p>Error: {error}</p>
          <p className="mt-2">Using cached data or sample data for visualization.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lead Analytics</h1>
        
        <div className="flex items-center space-x-4">
          <div className="bg-white rounded-md shadow-sm inline-flex">
            <button
              onClick={() => setTimePeriod('month')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                timePeriod === 'month' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimePeriod('year')}
              className={`px-4 py-2 text-sm font-medium ${
                timePeriod === 'year' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              This Year
            </button>
            <button
              onClick={() => setTimePeriod('total')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                timePeriod === 'total' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Time
            </button>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50"
          >
            {refreshing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Key metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Completed Invoices</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.completedInvoices}</dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Stale Leads</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.staleLeads}</dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Active Leads</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.activeLeads}</dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Sent Invoices</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.sentInvoices}</dd>
          </div>
        </div>
      </div>
      
      {/* Charts section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Invoice Completion Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Completion Trend</h3>
          <div className="h-80">
            <Line 
              data={lineChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0
                    }
                  }
                }
              }}
            />
          </div>
        </div>
        
        {/* Active vs Stale Leads */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Active vs Stale Leads</h3>
          <div className="h-80">
            <Bar 
              data={barChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0
                    }
                  }
                }
              }}
            />
          </div>
        </div>
        
        {/* Lead Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Status Distribution</h3>
          <div className="h-80 flex justify-center items-center">
            <div className="w-1/2 max-w-md">
              <Pie 
                data={pieChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Note about data */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          {timePeriod === 'month' ? 'Showing data from the last 30 days.' : 
           timePeriod === 'year' ? 'Showing data from the last 365 days.' : 
           'Showing all-time data.'}
        </p>
        <p className="mt-1">
          Data source: {dataSource === 'cache' ? 'Cached data' : 
                       dataSource === 'google_sheets' ? 'Google Sheets (fresh)' : 
                       dataSource === 'in_memory' ? 'Local database' : 
                       dataSource === 'mock' ? 'Mock data' : 
                       'Unknown source'}
        </p>
      </div>
    </div>
  );
} 