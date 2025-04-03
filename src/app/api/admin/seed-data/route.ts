import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase admin client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Sample data
const propertyTypes = ['Residential', 'Commercial', 'Industrial', 'Multi-family'];
const statuses = ['pending', 'contacted', 'interested', 'qualified', 'converted', 'closed', 'not available', 'void'];
const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Robert', 'Lisa', 'William', 'Emma', 'James', 'Olivia', 'Benjamin', 'Sophia', 'Daniel', 'Ava', 'Matthew', 'Isabella', 'Joseph', 'Mia'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson'];
const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com', 'protonmail.com', 'mail.com'];

// Status workflow mapping
const statusWorkflow = {
  'pending': ['contacted', 'not available', 'void'],
  'contacted': ['interested', 'not available', 'void'],
  'interested': ['qualified', 'not available', 'void'],
  'qualified': ['converted', 'not available', 'void'],
  'converted': ['closed', 'not available', 'void'],
  'closed': ['not available'],
  'not available': ['pending'],
  'void': ['pending']
};

// Notes for different statuses
const statusNotes = {
  'pending': [
    'New lead received through website',
    'Customer inquired about our services',
    'Added to CRM for follow-up',
    'Scheduled for initial contact',
    'Received referral from existing customer'
  ],
  'contacted': [
    'Left voicemail, waiting for callback',
    'Sent initial email with product information',
    'Spoke briefly, customer requested more information',
    'Scheduled follow-up call for next week',
    'Customer acknowledged receipt of information'
  ],
  'interested': [
    'Customer expressed interest in our premium door options',
    'Discussed specific requirements for their property',
    'Customer requested a quote for 3 doors',
    'Scheduled in-person consultation',
    'Customer reviewing product catalog'
  ],
  'qualified': [
    'Budget confirmed within our price range',
    'Property assessment completed',
    'Customer has immediate need for installation',
    'Decision maker confirmed',
    'Timeline aligns with our availability'
  ],
  'converted': [
    'Quote accepted, deposit received',
    'Contract signed and processed',
    'Scheduled installation for next month',
    'Customer selected premium options',
    'Payment plan established'
  ],
  'closed': [
    'Installation completed successfully',
    'Final payment received',
    'Customer very satisfied with work',
    'Warranty information provided',
    'Asked for referrals'
  ],
  'not available': [
    'Customer went with competitor due to pricing',
    'Project postponed indefinitely',
    'Customer not responding to follow-ups',
    'Budget constraints, cannot proceed at this time',
    'Customer's needs changed, no longer requires our services'
  ],
  'void': [
    'Customer found our quote too expensive',
    'Project cancelled due to property sale',
    'Customer decided to DIY instead',
    'Timeline couldn't be accommodated',
    'Product specifications didn't meet customer requirements'
  ]
};

// Voided sale specific notes
const voidedSaleNotes = [
  'Customer found our quote too expensive, went with a cheaper alternative',
  'Project cancelled due to budget constraints',
  'Customer decided our premium options were outside their budget',
  'Quote was higher than customer expected, decided not to proceed',
  'Customer received a more competitive offer from another provider',
  'Cost was the primary factor in customer's decision to go elsewhere',
  'Customer requested significant discounts we couldn't accommodate',
  'Project scope reduced due to cost concerns, no longer viable'
];

// Generate a random date within a specific range
function getRandomDate(startDate: Date, endDate: Date) {
  return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())).toISOString();
}

// Generate a date with seasonal bias (more in spring/summer)
function getSeasonalDate(startYear = 2023, endYear = 2024) {
  const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
  
  // Determine if this will be a spring/summer (higher probability) or fall/winter date
  const isWarmSeason = Math.random() < 0.7; // 70% chance of spring/summer
  
  let month;
  if (isWarmSeason) {
    // Spring/Summer months (March-August)
    month = Math.floor(Math.random() * 6) + 3;
  } else {
    // Fall/Winter months (September-February)
    month = Math.floor(Math.random() * 6) + 9;
    if (month > 12) {
      month -= 12;
    }
  }
  
  // Generate a random day based on the month
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = Math.floor(Math.random() * daysInMonth) + 1;
  
  return new Date(year, month - 1, day).toISOString();
}

