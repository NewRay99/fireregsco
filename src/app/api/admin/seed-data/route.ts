import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from 'uuid';

// Type definitions
type Status = 
  | 'pending' 
  | 'contacted' 
  | 'interested' 
  | 'sent invoice' 
  | 'payment received' 
  | 'not available' 
  | 'void'
  | 'booked'
  | 'completed inspection'
  | 'completed'
  | 'refunded'
  | 'reserved booking'
  | 'aftersales'
  | 'not interested';

type StatusWorkflow = {
  [K in Status]: Status[];
};

interface SeedOptions {
  includeVoidedSales: boolean;
  includeSeasonalTrends: boolean;
  includeDelayedBookings: boolean;
}

// Initialize Supabase admin client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Sample data
const propertyTypes = ['Residential', 'Commercial', 'Industrial', 'Multi-family'];
const statuses: Status[] = ['pending', 'contacted', 'interested', 'sent invoice', 'payment received', 'not available', 'void'];
const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Robert', 'Lisa', 'William', 'Emma', 'James', 'Olivia', 'Benjamin', 'Sophia', 'Daniel', 'Ava', 'Matthew', 'Isabella', 'Joseph', 'Mia'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson'];
const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com', 'protonmail.com', 'mail.com'];

// Status workflow mapping
const statusWorkflow: StatusWorkflow = {
  'pending': ['contacted', 'not available', 'void', 'not interested'],
  'contacted': ['interested', 'not available', 'void'],
  'interested': ['sent invoice', 'not available', 'reserved booking', 'void'],
  'reserved booking': ['sent invoice'],
  'sent invoice': ['payment received', 'booked', 'not available', 'void'],
  'payment received': ['booked', 'not available', 'void'],
  'booked': ['refunded', 'completed inspection', 'not available', 'void'],
  'completed inspection': ['booked'],
  'completed': ['aftersales'],
  'refunded': ['payment received'],
  'not available': ['contacted'],
  'void': ['contacted'],
  'aftersales': [],
  'not interested': ['pending', 'contacted']
};

