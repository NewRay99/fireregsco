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
    
    // Check if we should use Supabase instead
    if (process.env.USE_SUPABASE_STORAGE === 'true') {
      console.log('Using Supabase for data storage instead of Google Sheets');
      
      // Forward the request to the Supabase API route
      const supabaseResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/supabase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ formData })
      });
      
      if (!supabaseResponse.ok) {
        const errorData = await supabaseResponse.json();
        throw new Error(`Failed to save to Supabase: ${errorData.message || supabaseResponse.statusText}`);
      }
      
      const supabaseData = await supabaseResponse.json();
      return NextResponse.json(supabaseData);
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
        
        invalidateLeadCaches(formattedData.email, existingContact.id);
        
        return NextResponse.json({
          success: true,
          message: 'Data updated in memory (API fallback)',
          data: existingContact
        });
      } else {
        // Add as new contact
        const newContact = {
          id: contactId,
          ...formattedData,
          trackingHistory
        };
        
        global.contactData.push(newContact);
        
        invalidateLeadCaches(formattedData.email, contactId);
        
        return NextResponse.json({
          success: true,
          message: 'Data saved to memory (API fallback)',
          data: newContact
        });
      }
    }
    
  } catch (error) {
    console.error('Error in saveToSheet POST handler:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// Update lead status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, status, notes, timestamp = new Date().toISOString() } = body;
    
    if (!leadId) {
      throw new Error('Lead ID is required');
    }
    
    if (!status) {
      throw new Error('Status is required');
    }
    
    // Check if we should use Supabase instead
    if (process.env.USE_SUPABASE_STORAGE === 'true') {
      console.log('Using Supabase for data storage instead of Google Sheets');
      
      // Forward the request to the Supabase API route
      const supabaseResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/supabase`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!supabaseResponse.ok) {
        const errorData = await supabaseResponse.json();
        throw new Error(`Failed to update status in Supabase: ${errorData.message || supabaseResponse.statusText}`);
      }
      
      const supabaseData = await supabaseResponse.json();
      return NextResponse.json(supabaseData);
    }
    
    // Google Sheets Web App URL - replace with your deployed Google Apps Script web app URL
    const sheetsWebAppUrl = process.env.GOOGLE_SHEETS_URL || '';
    
    if (!sheetsWebAppUrl) {
      // For development, use the in-memory database
      console.log('Would update lead status in Google Sheets:', { leadId, status, notes });
      
      if (!global.contactData) {
        global.contactData = [];
      }
      
      // Find the contact by lead ID (checking in tracking history)
      let updatedContact = null;
      
      for (const contact of global.contactData) {
        // Check if this contact has the lead we're looking for
        const hasLead = contact.trackingHistory?.some((history: any) => history.leadId === leadId);
        
        if (hasLead) {
          // Update the contact status
          contact.status = status;
          
          // Add a new tracking history entry
          contact.trackingHistory = [
            {
              leadId,
              contactId: contact.id,
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              status,
              notes: notes || `Status updated to ${status}`,
              timestamp
            },
            ...(contact.trackingHistory || [])
          ];
          
          updatedContact = contact;
          break;
        }
      }
      
      if (!updatedContact) {
        throw new Error(`Lead ID ${leadId} not found`);
      }
      
      invalidateLeadCaches(updatedContact.email, updatedContact.id);
      
      return NextResponse.json({
        success: true,
        message: 'Lead status updated in memory',
        data: updatedContact
      });
    }
    
    console.log('Updating lead status in Google Sheets:', { leadId, status, notes });
    
    // Update the status in Google Sheets
    try {
      const response = await fetch(sheetsWebAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            leadId,
            status,
            notes,
            timestamp
          },
          action: 'updateLeadStatus' // Indicate this is a status update
        })
      });
      
      // Log the response status
      console.log('Google Sheets API update response status:', response.status);
      
      // Get the full response text for detailed logging
      const responseText = await response.text();
      console.log('Google Sheets update response:', responseText.substring(0, 200) + '...');
      
      // Try to parse the response as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing update response as JSON:', parseError);
        throw new Error('Failed to parse Google Sheets update response as JSON');
      }
      
      if (!response.ok || !result.success) {
        throw new Error(`Failed to update status in Google Sheets: ${JSON.stringify(result)}`);
      }
      
      console.log('Successfully updated status in Google Sheets:', result);
      
      // Try to update the in-memory cache if available
      if (global.contactData) {
        // Find the contact by lead ID or by the contact ID in the result
        const contactId = result.result?.contactId;
        let updatedContact = null;
        
        for (const contact of global.contactData) {
          // Check if this contact has the lead we're looking for
          // or if it matches the contact ID returned from the API
          const hasLead = contact.trackingHistory?.some((history: any) => history.leadId === leadId);
          const isContact = contact.id === contactId;
          
          if (hasLead || isContact) {
            // Update the contact status
            contact.status = status;
            
            // Add a new tracking history entry
            contact.trackingHistory = [
              {
                leadId,
                contactId: contact.id,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                status,
                notes: notes || `Status updated to ${status}`,
                timestamp
              },
              ...(contact.trackingHistory || [])
            ];
            
            updatedContact = contact;
            break;
          }
        }
        
        if (updatedContact) {
          invalidateLeadCaches(updatedContact.email, updatedContact.id);
        } else {
          // If we didn't find the contact in memory, invalidate the general cache
          invalidateLeadCaches();
        }
      } else {
        // If we don't have any in-memory cache, invalidate the general cache
        invalidateLeadCaches();
      }
      
      return NextResponse.json({
        success: true,
        message: 'Lead status updated in Google Sheets',
        sheetResult: result
      });
      
    } catch (fetchError) {
      console.error('Error communicating with Google Sheets API for status update:', fetchError);
      throw fetchError;
    }
    
  } catch (error) {
    console.error('Error in saveToSheet PUT handler:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 