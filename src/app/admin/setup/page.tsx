'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from "@supabase/supabase-js";
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';

export default function SetupPage() {
  const [activeTab, setActiveTab] = useState('connection');
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    tables: { [key: string]: boolean };
    error?: string;
  }>({
    connected: false,
    tables: {},
  });
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoadingTableData, setIsLoadingTableData] = useState(false);
  const [tableDataError, setTableDataError] = useState<string | null>(null);
  
  // New seed controls
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{success: boolean; message: string} | null>(null);
  const [seedCount, setSeedCount] = useState(50);
  const [seedType, setSeedType] = useState('sales');
  const [seedOptions, setSeedOptions] = useState({
    includeSeasonalTrends: true,
    includeVoidedSales: true,
    includeDelayedBookings: true
  });
  
  useEffect(() => {
    async function checkSupabaseConnection() {
      try {
        // Create Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          setSupabaseStatus({
            connected: false,
            tables: {},
            error: "Supabase credentials are missing in environment variables",
          });
          return;
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Check general connection
        const { data: healthCheck, error: healthError } = await supabase.from('_health_check').select('*').limit(1);
        
        if (healthError) {
          throw new Error(`Connection error: ${healthError.message}`);
        }
        
        // List of tables to check
        const tablesToCheck = [
          'users',
          'conversations',
          'messages',
          'settings',
          'documents',
          'transcriptions',
          'sales',
          'sales_tracking',
          'support_tickets',
          'twitter_scrape_history'
        ];
        
        const tableStatus: { [key: string]: boolean } = {};
        
        // Check each table
        for (const table of tablesToCheck) {
          try {
            const { error } = await supabase.from(table).select('count').limit(0);
            tableStatus[table] = !error;
          } catch (e) {
            tableStatus[table] = false;
          }
        }
        
        setSupabaseStatus({
          connected: true,
          tables: tableStatus,
        });
      } catch (error) {
        setSupabaseStatus({
          connected: false,
          tables: {},
          error: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }

    checkSupabaseConnection();
  }, []);
  
  const fetchTableData = async (tableName: string) => {
    try {
      setIsLoadingTableData(true);
      setTableDataError(null);
      
      console.log(`Attempting to fetch data from ${tableName} table via API...`);
      
      // Use the API route instead of direct Supabase client
      const response = await fetch(`/api/admin/table-data?table=${encodeURIComponent(tableName)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Error response from API:`, errorData);
        setTableDataError(`Error fetching data: ${errorData.error || response.statusText}`);
        return;
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error(`API returned error:`, result);
        setTableDataError(`Error from API: ${result.error}`);
        return;
      }
      
      console.log(`Successfully fetched ${result.data.length} records from ${tableName}`);
      setTableData(result.data || []);
      setSelectedTable(tableName);
    } catch (error) {
      console.error(`Error fetching table data:`, error);
      setTableDataError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingTableData(false);
    }
  };
  
  // Handle seed data generation
  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      setSeedResult(null);
      
      const response = await fetch('/api/admin/seed-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: seedType,
          count: seedCount,
          options: seedOptions
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to seed database');
      }
      
      setSeedResult({
        success: true,
        message: `Successfully seeded ${result.count} ${seedType} records!`
      });
    } catch (error) {
      console.error('Error seeding database:', error);
      setSeedResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Setup</h1>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('connection')}
              className={`${
                activeTab === 'connection'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Connection Status
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`${
                activeTab === 'database'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Database Explorer
            </button>
            <button
              onClick={() => setActiveTab('seed')}
              className={`${
                activeTab === 'seed'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Seed Data
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`${
                activeTab === 'settings'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Settings
            </button>
          </nav>
        </div>
        
        {/* Connection Status Tab */}
        {activeTab === 'connection' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Supabase Connection Status</h2>
            
            {supabaseStatus.error ? (
              <div className="p-4 bg-red-50 text-red-800 rounded-md mb-4">
                <h3 className="font-bold">Connection Error</h3>
                <p>{supabaseStatus.error}</p>
              </div>
            ) : supabaseStatus.connected ? (
              <div className="p-4 bg-green-50 text-green-800 rounded-md mb-4">
                <h3 className="font-bold">Connected to Supabase</h3>
                <p>Your application is successfully connected to your Supabase instance.</p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md mb-4">
                <h3 className="font-bold">Checking Connection...</h3>
                <p>Verifying connection to your Supabase instance.</p>
              </div>
            )}
            
            <h3 className="text-md font-medium mt-6 mb-2">Table Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(supabaseStatus.tables).map(([table, exists]) => (
                <div 
                  key={table}
                  className={`p-3 rounded-md ${
                    exists ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      exists ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium">{table}</span>
                  </div>
                  <p className="text-sm mt-1">
                    {exists ? 'Table exists and is accessible' : 'Table does not exist or is not accessible'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Database Explorer Tab */}
        {activeTab === 'database' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Database Explorer</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(supabaseStatus.tables)
                .filter(([_, exists]) => exists)
                .map(([table, _]) => (
                  <button
                    key={table}
                    onClick={() => fetchTableData(table)}
                    className={`p-3 text-left rounded-md border ${
                      selectedTable === table
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{table}</span>
                  </button>
                ))}
            </div>
            
            {isLoadingTableData ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            ) : tableDataError ? (
              <div className="p-4 bg-red-50 text-red-800 rounded-md">
                <h3 className="font-bold">Error</h3>
                <p>{tableDataError}</p>
              </div>
            ) : selectedTable ? (
              <div>
                <h3 className="text-md font-medium mb-2">
                  {selectedTable} ({tableData.length} records)
                </h3>
                
                {tableData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(tableData[0]).map(key => (
                            <th
                              key={key}
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tableData.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {Object.entries(row).map(([key, value], cellIndex) => (
                              <td
                                key={`${rowIndex}-${cellIndex}`}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                              >
                                {typeof value === 'object' 
                                  ? JSON.stringify(value).substring(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '')
                                  : String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-500">No records found in this table.</div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">
                Select a table from above to view its data.
              </div>
            )}
          </div>
        )}
        
        {/* Seed Data Tab */}
        {activeTab === 'seed' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Database Seed</h2>
            <p className="text-gray-600 mb-4">
              Generate sample data for testing and development purposes.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seed Type
                </label>
                <select
                  value={seedType}
                  onChange={(e) => setSeedType(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  disabled={isSeeding}
                >
                  <option value="sales">Sales Data</option>
                  <option value="support">Support Tickets</option>
                  <option value="both">Both Sales & Support</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Records
                </label>
                <input
                  type="number"
                  value={seedCount}
                  onChange={(e) => setSeedCount(parseInt(e.target.value))}
                  min="1"
                  max="500"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  disabled={isSeeding}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options
              </label>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="seasonalTrends"
                    checked={seedOptions.includeSeasonalTrends}
                    onChange={(e) => setSeedOptions({...seedOptions, includeSeasonalTrends: e.target.checked})}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    disabled={isSeeding}
                  />
                  <label htmlFor="seasonalTrends" className="ml-2 block text-sm text-gray-700">
                    Include seasonal trends (busier in spring/summer)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="voidedSales"
                    checked={seedOptions.includeVoidedSales}
                    onChange={(e) => setSeedOptions({...seedOptions, includeVoidedSales: e.target.checked})}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    disabled={isSeeding}
                  />
                  <label htmlFor="voidedSales" className="ml-2 block text-sm text-gray-700">
                    Include voided/lost sales (with notes about costs)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="delayedBookings"
                    checked={seedOptions.includeDelayedBookings}
                    onChange={(e) => setSeedOptions({...seedOptions, includeDelayedBookings: e.target.checked})}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    disabled={isSeeding}
                  />
                  <label htmlFor="delayedBookings" className="ml-2 block text-sm text-gray-700">
                    Include delayed bookings (1 week to 3 months sales cycle)
                  </label>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 disabled:bg-gray-400"
            >
              {isSeeding ? 'Seeding...' : 'Generate Seed Data'}
            </button>
            
            {seedResult && (
              <div className={`mt-4 p-3 rounded ${seedResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {seedResult.message}
              </div>
            )}
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">System Settings</h2>
            <p className="text-gray-600">
              Configure system-wide settings and preferences.
            </p>
            
            {/* Add your settings controls here */}
            <div className="mt-4 text-gray-500">
              Settings configuration coming soon...
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 