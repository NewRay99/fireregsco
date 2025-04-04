import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface SaleTracking {
  id: string;
  sale_id: string;
  status: string;
  notes: string;
  created_at: string;
  updated_by: string;
}

interface Sale {
  id: string;
  name: string;
  email: string;
  phone: string;
  property_type: string;
  door_count: number;
  message?: string;
  status: string;
  preferred_date?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  sales_tracking?: SaleTracking[];
}

interface StatusDurations {
  [key: string]: number[];
}

interface MonthlyMetrics {
  totalSales: number;
  completedSales: number;
  voidedSales: number;
  averageSalesCycle: number;
  averageTimeInStatus: {
    [key: string]: number;
  };
  timeToPayment: number;
  timeToVoid: number;
}

interface DoorCountDistribution {
  range: string;
  completed: number;
  voided: number;
}

interface PropertyTypeDistribution {
  type: string;
  completed: number;
  voided: number;
}

interface Metrics {
  currentMonth: MonthlyMetrics;
  lastMonth: MonthlyMetrics;
  overall: MonthlyMetrics & {
    statusTransitionTimes: Array<{
      from: string;
      to: string;
      days: number;
      month?: string;
    }>;
    doorCountDistribution: DoorCountDistribution[];
    propertyTypeDistribution: PropertyTypeDistribution[];
  };
}

// Initialize Supabase admin client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to calculate days between dates
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper function to get month range
function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
}

