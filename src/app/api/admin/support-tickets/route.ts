import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const ticketId = url.searchParams.get('id');
    
    if (ticketId) {
      // Fetch a specific ticket
      const { data: ticket, error: ticketError } = await supabaseAdmin
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
      
      if (ticketError) {
        console.error(`Error fetching ticket ${ticketId}:`, ticketError);
        return NextResponse.json({ 
          success: false, 
          error: ticketError.message 
        }, { status: 500 });
      }
      
      // Fetch responses for this ticket
      const { data: responses, error: responsesError } = await supabaseAdmin
        .from('support_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (responsesError) {
        console.error(`Error fetching responses for ticket ${ticketId}:`, responsesError);
        return NextResponse.json({ 
          success: false, 
          error: responsesError.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        ticket,
        responses
      });
    } else {
      // Fetch all tickets
      const { data: tickets, error: ticketsError } = await supabaseAdmin
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ticketsError) {
        console.error("Error fetching all tickets:", ticketsError);
        return NextResponse.json({ 
          success: false, 
          error: ticketsError.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        tickets
      });
    }
  } catch (error) {
    console.error("Error in support-tickets API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch support tickets data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (body.action === 'update_status') {
      const { ticketId, status } = body;
      
      // Update the ticket status
      const { error: updateError } = await supabaseAdmin
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);
      
      if (updateError) {
        console.error(`Error updating ticket ${ticketId}:`, updateError);
        return NextResponse.json({ 
          success: false, 
          error: updateError.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: `Ticket status updated to ${status}`
      });
    } else if (body.action === 'add_response') {
      const { ticketId, message, isAdmin } = body;
      
      // Add a response
      const { error: responseError } = await supabaseAdmin
        .from('support_responses')
        .insert({
          ticket_id: ticketId,
          message,
          is_admin: isAdmin,
          created_at: new Date().toISOString()
        });
      
      if (responseError) {
        console.error(`Error adding response to ticket ${ticketId}:`, responseError);
        return NextResponse.json({ 
          success: false, 
          error: responseError.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: "Response added successfully"
      });
    }
    
    return NextResponse.json({
      success: false,
      error: "Invalid action"
    }, { status: 400 });
  } catch (error) {
    console.error("Error in support-tickets API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process support tickets request" },
      { status: 500 }
    );
  }
} 