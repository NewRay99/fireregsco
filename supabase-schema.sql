DROP INDEX IF EXISTS idx_leads_email ;

DROP INDEX IF EXISTS idx_status_tracking_lead_id;

DROP INDEX IF EXISTS idx_leads_status;
DROP constraint  IF EXISTS status_tracking_lead_id_fkey ;

DROP TABLE IF EXISTS  leads;

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