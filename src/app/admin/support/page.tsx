'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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
  message?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  trackingHistory?: TrackingHistory[];
}

export default function LeadLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'email' | 'id'>('email');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Get search parameters from URL
  const searchParams = useSearchParams();
  
  // Fetch all leads on page load for local searching
  useEffect(() => {
    const fetchLeads = async (forceFresh = false) => {
      try {
        setIsSearching(true);
        // Add forceFresh parameter if needed to bypass cache
        const freshParam = forceFresh ? '&fresh=true' : '';
        const response = await fetch(`/api/leads?_=${new Date().getTime()}${freshParam}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch leads data');
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          // Debug the structure of data coming from API
          console.log('API Response Data:', data);
          
          // Log data source information
          if (data.source) {
            console.log(`Data source: ${data.source}${data.cacheType ? ', type: ' + data.cacheType : ''}`);
          }
          
          // Check if any leads have tracking history with notes
          const hasTrackingHistory = data.data.some((lead: Lead) => 
            lead.trackingHistory && lead.trackingHistory.length > 0
          );
          console.log('Has tracking history:', hasTrackingHistory);
          
          if (hasTrackingHistory) {
            // Find a lead with tracking history and log it
            const leadWithHistory = data.data.find((lead: Lead) => 
              lead.trackingHistory && lead.trackingHistory.length > 0
            );
            if (leadWithHistory) {
              console.log('Sample tracking history:', leadWithHistory.trackingHistory);
              
              // Log the first tracking history item in detail
              if (leadWithHistory.trackingHistory && leadWithHistory.trackingHistory.length > 0) {
                const firstHistoryItem = leadWithHistory.trackingHistory[0];
                console.log('First tracking history item keys:', Object.keys(firstHistoryItem));
                console.log('First tracking history notes field:', firstHistoryItem.notes);
                console.log('First item raw data:', JSON.stringify(firstHistoryItem));
                
                // Check if there are any tracking history items with notes
                const historyWithNotes = leadWithHistory.trackingHistory.filter((item: TrackingHistory) => {
                  // Log each item to check note field
                  console.log(`Item for ${item.email} status=${item.status}:`, 
                    item.notes, 
                    item.hasOwnProperty('note') ? (item as any)['note'] : 'no note field',
                    item.hasOwnProperty('notes') ? item.notes : 'no notes field'
                  );
                  return item.notes && item.notes.trim() !== '';
                });
                console.log('Tracking history items with notes:', historyWithNotes.length);
                if (historyWithNotes.length > 0) {
                  console.log('Sample item with notes:', historyWithNotes[0]);
                }
              }
            }
          }
          
          setAllLeads(data.data);
          
          // Check for URL parameters after leads are loaded
          const emailParam = searchParams.get('email');
          const idParam = searchParams.get('id');
          
          if (emailParam) {
            setSearchType('email');
            setSearchTerm(emailParam);
            performSearch(emailParam, 'email', data.data);
          } else if (idParam) {
            setSearchType('id');
            setSearchTerm(idParam);
            performSearch(idParam, 'id', data.data);
          }
        } else {
          throw new Error(data.message || 'Failed to load leads');
        }
      } catch (err: any) {
        console.error('Error fetching leads:', err);
        setErrorMessage(err.message || 'An error occurred while fetching leads');
      } finally {
        setIsSearching(false);
      }
    };
    
    fetchLeads();
  }, [searchParams]);

  // Function to perform search with given term, type and data
  const performSearch = (term: string, type: 'email' | 'id', leadsData: Lead[] = allLeads) => {
    if (!term.trim()) {
      setSearchResults([]);
      setSelectedLead(null);
      return;
    }

    try {
      let results: Lead[] = [];
      
      if (type === 'email') {
        // Case-insensitive email search
        results = leadsData.filter(lead => 
          lead.email.toLowerCase().includes(term.toLowerCase())
        );
      } else {
        // Exact ID match
        results = leadsData.filter(lead => lead.id === term);
      }
      
      setSearchResults(results);
      
      // Automatically select the lead if there's exactly one result
      // This will expand the details immediately when coming from the leads page
      if (results.length === 1) {
        setSelectedLead(results[0]);
        console.log('Auto-selected lead tracking history:', results[0].trackingHistory);
      } else {
        setSelectedLead(null);
      }
      
      if (results.length === 0) {
        setErrorMessage(`No leads found with ${type} ${term}`);
      }
    } catch (err: any) {
      console.error('Error searching leads:', err);
      setErrorMessage(err.message || 'An error occurred while searching');
    }
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSearching(true);
    setErrorMessage('');
    
    performSearch(searchTerm, searchType);
    
    setIsSearching(false);
  };

  // Function to format date in a more readable way
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  // Function to calculate time difference in a human-readable format
  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs} second${diffSecs === 1 ? '' : 's'} ago`;
    
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
    
    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
  };

  // Function to manually refresh data and force fresh fetch
  const handleRefresh = async () => {
    setIsSearching(true);
    try {
      // Force fresh data by adding fresh=true parameter
      const response = await fetch(`/api/leads?_=${new Date().getTime()}&fresh=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leads data');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('Refreshed leads data from source:', data.source);
        setAllLeads(data.data);
        
        // Re-run search with the fresh data if we have a search term
        if (searchTerm) {
          performSearch(searchTerm, searchType, data.data);
        }
      } else {
        throw new Error(data.message || 'Failed to refresh leads');
      }
    } catch (err: any) {
      console.error('Error refreshing leads:', err);
      setErrorMessage(err.message || 'An error occurred while refreshing leads');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold leading-tight text-dark font-heading">Lead Activity Logs</h1>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={handleRefresh}
            disabled={isSearching}
            className="btn btn-secondary inline-flex items-center px-4 py-2 ml-3"
            aria-label="Refresh data"
          >
            {isSearching ? (
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

      {/* Search Form */}
      <div className="bg-white shadow rounded-lg mt-6 p-6">
        <h2 className="text-lg font-medium text-dark font-heading mb-4">Search Lead Activity</h2>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
            <div className="w-full md:w-1/3">
              <label htmlFor="search-type" className="block text-sm font-medium text-dark">
                Search By
              </label>
              <select
                id="search-type"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'email' | 'id')}
              >
                <option value="email">Email</option>
                <option value="id">Lead ID</option>
              </select>
            </div>

            <div className="w-full md:w-2/3">
              <label htmlFor="search-term" className="block text-sm font-medium text-dark">
                {searchType === 'email' ? 'Email Address' : 'Lead ID'}
              </label>
              <input
                type={searchType === 'email' ? 'email' : 'text'}
                id="search-term"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder={searchType === 'email' ? 'Enter email address' : 'Enter lead ID'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary px-4 py-2"
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-6 bg-primary-light bg-opacity-10 border-l-4 border-primary p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-dark">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && !selectedLead && (
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-dark font-heading">
              Search Results
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-dark">
              {searchResults.length} lead{searchResults.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {searchResults.map((lead) => (
                <li key={lead.id} className="px-4 py-4 sm:px-6 hover:bg-light cursor-pointer" onClick={() => setSelectedLead(lead)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate">
                        {lead.name}
                      </p>
                      <p className="mt-1 text-sm text-dark">
                        {lead.email}
                      </p>
                      <p className="mt-1 text-xs text-dark opacity-70">
                        ID: {lead.id}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        lead.status === 'pending' ? 'bg-yellow-100 text-dark' : 
                        lead.status === 'contacted' ? 'bg-secondary-light text-dark' : 
                        lead.status === 'sent invoice' ? 'bg-purple-100 text-dark' : 
                        lead.status === 'completed' ? 'bg-green-100 text-dark' : 
                        'bg-gray-100 text-dark'
                      }`}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Selected Lead Details */}
      {selectedLead && (
        <div className="mt-6 space-y-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-dark font-heading">
                  Lead Details
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-dark opacity-75">
                  Created on {formatDate(selectedLead.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="inline-flex items-center px-3 py-1 border border-secondary shadow-sm text-sm font-medium rounded-md text-dark bg-white hover:bg-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              >
                Back to Results
              </button>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-dark opacity-75">Full name</dt>
                  <dd className="mt-1 text-sm text-dark">{selectedLead.name}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-dark opacity-75">Email address</dt>
                  <dd className="mt-1 text-sm text-dark">{selectedLead.email}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-dark opacity-75">Phone number</dt>
                  <dd className="mt-1 text-sm text-dark">{selectedLead.phone || 'Not provided'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-dark opacity-75">Current status</dt>
                  <dd className="mt-1 text-sm text-dark">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedLead.status === 'pending' ? 'bg-yellow-100 text-dark' : 
                      selectedLead.status === 'contacted' ? 'bg-secondary-light text-dark' : 
                      selectedLead.status === 'sent invoice' ? 'bg-purple-100 text-dark' : 
                      selectedLead.status === 'completed' ? 'bg-green-100 text-dark' : 
                      'bg-gray-100 text-dark'
                    }`}>
                      {selectedLead.status.charAt(0).toUpperCase() + selectedLead.status.slice(1)}
                    </span>
                  </dd>
                </div>
                {selectedLead.message && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-dark opacity-75">Message</dt>
                    <dd className="mt-1 text-sm text-dark whitespace-pre-wrap">{selectedLead.message}</dd>
                  </div>
                )}
                {selectedLead.notes && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-dark opacity-75">Latest Notes</dt>
                    <dd className="mt-1 text-sm text-dark whitespace-pre-wrap">{selectedLead.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-dark font-heading">
                Activity Log
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-dark opacity-75">
                Complete history of status changes and notes (newest first)
              </p>
            </div>
            <div className="border-t border-gray-200">
              {selectedLead.trackingHistory && selectedLead.trackingHistory.length > 0 ? (
                <div className="flow-root">
                  <ul className="relative divide-y divide-gray-200">
                    {/* Mapping through tracking history in descending order (newest first) */}
                    {[...selectedLead.trackingHistory]
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((activity, idx) => (
                        <li key={idx} className="relative pb-4 pl-6 pt-4 sm:pl-10 lg:pl-12">
                          <div className="relative flex items-start space-x-3">
                            <div className="relative">
                              <span className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white ${
                                activity.status === 'pending' ? 'bg-yellow-100' : 
                                activity.status === 'contacted' ? 'bg-secondary-light' : 
                                activity.status === 'sent invoice' ? 'bg-purple-100' : 
                                activity.status === 'completed' ? 'bg-green-100' : 
                                'bg-gray-100'
                              }`}>
                                {activity.status === 'completed' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-dark">
                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                  </svg>
                                ) : activity.status === 'sent invoice' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-dark">
                                    <path fillRule="evenodd" d="M1 11.27c0-.246.033-.492.099-.73l1.523-5.521A2.75 2.75 0 015.273 3h9.454a2.75 2.75 0 012.651 2.019l1.523 5.52c.066.239.099.485.099.732V15a2 2 0 01-2 2H3a2 2 0 01-2-2v-3.73zm3.068-5.852A1.25 1.25 0 015.273 4.5h9.454a1.25 1.25 0 011.205.918l1.523 5.52c.006.02.01.041.015.062H3.53a.75.75 0 00-.015-.062l1.553-5.62z" clipRule="evenodd" />
                                  </svg>
                                ) : activity.status === 'contacted' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-dark">
                                    <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                                    <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-dark">
                                    <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
                                  </svg>
                                )}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-dark">
                                  Status updated to {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                </div>
                                <time dateTime={activity.timestamp} className="ml-2 flex-shrink-0 whitespace-nowrap text-xs text-dark opacity-75">
                                  {formatDate(activity.timestamp)}
                                </time>
                              </div>
                              <p className="mt-0.5 text-sm text-dark opacity-75">
                                {getTimeSince(activity.timestamp)}
                              </p>
                              {activity.notes && (
                                <div className="mt-2 text-sm text-dark bg-light p-3 rounded-md border-l-4 border-secondary">
                                  <p className="whitespace-pre-wrap font-medium">Notes:</p>
                                  <p className="whitespace-pre-wrap">{activity.notes}</p>
                                </div>
                              )}
                              {!activity.notes && (activity as any).note && (
                                <div className="mt-2 text-sm text-dark bg-light p-3 rounded-md border-l-4 border-secondary">
                                  <p className="whitespace-pre-wrap font-medium">Notes:</p>
                                  <p className="whitespace-pre-wrap">{(activity as any).note}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    
                    {/* Initial submission entry at the end */}
                    <li key="initial" className="relative pb-4 pl-6 pt-4 sm:pl-10 lg:pl-12">
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-light ring-8 ring-white">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-dark">
                              <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                            </svg>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-dark">
                              Initial Submission
                            </div>
                            <time dateTime={selectedLead.createdAt} className="ml-2 flex-shrink-0 whitespace-nowrap text-xs text-dark opacity-75">
                              {formatDate(selectedLead.createdAt)}
                            </time>
                          </div>
                          <p className="mt-0.5 text-sm text-dark opacity-75">
                            {getTimeSince(selectedLead.createdAt)}
                          </p>
                          <div className="mt-2 text-sm text-dark">
                            <p>Contact form submitted with status <span className="font-medium">pending</span></p>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="px-4 py-5 sm:px-6 text-center">
                  <p className="text-sm text-dark opacity-75">No activity history available</p>
                </div>
              )}
            </div>
          </div>

          {/* Link to lead details page */}
          <div className="flex justify-between">
            <Link 
              href={`/admin/leads?id=${selectedLead.id}`}
              className="btn btn-primary inline-flex items-center px-4 py-2"
            >
              Go to Lead Management
            </Link>
            <button
              onClick={() => setSelectedLead(null)}
              className="btn btn-outline inline-flex items-center px-4 py-2"
            >
              Back to Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 