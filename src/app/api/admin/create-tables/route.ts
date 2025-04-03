import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    // Create the sales_tracking table if it doesn't exist
    const { error } = await supabaseAdmin.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS sales_tracking (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          sale_id UUID NOT NULL REFERENCES sales(id),
          status TEXT NOT NULL,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_by TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_sales_tracking_sale_id ON sales_tracking(sale_id);
      `
    });
    
    if (error) {
      console.error("Error creating tables:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: "Tables created successfully" });
  } catch (error) {
    console.error("Error in create-tables API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create tables" },
      { status: 500 }
    );
  }
} 