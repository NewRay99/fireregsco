import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    // Fetch recent sales
    const { data: recentSales, error: salesError } = await supabaseAdmin
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (salesError) {
      console.error("Error fetching recent sales:", salesError);
      return NextResponse.json({ 
        success: false, 
        error: salesError.message 
      }, { status: 500 });
    }
    
    // Get sales statistics
    const { data: allSales, error: allSalesError } = await supabaseAdmin
      .from('sales')
      .select('status');
    
    if (allSalesError) {
      console.error("Error fetching all sales:", allSalesError);
      return NextResponse.json({ 
        success: false, 
        error: allSalesError.message 
      }, { status: 500 });
    }
    
    // Count sales by status
    const stats = {
      total: allSales.length,
      pending: allSales.filter(sale => sale.status === 'pending').length,
      contacted: allSales.filter(sale => sale.status === 'contacted').length,
      qualified: allSales.filter(sale => sale.status === 'qualified').length,
      converted: allSales.filter(sale => sale.status === 'converted').length,
      closed: allSales.filter(sale => sale.status === 'closed').length
    };
    
    return NextResponse.json({
      success: true,
      recentSales,
      stats
    });
  } catch (error) {
    console.error("Error in dashboard-data API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
} 