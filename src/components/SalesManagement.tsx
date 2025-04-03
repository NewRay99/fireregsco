"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import StatusDropdown from "./StatusDropdown";
import { formatSaleFromSupabase } from "@/lib/supabase";

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
  const [trackingHistory, setTrackingHistory] = useState<Array<{
    status: string;
    timestamp: string;
    notes: string;
  }>>([]);

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
      
      if (!result.success) {
        throw new Error(`API error: ${result.error}`);
      }
      
      // Format the sales data
      const formattedSales = result.sales.map(sale => formatSaleFromSupabase(sale));
      setSales(formattedSales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      alert(`Error fetching sales: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sale details
  const fetchSaleDetails = async (id) => {
    try {
      setIsLoadingDetails(true);
      
      // Use the API route instead of direct Supabase client
      const response = await fetch(`/api/admin/sales-management?id=${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error fetching sale details: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`API error: ${result.error}`);
      }
      
      // Format the sale data
      const formattedSale = formatSaleFromSupabase(result.sale);
      setSelectedSale(formattedSale);
      
      // Set the tracking history
      setTrackingHistory(result.trackingHistory || []);
    } catch (error) {
      console.error("Error fetching sale details:", error);
      alert(`Error fetching sale details: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Update sale status
  const updateSaleStatus = async (id, newStatus) => {
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
      setSelectedSale(prev => ({
        ...prev,
        status: newStatus
      }));
      
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
      
      console.log(`Total records in sales_tracking table: ${trackingCount}`);
      
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
      
      console.log(`Total records in sales table: ${salesCount}`);
      
      // Get a sample of sales records
      const { data: salesSample, error: salesSampleError } = await supabase
        .from('sales')
        .select('*')
        .limit(5);
      
      if (salesSampleError) {
        console.error("Error fetching sample sales records:", salesSampleError);
        return;
      }
      
      console.log("Sample sales records:", salesSample);
      
      // If we have sales but no tracking, create initial tracking entries
      if (salesCount > 0 && trackingCount === 0) {
        console.log("Creating initial tracking entries for existing sales...");
        
        const { data: allSales, error: allSalesError } = await supabase
          .from('sales')
          .select('id, status, created_at');
        
        if (allSalesError) {
          console.error("Error fetching all sales:", allSalesError);
          return;
        }
        
        // Create tracking entries for each sale
        const trackingEntries = allSales.map(sale => ({
          sale_id: sale.id,
          status: sale.status || 'pending',
          notes: 'Initial status from sales record',
          created_at: sale.created_at,
          updated_by: 'system'
        }));
        
        if (trackingEntries.length > 0) {
          const { data: insertResult, error: insertError } = await supabase
            .from('sales_tracking')
            .insert(trackingEntries);
          
          if (insertError) {
            console.error("Error creating initial tracking entries:", insertError);
          } else {
            console.log(`Created ${trackingEntries.length} initial tracking entries`);
            alert(`Created ${trackingEntries.length} initial tracking entries. Please refresh the page.`);
          }
        }
      }
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
      <h2 className="text-2xl font-bold mb-6">Sales Management</h2>
      
      {sales.length === 0 ? (
        <div className="bg-gray-50 p-6 text-center rounded-md">
          <p className="text-gray-500">No sales records found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sales.map((sale) => (
            <div key={sale.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-lg">{sale.name}</h3>
                  <p className="text-gray-600">{sale.email}</p>
                  {sale.phone && <p className="text-gray-600">{sale.phone}</p>}
                </div>
                
                <div>
                  <p><span className="font-medium">Property Type:</span> {sale.propertyType}</p>
                  <p><span className="font-medium">Door Count:</span> {sale.doorCount}</p>
                  {sale.preferredDate && (
                    <p><span className="font-medium">Preferred Date:</span> {sale.preferredDate}</p>
                  )}
                </div>
                
                <div>
                  <div className="mb-2">
                    <span className="font-medium">Status:</span>
                    <StatusDropdown 
                      currentStatus={sale.status} 
                      onChange={(newStatus) => handleStatusChange(sale.id, newStatus)} 
                      disabled={isUpdating}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(sale.timestamp).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Updated: {new Date(sale.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {sale.message && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="font-medium">Message:</p>
                  <p className="whitespace-pre-wrap">{sale.message}</p>
                </div>
              )}
              
              {sale.trackingHistory.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Status History:</h4>
                  <div className="max-h-40 overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sale.trackingHistory.map((history, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2">
                              {new Date(history.timestamp).toLocaleString()}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                history.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                history.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                                history.status === 'interested' ? 'bg-purple-100 text-purple-800' :
                                history.status === 'reserved booking' ? 'bg-indigo-100 text-indigo-800' :
                                history.status === 'sent invoice' ? 'bg-pink-100 text-pink-800' :
                                history.status === 'payment received' ? 'bg-green-100 text-green-800' :
                                history.status === 'booked' ? 'bg-teal-100 text-teal-800' :
                                history.status === 'completed inspection' ? 'bg-cyan-100 text-cyan-800' :
                                history.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                history.status === 'aftersales' ? 'bg-lime-100 text-lime-800' :
                                history.status === 'void' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {history.status}
                              </span>
                            </td>
                            <td className="px-4 py-2">{history.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Status Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add Note for Status Change</h3>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="w-full p-2 border rounded mb-4"
              rows={4}
              placeholder="Add notes about this status change (optional)"
            ></textarea>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setStatusNote("");
                  // Reset the temporary status
                  const originalSales = sales.map(sale => {
                    const { tempNewStatus, ...rest } = sale as any;
                    return rest;
                  });
                  setSales(originalSales);
                }}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleNoteSubmit}
                className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save"}
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