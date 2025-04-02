import { NextRequest, NextResponse } from 'next/server';
import { sheetDataCache, CACHE_KEYS } from '@/lib/utils/cache';
import { supabase } from '@/lib/supabase';

const CACHE_TTL_MS = 60 * 60 * 1000; // Cache for 1 hour by default

// Define the default workflow in case database fails
const DEFAULT_STATUS_WORKFLOW = {
  // Initial status
  "pending": ["contacted", "not available"],
  
  // Customer contact flow
  "contacted": ["interested", "not available"],
  "interested": ["reserved booking", "not available"],
  
  // Booking flow
  "reserved booking": ["sent invoice", "not available"],
  "sent invoice": ["payment received", "not available"],
  "payment received": ["booked", "not available"],
  "booked": ["completed inspection", "not available"],
  
  // Completion flow
  "completed inspection": ["completed", "aftersales", "refunded", "not available"],
  "completed": ["aftersales", "not available"],
  
  // Post service
  "aftersales": ["completed", "refunded", "not available"],
  "refunded": ["not available"],
  
  // Terminal states
  "not available": ["pending"],
  "void": ["pending"]
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nocache = searchParams.get('nocache') === 'true';
  
  try {
    // Try to get from cache first
    const cacheKey = 'status_workflow';
    
    if (!nocache) {
      const cachedData = sheetDataCache.get(cacheKey);
      if (cachedData) {
        console.log('[Cache] Returning cached status workflow');
        return NextResponse.json(cachedData);
      }
    }
    
    console.log('Fetching status workflow from Supabase');
    
    // Try to fetch from Supabase first
    const { data: workflowData, error } = await supabase
      .from('status_workflow')
      .select('*');
    
    let statusWorkflow = DEFAULT_STATUS_WORKFLOW;
    
    if (error) {
      console.error('Error fetching status workflow from Supabase:', error);
      console.log('Using default status workflow');
    } else if (workflowData && workflowData.length > 0) {
      // Convert Supabase workflow data to the expected format
      try {
        statusWorkflow = {};
        
        for (const item of workflowData) {
          if (item.current_status && item.next_statuses) {
            statusWorkflow[item.current_status] = Array.isArray(item.next_statuses) 
              ? item.next_statuses 
              : JSON.parse(item.next_statuses);
          }
        }
        
        console.log('Successfully loaded status workflow from Supabase');
      } catch (parseError) {
        console.error('Error parsing status workflow:', parseError);
        console.log('Using default status workflow due to parsing error');
        statusWorkflow = DEFAULT_STATUS_WORKFLOW;
      }
    } else {
      console.log('No workflow data found in Supabase, using default workflow');
    }
    
    const response = {
      success: true,
      message: 'Status workflow retrieved successfully',
      data: statusWorkflow
    };
    
    // Cache the result
    sheetDataCache.set(cacheKey, response, { ttl: CACHE_TTL_MS });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching status workflow:', error);
    
    // Return default workflow as fallback
    return NextResponse.json({
      success: true,
      message: 'Using default status workflow due to error',
      data: DEFAULT_STATUS_WORKFLOW,
      error: error instanceof Error ? error.message : 'An error occurred while retrieving status workflow'
    });
  }
} 