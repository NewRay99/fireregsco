import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getServiceSupabase } from '@/lib/supabase';

interface StatusWorkflowItem {
  order: number;
  next: string[];
  probabilities: number[];
  avgDuration: number;
}

interface StatusWorkflow {
  [key: string]: StatusWorkflowItem;
}

// Status workflow with expected durations (in days) and probabilities
const statusWorkflow: StatusWorkflow = {
  'pending': { order: 0, next: ['contacted', 'not available'], probabilities: [0.85, 0.15], avgDuration: 2 },
  'contacted': { order: 1, next: ['interested', 'not available'], probabilities: [0.7, 0.3], avgDuration: 5 },
  'interested': { order: 2, next: ['reserved booking', 'not available'], probabilities: [0.8, 0.2], avgDuration: 7 },
  'reserved booking': { order: 3, next: ['sent invoice'], probabilities: [1.0], avgDuration: 3 },
  'sent invoice': { order: 4, next: ['payment received', 'not available'], probabilities: [0.75, 0.25], avgDuration: 5 },
  'payment received': { order: 5, next: ['booked'], probabilities: [1.0], avgDuration: 2 },
  'booked': { order: 6, next: ['completed inspection'], probabilities: [1.0], avgDuration: 14 },
  'completed inspection': { order: 7, next: ['completed'], probabilities: [1.0], avgDuration: 3 },
  'completed': { order: 8, next: [], probabilities: [], avgDuration: 0 },
  'not available': { order: 999, next: [], probabilities: [], avgDuration: 0 }
};

// Property types and door counts
const propertyTypes = ['hmo', 'hotel', 'commercial', 'public', 'other'];
const doorCounts = ['20-100', '100-200', '200-1000', '1000-2000', '2000+'];

// Names for dummy data
const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Robert', 'Lisa', 'William', 'Jessica', 'James', 'Jennifer', 'Daniel', 'Amanda', 'Christopher', 'Elizabeth', 'Matthew', 'Melissa', 'Andrew', 'Michelle'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson'];

// Function to generate a random phone number
const generatePhoneNumber = () => {
  let phone = '';
  for (let i = 0; i < 10; i++) {
    phone += Math.floor(Math.random() * 10);
  }
  return phone;
};