// Generate a random phone number
function getRandomPhone() {
  return `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
}

// Generate a random email
function getRandomEmail(firstName: string, lastName: string) {
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

// Generate a random message
function getRandomMessage() {
  const messages = [
    'I need a quote for my property.',
    'Looking for information about your services.',
    'Can you help me with my door installation?',
    'I would like to schedule a consultation.',
    'Please contact me regarding your door services.',
    'I need help with my garage door.',
    'Interested in your commercial door options.',
    'Need a repair for my existing door.',
    'Looking for a quote on multiple doors.',
    'Can you provide more information about your warranty?',
    'I have a new construction project that needs doors.',
    'My current door is damaged and needs replacement.',
    'What types of security doors do you offer?',
    'Do you provide emergency door repair services?',
    'I need doors for my entire office building.'
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Generate a random number of doors
function getRandomDoorCount() {
  // Weighted to have more 1-3 door requests
  const weights = [0.4, 0.3, 0.15, 0.05, 0.03, 0.02, 0.02, 0.01, 0.01, 0.01];
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < weights.length; i++) {
    cumulativeWeight += weights[i];
    if (random < cumulativeWeight) {
      return i + 1;
    }
  }
  
  return 1; // Default fallback
}

// Generate a realistic sales cycle with proper status progression
function generateSalesCycle(options: any) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  // Determine if this will be a completed, in-progress, or lost sale
  const saleOutcome = Math.random();
  let finalStatus;
  
  if (options.includeVoidedSales && saleOutcome < 0.3) {
    // 30% chance of lost/voided sale if that option is enabled
    finalStatus = Math.random() < 0.5 ? 'void' : 'not available';
  } else if (saleOutcome < 0.7) {
    // 40% chance of completed sale
    finalStatus = 'closed';
  } else {
    // 30% chance of in-progress sale
    const inProgressStatuses = ['pending', 'contacted', 'interested', 'qualified', 'converted'];
    finalStatus = inProgressStatuses[Math.floor(Math.random() * inProgressStatuses.length)];
  }
  
  // Generate the initial date based on seasonal trends if enabled
  const createdAt = options.includeSeasonalTrends 
    ? getSeasonalDate() 
    : getRandomDate(new Date(2023, 0, 1), new Date());
  
  // Generate the sale record
  const sale = {
    id: uuidv4(),
    name: `${firstName} ${lastName}`,
    email: getRandomEmail(firstName, lastName),
    phone: getRandomPhone(),
    property_type: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
    door_count: getRandomDoorCount(),
    message: getRandomMessage(),
    status: finalStatus,
    preferred_date: getRandomDate(new Date(createdAt), new Date(new Date(createdAt).setMonth(new Date(createdAt).getMonth() + 2))),
    created_at: createdAt,
    updated_at: createdAt
  };
  
  // Generate tracking history
  const trackingEntries = [];
  let currentStatus = 'pending'; // Always start with pending
  let currentDate = new Date(createdAt);
  
  // Add the initial pending status
  trackingEntries.push({
    id: uuidv4(),
    sale_id: sale.id,
    status: currentStatus,
    notes: statusNotes.pending[Math.floor(Math.random() * statusNotes.pending.length)],
    created_at: currentDate.toISOString(),
    updated_by: 'admin'
  });
  
  // Generate the status progression path to reach the final status
  const statusPath = ['pending'];
  while (currentStatus !== finalStatus) {
    const possibleNextStatuses = statusWorkflow[currentStatus];
    let nextStatus;
    
    if (finalStatus === 'void' || finalStatus === 'not available') {
      // If we're heading to a negative outcome, choose the path that leads there
      if (possibleNextStatuses.includes(finalStatus)) {
        nextStatus = finalStatus;
      } else {
        // Otherwise progress normally but will eventually lead to negative outcome
        const progressStatuses = possibleNextStatuses.filter(s => s !== 'void' && s !== 'not available');
        nextStatus = progressStatuses[Math.floor(Math.random() * progressStatuses.length)];
      }
    } else {
      // For positive outcomes, avoid negative statuses
      const progressStatuses = possibleNextStatuses.filter(s => s !== 'void' && s !== 'not available');
      if (progressStatuses.length === 0 || currentStatus === finalStatus) {
        break;
      }
      nextStatus = progressStatuses[Math.floor(Math.random() * progressStatuses.length)];
    }
    
    statusPath.push(nextStatus);
    currentStatus = nextStatus;
    
    if (statusPath.length > 10) {
      // Safety check to prevent infinite loops
      break;
    }
  }
  
  // Generate tracking entries for each status in the path
  for (let i = 1; i < statusPath.length; i++) {
    const status = statusPath[i];
    
    // Add a realistic time delay between status changes
    let timeDelay;
    if (options.includeDelayedBookings) {
      // More variable time delays if that option is enabled
      if (status === 'contacted') {
        timeDelay = Math.floor(Math.random() * 3) + 1; // 1-3 days
      } else if (status === 'interested') {
        timeDelay = Math.floor(Math.random() * 7) + 3; // 3-10 days
      } else if (status === 'qualified') {
        timeDelay = Math.floor(Math.random() * 14) + 7; // 7-21 days
      } else if (status === 'converted') {
        timeDelay = Math.floor(Math.random() * 30) + 14; // 14-44 days
      } else if (status === 'closed') {
        timeDelay = Math.floor(Math.random() * 60) + 30; // 30-90 days
      } else {
        timeDelay = Math.floor(Math.random() * 7) + 1; // 1-7 days for other statuses
      }
    } else {
      // More consistent time delays
      timeDelay = Math.floor(Math.random() * 7) + 3; // 3-10 days
    }
    
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + timeDelay);
    
    // Select appropriate notes
    let notes;
    if ((status === 'void' || status === 'not available') && options.includeVoidedSales) {
      notes = voidedSaleNotes[Math.floor(Math.random() * voidedSaleNotes.length)];
    } else {
      notes = statusNotes[status][Math.floor(Math.random() * statusNotes[status].length)];
    }
    
    trackingEntries.push({
      id: uuidv4(),
      sale_id: sale.id,
      status,
      notes,
      created_at: currentDate.toISOString(),
      updated_by: 'admin'
    });
  }
  
  // Update the sale's updated_at to match the last status change
  if (trackingEntries.length > 0) {
    sale.updated_at = trackingEntries[trackingEntries.length - 1].created_at;
  }
  
  return { sale, trackingEntries };
}

// Generate support ticket data
function generateSupportTicketData(count: number) {
  // Support ticket generation code (similar to your existing seed-support-data.ts)
  // ...
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, count = 50, options = {} } = body;
    
    console.log(`Starting seed process for ${type} with count ${count}`);
    
    if (type === 'sales' || type === 'both') {
      // Generate sales data
      const salesData = [];
      const trackingData = [];
      
      for (let i = 0; i < count; i++) {
        const { sale, trackingEntries } = generateSalesCycle(options);
        salesData.push(sale);
        trackingData.push(...trackingEntries);
      }
      
      // Insert sales data
      console.log(`Inserting ${salesData.length} sales records...`);
      const { error: salesError } = await supabaseAdmin.from('sales').insert(salesData);
      
      if (salesError) {
        console.error("Error inserting sales:", salesError);
        return NextResponse.json({ 
          success: false, 
          error: `Error inserting sales: ${salesError.message}` 
        }, { status: 500 });
      }
      
      // Insert tracking data
      console.log(`Inserting ${trackingData.length} tracking records...`);
      const { error: trackingError } = await supabaseAdmin.from('sales_tracking').insert(trackingData);
      
      if (trackingError) {
        console.error("Error inserting tracking data:", trackingError);
        return NextResponse.json({ 
          success: false, 
          error: `Error inserting tracking data: ${trackingError.message}` 
        }, { status: 500 });
      }
    }
    
    if (type === 'support' || type === 'both') {
      // Generate and insert support ticket data
      // ...
    }
    
    return NextResponse.json({
      success: true,
      count,
      message: `Successfully seeded ${count} ${type} records`
    });
  } catch (error) {
    console.error("Error in seed-data API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed data" },
      { status: 500 }
    );
  }
} 