import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample data
const propertyTypes = ['Residential', 'Commercial', 'Industrial', 'Multi-family'];
const statuses = ['pending', 'contacted', 'interested', 'qualified', 'converted', 'closed', 'not available'];
const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Robert', 'Lisa', 'William', 'Emma'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];
const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com'];

// Generate a random date within the last 6 months
function getRandomDate(months = 6) {
  const now = new Date();
  const pastDate = new Date(now);
  pastDate.setMonth(now.getMonth() - months);
  
  return new Date(pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime())).toISOString();
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
    'Can you provide more information about your warranty?'
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Generate a random tracking note
function getRandomNote(status: string) {
  const notes: Record<string, string[]> = {
    pending: [
      'New lead received',
      'Added to CRM',
      'Awaiting initial contact',
      'Scheduled for follow-up'
    ],
    contacted: [
      'Left voicemail',
      'Sent email',
      'Spoke briefly, will follow up',
      'Scheduled call back',
      'Sent information packet'
    ],
    interested: [
      'Customer expressed interest',
      'Discussed product options',
      'Sent catalog',
      'Scheduled in-person meeting',
      'Customer reviewing options'
    ],
    qualified: [
      'Confirmed budget',
      'Discussed timeline',
      'Verified property details',
      'Completed needs assessment',
      'Ready for proposal'
    ],
    converted: [
      'Proposal accepted',
      'Deposit received',
      'Contract signed',
      'Scheduled installation',
      'Processing order'
    ],
    closed: [
      'Installation completed',
      'Final payment received',
      'Customer satisfied',
      'Warranty information provided',
      'Case closed successfully'
    ],
    'not available': [
      'Customer not interested',
      'Budget constraints',
      'Chose competitor',
      'Project cancelled',
      'No response after multiple attempts',
      'Wrong contact information'
    ]
  };
  
  // Use type assertion to fix the TypeScript error
  const statusNotes = notes[status as keyof typeof notes] || notes.pending;
  return statusNotes[Math.floor(Math.random() * statusNotes.length)];
}

// Generate a random number of doors
function getRandomDoorCount() {
  return Math.floor(Math.random() * 10) + 1;
}

// Generate a sale record
function generateSale() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const createdAt = getRandomDate();
  
  return {
    id: uuidv4(),
    name: `${firstName} ${lastName}`,
    email: getRandomEmail(firstName, lastName),
    phone: getRandomPhone(),
    property_type: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
    door_count: getRandomDoorCount(),
    message: getRandomMessage(),
    status,
    preferred_date: getRandomDate(3),
    created_at: createdAt,
    updated_at: createdAt
  };
}

// Generate tracking history for a sale
function generateTrackingHistory(saleId: string, status: string, createdAt: string) {
  const trackingEntries = [];
  const statusIndex = statuses.indexOf(status);
  
  // Generate a tracking entry for each status up to the current one
  for (let i = 0; i <= statusIndex; i++) {
    const currentStatus = statuses[i];
    const date = new Date(createdAt);
    date.setDate(date.getDate() + i * 2); // Add 2 days for each status change
    
    trackingEntries.push({
      id: uuidv4(),
      sale_id: saleId,
      status: currentStatus,
      notes: getRandomNote(currentStatus),
      created_at: date.toISOString(),
      updated_by: 'admin'
    });
  }
  
  return trackingEntries;
}

// Main function to seed the database
async function seedDatabase() {
  try {
    console.log('Starting database seed...');
    
    // Generate sales data
    const salesCount = 50; // Number of sales to generate
    const sales = [];
    const trackingEntries = [];
    
    for (let i = 0; i < salesCount; i++) {
      const sale = generateSale();
      sales.push(sale);
      
      // Generate tracking history for this sale
      const saleTrackingEntries = generateTrackingHistory(sale.id, sale.status, sale.created_at);
      trackingEntries.push(...saleTrackingEntries);
    }
    
    // Insert sales data
    console.log(`Inserting ${sales.length} sales records...`);
    const { error: salesError } = await supabase.from('sales').insert(sales);
    
    if (salesError) {
      throw new Error(`Error inserting sales: ${salesError.message}`);
    }
    
    // Insert tracking data
    console.log(`Inserting ${trackingEntries.length} tracking records...`);
    const { error: trackingError } = await supabase.from('sales_tracking').insert(trackingEntries);
    
    if (trackingError) {
      throw new Error(`Error inserting tracking entries: ${trackingError.message}`);
    }
    
    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the seed function
seedDatabase(); 