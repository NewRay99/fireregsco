import { NextRequest, NextResponse } from 'next/server';
import { sheetDataCache, CACHE_KEYS } from '@/lib/utils/cache';

// Custom type declaration to fix TypeScript errors with global
declare global {
  var contactData: any[];
}

// Type for contact and tracking data
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

/**
 * Helper function to invalidate relevant caches when data changes
 */
function invalidateLeadCaches(email?: string, id?: string) {
  console.log(`[Cache] Invalidating caches for changes to lead: ${id || 'unknown ID'}, email: ${email || 'unknown email'}`);
  
  // Always invalidate the all leads cache
  sheetDataCache.invalidate(CACHE_KEYS.ALL_LEADS);
  
  // Invalidate specific caches if we have email or ID
  if (email) {
    sheetDataCache.invalidate(CACHE_KEYS.LEAD_BY_EMAIL(email));
  }
  
  if (id) {
    sheetDataCache.invalidate(CACHE_KEYS.LEAD_BY_ID(id));
  }
}

// Enhanced Google Sheets API integration with lead tracking
// This handles saving to both a contacts sheet and a lead tracking sheet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formData } = body;
    
    // Check if we have form data
    if (!formData) {
      throw new Error('No form data provided');
    }
    
    // Format the data for Google Sheets
    const timestamp = new Date().toISOString();
    const formattedData = {
      timestamp,
      name: formData.name || '',
      email: formData.email || '',
      phone: formData.phone || '',
      propertyType: formData.propertyType || '',
      doorCount: formData.doorCount || '',
      preferredDate: formData.preferredDate || '',
      message: formData.message || '',
      status: 'pending' // Initial status for all new leads
    };
    
    // Google Sheets Web App URL - replace with your deployed Google Apps Script web app URL
    const sheetsWebAppUrl = process.env.GOOGLE_SHEETS_URL || '';
    
    if (!sheetsWebAppUrl) {
      // For development, just log the data if no URL is configured
      console.log('Would save to Google Sheets:', formattedData);
      
      // In development mode, save to local contacts array for demo purposes
      if (!global.contactData) {
        global.contactData = [];
      }
      
      // Generate a mock contact ID and lead ID
      const contactId = 'contact-' + Math.random().toString(36).substring(2, 15);
      const leadId = 'lead-' + Math.random().toString(36).substring(2, 15);
      
      // Create initial tracking history
      const trackingHistory = [{
        leadId,
        contactId,
        name: formattedData.name,
        email: formattedData.email,
        phone: formattedData.phone,
        status: formattedData.status,
        notes: 'Initial contact via website',
        timestamp: formattedData.timestamp
      }];
      
      // Save to memory-based mock database
      global.contactData.push({
        id: contactId,
        ...formattedData,
        trackingHistory
      });
      
      console.log('Saved to mock database. Current contacts:', global.contactData.length);
      
      invalidateLeadCaches(formattedData.email, contactId);
      
      return NextResponse.json({
        success: true,
        message: 'Data logged (Google Sheets URL not configured)',
        data: {
          ...formattedData,
          id: contactId,
          trackingHistory
        }
      });
    }
    
    console.log('Attempting to send data to Google Sheets URL:', sheetsWebAppUrl);
    
    // Send the data to Google Sheets - specify we want to save to both sheets
    try {
      const response = await fetch(sheetsWebAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: formattedData,
          action: 'saveNewLead' // Indicate this is a new lead
        })
      });
      
      // Log the response status
      console.log('Google Sheets API response status:', response.status);
      
      // Get the full response text for detailed logging
      const responseText = await response.text();
      console.log('Google Sheets response:', responseText.substring(0, 200) + '...');
      
      // Try to parse the response as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        throw new Error('Failed to parse Google Sheets response as JSON');
      }
      
      if (!response.ok || !result.success) {
        throw new Error(`Failed to save to Google Sheets: ${JSON.stringify(result)}`);
      }
      
      console.log('Successfully saved to Google Sheets:', result);
      
      // Initialize in-memory cache if needed
      if (!global.contactData) {
        global.contactData = [];
      }
      
      // Create tracking history for the contact
      const trackingHistory = [{
        leadId: result.result?.leadId || ('lead-' + Math.random().toString(36).substring(2, 15)),
        contactId: result.result?.contactId || ('contact-' + Math.random().toString(36).substring(2, 15)),
        name: formattedData.name,
        email: formattedData.email,
        phone: formattedData.phone,
        status: formattedData.status,
        notes: 'Initial contact via website',
        timestamp: formattedData.timestamp
      }];
      
      // Save to memory-based cache as backup
      const contactEntry = {
        id: result.result?.contactId || ('contact-' + Math.random().toString(36).substring(2, 15)),
        ...formattedData,
        trackingHistory
      };
      
      // Check if we already have this email in the cache
      const existingIndex = global.contactData.findIndex(c => c.email === formattedData.email);
      if (existingIndex >= 0) {
        // Update existing contact
        global.contactData[existingIndex] = {
          ...global.contactData[existingIndex],
          ...contactEntry,
          trackingHistory: [
            ...trackingHistory,
            ...(global.contactData[existingIndex].trackingHistory || [])
          ]
        };
      } else {
        // Add new contact
        global.contactData.push(contactEntry);
      }
      
      invalidateLeadCaches(formattedData.email, contactEntry.id);
      
      return NextResponse.json({
        success: true,
        message: 'Data saved to contact and lead tracking sheets',
        data: contactEntry,
        sheetResult: result
      });
      
    } catch (fetchError) {
      console.error('Error communicating with Google Sheets API:', fetchError);
      
      // Fall back to the mock data storage in case of API failure
      if (!global.contactData) {
        global.contactData = [];
      }
      
      // Generate mock IDs
      const contactId = 'contact-' + Math.random().toString(36).substring(2, 15);
      const leadId = 'lead-' + Math.random().toString(36).substring(2, 15);
      
      // Create tracking history
      const trackingHistory = [{
        leadId,
        contactId,
        name: formattedData.name,
        email: formattedData.email,
        phone: formattedData.phone,
        status: formattedData.status,
        notes: 'Initial contact via website (API fallback)',
        timestamp: formattedData.timestamp
      }];
      
      // Check if we already have this email
      const existingContact = global.contactData.find(c => c.email === formattedData.email);
      
      if (existingContact) {
        // Update existing contact
        existingContact.trackingHistory = [
          ...trackingHistory,
          ...(existingContact.trackingHistory || [])
        ];
        existingContact.status = formattedData.status;
        existingContact.timestamp = formattedData.timestamp;
      } else {
        // Add new contact
        global.contactData.push({
          id: contactId,
          ...formattedData,
          trackingHistory
        });
      }
      
      console.log('API failed, saved to mock database. Current contacts:', global.contactData.length);
      
      invalidateLeadCaches(formattedData.email, contactId);
      
      // Return success response with fallback notice
      return NextResponse.json({
        success: true,
        message: 'Data saved to local storage (Google Sheets API unavailable)',
        data: {
          id: contactId,
          ...formattedData,
          trackingHistory
        },
        error: fetchError instanceof Error ? fetchError.message : String(fetchError)
      });
    }
    
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    
    invalidateLeadCaches();
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to save to Google Sheets',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// API endpoint to update lead status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, status, notes } = body;
    
    console.log('Received status update request:', { leadId, status, notes });
    
    if (!leadId || !status) {
      throw new Error('Lead ID and status are required');
    }
    
    // Validate status
    const validStatuses = ['pending', 'not available', 'contacted', 'sent invoice', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Google Sheets Web App URL
    const sheetsWebAppUrl = process.env.GOOGLE_SHEETS_URL || '';
    const timestamp = new Date().toISOString();
    
    if (!sheetsWebAppUrl) {
      console.log('Would update lead status:', { leadId, status, notes });
      
      // In development mode, update the mock database
      if (global.contactData) {
        // Find contact by ID or by checking the IDs in tracking history
        let contact = global.contactData.find(c => c.id === leadId);
        
        if (!contact) {
          // Try to find by tracking history
          contact = global.contactData.find(c => 
            c.trackingHistory?.some((h: TrackingHistory) => h.leadId === leadId || h.contactId === leadId)
          );
        }
        
        if (contact) {
          // Update the contact status
          contact.status = status;
          
          // Add a new entry to tracking history
          const newHistoryEntry = {
            leadId: 'lead-' + Math.random().toString(36).substring(2, 15),
            contactId: contact.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            status,
            notes: notes || 'Status updated (mock mode)',
            timestamp
          };
          
          if (!contact.trackingHistory) {
            contact.trackingHistory = [];
          }
          
          // Add to beginning (for descending order)
          contact.trackingHistory.unshift(newHistoryEntry);
          
          console.log('Updated mock lead status:', contact.id, status);
          
          // Invalidate caches for this contact
          invalidateLeadCaches(contact.email, contact.id);
        } else {
          console.warn('Lead not found in mock database:', leadId);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Status update logged (Google Sheets URL not configured)',
        data: { leadId, status, notes, timestamp }
      });
    }
    
    console.log('Sending status update to Google Sheets:', { leadId, status, notes, timestamp });
    
    try {
      // Send the update to Google Sheets
      const response = await fetch(sheetsWebAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadId,
          status,
          notes: notes || '',
          timestamp,
          action: 'updateLeadStatus'
        })
      });
      
      console.log('Status update response status:', response.status);
      
      // Get the full response for detailed logging
      const responseText = await response.text();
      console.log('Status update response:', responseText.substring(0, 200) + '...');
      
      // Try to parse the response as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        throw new Error('Failed to parse response as JSON');
      }
      
      if (!response.ok || !result.success) {
        throw new Error(`Failed to update lead status: ${JSON.stringify(result)}`);
      }
      
      console.log('Successfully updated lead status:', result);
      
      // Update local cache for backup
      if (global.contactData) {
        // Find the contact by lead ID or tracking history
        let contact = global.contactData.find(c => c.id === leadId);
        
        if (!contact) {
          // Try to find by tracking history
          contact = global.contactData.find(c => 
            c.trackingHistory?.some((h: TrackingHistory) => h.leadId === leadId || h.contactId === leadId)
          );
        }
        
        if (contact) {
          // Update contact status
          contact.status = status;
          
          // Add new tracking history entry
          const newHistoryEntry = {
            leadId: result.result?.newLeadId || ('lead-' + Math.random().toString(36).substring(2, 15)),
            contactId: result.result?.contactId || contact.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            status,
            notes: notes || 'Status updated',
            timestamp
          };
          
          if (!contact.trackingHistory) {
            contact.trackingHistory = [];
          }
          
          // Add to beginning (for descending order)
          contact.trackingHistory.unshift(newHistoryEntry);
          
          console.log('Updated local cache with new status:', status);
          
          // Invalidate caches for this contact
          invalidateLeadCaches(contact.email, contact.id);
        }
      }
      
      invalidateLeadCaches();
      
      return NextResponse.json({
        success: true,
        message: 'Lead status updated successfully',
        sheetResult: result
      });
      
    } catch (fetchError) {
      console.error('Error communicating with Google Sheets API for status update:', fetchError);
      
      // Update mock database as fallback
      if (global.contactData) {
        // Find contact by checking ID and tracking history
        let contact = global.contactData.find(c => c.id === leadId);
        
        if (!contact) {
          // Try to find by tracking history
          contact = global.contactData.find(c => 
            c.trackingHistory?.some((h: TrackingHistory) => h.leadId === leadId || h.contactId === leadId)
          );
        }
        
        if (contact) {
          // Update contact status
          contact.status = status;
          
          // Add new tracking history entry
          const newHistoryEntry = {
            leadId: 'lead-' + Math.random().toString(36).substring(2, 15),
            contactId: contact.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            status,
            notes: notes || 'Status updated (API fallback)',
            timestamp
          };
          
          if (!contact.trackingHistory) {
            contact.trackingHistory = [];
          }
          
          // Add to beginning (for descending order)
          contact.trackingHistory.unshift(newHistoryEntry);
          
          console.log('API failed, updated mock lead status:', contact.id, status);
          
          // Invalidate caches for this contact
          invalidateLeadCaches(contact.email, contact.id);
        } else {
          console.warn('Lead not found in mock database:', leadId);
        }
      }
      
      invalidateLeadCaches();
      
      // Return success response with fallback notice
      return NextResponse.json({
        success: true,
        message: 'Status updated in local storage (Google Sheets API unavailable)',
        data: { leadId, status, notes, timestamp },
        error: fetchError instanceof Error ? fetchError.message : String(fetchError)
      });
    }
    
  } catch (error) {
    console.error('Error updating lead status:', error);
    
    invalidateLeadCaches();
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update lead status',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 