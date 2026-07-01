-- 003_watcher_access.sql
-- Zero-install watcher access: a tokenized link lets an anonymous browser follow
-- a live journey without logging in. We expose data two ways:
--   1. get_watch_snapshot(token) — a SECURITY DEFINER RPC that validates the
--      token (active + unexpired + not revoked) and returns the journey status,
--      destination and latest ping. This is the initial load + polling fallback.
--   2. Realtime on gps_pings, gated by RLS to journeys that currently have an
--      active journey_link, for live position updates.

-- 1. Snapshot RPC ----------------------------------------------------------

CREATE OR REPLACE FUNCTION get_watch_snapshot(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_journey_id UUID;
  v_result JSON;
BEGIN
  SELECT journey_id INTO v_journey_id
  FROM journey_links
  WHERE token = p_token
    AND revoked_at IS NULL
    AND expires_at > NOW()
  LIMIT 1;

  IF v_journey_id IS NULL THEN
    RETURN NULL; -- invalid / expired / revoked token
  END IF;

  SELECT json_build_object(
    'journey_id', j.id,
    'status', j.status,
    'arrived_at', j.arrived_at,
    'destination_lat', j.destination_lat,
    'destination_lng', j.destination_lng,
    'latest', (
      SELECT json_build_object(
        'latitude', g.latitude,
        'longitude', g.longitude,
        'timestamp', g.timestamp
      )
      FROM gps_pings g
      WHERE g.journey_id = j.id
      ORDER BY g.timestamp DESC
      LIMIT 1
    )
  ) INTO v_result
  FROM journeys j
  WHERE j.id = v_journey_id;

  RETURN v_result;
END;
$$;

-- The anon role is what the zero-install watcher browser uses.
GRANT EXECUTE ON FUNCTION get_watch_snapshot(TEXT) TO anon, authenticated;

-- 2. RLS on gps_pings ------------------------------------------------------
-- Enabling RLS here would block the traveler's own inserts unless we also add an
-- owner policy, so both are created together.

ALTER TABLE gps_pings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages own pings" ON gps_pings;
CREATE POLICY "Owner manages own pings"
  ON gps_pings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Watchers may read pings only for journeys that are currently being shared via
-- an active, unexpired, non-revoked link. Journey ids are unguessable UUIDs and
-- exposure ends the moment the link expires or is revoked.
DROP POLICY IF EXISTS "Watchers read pings for actively shared journeys" ON gps_pings;
CREATE POLICY "Watchers read pings for actively shared journeys"
  ON gps_pings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journey_links jl
      WHERE jl.journey_id = gps_pings.journey_id
        AND jl.revoked_at IS NULL
        AND jl.expires_at > NOW()
    )
  );

-- 3. Realtime --------------------------------------------------------------
-- Add gps_pings to the Supabase realtime publication so watchers get live
-- INSERTs. Wrapped so re-running the migration is safe.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE gps_pings;
EXCEPTION
  WHEN duplicate_object THEN NULL; -- already in the publication
  WHEN undefined_object THEN NULL; -- publication not present (local/dev)
END $$;