// Add CORS headers to the response
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
  try {
    // Check if required environment variables are set
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing required environment variables");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { 
          status: 500,
          headers: {
            ...corsHeaders(),
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Fetch all sales data with tracking history
    const { data: salesData, error: salesError } = await supabaseAdmin
      .from('sales')
      .select('*, sales_tracking(*)');
    
    if (salesError) {
      console.error("Error fetching sales data:", salesError);
      return NextResponse.json({ 
        success: false, 
        error: salesError.message 
      }, { 
        status: 500,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json'
        }
      });
    }

    if (!salesData) {
      console.error("No sales data returned from database");
      return NextResponse.json({ 
        success: false, 
        error: "No data available" 
      }, { 
        status: 404,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json'
        }
      });
    }

    const now = new Date();
    const currentMonth = getMonthRange(now);
    const lastMonth = getMonthRange(new Date(now.getFullYear(), now.getMonth() - 1));

    // Initialize door count ranges
    const doorCountRanges = [
      { range: "20-100", min: 20, max: 100 },
      { range: "100-200", min: 100, max: 200 },
      { range: "200-1000", min: 200, max: 1000 },
      { range: "1000-2000", min: 1000, max: 2000 },
      { range: "2000+", min: 2000, max: Infinity }
    ];

    // Initialize door count distribution with direct calculation from sales data
    const doorCountDistribution = doorCountRanges.map(range => {
      const completedCount = (salesData as Sale[]).filter(sale => 
        sale.status === 'payment received' && 
        sale.door_count >= range.min && 
        sale.door_count <= range.max
      ).length;

      const voidedCount = (salesData as Sale[]).filter(sale => 
        sale.status === 'void' && 
        sale.door_count >= range.min && 
        sale.door_count <= range.max
      ).length;

      return {
        range: range.range,
        completed: completedCount,
        voided: voidedCount
      };
    });

    // Calculate property type distribution
    const propertyTypes = Array.from(new Set((salesData as Sale[]).map(sale => sale.property_type)));
    const propertyTypeDistribution = propertyTypes.map(type => {
      const completedCount = (salesData as Sale[]).filter(sale => 
        sale.status === 'payment received' && 
        sale.property_type === type
      ).length;

      const voidedCount = (salesData as Sale[]).filter(sale => 
        sale.status === 'void' && 
        sale.property_type === type
      ).length;

      return {
        type,
        completed: completedCount,
        voided: voidedCount
      };
    });

    // Process sales metrics
    const metrics: Metrics = {
      currentMonth: {
        totalSales: 0,
        completedSales: 0,
        voidedSales: 0,
        averageSalesCycle: 0,
        averageTimeInStatus: {},
        timeToPayment: 0,
        timeToVoid: 0
      },
      lastMonth: {
        totalSales: 0,
        completedSales: 0,
        voidedSales: 0,
        averageSalesCycle: 0,
        averageTimeInStatus: {},
        timeToPayment: 0,
        timeToVoid: 0
      },
      overall: {
        totalSales: salesData.length,
        completedSales: 0,
        voidedSales: 0,
        averageSalesCycle: 0,
        averageTimeInStatus: {},
        timeToPayment: 0,
        timeToVoid: 0,
        statusTransitionTimes: [],
        doorCountDistribution,
        propertyTypeDistribution
      }
    };

    // Track time-to-payment and time-to-void metrics
    let totalTimeToPayment = 0;
    let totalTimeToVoid = 0;
    let paymentCount = 0;
    let voidCount = 0;

    // Process sales by status
    const statusCounts: { [key: string]: number } = {};
    const statusDurations: StatusDurations = {};
    let totalCompletedCycleDays = 0;
    let completedCycleCount = 0;

    (salesData as Sale[]).forEach(sale => {
      const createdDate = new Date(sale.created_at);
      const isCurrentMonth = createdDate >= currentMonth.start && createdDate <= currentMonth.end;
      const isLastMonth = createdDate >= lastMonth.start && createdDate <= lastMonth.end;
      
      // Count by status
      statusCounts[sale.status] = (statusCounts[sale.status] || 0) + 1;

      // Track metrics by month
      if (isCurrentMonth) {
        metrics.currentMonth.totalSales++;
        if (sale.status === 'payment received') metrics.currentMonth.completedSales++;
        if (sale.status === 'void') metrics.currentMonth.voidedSales++;
      } else if (isLastMonth) {
        metrics.lastMonth.totalSales++;
        if (sale.status === 'payment received') metrics.lastMonth.completedSales++;
        if (sale.status === 'void') metrics.lastMonth.voidedSales++;
      }

      // Process tracking history for time analysis
      if (sale.sales_tracking) {
        const tracking = sale.sales_tracking.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        let lastStatus: string | null = null;
        let lastDate: string | null = null;

        tracking.forEach(entry => {
          if (lastStatus && lastDate) {
            const duration = daysBetween(lastDate, entry.created_at);
            
            if (!statusDurations[lastStatus]) {
              statusDurations[lastStatus] = [];
            }
            statusDurations[lastStatus].push(duration);

            metrics.overall.statusTransitionTimes.push({
              from: lastStatus,
              to: entry.status,
              days: duration
            });
          }

          lastStatus = entry.status;
          lastDate = entry.created_at;
        });

        // Calculate total cycle time for completed sales
        if (sale.status === 'closed' && tracking.length > 0) {
          const cycleDays = daysBetween(tracking[0].created_at, tracking[tracking.length - 1].created_at);
          totalCompletedCycleDays += cycleDays;
          completedCycleCount++;
        }

        // Find first 'pending' status
        const pendingEntry = tracking.find(t => t.status === 'pending');
        if (pendingEntry) {
          // Find payment received or void status
          const paymentEntry = tracking.find(t => t.status === 'payment received');
          const voidEntry = tracking.find(t => t.status === 'void');

          if (paymentEntry) {
            const timeToPayment = daysBetween(pendingEntry.created_at, paymentEntry.created_at);
            totalTimeToPayment += timeToPayment;
            paymentCount++;

            // Add to monthly metrics
            const month = new Date(pendingEntry.created_at).toISOString().slice(0, 7);
            metrics.overall.statusTransitionTimes.push({
              from: 'pending',
              to: 'payment received',
              days: timeToPayment,
              month
            });
          }

          if (voidEntry) {
            const timeToVoid = daysBetween(pendingEntry.created_at, voidEntry.created_at);
            totalTimeToVoid += timeToVoid;
            voidCount++;

            // Add to monthly metrics
            const month = new Date(pendingEntry.created_at).toISOString().slice(0, 7);
            metrics.overall.statusTransitionTimes.push({
              from: 'pending',
              to: 'void',
              days: timeToVoid,
              month
            });
          }
        }
      }
    });

    // Calculate averages
    metrics.overall.averageSalesCycle = completedCycleCount > 0 
      ? totalCompletedCycleDays / completedCycleCount 
      : 0;

    // Calculate average time in each status
    Object.entries(statusDurations).forEach(([status, durations]) => {
      metrics.overall.averageTimeInStatus[status] = 
        durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    });

    // Calculate average time to payment and void
    metrics.overall.timeToPayment = paymentCount > 0 ? totalTimeToPayment / paymentCount : 0;
    metrics.overall.timeToVoid = voidCount > 0 ? totalTimeToVoid / voidCount : 0;

    // Format sales by status for display
    const salesByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: (count / salesData.length * 100).toFixed(1)
    }));

    // Process sales by month
    const monthCounts: { [key: string]: { total: number; [key: string]: number } } = {};
    (salesData as Sale[]).forEach(sale => {
      const date = new Date(sale.created_at);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Initialize month if it doesn't exist
      if (!monthCounts[monthYear]) {
        monthCounts[monthYear] = { total: 0 };
      }
      
      // Increment total count
      monthCounts[monthYear].total++;
      
      // Increment status-specific count
      if (!monthCounts[monthYear][sale.status]) {
        monthCounts[monthYear][sale.status] = 0;
      }
      monthCounts[monthYear][sale.status]++;
    });

    const salesByMonth = Object.entries(monthCounts)
      .map(([monthYear, counts]) => ({
        monthYear,
        count: counts.total,
        label: new Date(`${monthYear}-01`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
        ...Object.entries(counts)
          .filter(([key]) => key !== 'total')
          .reduce((acc, [status, count]) => ({
            ...acc,
            [`count_${status}`]: count
          }), {})
      }))
      .sort((a, b) => a.monthYear.localeCompare(b.monthYear));

    return NextResponse.json({
      success: true,
      metrics,
      salesByStatus,
      salesByMonth
    }, {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Error in reports-data API:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch reports data"
      },
      { 
        status: 500,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 