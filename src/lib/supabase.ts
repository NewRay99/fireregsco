import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create client for client-side usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a server-side client with service role when available
// This bypasses RLS and should only be used in API routes
export const getServiceSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Helper function to convert a lead to the format expected by Supabase
export const formatLeadForSupabase = (lead: any) => {
  // Convert preferred date format if it exists
  let preferredDate = null;
  if (lead.preferredDate) {
    try {
      preferredDate = new Date(lead.preferredDate).toISOString();
    } catch (e) {
      console.warn(`Error parsing preferred date: ${lead.preferredDate}`);
    }
  }
  
  // Use the current timestamp if one isn't provided
  const timestamp = lead.timestamp || new Date().toISOString();
  
  return {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    property_type: lead.propertyType,
    door_count: lead.doorCount,
    message: lead.message || '',
    status: lead.status || 'pending',
    preferred_date: preferredDate,
    created_at: timestamp,
    updated_at: lead.updatedAt || timestamp
  };
};

// Helper function to convert Supabase response to the format expected by the app
export const formatLeadFromSupabase = (record: any) => {
  // Format the preferred date for display
  let preferredDateFormatted = '';
  
  if (record.preferred_date) {
    try {
      // Format the date in a user-friendly way
      preferredDateFormatted = new Date(record.preferred_date).toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.warn(`Error formatting preferred_date: ${record.preferred_date}`);
      preferredDateFormatted = record.preferred_date;
    }
  }

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    propertyType: record.property_type,
    doorCount: record.door_count,
    preferredDate: preferredDateFormatted,
    message: record.message,
    status: record.status,
    timestamp: record.created_at,
    updatedAt: record.updated_at,
    trackingHistory: [] // Initialize with empty array, will be populated separately
  };
};

// Helper function to check if a string is a valid ISO date
function isValidISODate(dateString: string) {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  return isoDateRegex.test(dateString);
}

// Helper function to format status tracking data for Supabase
export const formatStatusTrackingForSupabase = (tracking: any) => {
  return {
    lead_id: tracking.lead_id,
    status: tracking.status,
    notes: tracking.notes || '',
    created_at: tracking.timestamp || new Date().toISOString()
  };
};

// Helper function to convert Supabase status tracking to app format
export const formatStatusTrackingFromSupabase = (record: any) => {
  return {
    leadId: record.lead_id,
    status: record.status,
    notes: record.notes,
    timestamp: record.created_at
  };
};

// Helper function to format Twitter scrape history for Supabase
export const formatTwitterScrapeHistoryForSupabase = (scrapeData: any) => {
  return {
    twitter_handle: scrapeData.twitterHandle,
    last_scraped_at: scrapeData.lastScrapedAt || new Date().toISOString(),
    success: scrapeData.success !== undefined ? scrapeData.success : true,
    details: scrapeData.details || {}
  };
};

// Helper function to convert Supabase Twitter scrape history to app format
export const formatTwitterScrapeHistoryFromSupabase = (record: any) => {
  return {
    id: record.id,
    twitterHandle: record.twitter_handle,
    lastScrapedAt: record.last_scraped_at,
    success: record.success,
    details: record.details,
    createdAt: record.created_at
  };
};

// Check if a Twitter handle has been scraped today
export const hasBeenScrapedToday = async (twitterHandle: string) => {
  const supabaseService = getServiceSupabase();
  
  // Get today's date in local timezone at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabaseService
    .from('twitter_scrape_history')
    .select('last_scraped_at')
    .eq('twitter_handle', twitterHandle)
    .gte('last_scraped_at', today.toISOString())
    .order('last_scraped_at', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error('Error checking Twitter scrape history:', error);
    return false;
  }
  
  // If we have a record, this handle has been scraped today
  return data && data.length > 0;
};

// Record a Twitter scrape event
export const recordTwitterScrape = async (
  twitterHandle: string,
  success: boolean = true,
  details: any = {}
) => {
  const supabaseService = getServiceSupabase();
  
  const scrapeData = {
    twitterHandle,
    lastScrapedAt: new Date().toISOString(),
    success,
    details
  };
  
  const { data, error } = await supabaseService
    .from('twitter_scrape_history')
    .insert(formatTwitterScrapeHistoryForSupabase(scrapeData));
  
  if (error) {
    console.error('Error recording Twitter scrape:', error);
    return null;
  }
  
  return data;
}; 