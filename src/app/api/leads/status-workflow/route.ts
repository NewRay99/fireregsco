import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// Status workflow information
const statusWorkflow = {
  'pending': {
    order: 0,
    description: 'Initial status for new leads that have just submitted an inquiry'
  },
  'contacted': {
    order: 1,
    description: 'The lead has been contacted via phone, email, or other means'
  },
  'interested': {
    order: 2,
    description: 'The lead has expressed interest in booking a service'
  },
  'reserved booking': {
    order: 3,
    description: 'A booking has been tentatively reserved but not finalized'
  },
  'sent invoice': {
    order: 4,
    description: 'An invoice has been sent to the lead for payment'
  },
  'payment received': {
    order: 5,
    description: 'Payment has been received for the booking'
  },
  'booked': {
    order: 6,
    description: 'The booking has been confirmed and scheduled'
  },
  'completed inspection': {
    order: 7,
    description: 'The fire door inspection has been completed'
  },
  'completed': {
    order: 8,
    description: 'The entire service process has been completed'
  },
  'refunded': {
    order: 9,
    description: 'The payment has been refunded to the customer'
  },
  'aftersales': {
    order: 10,
    description: 'The customer is in the after-sales support phase'
  },
  'void': {
    order: 998,
    description: 'The lead/booking has been cancelled or voided'
  },
  'not available': {
    order: 999,
    description: 'The lead could not be reached or is not available'
  }
};

/**
 * API endpoint to fetch the status workflow from the Google Sheets App Script
 */
export async function GET() {
  try {
    // Check if we should fetch from Supabase
    if (process.env.USE_SUPABASE_STORAGE === 'true') {
      try {
        const supabase = getServiceSupabase();
        
        // Check if we have a status_workflow table
        const { data: workflowData, error } = await supabase
          .from('status_workflow')
          .select('*')
          .order('order', { ascending: true });
        
        if (error) {
          console.warn('Error fetching status workflow from Supabase:', error);
          // Fall back to hardcoded workflow
          return NextResponse.json({
            success: true,
            statusWorkflow,
            source: 'hardcoded (Supabase fetch failed)'
          });
        }
        
        if (workflowData && workflowData.length > 0) {
          // Convert to the expected format
          const formattedWorkflow: Record<string, any> = {};
          
          workflowData.forEach(item => {
            formattedWorkflow[item.status] = {
              order: item.order,
              description: item.description
            };
          });
          
          return NextResponse.json({
            success: true,
            statusWorkflow: formattedWorkflow,
            source: 'supabase'
          });
        }
      } catch (error) {
        console.error('Supabase workflow fetch error:', error);
        // Fall back to hardcoded workflow
      }
    }
    
    // Return the hardcoded workflow
    return NextResponse.json({
      success: true,
      statusWorkflow,
      source: 'hardcoded'
    });
  } catch (error) {
    console.error('Error in status workflow route:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch status workflow',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 