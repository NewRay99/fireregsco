import { NextRequest, NextResponse } from 'next/server';
import { sheetDataCache, CACHE_KEYS } from '@/lib/utils/cache';
import { getServiceSupabase } from '@/lib/supabase';

const CACHE_TTL_MS = 60 * 1000; // Cache for 60 seconds by default

// Fetch sales data from Supabase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month'; // Options: 'day', 'week', 'month', 'quarter', 'year'
    const nocache = searchParams.get('nocache') === 'true';

    console.log(`Getting sales data with range: ${range}, nocache: ${nocache}`);

    // Try to get from cache first
    const cacheKey = `sales_data_${range}`;
    
    if (!nocache) {
      const cachedData = sheetDataCache.get(cacheKey);
      if (cachedData) {
        console.log(`[Cache] Returning cached sales data for range: ${range}`);
        return NextResponse.json(cachedData);
      }
    }

    // Generate date range conditions based on range parameter
    const now = new Date();
    let startDate;
    
    switch (range) {
      case 'day':
        // Current day
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        // Last 7 days
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        // Current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        // Current quarter (approximate)
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        break;
      case 'year':
        // Current year
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        // Default to month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const startDateISO = startDate.toISOString();
    
    console.log(`Fetching sales from Supabase with created_at >= ${startDateISO}`);

    // Initialize Supabase client with service role
    const supabase = getServiceSupabase();
    
    // Fetch sales for the time period
    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', startDateISO)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sales for sales data:', error);
      throw new Error(`Failed to fetch sales: ${error.message}`);
    }

    // Process statistics from the sales
    const stats = {
      total: sales.length,
      statuses: {} as Record<string, number>,
      propertyTypes: {} as Record<string, number>,
      salesByDay: {} as Record<string, number>
    };

    sales.forEach(lead => {
      // Count statuses
      const status = lead.status || 'unknown';
      stats.statuses[status] = (stats.statuses[status] || 0) + 1;
      
      // Count property types
      const propertyType = lead.property_type || 'unknown';
      stats.propertyTypes[propertyType] = (stats.propertyTypes[propertyType] || 0) + 1;
      
      // Group by day for trend analysis
      const day = lead.created_at.split('T')[0]; // YYYY-MM-DD format
      stats.salesByDay[day] = (stats.salesByDay[day] || 0) + 1;
    });

    // Sort days chronologically
    const sortedDays = Object.keys(stats.salesByDay).sort();
    const sortedSalesByDay = sortedDays.reduce((acc, day) => {
      acc[day] = stats.salesByDay[day];
      return acc;
    }, {} as Record<string, number>);

    stats.salesByDay = sortedSalesByDay;

    // Create response data
    const response = {
      success: true,
      message: `Retrieved sales data for ${range} (${sales.length} sales)`,
      data: {
        stats,
        timeRange: {
          start: startDateISO,
          end: now.toISOString(),
          range
        }
      }
    };

    // Cache the result
    sheetDataCache.set(cacheKey, response, { ttl: CACHE_TTL_MS });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in GET /api/getSalesData:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while retrieving sales data',
    }, { status: 500 });
  }
} 