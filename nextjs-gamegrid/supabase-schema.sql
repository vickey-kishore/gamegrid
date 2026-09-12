-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function (must be defined before using it)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Profiles table for user roles and additional user data
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'player' CHECK (role IN ('admin', 'creator', 'player')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    'player'  -- Default role for all new users
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auction Events (Reference data)
CREATE TABLE auction_events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auction Categories (Reference data)
CREATE TABLE auction_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  min_players INTEGER DEFAULT 1,
  max_players INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auction Event Categories (Reference data) - keeping for backward compatibility
CREATE TABLE auction_event_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roster Category Constraints (Reference data) - keeping for backward compatibility
CREATE TABLE roster_category_constraints (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  base_price DECIMAL(10, 2) DEFAULT 0,
  image_url TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auctions
CREATE TABLE auctions (
  id SERIAL PRIMARY KEY,
  auction_name VARCHAR(255) NOT NULL,
  event_name VARCHAR(255),
  category VARCHAR(100),
  events TEXT, -- Comma-separated event names (keeping for backward compatibility)
  selected_events INTEGER[], -- Array of event IDs
  roster_rules JSONB DEFAULT '[]'::jsonb,
  allow_retention BOOLEAN DEFAULT FALSE,
  max_retained_players INTEGER DEFAULT 0,
  retention_price DECIMAL(10, 2) DEFAULT 0,
  auction_date TIMESTAMP WITH TIME ZONE,
  auction_venue VARCHAR(255),
  description TEXT,
  minimum_bid DECIMAL(10, 2),
  bid_increment DECIMAL(10, 2),
  auction_purse_amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Live', 'Completed')),
  is_deleted BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auction Categories Configuration (stores category settings per auction)
CREATE TABLE auction_category_config (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  category_name VARCHAR(255) NOT NULL,
  min_players INTEGER DEFAULT 1,
  max_players INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(auction_id, category_name)
);

-- Auction Teams
CREATE TABLE auction_teams (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  team_name VARCHAR(255) NOT NULL,
  logo_path TEXT,
  purse_amount DECIMAL(10, 2) NOT NULL,
  remaining_purse DECIMAL(10, 2) NOT NULL,
  minimum_players INTEGER DEFAULT 0,
  maximum_players INTEGER DEFAULT 99,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auction Players (Players in an auction)
CREATE TABLE auction_players (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'Available' CHECK (status IN ('Available', 'Sold', 'Unsold')),
  sold_to_team_id INTEGER REFERENCES auction_teams(id) ON DELETE SET NULL,
  sold_price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(auction_id, player_id)
);

-- Bids
CREATE TABLE bids (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  auction_player_id INTEGER NOT NULL REFERENCES auction_players(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES auction_teams(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournaments
CREATE TABLE tournaments (
  id SERIAL PRIMARY KEY,
  tournament_name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Completed')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournament Fixtures
CREATE TABLE tournament_fixtures (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_a_id INTEGER NOT NULL,
  team_b_id INTEGER NOT NULL,
  fixture_date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue VARCHAR(255),
  result_a_score INTEGER,
  result_b_score INTEGER,
  status VARCHAR(50) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_is_deleted ON auctions(is_deleted);
CREATE INDEX idx_auction_teams_auction_id ON auction_teams(auction_id);
CREATE INDEX idx_auction_players_auction_id ON auction_players(auction_id);
CREATE INDEX idx_auction_players_player_id ON auction_players(player_id);
CREATE INDEX idx_auction_players_status ON auction_players(status);
CREATE INDEX idx_bids_auction_id ON bids(auction_id);
CREATE INDEX idx_bids_auction_player_id ON bids(auction_player_id);
CREATE INDEX idx_bids_team_id ON bids(team_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournament_fixtures_tournament_id ON tournament_fixtures(tournament_id);
CREATE INDEX idx_auction_events_sort_order ON auction_events(sort_order);
CREATE INDEX idx_auction_category_config_auction_id ON auction_category_config(auction_id);

-- Create triggers for updated_at
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auctions_updated_at BEFORE UPDATE ON auctions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auction_teams_updated_at BEFORE UPDATE ON auction_teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auction_players_updated_at BEFORE UPDATE ON auction_players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_fixtures_updated_at BEFORE UPDATE ON tournament_fixtures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auction_category_config_updated_at BEFORE UPDATE ON auction_category_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data for auction events
INSERT INTO auction_events (name, sort_order) VALUES
  ('Men Doubles', 1),
  ('Women Doubles', 2),
  ('Mixed Doubles', 3),
  ('Under 19 Boys Singles', 4),
  ('Under 19 Girls Singles', 5),
  ('Under 19 Boys Doubles', 6),
  ('Under 19 Girls Doubles', 7),
  ('Under 19 Mixed Doubles', 8),
  ('Men Singles', 9),
  ('Women Singles', 10),
  ('Jumbled Men Doubles', 11),
  ('Veteran Men Doubles', 12),
  ('Under 17 Boys Singles', 13),
  ('Under 17 Girls Singles', 14),
  ('Under 17 Boys Doubles', 15),
  ('Under 17 Girls Doubles', 16),
  ('Under 17 Mixed Doubles', 17);

-- Insert seed data for auction categories
INSERT INTO auction_categories (name, min_players, max_players) VALUES
  ('Men', 1, NULL),
  ('Women', 1, NULL),
  ('Under 19 Boys', 1, NULL),
  ('Under 19 Girls', 1, NULL),
  ('Under 17 Boys', 1, NULL),
  ('Under 17 Girls', 1, NULL),
  ('40+ Men', 1, NULL),
  ('40+ Women', 1, NULL);

-- Insert seed data for auction event categories (keeping for backward compatibility)
INSERT INTO auction_event_categories (name) VALUES
  ('Men Doubles'),
  ('Reverse Men Doubles'),
  ('Veteran Doubles'),
  ('Jumbled Doubles'),
  ('Mixed Doubles'),
  ('Under 17 Boys Singles'),
  ('Under 17 Boys Doubles'),
  ('Under 19 Singles Singles'),
  ('Under 19 Boys Doubles'),
  ('Women Doubles');

-- Insert seed data for roster category constraints (keeping for backward compatibility)
INSERT INTO roster_category_constraints (name) VALUES
  ('Men'),
  ('Women'),
  ('45+'),
  ('35+'),
  ('U-17 Boys'),
  ('U-19 Boys'),
  ('U-19 Girls'),
  ('U-17 Girls');

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_category_config ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Only admins can update roles" ON profiles
  FOR UPDATE USING (
    auth.uid() = id AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Basic RLS policies (you'll want to customize these based on your auth requirements)
-- For now, allow public read access for development
CREATE POLICY "Public read access for auctions" ON auctions
  FOR SELECT USING (true);

CREATE POLICY "Public read access for auction_teams" ON auction_teams
  FOR SELECT USING (true);

CREATE POLICY "Public read access for players" ON players
  FOR SELECT USING (true);

CREATE POLICY "Public read access for auction_players" ON auction_players
  FOR SELECT USING (true);

CREATE POLICY "Public read access for bids" ON bids
  FOR SELECT USING (true);

CREATE POLICY "Public read access for tournaments" ON tournaments
  FOR SELECT USING (true);

CREATE POLICY "Public read access for tournament_fixtures" ON tournament_fixtures
  FOR SELECT USING (true);

-- Similar policies for other tables...
CREATE POLICY "Authenticated users can insert auction_teams" ON auction_teams
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update auction_teams" ON auction_teams
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete auction_teams" ON auction_teams
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert players" ON players
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update players" ON players
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete players" ON players
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert auction_players" ON auction_players
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update auction_players" ON auction_players
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete auction_players" ON auction_players
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert bids" ON bids
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert tournaments" ON tournaments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tournaments" ON tournaments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tournaments" ON tournaments
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert tournament_fixtures" ON tournament_fixtures
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tournament_fixtures" ON tournament_fixtures
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tournament_fixtures" ON tournament_fixtures
  FOR DELETE USING (auth.role() = 'authenticated');

-- Resource-based access control policies
-- Users can see all auctions (public read)
CREATE POLICY "Users can read all auctions" ON auctions
  FOR SELECT USING (true);

-- Users can insert auctions (they own)
CREATE POLICY "Users can insert their own auctions" ON auctions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own auctions OR if they are master admin
CREATE POLICY "Users can update their own auctions" ON auctions
  FOR UPDATE USING (
    auth.uid() = user_id OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Users can delete their own auctions OR if they are master admin
CREATE POLICY "Users can delete their own auctions" ON auctions
  FOR DELETE USING (
    auth.uid() = user_id OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Users can see all tournaments (public read)
CREATE POLICY "Users can read all tournaments" ON tournaments
  FOR SELECT USING (true);

-- Users can insert tournaments (they own)
CREATE POLICY "Users can insert their own tournaments" ON tournaments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tournaments OR if they are master admin
CREATE POLICY "Users can update their own tournaments" ON tournaments
  FOR UPDATE USING (
    auth.uid() = user_id OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Users can delete their own tournaments OR if they are master admin
CREATE POLICY "Users can delete their own tournaments" ON tournaments
  FOR DELETE USING (
    auth.uid() = user_id OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Public read access for reference tables
CREATE POLICY "Public read access for auction_events" ON auction_events
  FOR SELECT USING (true);

CREATE POLICY "Public read access for auction_categories" ON auction_categories
  FOR SELECT USING (true);

CREATE POLICY "Public read access for auction_category_config" ON auction_category_config
  FOR SELECT USING (true);

-- Users can insert auction_category_config for their own auctions
CREATE POLICY "Users can insert auction_category_config for their auctions" ON auction_category_config
  FOR INSERT WITH CHECK (
    auction_id IN (
      SELECT id FROM auctions WHERE user_id = auth.uid() OR
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- Users can update auction_category_config for their own auctions
CREATE POLICY "Users can update auction_category_config for their auctions" ON auction_category_config
  FOR UPDATE USING (
    auction_id IN (
      SELECT id FROM auctions WHERE user_id = auth.uid() OR
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- Users can delete auction_category_config for their own auctions
CREATE POLICY "Users can delete auction_category_config for their auctions" ON auction_category_config
  FOR DELETE USING (
    auction_id IN (
      SELECT id FROM auctions WHERE user_id = auth.uid() OR
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- Auction Registrations (Player registrations for auctions)
CREATE TABLE auction_registrations (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  club VARCHAR(255) NOT NULL,
  dob DATE NOT NULL,
  mobile_number VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for auction_registrations
CREATE INDEX idx_auction_registrations_auction_id ON auction_registrations(auction_id);
CREATE INDEX idx_auction_registrations_category ON auction_registrations(category);
CREATE INDEX idx_auction_registrations_mobile ON auction_registrations(mobile_number);
CREATE INDEX idx_auction_registrations_email ON auction_registrations(email);

-- Create trigger for updated_at on auction_registrations
CREATE TRIGGER update_auction_registrations_updated_at BEFORE UPDATE ON auction_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for auction_registrations
ALTER TABLE auction_registrations ENABLE ROW LEVEL SECURITY;

-- Public read access for auction_registrations
CREATE POLICY "Public read access for auction_registrations" ON auction_registrations
  FOR SELECT USING (true);

-- Authenticated users can insert auction_registrations
CREATE POLICY "Authenticated users can insert auction_registrations" ON auction_registrations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Admin/creator can update auction_registrations
CREATE POLICY "Admin can update auction_registrations" ON auction_registrations
  FOR UPDATE USING (
    auction_id IN (
      SELECT id FROM auctions WHERE user_id = auth.uid() OR
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- Admin/creator can delete auction_registrations
CREATE POLICY "Admin can delete auction_registrations" ON auction_registrations
  FOR DELETE USING (
    auction_id IN (
      SELECT id FROM auctions WHERE user_id = auth.uid() OR
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    )
  );
