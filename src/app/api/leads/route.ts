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
    // Parse URL parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const email = url.searchParams.get('email');
    const status = url.searchParams.get('status');
    const fresh = url.searchParams.get('fresh') === 'true';
    
    // Check if we should use Supabase instead
    if (process.env.USE_SUPABASE_STORAGE === 'true') {
      console.log('Using Supabase for data storage instead of Google Sheets');
      
      // Forward the request to the Supabase API route with the same parameters
      const queryParams = new URLSearchParams();
      if (id) queryParams.append('id', id);
      if (email) queryParams.append('email', email);
      if (status) queryParams.append('status', status);
      if (fresh) queryParams.append('fresh', 'true');
      
      const supabaseResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/supabase?${queryParams.toString()}`
      );
      
      if (!supabaseResponse.ok) {
        const errorData = await supabaseResponse.json();
        throw new Error(`Failed to fetch from Supabase: ${errorData.message || supabaseResponse.statusText}`);
      }
      
      const supabaseData = await supabaseResponse.json();
      return NextResponse.json(supabaseData);
    }
    
    // Logic for using in-memory or Google Sheets data
    
    // Check if we have any cache key to use
    let cacheKey = '';
    
    if (id) {
      cacheKey = CACHE_KEYS.LEAD_BY_ID(id);
    } else if (email) {
      cacheKey = CACHE_KEYS.LEAD_BY_EMAIL(email);
    } else {
      cacheKey = CACHE_KEYS.ALL_LEADS;
    }
    
    // Try to use cached data unless fresh=true
    if (!fresh) {
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
    
    // Initialize in-memory database if needed
    if (!global.contactData) {
      global.contactData = [];
    }
    
    // Filter data based on parameters
    let filteredData = [...global.contactData];
    
    if (id) {
      filteredData = filteredData.filter(contact => contact.id === id);
    }
    
    if (email) {
      filteredData = filteredData.filter(contact => 
        contact.email.toLowerCase().includes(email.toLowerCase())
      );
    }
    
    if (status) {
      filteredData = filteredData.filter(contact => contact.status === status);
    }
    
    // Cache the filtered results
    sheetDataCache.set(cacheKey, filteredData);
    
    return NextResponse.json({
      success: true,
      data: filteredData,
      source: 'memory'
    });
    
  } catch (error) {
    console.error('Error in GET /api/leads:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 