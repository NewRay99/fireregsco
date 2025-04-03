import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    
    let query = supabase.from('support_tickets').select('*');
    
    // Apply filters if provided
    if (id) {
      query = query.eq('id', id);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: 'Title and description are required fields' },
        { status: 400 }
      );
    }
    
    // Prepare the support ticket data
    const ticketData = {
      title: body.title,
      description: body.description,
      user_id: body.userId || null,
      user_email: body.userEmail || null,
      status: body.status || 'open',
      priority: body.priority || 'medium',
      category: body.category || 'general',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert into support_tickets table
    const { data, error } = await supabase
      .from('support_tickets')
      .insert(ticketData)
      .select();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      data: data[0]
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.id) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Only include fields that are provided
    if (body.status) updateData.status = body.status;
    if (body.priority) updateData.priority = body.priority;
    if (body.category) updateData.category = body.category;
    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.assignee_id) updateData.assignee_id = body.assignee_id;
    if (body.resolution) updateData.resolution = body.resolution;
    
    // Update the support ticket
    const { error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', body.id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Support ticket updated successfully'
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update support ticket' },
      { status: 500 }
    );
  }
} 