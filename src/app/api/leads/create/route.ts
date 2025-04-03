// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { sheetDataCache, CACHE_KEYS } from '@/lib/utils/cache';
import { getServiceSupabase, formatLeadForSupabase, formatStatusTrackingForSupabase, formatLeadFromSupabase, formatStatusTrackingFromSupabase } from '@/lib/supabase';

interface TrackingHistory {
  leadId: string;
  contactId?: string;
  name?: string;
  email?: string;
  phone?: string;
  status: string;
  notes: string;
  timestamp: string;
}

interface Lead {
  id?: string;
  name: string;
  email: string;
  phone: string;
  propertyType: string;
  doorCount: string;
  timestamp?: string;
  status?: string;
  preferredDate?: string;
  message?: string;
  trackingHistory?: TrackingHistory[];
}

interface StatusTracking {
  lead_id: string;
  status: string;
  notes: string;
  created_at: string;
}

interface FormattedLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  status: string;
  preferred_date?: string;
  created_at: string;
  updated_at: string;
  status_tracking?: StatusTracking[];
  trackingHistory: TrackingHistory[];
}

/**
 * API endpoint to create a new lead in Supabase
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.phone) {
      return NextResponse.json({
        success: false,
        message: 'Name, email, and phone are required fields'
      }, { status: 400 });
    }
    
    // Initialize Supabase client with service role
    const supabase = getServiceSupabase();
    
    // Format the lead data for Supabase
    const leadData: Lead = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      propertyType: body.propertyType || 'Unspecified',
      doorCount: body.doorCount || 'Unspecified',
      message: body.message || '',
      preferredDate: body.preferredDate || '',
      status: body.status || 'pending' // Default status
    };
    
    const formattedLead = formatLeadForSupabase(leadData);
    
    // Insert the lead
    const { data: lead, error } = await supabase
      .from('sales')
      .insert(formattedLead)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json({
        success: false,
        message: `Failed to create lead: ${error.message}`
      }, { status: 500 });
    }
    
    // Add the initial status tracking entry
    const trackingData: StatusTracking = {
      lead_id: lead.id,
      status: lead.status,
      notes: body.notes || 'Initial contact via website',
      created_at: lead.created_at
    };
    
    const { data: trackingEntry, error: trackingError } = await supabase
      .from('status_tracking')
      .insert(formatStatusTrackingForSupabase(trackingData))
      .select()
      .single();
    
    if (trackingError) {
      console.error('Error creating tracking entry:', trackingError);
      // Continue since the lead was created successfully
    }
    
    // Format the lead for response
    const formattedResponse: FormattedLead = {
      ...formatLeadFromSupabase(lead),
      trackingHistory: trackingEntry ? [{
        leadId: trackingEntry.lead_id,
        status: trackingEntry.status,
        notes: trackingEntry.notes,
        timestamp: trackingEntry.created_at
      }] : []
    };
    
    // Invalidate any related caches
    sheetDataCache.invalidate(CACHE_KEYS.ALL_LEADS);
    sheetDataCache.invalidateByPrefix('lead_email_');
    
    return NextResponse.json({
      success: true,
      message: 'Lead created successfully',
      data: formattedResponse
    });
    
  } catch (error) {
    console.error('Error in create lead API:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    }, { status: 500 });
  }
} 