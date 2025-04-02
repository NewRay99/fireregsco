# Supabase Setup Guide for Lead Management System

This guide will help you set up Supabase as the database back-end for the lead management system, replacing the Google Sheets storage option.

## Prerequisites

1. A Supabase account (free tier works fine for testing)
2. Your project's environment variables properly configured

## Creating a Supabase Project

1. Sign up or log in at [supabase.com](https://supabase.com)
2. Create a new project and note down your project URL and API keys
3. You will need:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - Public Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - Service Role Key (SUPABASE_SERVICE_ROLE_KEY)

## Setting Up Database Tables

Run the following SQL statements in the Supabase SQL Editor to create the required tables:

```sql
-- Leads table
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  property_type TEXT,
  door_count TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  preferred_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Status tracking table
CREATE TABLE status_tracking (
  id SERIAL PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id),
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Status workflow reference table
CREATE TABLE status_workflow (
  id SERIAL PRIMARY KEY,
  status TEXT UNIQUE NOT NULL,
  description TEXT,
  order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_status_tracking_lead_id ON status_tracking(lead_id);

-- Row-Level Security policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_workflow ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all access for authenticated users" ON leads
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all access for authenticated users" ON status_tracking
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all access for authenticated users" ON status_workflow
  FOR ALL TO authenticated USING (true);

-- Create policies for anonymous users (read-only for certain tables)
CREATE POLICY "Allow read access for anonymous users" ON status_workflow
  FOR SELECT TO anon USING (true);
```

## Populating Status Workflow

Run the following SQL to populate the status workflow table with the default statuses:

```sql
INSERT INTO status_workflow (status, description, order)
VALUES
  ('pending', 'Initial status for new leads that have just submitted an inquiry', 0),
  ('contacted', 'The lead has been contacted via phone, email, or other means', 1),
  ('interested', 'The lead has expressed interest in booking a service', 2),
  ('reserved booking', 'A booking has been tentatively reserved but not finalized', 3),
  ('sent invoice', 'An invoice has been sent to the lead for payment', 4),
  ('payment received', 'Payment has been received for the booking', 5),
  ('booked', 'The booking has been confirmed and scheduled', 6),
  ('completed inspection', 'The fire door inspection has been completed', 7),
  ('completed', 'The entire service process has been completed', 8),
  ('refunded', 'The payment has been refunded to the customer', 9),
  ('aftersales', 'The customer is in the after-sales support phase', 10),
  ('void', 'The lead/booking has been cancelled or voided', 998),
  ('not available', 'The lead could not be reached or is not available', 999);
```

## Environment Configuration

Add the following to your `.env.local` file:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
USE_SUPABASE_STORAGE=true
```

Replace the placeholder values with your actual Supabase project values.

## Testing the Connection

1. Start your development server: `npm run dev`
2. Navigate to `/admin/seed` to generate test data
3. Use a small batch (10-20 leads) for initial testing
4. Check the Supabase dashboard to verify data is being saved correctly

## Switching Between Storage Options

If you need to switch between Google Sheets and Supabase:

- To use Supabase: Set `USE_SUPABASE_STORAGE=true` in `.env.local`
- To use Google Sheets: Set `USE_SUPABASE_STORAGE=false` in `.env.local` (or remove the variable)

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Make sure your Supabase API keys are correctly formatted and have no trailing spaces

2. **Permission Errors**: Check the RLS (Row-Level Security) policies in Supabase and ensure they're configured correctly

3. **Missing Data**: Verify your tables are created with the exact column names listed in this guide

4. **Connection Issues**: Check your network connection and Supabase project status

### Debugging

If you encounter problems:

1. Check the browser console and server logs for error messages
2. Verify that the data structure matches what's expected by the application
3. Try using the Supabase dashboard to run manual queries and verify database contents
4. Reset the test data by using the seed function again

## Additional Configuration

For production environments, you should also:

1. Set up backups for your Supabase database
2. Configure email notifications for important events
3. Implement proper authentication with user roles
4. Add additional indexes for frequently queried columns 