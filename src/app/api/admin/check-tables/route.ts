import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    // Check if sales_tracking table exists and has data
    const { data: trackingData, error: trackingError } = await supabaseAdmin
      .from('sales_tracking')
      .select('*')
      .limit(10);
    
    if (trackingError) {
      console.error("Error checking sales_tracking table:", trackingError);
      return NextResponse.json({ 
        success: false, 
        error: trackingError.message,
        details: "Error accessing sales_tracking table" 
      }, { status: 500 });
    }
    
    // Get sample sales data
    const { data: salesData, error: salesError } = await supabaseAdmin
      .from('sales')
      .select('id, name, email, status')
      .limit(5);
    
    if (salesError) {
      console.error("Error checking sales table:", salesError);
      return NextResponse.json({ 
        success: false, 
        error: salesError.message,
        details: "Error accessing sales table" 
      }, { status: 500 });
    }
    
    // Return diagnostic information
    return NextResponse.json({
      success: true,
      tracking: {
        count: trackingData.length,
        sample: trackingData.slice(0, 3)
      },
      sales: {
        count: salesData.length,
        sample: salesData
      }
    });
  } catch (error) {
    console.error("Error in check-tables API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check tables" },
      { status: 500 }
    );
  }
} 