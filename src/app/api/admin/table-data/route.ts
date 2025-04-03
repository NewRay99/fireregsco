import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tableName = url.searchParams.get('table');
    
    if (!tableName) {
      return NextResponse.json({ 
        success: false, 
        error: "Table name is required" 
      }, { status: 400 });
    }
    
    console.log(`API: Fetching data from ${tableName} table...`);
    
    // Get the data using the service role key (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .limit(50);
    
    if (error) {
      console.error(`API: Error fetching data from ${tableName}:`, error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    console.log(`API: Successfully fetched ${data.length} records from ${tableName}`);
    
    return NextResponse.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error("API: Error in table-data endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch table data" },
      { status: 500 }
    );
  }
} 