// Function to generate a random email
const generateEmail = (firstName: string, lastName: string) => {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  const randomDomain = domains[Math.floor(Math.random() * domains.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}@${randomDomain}`;
};

// Function to generate random messages
const generateMessage = (propertyType: string, doorCount: string) => {
  const messages = [
    `I need fire door inspection for my ${propertyType} property with ${doorCount} doors.`,
    `Looking for a quote for fire inspection service. I have a ${propertyType} building with ${doorCount} doors.`,
    `Can you provide services for a ${propertyType} with ${doorCount} fire doors?`,
    `Need help with fire safety compliance for my ${propertyType} property with ${doorCount} doors.`,
    `Requesting information about fire door inspection for ${propertyType} building with approximately ${doorCount} doors.`
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

// Function to apply seasonal effects to lead generation
const applySeasonalEffect = (date: Date) => {
  const month = date.getMonth(); // 0-11 (Jan-Dec)
  
  // Seasonal multipliers:
  // Winter (Dec-Feb): 0.5-0.7x leads
  // Spring (Mar-May): 1.0-1.5x leads, gradually increasing
  // Summer (Jun-Aug): 1.2-1.5x leads
  // Fall (Sep-Nov): 0.8-1.0x leads, gradually decreasing
  
  if (month === 11 || month === 0 || month === 1) { // Winter
    return 0.5 + (Math.random() * 0.2);
  } else if (month >= 2 && month <= 4) { // Spring
    return 1.0 + (Math.random() * 0.5) * (month - 1) / 3;
  } else if (month >= 5 && month <= 7) { // Summer
    return 1.2 + (Math.random() * 0.3);
  } else { // Fall
    return 0.8 + (Math.random() * 0.2) * (3 - (month - 8)) / 3;
  }
};

interface HistoryEntry {
  status: string;
  timestamp: Date;
  notes: string;
}

interface LeadProgressionResult {
  finalStatus: string;
  history: HistoryEntry[];
}

// Function to simulate lead progression
const simulateLeadProgression = (startDate: Date, endDate: Date = new Date()): LeadProgressionResult => {
  let currentStatus = 'pending';
  let currentDate = new Date(startDate);
  const history: HistoryEntry[] = [];
  
  // Add initial status
  history.push({
    status: currentStatus,
    timestamp: new Date(currentDate),
    notes: 'Initial inquiry'
  });
  
  // Loop until we reach the end date or a terminal status
  while (currentDate < endDate && statusWorkflow[currentStatus].next.length > 0) {
    // Determine next status based on probabilities
    const nextStatusOptions = statusWorkflow[currentStatus].next;
    const probabilities = statusWorkflow[currentStatus].probabilities;
    
    const random = Math.random();
    let cumulativeProbability = 0;
    let nextStatusIndex = 0;
    
    for (let i = 0; i < probabilities.length; i++) {
      cumulativeProbability += probabilities[i];
      if (random <= cumulativeProbability) {
        nextStatusIndex = i;
        break;
      }
    }
    
    const nextStatus = nextStatusOptions[nextStatusIndex];
    
    // Calculate time to next status (with some randomness)
    const avgDuration = statusWorkflow[currentStatus].avgDuration;
    const actualDuration = Math.max(1, Math.round(avgDuration * (0.5 + Math.random())));
    
    // Advance date
    currentDate = new Date(currentDate.getTime() + actualDuration * 24 * 60 * 60 * 1000);
    
    // If we've gone past the end date, stop
    if (currentDate > endDate) {
      break;
    }
    
    // Generate notes based on status
    let notes = '';
    switch (nextStatus) {
      case 'contacted':
        notes = ['Left voicemail', 'Spoke with customer', 'Sent follow-up email'][Math.floor(Math.random() * 3)];
        break;
      case 'interested':
        notes = ['Customer expressed interest', 'Discussed services and pricing', 'Needs service soon'][Math.floor(Math.random() * 3)];
        break;
      case 'reserved booking':
        notes = ['Customer wants to proceed', 'Tentative date scheduled', 'Will confirm date soon'][Math.floor(Math.random() * 3)];
        break;
      case 'sent invoice':
        notes = ['Invoice #INV-' + Math.floor(Math.random() * 10000), 'Payment due in 7 days', 'Awaiting payment confirmation'][Math.floor(Math.random() * 3)];
        break;
      case 'payment received':
        notes = ['Payment confirmed', 'Receipt sent to customer', 'Ready to schedule'][Math.floor(Math.random() * 3)];
        break;
      case 'booked':
        notes = ['Inspection scheduled for ' + new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(), 'Technician assigned', 'Confirmation sent'][Math.floor(Math.random() * 3)];
        break;
      case 'completed inspection':
        notes = ['Inspection completed', 'Report being prepared', 'Follow-up needed for minor issues'][Math.floor(Math.random() * 3)];
        break;
      case 'completed':
        notes = ['All work completed', 'Final documentation sent', 'Customer satisfied'][Math.floor(Math.random() * 3)];
        break;
      case 'not available':
        notes = ['No response from customer', 'Customer not interested', 'Customer went with another provider'][Math.floor(Math.random() * 3)];
        break;
      default:
        notes = 'Status updated';
    }
    
    // Add to history
    history.push({
      status: nextStatus,
      timestamp: new Date(currentDate),
      notes: notes
    });
    
    // Update current status
    currentStatus = nextStatus;
  }
  
  return {
    finalStatus: currentStatus,
    history: history
  };
};

interface TrackingHistoryEntry {
  leadId: string;
  contactId: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  notes: string;
  timestamp: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyType: string;
  doorCount: string;
  message: string;
  timestamp: string;
  status: string;
  trackingHistory: TrackingHistoryEntry[];
}

// Function to generate a random lead with history
const generateLead = (createdAt: Date): Lead => {
  const contactId = `contact-${uuidv4()}`;
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${firstName} ${lastName}`;
  const email = generateEmail(firstName, lastName);
  const phone = generatePhoneNumber();
  const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
  const doorCount = doorCounts[Math.floor(Math.random() * doorCounts.length)];
  const message = generateMessage(propertyType, doorCount);
  
  // Simulate lead progression
  const { finalStatus, history } = simulateLeadProgression(createdAt);
  
  // Create lead object
  const lead: Lead = {
    id: contactId,
    name,
    email,
    phone,
    propertyType,
    doorCount,
    message,
    timestamp: createdAt.toISOString(),
    status: finalStatus,
    trackingHistory: history.map((entry) => ({
      leadId: `lead-${uuidv4()}`,
      contactId,
      name,
      email,
      phone,
      status: entry.status,
      notes: entry.notes,
      timestamp: entry.timestamp.toISOString()
    }))
  };
  
  return lead;
};

// Function to generate the specified number of leads with seasonal distribution
const generateLeads = (count: number): Lead[] => {
  const leads: Lead[] = [];
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  
  // Generate target counts for each month to create seasonal pattern
  const monthlyTargets: number[] = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(oneYearAgo.getFullYear(), oneYearAgo.getMonth() + i, 15);
    const seasonalFactor = applySeasonalEffect(date);
    monthlyTargets.push(Math.ceil(count / 12 * seasonalFactor));
  }
  
  // Adjust to make sure we generate exactly the requested number
  const totalTargeted = monthlyTargets.reduce((sum, count) => sum + count, 0);
  if (totalTargeted !== count) {
    const adjustment = count - totalTargeted;
    // Distribute the adjustment evenly
    for (let i = 0; i < Math.abs(adjustment); i++) {
      if (adjustment > 0) {
        monthlyTargets[i % 12]++;
      } else {
        monthlyTargets[i % 12] = Math.max(1, monthlyTargets[i % 12] - 1);
      }
    }
  }
  
  // Generate leads for each month
  for (let i = 0; i < 12; i++) {
    const monthStart = new Date(oneYearAgo.getFullYear(), oneYearAgo.getMonth() + i, 1);
    const monthEnd = new Date(oneYearAgo.getFullYear(), oneYearAgo.getMonth() + i + 1, 0);
    const daysInMonth = monthEnd.getDate();
    
    for (let j = 0; j < monthlyTargets[i]; j++) {
      // Distribute leads throughout the month
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      const hour = Math.floor(Math.random() * 12) + 8; // Between 8am and 8pm
      const minute = Math.floor(Math.random() * 60);
      
      const createdAt = new Date(monthStart.getFullYear(), monthStart.getMonth(), day, hour, minute);
      leads.push(generateLead(createdAt));
    }
  }
  
  return leads;
};