// Notes for different statuses
const statusNotes: Record<Status, string[]> = {
  'pending': [
    'New lead received through website',
    'Customer inquired about our services',
    'Added to CRM for follow-up',
    'Scheduled for initial contact',
    'Received referral from existing customer',
    'Customer found us through Google search',
    'Inquiry received via contact form',
    'Lead generated from Facebook ad campaign',
    'Contact details obtained at industry trade show',
    'Potential client from LinkedIn outreach',
    'Discovered through local business directory',
    'Request for information submitted through partner referral',
    'Contact information forwarded by satisfied previous customer',
    'Inquiry initiated after viewing fire safety demonstration',
    'Customer requested product information brochure',
    'Lead from property management agency',
    'Initial contact through maintenance department referral',
    'Request for service through regulatory compliance inquiry',
    'Lead from insurance company recommendation',
    'Potential client identified through fire safety audit'
  ],
  'contacted': [
    'Left voicemail, waiting for callback',
    'Sent initial email with product information',
    'Spoke briefly, customer requested more information',
    'Scheduled follow-up call for next week',
    'Customer acknowledged receipt of information',
    'Detailed email sent with service overview and pricing structure',
    'Initial consultation call completed, sent follow-up materials',
    'Sent digital brochure highlighting relevant services',
    'Left message with property manager for client',
    'Connected on LinkedIn and shared company profile',
    'Discussed preliminary needs assessment over phone',
    'Exchanged text messages about potential site visit',
    'Sent video presentation of our fire door inspection process',
    'Provided case studies of similar properties we have serviced',
    'Reached out via multiple channels - email, phone, and text',
    'Responded to specific technical questions about fire door ratings',
    'Conducted brief video call to introduce our team',
    'Provided preliminary compliance checklist for self-assessment',
    'Sent calendar invitation for formal consultation',
    'Mailed physical information packet per customer request'
  ],
  'interested': [
    'Customer expressed interest in our premium door options',
    'Discussed specific requirements for their property',
    'Customer requested a quote for 3 doors',
    'Scheduled in-person consultation',
    'Customer reviewing product catalog',
    'Client mentioned urgent compliance deadline approaching',
    'Requested site survey to assess scope of required work',
    'Discussed budget constraints and appropriate service options',
    'Client confirmed need for full property assessment',
    'Inquired about bulk pricing for multiple properties',
    'Asked detailed questions about certification processes',
    'Expressed specific interest in our reporting methodology',
    'Requested references from similar businesses we have serviced',
    'Comparing our service offerings with competitors',
    'Asked for clarification on maintenance packages following installation',
    'Requested information about ongoing compliance monitoring',
    'Inquired about staff training options for fire safety',
    'Discussed timeline requirements for project completion',
    'Asked about warranty and service guarantees',
    'Requested sample reports from previous inspections'
  ],
  'sent invoice': [
    'Budget confirmed within our price range',
    'Property assessment completed',
    'Customer has immediate need for installation',
    'Decision maker confirmed',
    'Timeline aligns with our availability',
    'Detailed proposal sent for 127 fire doors across 3 buildings',
    'Customized service package outlined in invoice',
    'Quote includes discounted rate for multiple properties',
    'Invoice includes breakdown of compliance requirements by door',
    'Finalized scope of work after on-site assessment',
    'Proposal includes timeline for phased implementation',
    'Invoice sent with itemized breakdown per regulatory requirement',
    'Quote reflects premium options as requested during consultation',
    'Included supplementary fire safety assessments in proposal',
    'Sent invoice with extended payment terms as negotiated',
    'Provided digital and physical copies of complete proposal',
    'Invoice includes priority scheduling due to compliance deadlines',
    'Quote reflects volume discount as discussed',
    'Included optional maintenance package in proposal',
    'Proposal includes staff training component per request'
  ],
  'payment received': [
    'Quote accepted, deposit received',
    'Contract signed and processed',
    'Scheduled installation for next month',
    'Customer selected premium options',
    'Payment plan established',
    'Full payment received via bank transfer',
    'Deposit processed, final payment due upon completion',
    'Purchase order received from corporate client',
    'Payment received, scheduling detailed assessment',
    'Credit card payment processed through secure portal',
    'Installment plan activated as per agreement',
    'Invoice paid through property management company',
    'Expedited payment received for urgent compliance work',
    'Retainer payment received for ongoing compliance monitoring',
    'Payment confirmed, procurement process initiated',
    'Funds received, confirming installation schedule',
    'Down payment received, ordering specialized materials',
    'Payment received for initial phase of multi-stage project',
    'Partial payment processed, scheduling preliminary work',
    'Payment processed through corporate accounting system'
  ],
  'not available': [
    'Customer went with competitor due to pricing',
    'Project postponed indefinitely',
    'Customer not responding to follow-ups',
    'Budget constraints, cannot proceed at this time',
    'Customer\'s needs changed, no longer requires our services',
    'Property ownership changing, decision deferred to new owner',
    'Responding to RFP with different vendor requirements',
    'Internal restructuring has paused all facility improvements',
    'Contact person left company, project status uncertain',
    'Compliance deadline extended, postponing urgent need',
    'Awaiting board approval before proceeding',
    'Property listed for sale, improvements on hold',
    'Seasonal business closed until spring',
    'Management decided to bundle with larger renovation project',
    'Property management firm changed, reviewing all vendors',
    'Corporate headquarters reviewing all capital expenditures',
    'Client requested we check back next quarter',
    'Multiple decision makers causing delays in approval process',
    'Budget reallocated to different compliance priorities',
    'Client implementing internal assessment before proceeding'
  ],
  'void': [
    'Customer found our quote too expensive',
    'Project cancelled due to property sale',
    'Customer decided to DIY instead',
    'Timeline couldn\'t be accommodated',
    'Product specifications didn\'t meet customer requirements',
    'Client went bankrupt, project terminated',
    'Business closing permanently, services no longer needed',
    'Property condemned by local authorities',
    'Corporate directive to freeze all non-essential spending',
    'Misunderstanding of service scope led to cancellation',
    'Regulatory requirements changed, altering project needs',
    'Insurance requirements satisfied through different means',
    'Client consolidated vendors, using existing service provider',
    'Decision maker left company, new management canceled project',
    'Property severely damaged, requiring complete rebuild',
    'Major renovation planned, incorporating fire safety in larger project',
    'Client merged with another company with different vendors',
    'Project scaled down below viable service threshold',
    'Legal dispute regarding property has frozen all improvements',
    'Customer expectations misaligned with industry standards'
  ],
  'booked': [
    'Installation date confirmed and scheduled',
    'Technicians assigned to project',
    'Materials ordered and in production',
    'Pre-installation assessment scheduled',
    'Client confirmed site access arrangements',
    'Installation team briefed on project specifications',
    'Special equipment scheduled for delivery',
    'Logistics coordinated for multi-day installation',
    'Schedule confirmed with all stakeholders',
    'Site preparation instructions provided to client',
    'Work permits secured for installation date',
    'Scheduling coordinated with other contractors on site',
    'After-hours installation arranged as requested',
    'Phased installation schedule confirmed',
    'Weekend installation booked to minimize disruption',
    'Technician specializing in this model assigned',
    'Emergency booking accommodated due to compliance issues',
    'Inspection scheduled following recent fire incident',
    'Priority booking confirmed due to regulatory deadline',
    'Multiple technicians assigned for complex installation'
  ],
  'completed inspection': [
    'All fire doors inspected according to BS9999 standards',
    'Detailed photographic evidence collected for 46 doors',
    'Minor remedial work completed during inspection',
    'Compliance issues documented with recommended actions',
    'Inspection revealed 14 doors requiring immediate attention',
    'All doors tagged with compliance status indicators',
    'Full property assessed with prioritized maintenance schedule',
    'Digital inspection report generated on-site',
    'Client representative walked through key findings',
    'Gap measurements documented for all fire doors',
    'Smoke seal integrity verified throughout property',
    'Immediate safety concerns addressed during visit',
    'Follow-up remediation work scheduled based on findings',
    'All ironmongery inspected and documented',
    'Fire door integrity tests performed throughout facility',
    'Certification documentation updated with inspection results',
    'Non-compliant hardware identified and documented',
    'Operation of self-closing mechanisms verified',
    'Emergency exit functionality confirmed for all doors',
    'Assessment compared against previous inspection findings'
  ],
  'completed': [
    'Installation completed successfully',
    'Final payment received',
    'Customer very satisfied with work',
    'Warranty information provided',
    'Asked for referrals',
    'All certification documentation delivered to client',
    'Compliance report submitted to regulatory authorities',
    'Successfully passed third-party inspection',
    'Client signed off on all completed work',
    'Maintenance schedule established for ongoing compliance',
    'Project completed ahead of schedule',
    'Staff training on fire safety protocols completed',
    'Final inspection report delivered with photo documentation',
    'All fire doors now fully compliant with current regulations',
    'Digital and physical copies of all certification provided',
    'Customer added to annual inspection program',
    'Follow-up survey showed 100% satisfaction with service',
    'Testimonial requested and received from property manager',
    'Post-installation inspection revealed no issues',
    'Client referred us to two additional properties',
    'Project completed to specification',
    'All compliance requirements fulfilled',
    'Final walkthrough conducted with client',
    'All documentation delivered to client',
    'Certification issued for all installed systems',
    'Maintenance instructions provided to facilities team',
    'Staff training on proper door usage completed',
    'Digital and physical compliance documentation provided',
    'All remedial actions addressed and verified',
    'Quality control inspection passed with no issues',
    'Client signed off on completed work',
    'Post-installation testing confirmed proper operation',
    'All temporary fire safety measures removed',
    'Worksite cleaned and restored to original condition',
    'Follow-up inspection scheduled for 12 months',
    'Warranty documentation processed and delivered',
    'Maintenance schedule established and first visit booked',
    'Final report submitted to regulatory authorities',
    'Before and after documentation provided to client',
    'Project completed under budget and ahead of schedule'
  ],
  'refunded': [
    'Full refund processed due to scheduling conflict',
    'Partial refund issued for reduced scope of work',
    'Refund processed for cancelled installation',
    'Refund issued due to duplicate payment',
    'Deposit returned as project requirements changed',
    'Goodwill refund processed after service complaint',
    'Refund issued for services not rendered',
    'Payment returned as work postponed beyond 90 days',
    'Refund processed through original payment method',
    'Partial refund for downsized project scope',
    'Credit issued against future services instead of refund',
    'Refund processed due to regulatory changes affecting project',
    'Payment returned as service area expanded beyond our coverage',
    'Refund due to product unavailability',
    'Deposit returned as client circumstances changed',
    'Refund issued following cancellation within cooling-off period',
    'Payment returned as specialized requirements could not be met',
    'Partial refund for delayed service delivery',
    'Refund processed after contract termination',
    'Payment returned due to force majeure event'
  ],
  'reserved booking': [
    'Tentative date held pending deposit',
    'Provisional booking awaiting final confirmation',
    'Time slot reserved based on client preference',
    'Installation team provisionally assigned',
    'Booking penciled in calendar awaiting contract',
    'Priority slot reserved for urgent compliance work',
    'Date range blocked pending final scheduling',
    'Resources allocated provisionally for project',
    'Preferred installation date noted in system',
    'Team with specialized expertise reserved for project',
    'Calendar blocked for multi-day installation',
    'Scheduling coordinated with client\'s operational hours',
    'After-hours slot reserved as requested',
    'Weekend installation provisionally booked',
    'Booking reserved pending property access confirmation',
    'Slot held awaiting materials availability confirmation',
    'Multiple technicians reserved for complex installation',
    'Emergency slot held for critical safety issue',
    'Installation window reserved pending regulatory approval',
    'Provisional booking made for seasonal maintenance program'
  ],
  'aftersales': [
    'Post-installation check-up scheduled',
    'Warranty registration completed',
    'Customer enrolled in maintenance program',
    'Follow-up survey sent to gauge satisfaction',
    'Additional training materials provided to staff',
    'Quarterly inspection schedule established',
    'Complimentary 30-day assessment offered',
    'Maintenance contract options presented',
    'Replacement parts inventory list provided',
    'Emergency response protocol documentation delivered',
    'Online portal access granted for documentation retrieval',
    'Technician contact information provided for future needs',
    'Scheduled first annual re-certification',
    'Thank you package sent to facilities manager',
    'Detailed care instructions provided for longevity',
    'Additional safety signage provided as courtesy',
    'Staff training refresher scheduled for six-month mark',
    'Notification system set up for regulatory updates',
    'Client added to newsletter for compliance updates',
    'Loyalty discount applied to future services'
  ],
  'not interested': [
    'Customer preferred alternative fire safety solutions',
    'Client has existing contractor for fire door services',
    'Budget allocated to different safety priorities',
    'Decision maker not convinced of urgency',
    'Property already underwent recent inspection',
    'Client feels current doors are adequate',
    'Preferred more comprehensive building safety audit',
    'Cost considered too high for perceived value',
    'Management does not prioritize proactive compliance',
    'Customer disagreed with our assessment approach',
    'Internal facilities team handles fire safety compliance',
    'Property scheduled for redevelopment, temporary solution preferred',
    'Client using different certification methodology',
    'Decision maker skeptical about regulatory requirements',
    'Found our approach too disruptive to operations',
    'Currently focused on other building improvement projects',
    'Management committee rejected proposal',
    'Concerns about historical building modifications',
    'Currently in dispute with regulatory authority',
    'Waiting for industry standards update before proceeding'
  ]
};

