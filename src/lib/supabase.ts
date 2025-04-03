import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations that need more privileges
export const getServiceSupabase = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables");
    // Fall back to anon key if service role key is not available
    return supabase;
  }
  
  return createClient(supabaseUrl, serviceRoleKey);
};

// Helper function to convert a sale to the format expected by Supabase
export const formatSaleForSupabase = (sale: any) => {
  // Convert preferred date format if it exists
  let preferredDate = null;
  if (sale.preferredDate) {
    try {
      preferredDate = new Date(sale.preferredDate).toISOString();
    } catch (e) {
      console.warn(`Error parsing preferred date: ${sale.preferredDate}`);
    }
  }
  
  // Use the current timestamp if one isn't provided
  const timestamp = sale.timestamp || new Date().toISOString();
  
  return {
    name: sale.name,
    email: sale.email,
    phone: sale.phone,
    property_type: sale.propertyType,
    door_count: sale.doorCount,
    message: sale.message || '',
    status: sale.status || 'pending',
    preferred_date: preferredDate,
    created_at: timestamp,
    updated_at: sale.updatedAt || timestamp
  };
};

// Helper function to convert Supabase response to the format expected by the app
export const formatSaleFromSupabase = (record: any) => {
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
export const formatSalesTrackingForSupabase = (tracking: any) => {
  return {
    sale_id: tracking.sale_id,
    status: tracking.status,
    notes: tracking.notes || '',
    created_at: tracking.timestamp || new Date().toISOString()
  };
};

// Helper function to convert Supabase status tracking to app format
export const formatSalesTrackingFromSupabase = (record: any) => {
  return {
    saleId: record.sale_id,
    status: record.status,
    notes: record.notes,
    timestamp: record.created_at
  };
};

// Helper function to format support ticket for Supabase
export const formatSupportTicketForSupabase = (ticket: any) => {
  return {
    title: ticket.title,
    description: ticket.description,
    user_id: ticket.userId || null,
    user_email: ticket.userEmail || null,
    status: ticket.status || 'open',
    priority: ticket.priority || 'medium',
    category: ticket.category || 'general',
    assignee_id: ticket.assigneeId || null,
    resolution: ticket.resolution || null,
    created_at: ticket.createdAt || new Date().toISOString(),
    updated_at: ticket.updatedAt || new Date().toISOString()
  };
};

// Helper function to convert Supabase support ticket to app format
export const formatSupportTicketFromSupabase = (record: any) => {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    userId: record.user_id,
    userEmail: record.user_email,
    status: record.status,
    priority: record.priority,
    category: record.category,
    assigneeId: record.assignee_id,
    resolution: record.resolution,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
};

// Helper function for Twitter scrape history (keeping this from your existing code)
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

// Function to get door count ranges from Supabase
export const getDoorCountRanges = async () => {
  const { data, error } = await supabase
    .from('door_count_ranges')
    .select('*')
    .order('display_order', { ascending: true });
    
  if (error) {
    console.error('Error fetching door count ranges:', error);
    return [];
  }
  
  return data;
};

// Function to get status workflow from Supabase
export const getStatusWorkflow = async () => {
  const { data, error } = await supabase
    .from('status_workflow')
    .select('*')
    .order('current_status', { ascending: true });
    
  if (error) {
    console.error('Error fetching status workflow:', error);
    return [];
  }
  
  return data;
};

// Function to get next available statuses for a given status
export const getNextStatuses = async (currentStatus: string) => {
  const { data, error } = await supabase
    .from('status_workflow')
    .select('next_statuses')
    .eq('current_status', currentStatus)
    .single();
    
  if (error) {
    console.error(`Error fetching next statuses for ${currentStatus}:`, error);
    return [];
  }
  
  return data?.next_statuses || [];
};

// Add this function to check and create required tables
export const ensureRequiredTables = async () => {
  try {
    // First try with the regular client
    console.log("Checking if sales_tracking table exists...");
    
    // Check if we can query the sales_tracking table
    const { data: trackingData, error: trackingError } = await supabase
      .from('sales_tracking')
      .select('*')
      .limit(1);
    
    if (trackingError) {
      console.error("Error checking sales_tracking table:", trackingError);
      
      // If the table doesn't exist, we need to create it
      if (trackingError.message.includes("does not exist")) {
        console.log("sales_tracking table doesn't exist, attempting to create it...");
        
        try {
          // Try to use the service role client
          const supabaseAdmin = getServiceSupabase();
          
          // Create the sales_tracking table
          const { error: createError } = await supabaseAdmin
            .rpc('execute_sql', {
              sql_query: `
                CREATE TABLE IF NOT EXISTS sales_tracking (
                  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                  sale_id UUID NOT NULL REFERENCES sales(id),
                  status TEXT NOT NULL,
                  notes TEXT,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  updated_by TEXT
                );
                
                CREATE INDEX idx_sales_tracking_sale_id ON sales_tracking(sale_id);
              `
            });
          
          if (createError) {
            console.error("Error creating sales_tracking table:", createError);
            return false;
          }
          
          console.log("sales_tracking table created successfully");
          return true;
        } catch (err) {
          console.error("Failed to create sales_tracking table:", err);
          alert("Could not create the sales_tracking table. Please check your Supabase configuration and ensure the service role key is set correctly.");
          return false;
        }
      }
      
      return false;
    }
    
    console.log("sales_tracking table exists:", trackingData);
    return true;
  } catch (error) {
    console.error("Error in ensureRequiredTables:", error);
    return false;
  }
};

// Call this function when the app initializes 

// Types
export interface Lead {
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
}

export interface StatusTracking {
  id: string;
  lead_id: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Utility functions for formatting data
export function formatLeadForSupabase(lead: Partial<Lead>) {
  return {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    message: lead.message,
    status: lead.status || 'new',
    preferred_date: lead.preferred_date ? new Date(lead.preferred_date).toISOString() : null
  };
}

export function formatLeadFromSupabase(data: any): Lead {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    company: data.company,
    message: data.message,
    status: data.status,
    preferred_date: data.preferred_date ? new Date(data.preferred_date).toISOString() : undefined,
    created_at: data.created_at,
    updated_at: data.updated_at,
    status_tracking: data.status_tracking?.map(formatStatusTrackingFromSupabase) || []
  };
}

export function formatStatusTrackingForSupabase(tracking: Partial<StatusTracking>) {
  return {
    lead_id: tracking.lead_id,
    status: tracking.status,
    notes: tracking.notes || ''
  };
}

export function formatStatusTrackingFromSupabase(data: any): StatusTracking {
  return {
    id: data.id,
    lead_id: data.lead_id,
    status: data.status,
    notes: data.notes || '',
    created_at: data.created_at,
    updated_at: data.updated_at
  };
} 