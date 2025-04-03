import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET(req: NextRequest) {
  try {
    // Fetch all sales data with tracking history
    const { data: salesData, error: salesError } = await supabaseAdmin
      .from('sales')
      .select('*, sales_tracking(*)');
    
    if (salesError) {
      console.error("Error fetching sales data:", salesError);
      return NextResponse.json({ 
        success: false, 
        error: salesError.message 
      }, { status: 500 });
    }

    const now = new Date();
    const currentMonth = getMonthRange(now);
    const lastMonth = getMonthRange(new Date(now.getFullYear(), now.getMonth() - 1));

    // Process sales metrics
    const metrics = {
      currentMonth: {
        totalSales: 0,
        completedSales: 0,
        voidedSales: 0,
        averageSalesCycle: 0,
        averageTimeInStatus: {},
      },
      lastMonth: {
        totalSales: 0,
        completedSales: 0,
        voidedSales: 0,
        averageSalesCycle: 0,
        averageTimeInStatus: {},
      },
      overall: {
        totalSales: salesData.length,
        completedSales: 0,
        voidedSales: 0,
        averageSalesCycle: 0,
        averageTimeInStatus: {},
        statusTransitionTimes: [],
      }
    };

    // Process sales by status
    const statusCounts = {};
    const statusDurations = {};
    let totalCompletedCycleDays = 0;
    let completedCycleCount = 0;

    salesData.forEach(sale => {
      const createdDate = new Date(sale.created_at);
      const isCurrentMonth = createdDate >= currentMonth.start && createdDate <= currentMonth.end;
      const isLastMonth = createdDate >= lastMonth.start && createdDate <= lastMonth.end;
      
      // Count by status
      statusCounts[sale.status] = (statusCounts[sale.status] || 0) + 1;

      // Track metrics by month
      if (isCurrentMonth) {
        metrics.currentMonth.totalSales++;
        if (sale.status === 'closed') metrics.currentMonth.completedSales++;
        if (sale.status === 'void') metrics.currentMonth.voidedSales++;
      } else if (isLastMonth) {
        metrics.lastMonth.totalSales++;
        if (sale.status === 'closed') metrics.lastMonth.completedSales++;
        if (sale.status === 'void') metrics.lastMonth.voidedSales++;
      }

      // Process tracking history for time analysis
      if (sale.sales_tracking) {
        const tracking = sale.sales_tracking.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        let lastStatus = null;
        let lastDate = null;

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

    // Format sales by status for display
    const salesByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: (count / salesData.length * 100).toFixed(1)
    }));

    // Process sales by month
    const monthCounts = {};
    salesData.forEach(sale => {
      const date = new Date(sale.created_at);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
    });

    const salesByMonth = Object.entries(monthCounts)
      .map(([monthYear, count]) => ({
        monthYear,
        count,
        label: new Date(`${monthYear}-01`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      }))
      .sort((a, b) => a.monthYear.localeCompare(b.monthYear));

    return NextResponse.json({
      success: true,
      metrics,
      salesByStatus,
      salesByMonth
    });
  } catch (error) {
    console.error("Error in reports-data API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reports data" },
      { status: 500 }
    );
  }
} 