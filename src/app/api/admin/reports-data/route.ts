import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    // Fetch all sales data
    const { data: salesData, error: salesError } = await supabaseAdmin
      .from('sales')
      .select('*');
    
    if (salesError) {
      console.error("Error fetching sales data:", salesError);
      return NextResponse.json({ 
        success: false, 
        error: salesError.message 
      }, { status: 500 });
    }
    
    // Process sales by status
    const statusCounts = {};
    salesData.forEach(sale => {
      statusCounts[sale.status] = (statusCounts[sale.status] || 0) + 1;
    });
    
    const salesByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
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