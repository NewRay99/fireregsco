import { NextRequest, NextResponse } from 'next/server';
import { sheetDataCache, CACHE_KEYS } from '@/lib/utils/cache';
import { getServiceSupabase, formatLeadFromSupabase, formatStatusTrackingFromSupabase } from '@/lib/supabase';

const CACHE_TTL_MS = 60 * 1000; // Cache for 60 seconds by default

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  try {
    const emailParam = searchParams.get('email');
    const idParam = searchParams.get('id');
    const nocache = searchParams.get('nocache') === 'true';

    console.log(`GET request for sales. Params: email=${emailParam || 'none'}, id=${idParam || 'none'}, nocache=${nocache}`);

    // Check for email - primary way to look up a specific lead
    if (emailParam) {
      // Try to get from cache first
      const cacheKey = CACHE_KEYS.LEAD_BY_EMAIL(emailParam);
      
      if (!nocache) {
        const cachedData = sheetDataCache.get(cacheKey);
        if (cachedData) {
          console.log(`[Cache] Returning cached lead data for email: ${emailParam}`);
          return NextResponse.json(cachedData);
        }
      }
      
      // Fetch from Supabase
      console.log(`Fetching lead data from Supabase for email: ${emailParam}`);
      
      // Initialize Supabase client with service role
      const supabase = getServiceSupabase();
      
      const { data: lead, error } = await supabase
        .from('sales')
        .select('*')
        .eq('email', emailParam.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error fetching lead by email:', error);
        return NextResponse.json({ 
          success: false, 
          message: `Lead not found for email: ${emailParam}` 
        }, { status: 404 });
      }
      
      if (!lead) {
        return NextResponse.json({ 
          success: false, 
          message: `No lead found for email: ${emailParam}` 
        }, { status: 404 });
      }
      
      // Get status tracking history
      const { data: trackingHistory, error: trackingError } = await supabase
        .from('status_tracking')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });
      
      // Format the lead data
      const formattedLead = formatLeadFromSupabase(lead);
      
      // Format tracking history if available
      const formattedHistory = trackingHistory 
        ? trackingHistory.map((item: any) => formatStatusTrackingFromSupabase(item)) 
        : [];
      
      // Create the response with lead and history
      const response = {
        success: true,
        message: 'Lead found',
        data: {
          ...formattedLead,
          trackingHistory: formattedHistory
        }
      };
      
      // Cache the result
      sheetDataCache.set(cacheKey, response, { ttl: CACHE_TTL_MS });
      
      return NextResponse.json(response);
    }
    
    // Check for ID - secondary way to look up a specific lead
    if (idParam) {
      // Try to get from cache first
      const cacheKey = CACHE_KEYS.LEAD_BY_ID(idParam);
      
      if (!nocache) {
        const cachedData = sheetDataCache.get(cacheKey);
        if (cachedData) {
          console.log(`[Cache] Returning cached lead data for ID: ${idParam}`);
          return NextResponse.json(cachedData);
        }
      }
      
      // Fetch from Supabase
      console.log(`Fetching lead data from Supabase for ID: ${idParam}`);
      
      // Initialize Supabase client with service role
      const supabase = getServiceSupabase();
      
      const { data: lead, error } = await supabase
        .from('sales')
        .select('*')
        .eq('id', idParam)
        .single();
      
      if (error) {
        console.error('Error fetching lead by ID:', error);
        return NextResponse.json({ 
          success: false, 
          message: `Lead not found for ID: ${idParam}` 
        }, { status: 404 });
      }
      
      // Get status tracking history
      const { data: trackingHistory, error: trackingError } = await supabase
        .from('status_tracking')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });
      
      // Format the lead data
      const formattedLead = formatLeadFromSupabase(lead);
      
      // Format tracking history if available
      const formattedHistory = trackingHistory 
        ? trackingHistory.map((item: any) => formatStatusTrackingFromSupabase(item)) 
        : [];
      
      // Create the response with lead and history
      const response = {
        success: true,
        message: 'Lead found',
        data: {
          ...formattedLead,
          trackingHistory: formattedHistory
        }
      };
      
      // Cache the result
      sheetDataCache.set(cacheKey, response, { ttl: CACHE_TTL_MS });
      
      return NextResponse.json(response);
    }
    
    // Fallback to returning all sales if no specific parameters provided
    // Try to get from cache first
    if (!nocache) {
      const cachedData = sheetDataCache.get(CACHE_KEYS.ALL_LEADS);
      if (cachedData) {
        console.log('[Cache] Returning cached list of all sales');
        return NextResponse.json(cachedData);
      }
    }
    
    // Fetch all sales from Supabase
    console.log('Fetching all sales from Supabase');
    
    // Initialize Supabase client with service role
    const supabase = getServiceSupabase();
    
    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all sales:', error);
      throw new Error(`Failed to fetch sales: ${error.message}`);
    }
    
    // Format all sales
    const formattedSales = sales.map((lead: any) => formatLeadFromSupabase(lead));
    
    // Create the response
    const response = {
      success: true,
      message: `Retrieved ${formattedSales.length} sales`,
      data: formattedSales
    };
    
    // Cache the result
    sheetDataCache.set(CACHE_KEYS.ALL_LEADS, response, { ttl: CACHE_TTL_MS });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error in GET /api/getSales:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while retrieving sales',
    }, { status: 500 });
  }
} 