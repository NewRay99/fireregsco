/**
 * Migration script to convert existing TEXT preferred_date fields to TIMESTAMP
 * Run with: npx ts-node src/scripts/migrate-preferred-dates.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or service key. Make sure .env.local is properly configured.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateDates() {
  console.log('Starting preferred_date migration...');

  try {
    // Fetch all leads with non-null preferred_date
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, preferred_date')
      .not('preferred_date', 'is', null);

    if (error) {
      throw error;
    }

    console.log(`Found ${leads.length} leads with preferred_date to migrate`);

    let successCount = 0;
    let failureCount = 0;

    for (const lead of leads) {
      try {
        if (!lead.preferred_date) continue;
        
        // Skip if it's already an ISO date string
        if (typeof lead.preferred_date === 'string' && 
            lead.preferred_date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          console.log(`Lead ${lead.id} already has valid ISO date format`);
          successCount++;
          continue;
        }

        // Try to parse the date
        let timestampValue: string;
        
        try {
          // First attempt - if it's a date string like YYYY-MM-DD
          if (typeof lead.preferred_date === 'string' && lead.preferred_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            timestampValue = new Date(lead.preferred_date + 'T12:00:00Z').toISOString();
          } else {
            // Otherwise try general date parsing
            const date = new Date(lead.preferred_date);
            if (isNaN(date.getTime())) {
              throw new Error(`Cannot parse date: ${lead.preferred_date}`);
            }
            timestampValue = date.toISOString();
          }
          
          // Update the lead with the new timestamp
          const { error: updateError } = await supabase
            .from('leads')
            .update({ preferred_date: timestampValue })
            .eq('id', lead.id);
            
          if (updateError) {
            throw updateError;
          }
          
          console.log(`Successfully migrated lead ${lead.id}: ${lead.preferred_date} -> ${timestampValue}`);
          successCount++;
        } catch (parseError) {
          console.error(`Error parsing date for lead ${lead.id}:`, parseError);
          // Set to null if we can't parse it
          const { error: updateError } = await supabase
            .from('leads')
            .update({ preferred_date: null })
            .eq('id', lead.id);
            
          if (updateError) {
            console.error(`Error updating lead ${lead.id} to null:`, updateError);
          } else {
            console.log(`Set preferred_date to null for lead ${lead.id}`);
          }
          failureCount++;
        }
      } catch (leadError) {
        console.error(`Error processing lead ${lead.id}:`, leadError);
        failureCount++;
      }
    }

    console.log('Migration completed!');
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Failed to migrate: ${failureCount}`);

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

// Run the migration
migrateDates(); 