-- First, create the admin_users table which is referenced in policies
CREATE TABLE admin_users (
  email TEXT PRIMARY KEY,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial admin user (replace with your admin email)
INSERT INTO admin_users (email) VALUES ('admin@example.com');

-- Create a health check table for connection testing
CREATE TABLE _health_check (
  id SERIAL PRIMARY KEY,
  status TEXT DEFAULT 'ok',
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial health check record
INSERT INTO _health_check (status) VALUES ('ok');

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
ALTER TABLE status_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitter_scrape_history ENABLE ROW LEVEL SECURITY;
;
CREATE POLICY allow_all ON status_workflow FOR ALL TO authenticated USING (true);
CREATE POLICY allow_all ON twitter_scrape_history FOR ALL TO authenticated USING (true);

CREATE POLICY allow_service_all ON status_workflow FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY allow_service_all ON twitter_scrape_history FOR ALL USING (auth.role() = 'service_role');

-- Comment on tables
COMMENT ON TABLE status_workflow IS 'Configuration of allowed status transitions';
COMMENT ON TABLE twitter_scrape_history IS 'History of Twitter handle scraping activity to limit API calls';

-- Users table for authentication and user management
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Create policy for users to update their own data
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Sales table (formerly leads)
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  property_type TEXT,
  door_count INTEGER,
  message TEXT,
  status TEXT DEFAULT 'pending',
  preferred_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read sales data
CREATE POLICY "Authenticated users can read sales" ON sales
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for admin users to insert/update sales data
CREATE POLICY "Admin users can manage sales" ON sales
  FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.email IN (SELECT email FROM admin_users)
  ));

-- Sales tracking table (formerly lead tracking)
CREATE TABLE sales_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

-- Enable Row Level Security
ALTER TABLE sales_tracking ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select from sales_tracking
CREATE POLICY "Allow authenticated users to select from sales_tracking" 
ON sales_tracking
FOR SELECT 
TO authenticated
USING (true);

-- Allow authenticated users to insert into sales_tracking
CREATE POLICY "Allow authenticated users to insert into sales_tracking" 
ON sales_tracking
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update their own entries in sales_tracking
CREATE POLICY "Allow authenticated users to update their own entries in sales_tracking" 
ON sales_tracking
FOR UPDATE 
TO authenticated
USING (updated_by = auth.uid()::text OR updated_by = 'admin');

-- Allow authenticated users to delete their own entries in sales_tracking
CREATE POLICY "Allow authenticated users to delete their own entries in sales_tracking" 
ON sales_tracking
FOR DELETE 
TO authenticated
USING (updated_by = auth.uid()::text OR updated_by = 'admin');

-- Support tickets table (formerly logs)
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  category TEXT DEFAULT 'general',
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own support tickets
CREATE POLICY "Users can read their own support tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.email IN (SELECT email FROM admin_users)
  ));

-- Create policy for users to create support tickets
CREATE POLICY "Users can create support tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy for admin users to manage all support tickets
CREATE POLICY "Admin users can manage all support tickets" ON support_tickets
  FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.email IN (SELECT email FROM admin_users)
  ));

-- Conversations table for chat history
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own conversations
CREATE POLICY "Users can manage their own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

-- Messages table for individual messages in conversations
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read messages in their conversations
CREATE POLICY "Users can read messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Create policy for users to insert messages in their conversations
CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Settings table for application settings
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users to manage settings
CREATE POLICY "Admin users can manage settings" ON settings
  FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.email IN (SELECT email FROM admin_users)
  ));

-- Create policy for all users to read public settings
CREATE POLICY "All users can read public settings" ON settings
  FOR SELECT USING (key LIKE 'public.%');

-- Documents table for storing documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own documents
CREATE POLICY "Users can manage their own documents" ON documents
  FOR ALL USING (auth.uid() = user_id);

-- Create policy for admin users to read all documents
CREATE POLICY "Admin users can read all documents" ON documents
  FOR SELECT USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.email IN (SELECT email FROM admin_users)
  ));

-- Transcriptions table for storing audio transcriptions
CREATE TABLE transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  audio_url TEXT,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own transcriptions
CREATE POLICY "Users can manage their own transcriptions" ON transcriptions
  FOR ALL USING (auth.uid() = user_id);

-- Create policy for admin users to read all transcriptions
CREATE POLICY "Admin users can read all transcriptions" ON transcriptions
  FOR SELECT USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.email IN (SELECT email FROM admin_users)
  ));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tables with updated_at columns
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON sales
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON support_tickets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 




-- Also create a policy to allow anonymous users to use the service role key
CREATE POLICY allow_service_all ON conversations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY allow_service_all ON sales FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY allow_service_all ON sales_tracking FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY allow_service_all ON support_tickets FOR ALL USING (auth.role() = 'service_role');