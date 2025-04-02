# Ansh & Riley Full-Stack Template

This is a full-stack template project for Software Composers to create  applications with AI.

## Getting started
To create a new project, you go to `/paths`, choose from our list of Paths, and then use Cursor's Composer feature to quickly scaffold your project!

You can also edit the Path's prompt template to be whatever you like!

## Technologies used
This doesn't really matter, but is useful for the AI to understand more about this project. We are using the following technologies
- React with Next.js 14 App Router
- TailwindCSS
- Firebase Auth, Storage, and Database
- Multiple AI endpoints including OpenAI, Anthropic, and Replicate using Vercel's AI SDK

## Supabase Database Migration Guide

The application has been updated to use Supabase instead of Google Sheets for faster database operations. Here's how to set up and migrate:

### 1. Set Up Supabase

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Get your Supabase URL and anon key from the project settings
4. Add these values to your `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   USE_SUPABASE_STORAGE=true
   ```

### 2. Create Tables in Supabase

1. Go to the SQL Editor in your Supabase dashboard
2. Create a new query and paste the following SQL commands:

```sql
DROP INDEX IF EXISTS idx_leads_email;
DROP INDEX IF EXISTS idx_status_tracking_lead_id;
DROP INDEX IF EXISTS idx_leads_status;
DROP CONSTRAINT IF EXISTS status_tracking_lead_id_fkey;
DROP TABLE IF EXISTS leads;

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  property_type TEXT,
  door_count TEXT,
  preferred_date TIMESTAMP WITH TIME ZONE,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create status tracking table for lead history
CREATE TABLE IF NOT EXISTS status_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create status workflow table
CREATE TABLE IF NOT EXISTS status_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_status TEXT NOT NULL UNIQUE,
  next_statuses JSONB NOT NULL, -- Array of possible next statuses
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create twitter_scrape_history table to track scraping activity
CREATE TABLE IF NOT EXISTS twitter_scrape_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_handle TEXT NOT NULL,
  last_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Create index on lead_id in status_tracking for faster joins
CREATE INDEX IF NOT EXISTS idx_status_tracking_lead_id ON status_tracking(lead_id);

-- Create index on status in leads for faster filtering
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Create index on twitter_handle for faster lookups
CREATE INDEX IF NOT EXISTS idx_twitter_scrape_history_handle ON twitter_scrape_history(twitter_handle);

-- Create index on last_scraped_at for date queries
CREATE INDEX IF NOT EXISTS idx_twitter_scrape_history_date ON twitter_scrape_history(last_scraped_at);

-- Populate status workflow with default values
INSERT INTO status_workflow (current_status, next_statuses) 
VALUES
  ('pending', '["contacted", "not available"]'),
  ('contacted', '["interested", "not available"]'),
  ('interested', '["reserved booking", "not available"]'),
  ('reserved booking', '["sent invoice", "not available"]'),
  ('sent invoice', '["payment received", "not available"]'),
  ('payment received', '["booked", "not available"]'),
  ('booked', '["completed inspection", "not available"]'),
  ('completed inspection', '["completed", "aftersales", "refunded", "not available"]'),
  ('completed', '["aftersales", "not available"]'),
  ('aftersales', '["completed", "refunded", "not available"]'),
  ('refunded', '["not available"]'),
  ('not available', '["pending"]'),
  ('void', '["pending"]')
ON CONFLICT (current_status) DO NOTHING;

-- Enable row level security but allow all operations for now
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitter_scrape_history ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for authenticated users
CREATE POLICY allow_all ON leads FOR ALL TO authenticated USING (true);
CREATE POLICY allow_all ON status_tracking FOR ALL TO authenticated USING (true);
CREATE POLICY allow_all ON status_workflow FOR ALL TO authenticated USING (true);
CREATE POLICY allow_all ON twitter_scrape_history FOR ALL TO authenticated USING (true);

-- Allow anonymous access for leads table to support unauthenticated form submissions
DROP POLICY IF EXISTS allow_anon_insert ON leads;
CREATE POLICY allow_anon_insert ON leads FOR INSERT TO anon WITH CHECK (true);

-- Also create a policy to allow anonymous users to use the service role key
CREATE POLICY allow_service_all ON leads FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY allow_service_all ON status_tracking FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY allow_service_all ON status_workflow FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY allow_service_all ON twitter_scrape_history FOR ALL USING (auth.role() = 'service_role');

-- Comment on tables
COMMENT ON TABLE leads IS 'Customer leads collected from the website';
COMMENT ON TABLE status_tracking IS 'History of status changes for each lead';
COMMENT ON TABLE status_workflow IS 'Configuration of allowed status transitions';
COMMENT ON TABLE twitter_scrape_history IS 'History of Twitter handle scraping activity to limit API calls';
```

