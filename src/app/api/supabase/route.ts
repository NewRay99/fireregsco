import { NextRequest, NextResponse } from 'next/server';
import { 
  getServiceSupabase, 
  formatLeadForSupabase, 
  formatStatusTrackingForSupabase 
} from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { sheetDataCache, CACHE_KEYS } from '@/lib/utils/cache';

// Helper function to generate a unique ID
const generateId = () => {
  return 'lead_' + uuidv4().replace(/-/g, '');
};

// Helper function to invalidate caches
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

// POST handler for creating new leads
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formData } = body;
    
    // Check if we have form data
    if (!formData) {
      throw new Error('No form data provided');
    }
    
    const supabase = getServiceSupabase();
    
    // Generate IDs
    const leadId = generateId();
    
    // Format the data for Supabase
    const leadData = formatLeadForSupabase({
      ...formData,
      id: leadId  // Include the generated ID
    });
    
    // Insert the lead into Supabase
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();
    
    if (leadError) {
      console.error('Error inserting lead:', leadError);
      throw new Error(`Failed to insert lead: ${leadError.message}`);
    }
    
    // Create initial status tracking entry
    const initialStatus = {
      lead_id: leadId,
      status: formData.status || 'pending',
      notes: 'Initial contact via website',
      created_at: new Date().toISOString()
    };
    
    const { data: statusTracking, error: statusError } = await supabase
      .from('status_tracking')
      .insert(initialStatus);
    
    if (statusError) {
      console.error('Error inserting status tracking:', statusError);
      // We don't want to fail the whole request if just the status tracking fails
      console.warn('Lead was created but status tracking failed');
    }
    
    // Invalidate relevant caches
    invalidateLeadCaches(formData.email, leadId);
    
    return NextResponse.json({
      success: true,
      message: 'Lead saved to Supabase',
      leadId,
      data: lead
    });
    
  } catch (error) {
    console.error('Error in Supabase POST handler:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

// PUT handler for updating lead status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, status, notes, timestamp } = body;
    
    if (!leadId) {
      throw new Error('Lead ID is required');
    }
    
    if (!status) {
      throw new Error('Status is required');
    }
    
    const supabase = getServiceSupabase();
    
    // First, update the lead status
    const { data: leadData, error: leadUpdateError } = await supabase
      .from('leads')
      .update({ 
        status, 
        updated_at: timestamp || new Date().toISOString() 
      })
      .eq('id', leadId)
      .select()
      .single();
    
    if (leadUpdateError) {
      console.error('Error updating lead status:', leadUpdateError);
      throw new Error(`Failed to update lead status: ${leadUpdateError.message}`);
    }
    
    // Next, add a new status tracking entry
    const statusData = formatStatusTrackingForSupabase({
      lead_id: leadId,
      status,
      notes,
      timestamp: timestamp || new Date().toISOString()
    });
    
    const { data: statusTracking, error: statusTrackingError } = await supabase
      .from('status_tracking')
      .insert(statusData);
    
    if (statusTrackingError) {
      console.error('Error inserting status tracking:', statusTrackingError);
      // Don't fail the whole request if just the tracking insert fails
      console.warn('Lead status was updated but status tracking entry failed');
    }
    
    // Get the lead email for cache invalidation
    let email = '';
    if (leadData) {
      email = leadData.email;
    } else {
      // If we didn't get the email from the update, fetch it
      const { data: lead } = await supabase
        .from('leads')
        .select('email')
        .eq('id', leadId)
        .single();
      
      if (lead) {
        email = lead.email;
      }
    }
    
    // Invalidate relevant caches
    invalidateLeadCaches(email, leadId);
    
    return NextResponse.json({
      success: true,
      message: 'Lead status updated',
      data: {
        leadId,
        status,
        updated_at: timestamp || new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error in Supabase PUT handler:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

// GET handler for retrieving leads
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const email = url.searchParams.get('email');
    const status = url.searchParams.get('status');
    const fresh = url.searchParams.get('fresh') === 'true';
    
    const supabase = getServiceSupabase();
    
    // Check if we can use the cache
    if (!fresh) {
      let cacheKey = '';
      
      if (id) {
        cacheKey = CACHE_KEYS.LEAD_BY_ID(id);
      } else if (email) {
        cacheKey = CACHE_KEYS.LEAD_BY_EMAIL(email);
      } else {
        cacheKey = CACHE_KEYS.ALL_LEADS;
      }
      
      const cachedData = sheetDataCache.get(cacheKey);
      if (cachedData) {
        console.log(`[Cache] Using cached data for ${cacheKey}`);
        return NextResponse.json({
          success: true,
          data: cachedData,
          source: 'cache',
          cacheType: 'memory'
        });
      }
    }
    
    // Build the query based on parameters
    let query = supabase.from('leads').select('*');
    
    if (id) {
      query = query.eq('id', id);
    }
    
    if (email) {
      query = query.ilike('email', `%${email}%`);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    // Execute the query
    const { data: leads, error } = await query;
    
    if (error) {
      console.error('Error fetching leads from Supabase:', error);
      throw new Error(`Failed to fetch leads: ${error.message}`);
    }
    
    // If we have leads, fetch their status history
    if (leads && leads.length > 0) {
      // Create an array of lead IDs
      const leadIds = leads.map(lead => lead.id);
      
      // Fetch status tracking for all leads in one query
      const { data: statusTracking, error: statusError } = await supabase
        .from('status_tracking')
        .select('*')
        .in('lead_id', leadIds)
        .order('created_at', { ascending: false });
      
      if (statusError) {
        console.warn('Error fetching status tracking:', statusError);
        // Continue anyway, we just won't have tracking history
      }
      
      // Group status tracking by lead ID
      const trackingByLeadId: Record<string, any[]> = {};
      if (statusTracking) {
        statusTracking.forEach(tracking => {
          if (!trackingByLeadId[tracking.lead_id]) {
            trackingByLeadId[tracking.lead_id] = [];
          }
          trackingByLeadId[tracking.lead_id].push({
            leadId: tracking.lead_id,
            status: tracking.status,
            notes: tracking.notes,
            timestamp: tracking.created_at
          });
        });
      }
      
      // Add tracking history to each lead
      leads.forEach(lead => {
        lead.trackingHistory = trackingByLeadId[lead.id] || [];
        
        // Convert snake_case fields to camelCase for client compatibility
        lead.propertyType = lead.property_type;
        lead.doorCount = lead.door_count;
        lead.preferredDate = lead.preferred_date;
        lead.createdAt = lead.created_at;
        lead.updatedAt = lead.updated_at;
        lead.timestamp = lead.created_at;
      });
      
      // Cache the results
      if (id) {
        sheetDataCache.set(CACHE_KEYS.LEAD_BY_ID(id), leads);
      } else if (email) {
        sheetDataCache.set(CACHE_KEYS.LEAD_BY_EMAIL(email), leads);
      } else {
        sheetDataCache.set(CACHE_KEYS.ALL_LEADS, leads);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: leads || [],
      source: 'supabase'
    });
    
  } catch (error) {
    console.error('Error in Supabase GET handler:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 