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
const ticketSubjects = [
  'Door not closing properly',
  'Need help with installation',
  'Product inquiry',
  'Billing question',
  'Warranty claim',
  'Scheduling issue',
  'Technical support needed',
  'Request for refund',
  'Damaged product',
  'Missing parts'
];

const ticketStatuses = ['open', 'in_progress', 'resolved', 'closed'];
const ticketPriorities = ['low', 'medium', 'high', 'urgent'];
const ticketCategories = ['technical', 'billing', 'product', 'general', 'warranty'];

const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Robert', 'Lisa', 'William', 'Emma'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];
const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com'];

// Generate a random date within the last 3 months
function getRandomDate(months = 3) {
  const now = new Date();
  const pastDate = new Date(now);
  pastDate.setMonth(now.getMonth() - months);
  
  return new Date(pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime())).toISOString();
}

// Generate a random email
function getRandomEmail(firstName: string, lastName: string) {
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

// Generate a random message
function getRandomMessage() {
  const messages = [
    'I\'m having an issue with my door installation.',
    'The door is making a strange noise when opening.',
    'I need help with my warranty claim.',
    'Can you provide more information about your products?',
    'I need to reschedule my installation appointment.',
    'My door is not closing properly after installation.',
    'I received the wrong parts for my door.',
    'The technician didn\'t show up for the scheduled appointment.',
    'I need a copy of my invoice.',
    'How do I maintain my new door?'
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Generate a random response
function getRandomResponse(isAdmin: boolean) {
  const adminResponses = [
    'Thank you for contacting us. We\'ll look into this issue right away.',
    'I understand your concern. Let me check with our technical team.',
    'We apologize for the inconvenience. We\'ll resolve this as soon as possible.',
    'I\'ve forwarded your issue to our service department.',
    'Can you provide more details about the problem you\'re experiencing?',
    'We\'ve scheduled a technician to visit your location.',
    'Your warranty claim has been approved.',
    'We\'ve issued a refund for your purchase.',
    'The replacement parts have been shipped to your address.',
    'Please let us know if you need any further assistance.'
  ];
  
  const customerResponses = [
    'Thank you for your quick response.',
    'I appreciate your help with this issue.',
    'When can I expect the technician to arrive?',
    'Here are the additional details you requested.',
    'The issue is still not resolved.',
    'The technician fixed the problem. Thank you!',
    'I received the replacement parts. Thank you!',
    'I still have questions about my warranty.',
    'Can you provide a more specific timeframe?',
    'I need to reschedule the appointment.'
  ];
  
  return isAdmin ? 
    adminResponses[Math.floor(Math.random() * adminResponses.length)] : 
    customerResponses[Math.floor(Math.random() * customerResponses.length)];
}

// Generate a support ticket
function generateSupportTicket() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const status = ticketStatuses[Math.floor(Math.random() * ticketStatuses.length)];
  const createdAt = getRandomDate();
  
  return {
    id: uuidv4(),
    user_id: null, // We're not associating with real users for this seed
    email: getRandomEmail(firstName, lastName),
    subject: ticketSubjects[Math.floor(Math.random() * ticketSubjects.length)],
    message: getRandomMessage(),
    status,
    priority: ticketPriorities[Math.floor(Math.random() * ticketPriorities.length)],
    category: ticketCategories[Math.floor(Math.random() * ticketCategories.length)],
    created_at: createdAt,
    updated_at: createdAt
  };
}

// Generate responses for a ticket
function generateTicketResponses(ticketId: string, createdAt: string, status: string) {
  const responses = [];
  const responseCount = Math.floor(Math.random() * 5) + 1; // 1-5 responses
  
  let currentDate = new Date(createdAt);
  
  // Always add an initial admin response
  responses.push({
    id: uuidv4(),
    ticket_id: ticketId,
    message: getRandomResponse(true),
    is_admin: true,
    created_at: new Date(currentDate.getTime() + 1000 * 60 * 60 * 2).toISOString() // 2 hours later
  });
  
  // Add additional responses
  for (let i = 1; i < responseCount; i++) {
    currentDate = new Date(currentDate.getTime() + 1000 * 60 * 60 * 24); // Add a day
    
    responses.push({
      id: uuidv4(),
      ticket_id: ticketId,
      message: getRandomResponse(i % 2 === 0), // Alternate between admin and customer
      is_admin: i % 2 === 0,
      created_at: currentDate.toISOString()
    });
  }
  
  // If the ticket is resolved or closed, add a resolution response
  if (status === 'resolved' || status === 'closed') {
    currentDate = new Date(currentDate.getTime() + 1000 * 60 * 60 * 24); // Add a day
    
    responses.push({
      id: uuidv4(),
      ticket_id: ticketId,
      message: 'This issue has been resolved. Thank you for your patience.',
      is_admin: true,
      created_at: currentDate.toISOString()
    });
  }
  
  return responses;
}

// Main function to seed the database
async function seedDatabase() {
  try {
    console.log('Starting support tickets seed...');
    
    // Generate support tickets
    const ticketsCount = 30; // Number of tickets to generate
    const tickets = [];
    const responses = [];
    
    for (let i = 0; i < ticketsCount; i++) {
      const ticket = generateSupportTicket();
      tickets.push(ticket);
      
      // Generate responses for this ticket
      const ticketResponses = generateTicketResponses(ticket.id, ticket.created_at, ticket.status);
      responses.push(...ticketResponses);
    }
    
    // Insert tickets
    console.log(`Inserting ${tickets.length} support tickets...`);
    const { error: ticketsError } = await supabase.from('support_tickets').insert(tickets);
    
    if (ticketsError) {
      throw new Error(`Error inserting tickets: ${ticketsError.message}`);
    }
    
    // Insert responses
    console.log(`Inserting ${responses.length} ticket responses...`);
    const { error: responsesError } = await supabase.from('support_responses').insert(responses);
    
    if (responsesError) {
      throw new Error(`Error inserting responses: ${responsesError.message}`);
    }
    
    console.log('Support tickets seed completed successfully!');
  } catch (error) {
    console.error('Error seeding support tickets:', error);
  }
}

// Run the seed function
seedDatabase(); 