3. Run the query to create all necessary tables with indexes and default data

### 3. Set Up Supabase Client

You need to import and use the Supabase client in your application. The project has already set up the client in `src/lib/supabase.ts`:

```javascript
// Client-side usage:
import { supabase } from '@/lib/supabase';

// In API routes (server-side) with admin privileges:
import { getServiceSupabase } from '@/lib/supabase';
const supabaseAdmin = getServiceSupabase();
```

The Supabase client is automatically initialized with the environment variables you've set up. All API routes have been updated to check for the `USE_SUPABASE_STORAGE` environment variable and will automatically use Supabase when it's set to `true`.

### 4. Migrate Data from Google Sheets (Optional)

If you have existing data in Google Sheets, you can migrate it to Supabase:

1. Export your Google Sheet data as CSV
2. Import the CSV files into the appropriate Supabase tables using the Supabase dashboard's Table Editor

### 4. Testing the Migration

1. Make sure all API endpoints are working by:
   - Creating a new lead through the contact form
   - Checking the admin dashboard
   - Updating lead statuses

The application includes the following API endpoints for Supabase:

- `GET /api/supabase` - Retrieves leads with optional filtering
- `POST /api/supabase` - Creates a new lead
- `PUT /api/supabase` - Updates an existing lead
- `GET /api/status/workflow` - Gets the status workflow configuration
- `POST /api/admin/seed` - Seeds test data into the database

You can monitor requests in the Network tab of your browser's developer tools to ensure they're connecting to Supabase instead of Google Sheets.

### Fallback to Google Sheets (If Needed)

The application still has the Google Sheets implementation in the codebase. If you need to revert:

1. Remove Supabase environment variables
2. Revert the API files to use Google Sheets (check version control history)

### Tables Created

The migration creates three tables in Supabase:

1. `leads` - Stores lead information (name, email, etc.)
2. `status_tracking` - Records status history for each lead
3. `status_workflow` - Defines allowed status transitions

## Preferred Date Migration Instructions

The `preferred_date` field in the Supabase leads table has been updated from `TEXT` to `TIMESTAMP WITH TIME ZONE` for improved date handling. Here's how to handle the migration:

### 1. Database Schema Changes

The schema change has already been made in `supabase-schema.sql`. If you're creating a new database, it will automatically use the correct format.

### 2. Updating Existing Data

If you have existing data with the old TEXT format, run the migration script:

1. Install required dependencies:
   ```
   npm install dotenv@latest
   ```

2. Add a Supabase service key to your .env.local file (optional but recommended):
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. Run the migration script:
   ```
   npx ts-node src/scripts/migrate-preferred-dates.ts
   ```

This script will:
- Convert YYYY-MM-DD format strings to proper ISO timestamps
- Attempt to parse other date formats
- Set unparseable dates to NULL

### 3. Code Changes

The following code has been updated to handle the new timestamp format:

1. **ContactForm.tsx**: Now converts the date input to an ISO timestamp before submission
2. **supabase.ts**: Updated formatting functions for both sending and receiving date data
3. **Lead interfaces**: Type definitions have been updated to reflect the date format changes

### 4. Troubleshooting

If you encounter any issues with the date format, check:
- The date being submitted from the contact form
- The format of dates in the Supabase database
- The display formatting in the admin dashboard