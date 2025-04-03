'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TrackingHistory {
  leadId: string;
  contactId?: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  notes: string;
  timestamp: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyType: string;
  doorCount: string;
  timestamp: string;
  status: string;
  message?: string;
  trackingHistory?: TrackingHistory[];
}

// Define status types for consistency
const STATUSES = {
  PENDING: 'pending',
  NOT_AVAILABLE: 'not available',
  CONTACTED: 'contacted',
  SENT_INVOICE: 'sent invoice',
  COMPLETED: 'completed'
};

export default function SalesAdminPage() {
  const [sales, setSales] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    notes: ''
  });
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [dataSource, setDataSource] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>(STATUSES.PENDING);
  const router = useRouter();
  const searchType = 'email';
  const searchValue = selectedLead?.email || '';

  // Fetch sales from the API
  useEffect(() => {
    const fetchSales = async (forceFresh = false) => {
      setLoading(true);
      try {
        // Add cache-busting parameter to force fresh data
        const timestamp = new Date().getTime();
        // Add forceFresh parameter if needed to bypass cache
        const freshParam = forceFresh ? '&fresh=true' : '';
        const response = await fetch(`/api/sales?_=${timestamp}${freshParam}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch sales: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          // Group sales by email to avoid duplicates
          const groupedSales = groupSalesByEmail(data.data);
          setSales(groupedSales);
          
          // Set the data source for displaying to user
          if (data.source) {
            setDataSource(data.source);
            console.log(`Data source: ${data.source}${data.cacheType ? ', type: ' + data.cacheType : ''}`);
          }
          console.log('Fetched sales:', groupedSales.length);
        } else {
          throw new Error(data.message || 'Failed to fetch sales');
        }
      } catch (err) {
        console.error('Error fetching sales:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch sales');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSales();
  }, [refreshTrigger]); // Triggered on refresh change

  // Group sales by email address and keep most recent
  const groupSalesByEmail = (sales: Lead[]): Lead[] => {
    const emailMap: { [key: string]: Lead } = {};
    
    sales.forEach(lead => {
      const email = lead.email;
      
      if (!emailMap[email] || new Date(lead.timestamp) > new Date(emailMap[email].timestamp)) {
        // This is either the first occurrence of this email or a newer one
        emailMap[email] = lead;
      }
    });
    
    return Object.values(emailMap);
  };

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setStatusUpdate({
      status: lead.status,
      notes: ''
    });
    setUpdateSuccess(false);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusUpdate({
      ...statusUpdate,
      status: e.target.value
    });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStatusUpdate({
      ...statusUpdate,
      notes: e.target.value
    });
  };

  const updateLeadStatus = async () => {
    if (!selectedLead) return;
    
    setUpdating(true);
    setError(null);
    
    try {
      console.log('Updating lead status:', {
        leadId: selectedLead.id,
        status: statusUpdate.status,
        notes: statusUpdate.notes
      });
      
      // Call our API to update the lead status
      const response = await fetch('/api/saveToSheet', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadId: selectedLead.id,
          status: statusUpdate.status,
          notes: statusUpdate.notes
        })
      });
      
      const responseData = await response.json();
      console.log('Update response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update lead status');
      }
      
      // Update the lead in the UI
      setSales(sales.map(lead => 
        lead.id === selectedLead.id 
          ? { ...lead, status: statusUpdate.status } 
          : lead
      ));
      
      setSelectedLead({
        ...selectedLead,
        status: statusUpdate.status
      });
      
      setUpdateSuccess(true);
      
      // Clear the update message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
      
      // Force a data refresh after a short delay to get updated data from server
      setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lead status');
      console.error('Error updating lead status:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Function to get data source display text
  const getDataSourceDisplay = () => {
    switch(dataSource) {
      case 'google_sheets':
        return 'Google Sheets';
      case 'in_memory':
        return 'Local Cache';
      case 'mock':
        return 'Mock Data';
      default:
        return 'Unknown Source';
    }
  };

  // Function to manually refresh data with force fresh
  const handleRefresh = (forceFresh = true) => {
    // Increment the refresh trigger to force a re-fetch
    setRefreshTrigger(prev => prev + 1);
    
    // If we want to force fresh data, directly call fetchSales
    if (forceFresh) {
      const fetchFreshSales = async () => {
        setLoading(true);
        try {
          // Add cache-busting parameter and fresh parameter to force fresh data
          const timestamp = new Date().getTime();
          const response = await fetch(`/api/sales?_=${timestamp}&fresh=true`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch sales: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.success && data.data) {
            // Group sales by email to avoid duplicates
            const groupedSales = groupSalesByEmail(data.data);
            setSales(groupedSales);
            
            // Set the data source for displaying to user
            if (data.source) {
              setDataSource(data.source);
              console.log(`Refreshed data source: ${data.source}`);
            }
            console.log('Refreshed sales:', groupedSales.length);
          } else {
            throw new Error(data.message || 'Failed to refresh sales');
          }
        } catch (err) {
          console.error('Error refreshing sales:', err);
          setError(err instanceof Error ? err.message : 'Failed to refresh sales');
        } finally {
          setLoading(false);
        }
      };
      
      fetchFreshSales();
    }
  };

  // Function to change active tab
  const handleTabChange = (status: string) => {
    setActiveTab(status);
    setSelectedLead(null);
  };

  // Filter sales based on active tab
  const filteredSales = sales.filter(lead => lead.status === activeTab);

  // Count sales by status
  const leadCounts = {
    [STATUSES.PENDING]: sales.filter(lead => lead.status === STATUSES.PENDING).length,
    [STATUSES.NOT_AVAILABLE]: sales.filter(lead => lead.status === STATUSES.NOT_AVAILABLE).length,
    [STATUSES.CONTACTED]: sales.filter(lead => lead.status === STATUSES.CONTACTED).length,
    [STATUSES.SENT_INVOICE]: sales.filter(lead => lead.status === STATUSES.SENT_INVOICE).length,
    [STATUSES.COMPLETED]: sales.filter(lead => lead.status === STATUSES.COMPLETED).length,
  };

  // Format the date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString || 'Unknown date';
    }
  };

  if (loading && sales.length === 0) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  if (error && sales.length === 0) return (
    <div className="min-h-screen flex items-center justify-center text-red-600">
      Error: {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Lead Management</h1>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Data Source:</span>
            <span className={`
              px-2 py-1 text-xs rounded-full
              ${dataSource === 'google_sheets' ? 'bg-green-100 text-green-800' : ''}
              ${dataSource === 'in_memory' ? 'bg-blue-100 text-blue-800' : ''}
              ${dataSource === 'mock' ? 'bg-yellow-100 text-yellow-800' : ''}
            `}>
              {getDataSourceDisplay()}
            </span>
            <button 
              onClick={() => handleRefresh(true)}
              className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              aria-label="Refresh data"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        {/* Status Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange(STATUSES.PENDING)}
                className={`${
                  activeTab === STATUSES.PENDING
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Pending ({leadCounts[STATUSES.PENDING]})
              </button>
              <button
                onClick={() => handleTabChange(STATUSES.CONTACTED)}
                className={`${
                  activeTab === STATUSES.CONTACTED
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Contacted ({leadCounts[STATUSES.CONTACTED]})
              </button>
              <button
                onClick={() => handleTabChange(STATUSES.SENT_INVOICE)}
                className={`${
                  activeTab === STATUSES.SENT_INVOICE
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Sent Invoice ({leadCounts[STATUSES.SENT_INVOICE]})
              </button>
              <button
                onClick={() => handleTabChange(STATUSES.COMPLETED)}
                className={`${
                  activeTab === STATUSES.COMPLETED
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Completed ({leadCounts[STATUSES.COMPLETED]})
              </button>
              <button
                onClick={() => handleTabChange(STATUSES.NOT_AVAILABLE)}
                className={`${
                  activeTab === STATUSES.NOT_AVAILABLE
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Not Available ({leadCounts[STATUSES.NOT_AVAILABLE]})
              </button>
            </nav>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lead List */}
          <div className="col-span-1 bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Sales ({filteredSales.length})
              </h2>
            </div>
            <ul className="divide-y divide-gray-200 max-h-[70vh] overflow-y-auto">
              {filteredSales.map(lead => (
                <li 
                  key={lead.id}
                  className={`
                    px-4 py-4 hover:bg-gray-50 cursor-pointer
                    ${selectedLead?.id === lead.id ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1" onClick={() => handleSelectLead(lead)}>
                      <p className="font-medium text-gray-900">{lead.name}</p>
                      <p className="text-sm text-gray-500">{lead.email}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(lead.timestamp)}
                      </p>
                      {lead.trackingHistory && lead.trackingHistory.length > 1 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded mt-1 inline-block">
                          {lead.trackingHistory.length} updates
                        </span>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <Link
                        href={`/admin/support?email=${lead.email}`}
                        className="p-2 text-secondary hover:text-secondary-dark hover:bg-gray-100 rounded-full transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        title="View Activity Logs"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
              {filteredSales.length === 0 && (
                <li className="px-4 py-4 text-center text-gray-500">
                  No sales with status "{activeTab}"
                </li>
              )}
            </ul>
          </div>
          
          {/* Lead Details & Status Update */}
          <div className="col-span-1 md:col-span-2">
            {selectedLead ? (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Lead Details</h2>
                  <Link 
                    href={`/admin/support?${searchType}=${searchValue}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    View Activity Logs
                  </Link>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Lead ID</dt>
                      <dd className="mt-1 text-sm text-gray-900 break-all">{selectedLead.id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedLead.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedLead.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedLead.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedLead.propertyType}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Door Count</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedLead.doorCount}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Submission Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedLead.timestamp)}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Message</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedLead.message || "No message provided"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Current Status</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <span className={`
                          px-2 py-1 text-xs rounded-full
                          ${selectedLead.status === STATUSES.PENDING ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${selectedLead.status === STATUSES.NOT_AVAILABLE ? 'bg-gray-100 text-gray-800' : ''}
                          ${selectedLead.status === STATUSES.CONTACTED ? 'bg-blue-100 text-blue-800' : ''}
                          ${selectedLead.status === STATUSES.SENT_INVOICE ? 'bg-purple-100 text-purple-800' : ''}
                          ${selectedLead.status === STATUSES.COMPLETED ? 'bg-green-100 text-green-800' : ''}
                        `}>
                          {selectedLead.status}
                        </span>
                      </dd>
                    </div>
                  </dl>
                  
                  {/* Status History */}
                  {selectedLead.trackingHistory && selectedLead.trackingHistory.length > 0 && (
                    <div className="mt-8 border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Status History</h3>
                      <div className="flow-root">
                        <ul className="-mb-8">
                          {selectedLead.trackingHistory.map((history, historyIdx) => (
                            <li key={history.leadId || historyIdx}>
                              <div className="relative pb-8">
                                {historyIdx !== selectedLead.trackingHistory!.length - 1 ? (
                                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                ) : null}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className={`
                                      h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white
                                      ${history.status === STATUSES.PENDING ? 'bg-yellow-500' : ''}
                                      ${history.status === STATUSES.NOT_AVAILABLE ? 'bg-gray-500' : ''}
                                      ${history.status === STATUSES.CONTACTED ? 'bg-blue-500' : ''}
                                      ${history.status === STATUSES.SENT_INVOICE ? 'bg-purple-500' : ''}
                                      ${history.status === STATUSES.COMPLETED ? 'bg-green-500' : ''}
                                    `}>
                                      <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-gray-900">
                                        Status: <span className="font-medium">{history.status}</span>
                                      </p>
                                      {history.notes && (
                                        <p className="mt-1 text-sm text-gray-500">
                                          {history.notes}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                      {formatDate(history.timestamp)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900">Update Status</h3>
                    
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          id="status"
                          name="status"
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          value={statusUpdate.status}
                          onChange={handleStatusChange}
                        >
                          <option value={STATUSES.PENDING}>Pending</option>
                          <option value={STATUSES.NOT_AVAILABLE}>Not Available</option>
                          <option value={STATUSES.CONTACTED}>Contacted</option>
                          <option value={STATUSES.SENT_INVOICE}>Sent Invoice</option>
                          <option value={STATUSES.COMPLETED}>Completed</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                          Notes
                        </label>
                        <textarea
                          id="notes"
                          name="notes"
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Add notes about this status update..."
                          value={statusUpdate.notes}
                          onChange={handleNotesChange}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          onClick={updateLeadStatus}
                          disabled={updating}
                        >
                          {updating ? 'Updating...' : 'Update Status'}
                        </button>
                        
                        {updateSuccess && (
                          <span className="text-green-600 text-sm">
                            Status updated successfully!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 flex items-center justify-center h-full">
                <p className="text-gray-500">Select a lead to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 