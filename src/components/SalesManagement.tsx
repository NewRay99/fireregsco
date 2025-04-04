"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import StatusDropdown from "./StatusDropdown";
import { formatSaleFromSupabase } from "@/lib/supabase";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface Sale {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyType: string;
  doorCount: string;
  preferredDate: string;
  message: string;
  status: string;
  timestamp: string;
  updatedAt: string;
  trackingHistory: Array<{
    status: string;
    timestamp: string;
    notes: string;
  }>;
}

interface SupabaseSale {
  id: string;
  name: string;
  email: string;
  phone: string;
  property_type: string;
  door_count: string;
  preferred_date: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  tracking_history?: Array<{
    status: string;
    created_at: string;
    notes: string;
  }>;
}

export default function SalesManagement() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [trackingHistoryMap, setTrackingHistoryMap] = useState<Map<string, Array<{
    status: string;
    timestamp: string;
    notes: string;
  }>>>(new Map());
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['pending']);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [workflowStatuses, setWorkflowStatuses] = useState<string[]>([]);
  const [mainStatuses] = useState(['pending', 'contacted', 'sent invoice']);

  // Fetch workflow statuses
  const fetchWorkflowStatuses = async () => {
    try {
      console.log("Starting workflow status fetch...");
      
      const { data, error } = await supabase
        .from('status_workflow')
        .select('current_status, next_statuses')
        .order('created_at');

      if (error) {
        console.error("Supabase error fetching statuses:", error);
        throw error;
      }

      if (!data || !Array.isArray(data)) {
        console.error("Invalid data format received:", data);
        throw new Error("Invalid data format received from status_workflow table");
      }

      console.log("Raw status workflow data:", data);
      
      const statuses = data.map(item => item.current_status);
      console.log("Processed workflow statuses:", statuses);
      
      if (statuses.length === 0) {
        console.warn("No statuses found in workflow table, using defaults");
        throw new Error("No statuses found in workflow table");
      }

      setWorkflowStatuses(statuses);
      
      // Also log the next_statuses for debugging
      data.forEach(item => {
        console.log(`Next statuses for ${item.current_status}:`, item.next_statuses);
      });

    } catch (error) {
      console.error("Error in fetchWorkflowStatuses:", error);
      // Set default statuses if fetch fails
      const defaultStatuses = [
        'pending',
        'contacted',
        'interested',
        'reserved booking',
        'sent invoice',
        'payment received',
        'booked',
        'completed inspection',
        'completed',
        'aftersales',
        'refunded',
        'not available',
        'void'
      ];
      console.log("Setting default statuses:", defaultStatuses);
      setWorkflowStatuses(defaultStatuses);
    }
  };

  // Call fetchWorkflowStatuses immediately and then set up interval to refresh
  useEffect(() => {
    fetchWorkflowStatuses();
    
    // Refresh statuses every 5 minutes
    const interval = setInterval(fetchWorkflowStatuses, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch sales data from Supabase
  const fetchSales = async () => {
    try {
      setIsLoading(true);
      
      // Use the API route instead of direct Supabase client
      const response = await fetch('/api/admin/sales-management');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error fetching sales: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      console.log("API Response:", result); // Debug log
      
      if (!result.success) {
        throw new Error(`API error: ${result.error}`);
      }
      
      // Format the sales data and set up tracking history map
      const formattedSales = result.sales.map((sale: SupabaseSale) => formatSaleFromSupabase(sale));
      console.log("Formatted Sales:", formattedSales); // Debug log
      setSales(formattedSales);

      // Set up tracking history map from the sales data
      const newTrackingMap = new Map();
      formattedSales.forEach((sale: Sale) => {
        if (sale.trackingHistory && sale.trackingHistory.length > 0) {
          newTrackingMap.set(sale.id, sale.trackingHistory);
        }
      });
      console.log("Initial tracking map:", Object.fromEntries(newTrackingMap)); // Debug log
      setTrackingHistoryMap(newTrackingMap);
    } catch (error) {
      console.error("Error fetching sales:", error);
      alert(`Error fetching sales: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sale details is now only used when updating status
  const fetchSaleDetails = async (id: string) => {
    try {
      setIsLoadingDetails(true);
      console.log(`Fetching details for sale ${id}`); // Debug log
      
      const response = await fetch(`/api/admin/sales-management?id=${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sale details');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch sale details');
      }

      const sale = formatSaleFromSupabase(result.sale);
      console.log(`Updated sale details:`, sale); // Debug log

      // Update the tracking history map with the new data
      setTrackingHistoryMap(prev => {
        const newMap = new Map(prev);
        if (sale.trackingHistory && sale.trackingHistory.length > 0) {
          newMap.set(id, sale.trackingHistory);
        }
        return newMap;
      });

      // Update the sale in the sales list
      setSales(prev => prev.map(s => s.id === id ? sale : s));
    } catch (error) {
      console.error("Error fetching sale details:", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Add this debug effect
  useEffect(() => {
    console.log("Current tracking history map:", Object.fromEntries(trackingHistoryMap));
  }, [trackingHistoryMap]);

  // Update sale status
  const updateSaleStatus = async (id: string, newStatus: string) => {
    try {
      setIsUpdating(true);
      
      // Use the API route instead of direct Supabase client
      const response = await fetch('/api/admin/sales-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_status',
          saleId: id,
          status: newStatus,
          notes: statusNote
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error updating sale status: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`API error: ${result.error}`);
      }
      
      // Update the selected sale
      setSelectedSale(prev => prev ? {
        ...prev,
        status: newStatus
      } : null);
      
      // Refresh the sale details to get the updated tracking history
      fetchSaleDetails(id);
      
      // Clear the notes
      setStatusNote('');
      
      // Close the status modal
      setShowNoteModal(false);
      
      // Show success message
      alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating sale status:", error);
      alert(`Error updating sale status: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Add this function at the top of your SalesManagement component
  const checkSalesTrackingTable = async () => {
    try {
      console.log("Checking sales_tracking table...");
      
      // Get total count of records in sales_tracking table
      const { count: trackingCount, error: countError } = await supabase
        .from('sales_tracking')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error("Error counting sales_tracking records:", countError);
        return;
      }
      
      console.log(`Total records in sales_tracking table: ${trackingCount ?? 0}`);
      
      // Get a sample of records to verify structure
      const { data: sampleData, error: sampleError } = await supabase
        .from('sales_tracking')
        .select('*')
        .limit(5);
      
      if (sampleError) {
        console.error("Error fetching sample sales_tracking records:", sampleError);
        return;
      }
      
      console.log("Sample sales_tracking records:", sampleData);
      
      // Check if we have any sales records
      const { count: salesCount, error: salesCountError } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true });
      
      if (salesCountError) {
        console.error("Error counting sales records:", salesCountError);
        return;
      }
      
      console.log(`Total records in sales table: ${salesCount ?? 0}`);
    } catch (error) {
      console.error("Error checking sales_tracking table:", error);
    }
  };

  // Add this function to your SalesManagement component
  const directQueryTrackingData = async () => {
    try {
      // Use the API route instead of direct Supabase client
      const response = await fetch('/api/admin/sales-management');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error fetching sales: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`API error: ${result.error}`);
      }
      
      console.log("Sales data from API:", result.sales);
      
      // For each sale, fetch its tracking data
      for (const sale of result.sales.slice(0, 3)) { // Just check the first 3 for brevity
        const detailsResponse = await fetch(`/api/admin/sales-management?id=${sale.id}`);
        const detailsResult = await detailsResponse.json();
        
        if (detailsResult.success) {
          console.log(`Tracking data for sale ${sale.id}:`, detailsResult.trackingHistory);
        }
      }
      
      alert("Check console for tracking data");
    } catch (error) {
      console.error("Error querying tracking data:", error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Add this function to check for data type issues
  const checkDataTypes = async () => {
    try {
      console.log("Checking data types...");
      
      // Get a sample sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select('id')
        .limit(1)
        .single();
      
      if (saleError) {
        console.error("Error fetching sample sale:", saleError);
        return;
      }
      
      const saleId = saleData.id;
      console.log(`Sample sale ID: ${saleId} (${typeof saleId})`);
      
      // Create a test tracking entry with explicit type handling
      const { data: insertData, error: insertError } = await supabase
        .from('sales_tracking')
        .insert({
          sale_id: saleId, // Use the exact ID from the sales table
          status: 'test',
          notes: 'Testing data type compatibility',
          created_at: new Date().toISOString(),
          updated_by: 'system'
        })
        .select();
      
      if (insertError) {
        console.error("Error inserting test tracking:", insertError);
        alert(`Error inserting test tracking: ${insertError.message}`);
      } else {
        console.log("Test tracking inserted:", insertData);
        
        // Now try to fetch it back
        const { data: fetchData, error: fetchError } = await supabase
          .from('sales_tracking')
          .select('*')
          .eq('sale_id', saleId);
        
        if (fetchError) {
          console.error("Error fetching test tracking:", fetchError);
        } else {
          console.log("Fetched test tracking:", fetchData);
          alert(`Successfully created and fetched test tracking for sale ${saleId}. Check console for details.`);
        }
      }
    } catch (err) {
      console.error("Error checking data types:", err);
      alert(`Error checking data types: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  useEffect(() => {
    fetchSales();
    checkSalesTrackingTable();
  }, []);

  // Calculate status counts
  useEffect(() => {
    const counts: Record<string, number> = {};
    sales.forEach(sale => {
      counts[sale.status] = (counts[sale.status] || 0) + 1;
    });
    setStatusCounts(counts);
  }, [sales]);

  // Handle status change
  const handleStatusChange = async (saleId: string, newStatus: string) => {
    setSelectedSaleId(saleId);
    setShowNoteModal(true);
    // Store the new status in the component state temporarily
    const updatedSales = sales.map(sale => 
      sale.id === saleId ? { ...sale, tempNewStatus: newStatus } : sale
    );
    setSales(updatedSales as any);
  };

  // Handle note submission and complete the status change
  const handleNoteSubmit = async () => {
    try {
      if (!selectedSaleId) return;
      
      // Find the sale with the temporary status
      const saleToUpdate = sales.find(sale => sale.id === selectedSaleId);
      if (!saleToUpdate) return;
      
      const newStatus = (saleToUpdate as any).tempNewStatus;
      if (!newStatus) return;
      
      // Use the updateSaleStatus function which now uses the API
      await updateSaleStatus(selectedSaleId, newStatus);
      
      // Refresh the sales list
      fetchSales();
    } catch (error) {
      console.error("Error updating sale status:", error);
      alert(`Error updating sale status: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Toggle notes expansion - no need to fetch details anymore since we have them
  const toggleNotesExpansion = (saleId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(saleId)) {
        newSet.delete(saleId);
      } else {
        newSet.add(saleId);
      }
      return newSet;
    });
  };

  // Filter sales by selected statuses
  const filteredSales = sales.filter(sale => selectedStatuses.includes(sale.status));

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <h3 className="font-bold">Error loading sales</h3>
        <p>{error}</p>
        <button 
          onClick={fetchSales}
          className="mt-2 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Add debug info at the top */}
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-bold">Debug Info:</h3>
        <p>Number of sales: {sales.length}</p>
        <p>Number of sales with tracking: {trackingHistoryMap.size}</p>
        <p>Selected statuses: {selectedStatuses.join(', ')}</p>
      </div>
      {/* Status Filter */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Filter by Status</h2>
          <span className="text-sm text-gray-600">
            {filteredSales.length} records found
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {mainStatuses.map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatuses(prev => 
                prev.includes(status) 
                  ? prev.filter(s => s !== status)
                  : [...prev, status]
              )}
              className={`px-4 py-2 rounded-full text-sm font-medium relative ${
                selectedStatuses.includes(status)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {status}
              {statusCounts[status] > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {statusCounts[status]}
                </span>
              )}
            </button>
          ))}
          <select
            className="px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-700"
            onChange={(e) => {
              const status = e.target.value;
              if (status && !selectedStatuses.includes(status)) {
                setSelectedStatuses(prev => [...prev, status]);
              }
            }}
            value=""
          >
            <option value="">Other Statuses...</option>
            {workflowStatuses
              .filter(status => !mainStatuses.includes(status))
              .map(status => (
                <option key={status} value={status}>
                  {status} ({statusCounts[status] || 0})
                </option>
            ))}
          </select>
        </div>
        {selectedStatuses.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedStatuses.map(status => (
              <span
                key={status}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100"
              >
                {status}
                <span className="ml-1 text-xs text-gray-500">
                  ({statusCounts[status] || 0})
                </span>
                <button
                  onClick={() => setSelectedStatuses(prev => prev.filter(s => s !== status))}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </span>
            ))}
                </div>
                  )}
                </div>
                
      {/* Sales List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : filteredSales.length === 0 ? (
            <div className="text-gray-500 text-center py-12">No sales found for the selected statuses.</div>
          ) : (
            <div className="space-y-6">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                <div>
                      <h3 className="text-lg font-medium">{sale.name}</h3>
                      <p className="text-sm text-gray-500">{sale.email}</p>
                    </div>
                    <StatusDropdown 
                      currentStatus={sale.status} 
                      onStatusChange={(newStatus) => handleStatusChange(sale.id, newStatus)}
                      statuses={workflowStatuses}
                    />
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-700">Notes</h4>
                        {(trackingHistoryMap.get(sale.id)?.length ?? 0) > 0 && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {trackingHistoryMap.get(sale.id)?.length ?? 0}
                          </span>
                        )}
                </div>
                      <button
                        onClick={() => toggleNotesExpansion(sale.id)}
                        className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        {(trackingHistoryMap.get(sale.id)?.length ?? 0) > 0 && (
                          <span className="text-sm text-gray-500">
                            {new Date(trackingHistoryMap.get(sale.id)![0].timestamp).toLocaleDateString()}
                          </span>
                        )}
                        {expandedNotes.has(sale.id) ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </button>
              </div>
                    <div className={`mt-2 ${expandedNotes.has(sale.id) ? '' : ''}`}>
                      {(trackingHistoryMap.get(sale.id)?.length ?? 0) > 0 && (
                        <div className="space-y-3">
                          {/* First note always visible */}
                          <div className="p-3 bg-[#f5f5dc] rounded-lg">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{trackingHistoryMap.get(sale.id)![0].status}</span>
                              <span className="text-gray-500">
                                {new Date(trackingHistoryMap.get(sale.id)![0].timestamp).toLocaleString()}
                              </span>
                            </div>
                            {trackingHistoryMap.get(sale.id)![0].notes && (
                              <p className="mt-1 text-sm text-gray-700">{trackingHistoryMap.get(sale.id)![0].notes}</p>
                            )}
                          </div>
                          
                          {/* Other notes expandable */}
                          {expandedNotes.has(sale.id) && trackingHistoryMap.get(sale.id)!.slice(1).map((entry, index) => (
                            <div key={index} className="p-3 bg-[#f5f5dc] rounded-lg">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{entry.status}</span>
                                <span className="text-gray-500">
                                  {new Date(entry.timestamp).toLocaleString()}
                                </span>
                              </div>
                              {entry.notes && (
                                <p className="mt-1 text-sm text-gray-700">{entry.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Property Type:</span> {sale.propertyType}
                    </div>
                    <div>
                      <span className="font-medium">Door Count:</span> {sale.doorCount}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {sale.phone}
                    </div>
                    <div>
                      <span className="font-medium">Preferred Date:</span>{" "}
                      {sale.preferredDate ? new Date(sale.preferredDate).toLocaleDateString() : "Not specified"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Status Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium mb-4">Add Note for Status Change</h3>
            <textarea
              className="w-full p-2 border rounded"
              rows={4}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Enter notes about this status change..."
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                onClick={() => setShowNoteModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleNoteSubmit}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={async () => {
          if (sales.length > 0) {
            const firstSale = sales[0];
            console.log("Creating test tracking entry for sale:", firstSale.id);
            
            const { data, error } = await supabase
              .from('sales_tracking')
              .insert({
                sale_id: firstSale.id,
                status: 'contacted',
                notes: 'Test tracking entry created for debugging',
                created_at: new Date().toISOString(),
                updated_by: 'admin'
              });
              
            if (error) {
              console.error("Error creating test tracking:", error);
              alert("Failed to create test tracking entry: " + error.message);
            } else {
              console.log("Test tracking created:", data);
              alert("Test tracking entry created successfully. Refreshing data...");
              fetchSales();
            }
          } else {
            alert("No sales available to create test tracking");
          }
        }}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mb-4"
      >
        Create Test Tracking Entry
      </button>

      <button 
        onClick={directQueryTrackingData}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4 ml-2"
      >
        Direct Query Tracking Data
      </button>

      <button 
        onClick={checkDataTypes}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mb-4 ml-2"
      >
        Check Data Types
      </button>
    </div>
  );
} 