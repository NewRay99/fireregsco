import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const saleId = url.searchParams.get('id');
    
    if (saleId) {
      // Fetch a specific sale
      const { data: sale, error: saleError } = await supabaseAdmin
        .from('sales')
        .select('*')
        .eq('id', saleId)
        .single();
      
      if (saleError) {
        console.error(`Error fetching sale ${saleId}:`, saleError);
        return NextResponse.json({ 
          success: false, 
          error: saleError.message 
        }, { status: 500 });
      }
      
      // Fetch tracking history for this sale
      const { data: trackingHistory, error: trackingError } = await supabaseAdmin
        .from('sales_tracking')
        .select('*')
        .eq('sale_id', saleId)
        .order('created_at', { ascending: false });
      
      if (trackingError) {
        console.error(`Error fetching tracking history for sale ${saleId}:`, trackingError);
        return NextResponse.json({ 
          success: false, 
          error: trackingError.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        sale,
        trackingHistory
      });
    } else {
      // Fetch all sales
      const { data: sales, error: salesError } = await supabaseAdmin
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (salesError) {
        console.error("Error fetching all sales:", salesError);
        return NextResponse.json({ 
          success: false, 
          error: salesError.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        sales
      });
    }
  } catch (error) {
    console.error("Error in sales-management API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sales data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (body.action === 'update_status') {
      const { saleId, status, notes } = body;
      
      console.log(`Updating sale ${saleId} status to ${status}`);
      
      // Update the sale status
      const { error: updateError } = await supabaseAdmin
        .from('sales')
        .update({ status })
        .eq('id', saleId);
      
      if (updateError) {
        console.error(`Error updating sale ${saleId}:`, updateError);
        return NextResponse.json({ 
          success: false, 
          error: updateError.message 
        }, { status: 500 });
      }
      
      console.log(`Successfully updated sale status. Adding tracking entry...`);
      
      // Add a tracking entry using the admin client to bypass RLS
      const { error: trackingError } = await supabaseAdmin
        .from('sales_tracking')
        .insert({
          sale_id: saleId,
          status,
          notes,
          created_at: new Date().toISOString(),
          updated_by: 'admin'
        });
      
      if (trackingError) {
        console.error(`Error creating tracking entry for sale ${saleId}:`, trackingError);
        return NextResponse.json({ 
          success: false, 
          error: `Error creating tracking entry: ${trackingError.message}` 
        }, { status: 500 });
      }
      
      console.log(`Successfully added tracking entry`);
      
      return NextResponse.json({
        success: true,
        message: `Sale status updated to ${status}`
      });
    }
    
    return NextResponse.json({
      success: false,
      error: "Invalid action"
    }, { status: 400 });
  } catch (error) {
    console.error("Error in sales-management API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process sales management request" },
      { status: 500 }
    );
  }
} 