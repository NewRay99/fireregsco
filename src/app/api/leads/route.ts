import { NextRequest, NextResponse } from 'next/server';
import { sheetDataCache, CACHE_KEYS } from '@/lib/utils/cache';

// Custom type declaration to fix TypeScript errors with global
declare global {
  var contactData: any[];
}

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

// This API fetches lead data from Google Sheets or falls back to mock data
export async function GET(request: NextRequest) {
  try {
    // Check the URL for cache busting parameter
    const url = new URL(request.url);
    const forceFresh = url.searchParams.has('fresh');
    const leadId = url.searchParams.get('id');
    const email = url.searchParams.get('email');
    
    // Check if we have a cached response first (unless force fresh is requested)
    if (!forceFresh) {
      let cachedData = null;
      
      // Try to get specific lead if ID or email is provided
      if (leadId) {
        cachedData = sheetDataCache.get<Lead>(CACHE_KEYS.LEAD_BY_ID(leadId));
        if (cachedData) {
          return NextResponse.json({
            success: true,
            data: [cachedData],
            source: 'cache',
            cacheType: 'id'
          });
        }
      } else if (email) {
        cachedData = sheetDataCache.get<Lead[]>(CACHE_KEYS.LEAD_BY_EMAIL(email));
        if (cachedData) {
          return NextResponse.json({
            success: true,
            data: cachedData,
            source: 'cache',
            cacheType: 'email'
          });
        }
      } else {
        // Try to get all sales from cache
        cachedData = sheetDataCache.get<Lead[]>(CACHE_KEYS.ALL_LEADS);
        if (cachedData) {
          return NextResponse.json({
            success: true,
            data: cachedData,
            source: 'cache',
            cacheType: 'all'
          });
        }
      }
    }
    
    // Cache miss or force fresh, proceed to fetch from Google Sheets
    // Check if we have access to a Google Sheets API
    const sheetsWebAppUrl = process.env.GOOGLE_SHEETS_URL || '';
    
    // If we have a Google Sheets URL, try to fetch from it first
    if (sheetsWebAppUrl) {
      try {
        console.log('Attempting to fetch sales from Google Sheets...');
        
        // Add a timestamp parameter to prevent caching
        const timestamp = new Date().getTime();
        
        // Fetch data from Google Sheets
        const response = await fetch(`${sheetsWebAppUrl}?action=getSales&_=${timestamp}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        // Check if the response is valid
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          const responseText = await response.text();
          
          console.log('Response from Google Sheets:', responseText.substring(0, 200) + '...');
          
          try {
            // Try to parse the response as JSON
            const data = JSON.parse(responseText);
            
            if (data.success && data.sales && Array.isArray(data.sales)) {
              console.log(`Successfully fetched ${data.sales.length} sales from Google Sheets`);
              
              // Log a sample lead structure to debug trackingHistory
              if (data.sales.length > 0) {
                const sampleLead = data.sales[0];
                console.log('Sample lead structure:', {
                  id: sampleLead.id,
                  email: sampleLead.email,
                  status: sampleLead.status,
                  hasTrackingHistory: Array.isArray(sampleLead.trackingHistory),
                  trackingHistoryLength: Array.isArray(sampleLead.trackingHistory) ? sampleLead.trackingHistory.length : 0
                });
                
                // Check if trackingHistory exists and log the first entry
                if (sampleLead.trackingHistory && sampleLead.trackingHistory.length > 0) {
                  console.log('Sample tracking history entry:', sampleLead.trackingHistory[0]);
                  // Check for note vs notes field
                  console.log('Has notes field:', sampleLead.trackingHistory[0].hasOwnProperty('notes'));
                  console.log('Has note field:', sampleLead.trackingHistory[0].hasOwnProperty('note'));
                }
              }
              
              // Ensure all sales have a tracking history array
              const processedSales = data.sales.map((lead: Lead) => {
                // Process tracking history to ensure notes field exists
                let trackingHistory = lead.trackingHistory || [];
                
                // Normalize the tracking history, checking for both note/notes fields
                if (Array.isArray(trackingHistory)) {
                  trackingHistory = trackingHistory.map(item => {
                    // Check if the item has a 'note' field but no 'notes' field
                    if (!item.notes && item.hasOwnProperty('note')) {
                      return {
                        ...item,
                        notes: (item as any).note || '' // Copy note to notes
                      };
                    }
                    return {
                      ...item,
                      notes: item.notes || '' // Ensure notes is always defined
                    };
                  });
                }
                
                return {
                  ...lead,
                  trackingHistory
                };
              });
              
              // Update our in-memory cache for backup
              global.contactData = processedSales;
              
              // Store in cache for future use
              sheetDataCache.set(CACHE_KEYS.ALL_LEADS, processedSales, { ttl: 2 * 60 * 1000 }); // 2 minute TTL
              
              // Cache individual sales by ID and email
              processedSales.forEach((lead: Lead) => {
                sheetDataCache.set(CACHE_KEYS.LEAD_BY_ID(lead.id), lead, { ttl: 5 * 60 * 1000 }); // 5 minute TTL
                
                // Find all sales with the same email (for email-based matching)
                const emailSales = processedSales.filter((l: Lead) => 
                  l.email.toLowerCase() === lead.email.toLowerCase()
                );
                sheetDataCache.set(CACHE_KEYS.LEAD_BY_EMAIL(lead.email), emailSales, { ttl: 5 * 60 * 1000 });
              });
              
              // Handle specific request types
              if (leadId) {
                const requestedLead = processedSales.find((lead: Lead) => lead.id === leadId);
                if (requestedLead) {
                  return NextResponse.json({
                    success: true,
                    data: [requestedLead],
                    source: 'google_sheets'
                  });
                }
              } else if (email) {
                const emailSales = processedSales.filter((lead: Lead) => 
                  lead.email.toLowerCase() === email.toLowerCase()
                );
                if (emailSales.length > 0) {
                  return NextResponse.json({
                    success: true,
                    data: emailSales,
                    source: 'google_sheets'
                  });
                }
              }
              
              // Return all sales if no specific sales requested or found
              return NextResponse.json({
                success: true,
                data: processedSales,
                source: 'google_sheets'
              });
            }
            
            console.log('Invalid data format from Google Sheets:', data);
          } catch (parseError) {
            console.error('Error parsing JSON from Google Sheets:', parseError);
            console.log('Raw response was not valid JSON');
          }
        } else {
          console.error('Bad response from Google Sheets:', response.status, response.statusText);
        }
        
        console.log('Failed to fetch sales from Google Sheets, falling back to in-memory database');
      } catch (error) {
        console.error('Error fetching from Google Sheets:', error);
        console.log('Falling back to in-memory database after error');
      }
    }
    
    // If Google Sheets fetch failed or we don't have a URL, use in-memory database
    if (global.contactData && global.contactData.length > 0) {
      console.log('Returning sales from in-memory database:', global.contactData.length);
      return NextResponse.json({
        success: true,
        data: global.contactData,
        source: 'in_memory'
      });
    }
    
    // If no data available yet, initialize with mock data
    const mockSales = [
      {
        id: 'contact-5678-90ab-cdef',
        name: 'John Smith',
        email: 'john@example.com',
        phone: '07700 900123',
        propertyType: 'HMO',
        doorCount: '25',
        timestamp: new Date().toISOString(),
        status: 'pending',
        message: 'I need an inspection for my property',
        trackingHistory: [
          {
            leadId: 'lead-1234-5678-90ab-cdef',
            contactId: 'contact-5678-90ab-cdef',
            name: 'John Smith',
            email: 'john@example.com',
            phone: '07700 900123',
            status: 'pending',
            notes: 'Initial contact via website',
            timestamp: new Date().toISOString()
          }
        ]
      },
      {
        id: 'contact-6789-01bc-defg',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '07700 900456',
        propertyType: 'Hotel',
        doorCount: '120',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'contacted',
        message: 'Looking for a quote for my hotel',
        trackingHistory: [
          {
            leadId: 'lead-2345-6789-01bc-defg',
            contactId: 'contact-6789-01bc-defg',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            phone: '07700 900456',
            status: 'pending',
            notes: 'Initial contact via website',
            timestamp: new Date(Date.now() - 86400000).toISOString()
          },
          {
            leadId: 'lead-3456-6789-01bc-defg',
            contactId: 'contact-6789-01bc-defg',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            phone: '07700 900456',
            status: 'contacted',
            notes: 'Called client, they are interested',
            timestamp: new Date(Date.now() - 43200000).toISOString()
          }
        ]
      },
      {
        id: 'contact-7890-12cd-efgh',
        name: 'David Williams',
        email: 'david@example.com',
        phone: '07700 900789',
        propertyType: 'Commercial',
        doorCount: '50',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        status: 'sent invoice',
        message: 'Need urgent inspection for compliance reasons',
        trackingHistory: [
          {
            leadId: 'lead-4567-7890-12cd-efgh',
            contactId: 'contact-7890-12cd-efgh',
            name: 'David Williams',
            email: 'david@example.com',
            phone: '07700 900789',
            status: 'pending',
            notes: 'Initial contact via website',
            timestamp: new Date(Date.now() - 172800000).toISOString()
          },
          {
            leadId: 'lead-5678-7890-12cd-efgh',
            contactId: 'contact-7890-12cd-efgh',
            name: 'David Williams',
            email: 'david@example.com',
            phone: '07700 900789',
            status: 'contacted',
            notes: 'Client needs inspection ASAP',
            timestamp: new Date(Date.now() - 129600000).toISOString()
          },
          {
            leadId: 'lead-6789-7890-12cd-efgh',
            contactId: 'contact-7890-12cd-efgh',
            name: 'David Williams',
            email: 'david@example.com',
            phone: '07700 900789',
            status: 'sent invoice',
            notes: 'Invoice #INV-2023-456 sent',
            timestamp: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      }
    ];
    
    // Initialize our in-memory database with mock data if it doesn't exist
    if (!global.contactData) {
      global.contactData = mockSales;
      console.log('Initialized in-memory database with mock data');
    }
    
    return NextResponse.json({
      success: true,
      data: global.contactData,
      source: 'mock'
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch sales',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 