// Voided sale specific notes
const voidedSaleNotes = [
  'Customer found our quote too expensive, went with a cheaper alternative',
  'Project cancelled due to budget constraints',
  'Customer decided our premium options were outside their budget',
  'Quote was higher than customer expected, decided not to proceed',
  'Customer received a more competitive offer from another provider',
  'Cost was the primary factor in customer\'s decision to go elsewhere',
  'Customer requested significant discounts we couldn\'t accommodate',
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
function generateSalesCycle(options: SeedOptions) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  // Determine if this will be a completed, in-progress, or lost sale
  const saleOutcome = Math.random();
  let finalStatus: Status;
  
  if (options.includeVoidedSales && saleOutcome < 0.3) {
    // 30% chance of lost/voided sale if that option is enabled
    finalStatus = Math.random() < 0.5 ? 'void' : 'not available';
  } else if (saleOutcome < 0.7) {
    // 40% chance of completed sale
    finalStatus = 'completed';
  } else {
    // 30% chance of in-progress sale
    const inProgressStatuses: Status[] = ['pending', 'contacted', 'interested', 'sent invoice', 'payment received'];
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
  let currentStatus: Status = 'pending'; // Always start with pending
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
  const statusPath: Status[] = ['pending'];
  while (currentStatus !== finalStatus) {
    const possibleNextStatuses: Status[] = statusWorkflow[currentStatus];
    let nextStatus: Status;
    
    if (finalStatus === 'void' || finalStatus === 'not available') {
      // If we're heading to a negative outcome, choose the path that leads there
      if (possibleNextStatuses.includes(finalStatus)) {
        nextStatus = finalStatus;
      } else {
        // Otherwise progress normally but will eventually lead to negative outcome
        const progressStatuses = possibleNextStatuses.filter((s: Status) => s !== 'void' && s !== 'not available');
        nextStatus = progressStatuses[Math.floor(Math.random() * progressStatuses.length)];
      }
    } else {
      // Progress towards the final status through the normal path
      nextStatus = possibleNextStatuses.find((s: Status) => 
        s !== 'void' && s !== 'not available' && 
        statusPath.indexOf(s) === -1
      ) || finalStatus;
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
      } else if (status === 'sent invoice') {
        timeDelay = Math.floor(Math.random() * 14) + 7; // 7-21 days
      } else if (status === 'payment received') {
        timeDelay = Math.floor(Math.random() * 30) + 14; // 14-44 days
      } else if (status === 'completed') {
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

// Add this function before the POST handler
async function clearTables() {
  try {
    // Delete all records from sales_tracking first (due to foreign key constraint)
    const { error: trackingError } = await supabaseAdmin
      .from('sales_tracking')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (trackingError) {
      console.error("Error clearing sales_tracking table:", trackingError);
      throw trackingError;
    }

    // Then delete all records from sales
    const { error: salesError } = await supabaseAdmin
      .from('sales')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (salesError) {
      console.error("Error clearing sales table:", salesError);
      throw salesError;
    }

    console.log("Successfully cleared all tables");
    return true;
  } catch (error) {
    console.error("Error in clearTables:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, count = 50, options = {}, clearExisting = false } = body;
    
    console.log(`Starting seed process for ${type} with count ${count}`);
    
    if (clearExisting) {
      console.log("Clearing existing data...");
      try {
        await clearTables();
        console.log("Successfully cleared existing data");
      } catch (error) {
        return NextResponse.json({ 
          success: false, 
          error: `Error clearing tables: ${error instanceof Error ? error.message : String(error)}` 
        }, { status: 500 });
      }
    }

    if (type === 'sales' || type === 'both') {
      // Generate sales data
      const salesData = [];
      const trackingData = [];
      
      for (let i = 0; i < count; i++) {
        const { sale, trackingEntries } = generateSalesCycle(options as SeedOptions);
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