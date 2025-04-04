"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import StatusDropdown from "./StatusDropdown";
import { formatSaleFromSupabase } from "@/lib/supabase";
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

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

export default function SingleLeadSupport() {
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [workflowStatuses, setWorkflowStatuses] = useState<string[]>([]);
  const [expandedNotes, setExpandedNotes] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Sale[]>([]);

  // Fetch workflow statuses
  const fetchWorkflowStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('status_workflow')
        .select('current_status, next_statuses')
        .order('created_at');

      if (error) throw error;

      const statuses = data?.map(item => item.current_status) || [];
      setWorkflowStatuses(statuses.length > 0 ? statuses : [
        'pending', 'contacted', 'interested', 'reserved booking', 'sent invoice',
        'payment received', 'booked', 'completed inspection', 'completed',
        'aftersales', 'refunded', 'not available', 'void'
      ]);
    } catch (error) {
      console.error("Error fetching workflow statuses:", error);
    }
  };

  // Fetch all leads data
  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/sales-management');
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch sales data');
      }

      const formattedSales = result.sales.map((s: any) => formatSaleFromSupabase(s));
      setAllSales(formattedSales);
      
    } catch (error) {
      console.error("Error fetching leads:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      const defaultLead = allSales.find(s => s.email === 'william.jones@hotmail.com');
      setSale(defaultLead || null);
      return;
    }

    const results = allSales.filter(s => 
      s.email.toLowerCase().includes(query.toLowerCase()) ||
      s.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
    
    // If there's exactly one match, select it
    if (results.length === 1) {
      setSale(results[0]);
      setSearchResults([]); // Clear results once selected
    }
  };

  // Select a lead from search results
  const selectLead = (selectedLead: Sale) => {
    setSale(selectedLead);
    setSearchResults([]);
    setSearchQuery(selectedLead.email);
  };

  // Update sale status
  const updateSaleStatus = async (newStatus: string) => {
    if (!sale) return;
    
    try {
      setIsUpdating(true);
      
      const response = await fetch('/api/admin/sales-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_status',
          saleId: sale.id,
          status: newStatus,
          notes: statusNote
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || response.statusText);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Refresh the leads data
      fetchLeads();
      
      // Clear the notes and close modal
      setStatusNote('');
      setShowNoteModal(false);
      
      alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert(`Error updating status: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    setShowNoteModal(true);
    // Store the new status temporarily
    setSale(prev => prev ? { ...prev, tempNewStatus: newStatus as any } : null);
  };

  // Handle note submission
  const handleNoteSubmit = async () => {
    if (!sale || !(sale as any).tempNewStatus) return;
    await updateSaleStatus((sale as any).tempNewStatus);
  };

  useEffect(() => {
    fetchWorkflowStatuses();
    fetchLeads();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Search Section */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full max-w-3xl mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => selectLead(result)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
              >
                <div className="font-medium">{result.name}</div>
                <div className="text-sm text-gray-600">{result.email}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-800 rounded-md">
          <h3 className="font-bold">Error loading lead</h3>
          <p>{error}</p>
          <button 
            onClick={fetchLeads}
            className="mt-2 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
          >
            Try Again
          </button>
        </div>
      ) : !sale ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No lead selected. Use the search above to find a lead.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5">
            {/* Lead Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">{sale.name}</h2>
                <p className="text-gray-600">{sale.email}</p>
                <p className="text-gray-600">{sale.phone}</p>
              </div>
              <StatusDropdown 
                currentStatus={sale.status} 
                onStatusChange={handleStatusChange}
                statuses={workflowStatuses}
              />
            </div>

            {/* Lead Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Property Type</h3>
                <p className="mt-1">{sale.propertyType}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Door Count</h3>
                <p className="mt-1">{sale.doorCount}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Preferred Date</h3>
                <p className="mt-1">
                  {sale.preferredDate ? new Date(sale.preferredDate).toLocaleDateString() : "Not specified"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                <p className="mt-1">{new Date(sale.timestamp).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500">Message</h3>
              <p className="mt-1 text-gray-700">{sale.message}</p>
            </div>

            {/* Notes History */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Notes History</h3>
                <button
                  onClick={() => setExpandedNotes(!expandedNotes)}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  {expandedNotes ? (
                    <ChevronUpIcon className="h-5 w-5" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {sale.trackingHistory && sale.trackingHistory.length > 0 ? (
                <div className="space-y-4">
                  {expandedNotes && sale.trackingHistory.map((entry, index) => (
                    <div key={index} className="p-4 bg-[#f5f5dc] rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">{entry.status}</span>
                        <span className="text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-gray-700">{entry.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No notes available</p>
              )}
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
} 