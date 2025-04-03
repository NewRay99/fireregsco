import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { formatSaleForSupabase } from "@/lib/supabase";

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    let query = supabase.from('sales').select('*');
    
    // If ID is provided, filter by ID
    if (id) {
      query = query.eq('id', id);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('API received data:', body);
    
    // Validate required fields
    if (!body.name || !body.email) {
      console.error('Missing required fields:', { name: body.name, email: body.email });
      return NextResponse.json(
        { error: 'Name and email are required fields' },
        { status: 400 }
      );
    }
    
    // Format the sale data for Supabase
    const saleData = formatSaleForSupabase(body);
    console.log('Formatted data for Supabase:', saleData);
    
    // Insert into sales table
    console.log('Attempting to insert into Supabase sales table...');
    const { data, error } = await supabase
      .from('sales')
      .insert(saleData)
      .select();
    
    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Successfully inserted into sales table:', data);
    
    // Also add an entry to sales_tracking
    const trackingData = {
      sale_id: data[0].id,
      status: data[0].status,
      notes: 'Initial submission',
      created_at: new Date().toISOString(),
      updated_by: 'system'
    };
    
    console.log('Adding to sales_tracking:', trackingData);
    const trackingResult = await supabase.from('sales_tracking').insert(trackingData);
    
    if (trackingResult.error) {
      console.error('Error adding to sales_tracking:', trackingResult.error);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sale recorded successfully',
      data: data[0]
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.id || !body.status) {
      return NextResponse.json(
        { error: 'Sale ID and status are required fields' },
        { status: 400 }
      );
    }
    
    // Update the sale status
    const { error } = await supabase
      .from('sales')
      .update({
        status: body.status,
        notes: body.notes || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Add an entry to sales_tracking
    const trackingData = {
      sale_id: body.id,
      status: body.status,
      notes: body.notes || '',
      created_at: new Date().toISOString(),
      updated_by: body.updatedBy || 'admin'
    };
    
    await supabase.from('sales_tracking').insert(trackingData);
    
    return NextResponse.json({
      success: true,
      message: 'Sale status updated successfully'
    });
  } catch (error) {
    console.error('Error updating sale:', error);
    return NextResponse.json(
      { error: 'Failed to update sale' },
      { status: 500 }
    );
  }
} 