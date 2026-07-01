-- 002_journey_links_and_arrival.sql
-- Add journey_links for tokenized watcher links + arrival automation columns

-- Journey links (tokenized, auto-expiring watcher URLs)
CREATE TABLE IF NOT EXISTS journey_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,                    -- unguessable token for watcher URL
  watcher_id UUID REFERENCES watchers(id) ON DELETE SET NULL,
  expires_at TIMESTAMP NOT NULL,                 -- auto-expiry (arrival or TTL)
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP                           -- manual revoke via "Stop Sharing"
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_journey_links_token ON journey_links(token);
CREATE INDEX IF NOT EXISTS idx_journey_links_journey_id ON journey_links(journey_id);

-- Add arrival/auto-expiry columns to journeys
ALTER TABLE journeys
  ADD COLUMN IF NOT EXISTS destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destination_lat FLOAT,
  ADD COLUMN IF NOT EXISTS destination_lng FLOAT,
  ADD COLUMN IF NOT EXISTS arrival_radius_meters INT DEFAULT 100,
  ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS auto_expired_at TIMESTAMP;

-- RLS Policies (enable if not already)
ALTER TABLE journey_links ENABLE ROW LEVEL SECURITY;

-- Owner can manage their journey links
CREATE POLICY "Owner can manage journey links"
  ON journey_links FOR ALL
  USING (
    journey_id IN (
      SELECT id FROM journeys WHERE user_id = auth.uid()
    )
  );

-- Watcher can read active link for their journey (via token)
CREATE POLICY "Watcher can read active link by token"
  ON journey_links FOR SELECT
  USING (
    expires_at > NOW() AND revoked_at IS NULL
  );

-- Enable RLS on destinations if not already
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage destinations"
  ON destinations FOR ALL
  USING (user_id = auth.uid());

-- Enable RLS on watchers
ALTER TABLE watchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage watchers"
  ON watchers FOR ALL
  USING (user_id = auth.uid());