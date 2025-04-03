-- Create a table for door count ranges
CREATE TABLE door_count_ranges (
  id SERIAL PRIMARY KEY,
  range_name TEXT NOT NULL UNIQUE,
  min_count INTEGER NOT NULL,
  max_count INTEGER,  -- NULL for unlimited (e.g., "2000+")
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the predefined door count ranges
INSERT INTO door_count_ranges (range_name, min_count, max_count, display_order)
VALUES
  ('20-100', 20, 100, 1),
  ('100-200', 100, 200, 2),
  ('200-1000', 200, 1000, 3),
  ('1000-2000', 1000, 2000, 4),
  ('2000+', 2000, NULL, 5);

-- Create an index for faster lookups
CREATE INDEX idx_door_count_ranges_name ON door_count_ranges(range_name); 