interface PostApiResults {
  success: number;
  failed: number;
  errors: Array<{
    lead: string;
    error: string;
  }>;
}

const postLeadsToSupabase = async (leads: Lead[]): Promise<PostApiResults> => {
  // Get Supabase client
  const supabase = getServiceSupabase();
  
  // Process leads in batches
  for (const lead of leads) {
    // Format lead for Supabase
    const leadData = {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      property_type: lead.propertyType,
      door_count: lead.doorCount,
      message: lead.message,
      status: lead.status,
      created_at: lead.timestamp,
      updated_at: lead.timestamp
    };
    
    // Insert lead
    await supabase.from('leads').insert(leadData);
    
    // Insert all tracking history
    for (const entry of lead.trackingHistory) {
      await supabase.from('status_tracking').insert({
        lead_id: lead.id,
        status: entry.status,
        notes: entry.notes,
        created_at: entry.timestamp
      });
    }
  }
}

export async function GET(request: Request) {
  // Extract count parameter from URL, default to 50
  const url = new URL(request.url);
  const countParam = url.searchParams.get('count');
  const count = countParam ? parseInt(countParam, 10) : 50;
  
  // Validate count (prevent excessive generation)
  const maxCount = 200;
  const validCount = Math.min(count, maxCount);
  
  try {
    console.log(`Generating ${validCount} dummy leads with seasonal patterns...`);
    
    // Generate the leads
    const leads = generateLeads(validCount);
    
    // Return the leads without posting if dryRun is true
    if (url.searchParams.get('dryRun') === 'true') {
      return NextResponse.json({
        success: true,
        message: `Generated ${leads.length} dummy leads (dry run, not posted to API)`,
        leads: leads.slice(0, 5) // Return just the first 5 for preview
      });
    }
    
    // Post the leads to the API
    console.log(`Posting ${leads.length} leads to API...`);
    const results = await postLeadsToSupabase(leads);
    
    return NextResponse.json({
      success: true,
      message: `Seeded ${results.success} out of ${leads.length} dummy leads to the database`,
      failedCount: results.failed,
      errors: results.errors.slice(0, 5) // Show only first 5 errors
    });
    
  } catch (error) {
    console.error('Error in seed route:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to seed dummy data',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 