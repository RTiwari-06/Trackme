# TrackMe 2 - Complete Production Setup Guide

**Strategy**: Cloud-native (Supabase + Upstash), EAS Cloud Builds, Free GPS (expo-location), Android-First Launch

**Total Time**: ~90 minutes

---

## Phase 1: Local Developer Tools (15 min)

### Step 1.1: Verify Node.js (≥18.0 LTS)

```powershell
# Check installed version
node --version
npm --version

# If not installed, download from https://nodejs.org/ (LTS)
# Then verify:
node --version  # Should be v18.x or v20.x
```

**Expected output**:
```
v20.11.0
10.2.0
```

### Step 1.2: Verify Git

```powershell
git --version
# Expected: git version 2.x.x or higher
```

### Step 1.3: Install EAS CLI Globally

```powershell
npm install -g eas-cli
eas --version
# Expected: eas@x.x.x
```

**Verify installation**:
```powershell
where eas
# Should show path like: C:\Users\YourUser\AppData\Roaming\npm\eas
```

### Step 1.4: Create Expo Project

```powershell
# Choose a workspace directory
cd C:\Users\compaq\Desktop\SCT_WD\Tracer

# Initialize Expo project
npx create-expo-app TrackMe

# Navigate into project
cd TrackMe

# Verify Expo setup
npx expo --version
# Expected: expo@x.x.x
```

**Project structure created**:
```
TrackMe/
├── app.json
├── package.json
├── App.js
├── babel.config.js
└── ...
```

---

## Phase 2: Cloud Infrastructure Setup (30 min)

### Step 2.1: Create Supabase Project (PostgreSQL + Auth)

**2.1a: Sign up**
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Verify email

**2.1b: Create organization**
- Enter organization name: `TrackMe`
- Choose free plan

**2.1c: Create first project**
- Project name: `trackme-prod`
- Database password: Generate strong password (save in password manager!)
- Region: **Singapore** (closest to India for low latency)
- Click "Create new project" (wait 2-3 min for initialization)

**2.1d: Get credentials**
Once dashboard loads, go to **Settings → API → Project Settings**:
- Copy `Project URL` → save as `SUPABASE_URL`
- Copy `anon public` key → save as `SUPABASE_ANON_KEY`

```
Example:
SUPABASE_URL=https://xyzabc.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

---

### Step 2.2: Create Upstash Redis Database

**2.2a: Sign up**
1. Go to [https://upstash.com](https://upstash.com)
2. Sign up with GitHub or Google
3. Verify email

**2.2b: Create Redis database**
- Click "Create Database"
- Name: `trackme-redis`
- Region: **Singapore** (same as Supabase)
- Type: Redis (default)
- Click "Create"

**2.2c: Get connection details**
In database dashboard, go to **Details** tab:
- Copy `Redis URL (TLS)` → save as `REDIS_URL`
- It looks like: `rediss://default:password@host:port`

```
Example:
REDIS_URL=rediss://default:abc123xyz@abc-redis.upstash.io:6379
```

---

## Phase 3: Third-Party API Keys (20 min)

### Step 3.1: Create Mapbox Account

**3.1a: Sign up**
1. Go to [https://mapbox.com](https://mapbox.com)
2. Click "Sign up"
3. Create account (email + password or GitHub)
4. Verify email

**3.1b: Get access token**
1. After login, go to **Account → Tokens** (or dashboard)
2. Click "Create a token"
3. Name it: `TrackMe-Mobile`
4. Check permissions: `public`, `write`
5. Create token
6. Copy token → save as `MAPBOX_TOKEN`

```
Example:
MAPBOX_TOKEN=pk.eyJ1IjoieW91cm51bWJlciIsImEiOiJjazl...
```

**Keep this token secret** (don't commit to git)

---

### Step 3.2: Create Expo Account (for EAS Builds)

**3.2a: Sign up**
1. Go to [https://expo.dev](https://expo.dev)
2. Click "Sign up"
3. Create account (GitHub recommended for easy linking)
4. Verify email

**3.2b: Link to local CLI**
```powershell
# From TrackMe project root
cd C:\Users\compaq\Desktop\SCT_WD\Tracer\TrackMe

eas login
# Browser opens → sign in → return to CLI
# Expected: "Logged in as your_expo_username"
```

**Verify**:
```powershell
eas whoami
# Expected: your_expo_username
```

---

## Phase 4: Project Configuration (25 min)

### Step 4.1: Install Mobile Dependencies

From `TrackMe/` directory:

```powershell
# GPS & Background Tasks
npm install expo-location expo-task-manager

# Navigation
npm install expo-router expo-navigation

# Maps
npm install react-native-maps

# State Management
npm install zustand

# Supabase (Backend)
npm install @supabase/supabase-js

# Redis Client (for real-time features)
npm install redis
```

**Verify all installations**:
```powershell
npm list expo-location zustand @supabase/supabase-js
# Should show all packages with versions
```

---

### Step 4.2: Create Environment Configuration File

From `TrackMe/` root:

```powershell
# Create .env.local file
@"
# Supabase (PostgreSQL + Auth)
SUPABASE_URL=https://xyzabc.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# Mapbox (Maps & Routing)
MAPBOX_TOKEN=pk.eyJ1IjoieW91...

# Upstash Redis (Real-time GPS pings)
REDIS_URL=rediss://default:abc123@abc-redis.upstash.io:6379

# App Config
EXPO_PUBLIC_ENV=production
"@ | Out-File -Encoding UTF8 .env.local
```

**Verify file created**:
```powershell
Get-Content .env.local
```

---

### Step 4.3: Update app.json for Android-First

Edit `app.json`:

```json
{
  "expo": {
    "name": "TrackMe",
    "slug": "trackme",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTabletMode": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.trackme.app",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ]
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow TrackMe to access your location."
        }
      ]
    ]
  }
}
```

**Key Android permissions for background GPS**:
- `ACCESS_FINE_LOCATION`: High-precision GPS
- `ACCESS_COARSE_LOCATION`: Network-based location
- `ACCESS_BACKGROUND_LOCATION`: Background tracking

---

### Step 4.4: Configure EAS for Android-First Builds

Create `eas.json` in project root:

```powershell
@"
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "preview2": {
      "android": {
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "preview3": {
      "developmentClient": true
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccount": "~/.gradle/keystore.properties"
      }
    }
  }
}
"@ | Out-File -Encoding UTF8 eas.json
```

**Verify**:
```powershell
Get-Content eas.json
```

---

### Step 4.5: Test Local Expo Dev Server

```powershell
# Start Expo dev server
npx expo start

# Output will show:
# ➜  Expo Go app
# ➜  Android Emulator
# ➜  Web
# Press 'a' to open Android Emulator
# Press 'i' to open iOS Simulator (if on Mac)
# Press 'w' to open web
```

**For Android testing** (requires Android Emulator):
- If you have Android Studio installed: open Android Emulator
- Press 'a' in dev server terminal
- APK builds and deploys to emulator

---

## Phase 5: Database Schema Setup (15 min)

### Step 5.1: Create Tables in Supabase

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select `trackme-prod` project
3. Go to **SQL Editor** (left sidebar)
4. Click **New query**
5. Paste the following SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Journeys table
CREATE TABLE journeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  start_location JSONB NOT NULL, -- {lat, lng, address}
  end_location JSONB, -- {lat, lng, address}
  distance_km FLOAT,
  duration_minutes INT,
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- GPS Pings table (archive from Redis)
CREATE TABLE gps_pings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id UUID REFERENCES journeys(id) ON DELETE SET NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  accuracy FLOAT, -- GPS accuracy in meters
  altitude FLOAT,
  heading FLOAT,
  speed FLOAT, -- meters per second
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Destinations (saved places)
CREATE TABLE destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  address TEXT,
  category TEXT, -- home, work, gym, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Real-time subscriptions (optional - for Supabase Realtime)
CREATE TABLE journey_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  update_type TEXT, -- status_change, location_update, etc.
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_journeys_user_id ON journeys(user_id);
CREATE INDEX idx_journeys_status ON journeys(status);
CREATE INDEX idx_gps_pings_user_id ON gps_pings(user_id);
CREATE INDEX idx_gps_pings_journey_id ON gps_pings(journey_id);
CREATE INDEX idx_gps_pings_timestamp ON gps_pings(timestamp DESC);
CREATE INDEX idx_destinations_user_id ON destinations(user_id);
```

6. Click **Run** (or Cmd+Enter)
7. Expected: "Query successful" ✓

---

### Step 5.2: Enable Row Level Security (RLS)

Still in SQL Editor, run:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own data
CREATE POLICY users_own_data ON journeys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY users_own_data_insert ON journeys FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY gps_pings_own ON gps_pings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY gps_pings_insert ON gps_pings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY destinations_own ON destinations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY destinations_insert ON destinations FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**Expected**: "Query successful" ✓

---

### Step 5.3: Test Database Connection (from Expo)

Create `src/services/supabase.ts` in project:

```typescript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase credentials in .env.local')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count')
    if (error) throw error
    console.log('✓ Supabase connection OK')
    return true
  } catch (err) {
    console.error('✗ Supabase connection failed:', err)
    return false
  }
}
```

---

### Step 5.4: Test Redis Connection

Create `src/services/redis.ts`:

```typescript
import { createClient } from 'redis'

const REDIS_URL = process.env.REDIS_URL

if (!REDIS_URL) {
  throw new Error('Missing REDIS_URL in .env.local')
}

const redisClient = createClient({
  url: REDIS_URL,
})

redisClient.on('error', (err) => console.error('Redis error:', err))

export async function connectRedis() {
  try {
    await redisClient.connect()
    await redisClient.ping()
    console.log('✓ Redis connection OK')
    return redisClient
  } catch (err) {
    console.error('✗ Redis connection failed:', err)
    return null
  }
}

export async function storeGPSPing(userId: string, data: any) {
  const key = `gps:${userId}:${Date.now()}`
  await redisClient.set(key, JSON.stringify(data), {
    EX: 3600, // 1 hour TTL
  })
}

export default redisClient
```

---

## Phase 6: Verification Checklist (10 min)

### Step 6.1: Verify All Installations

```powershell
# From TrackMe/ directory
node --version              # ✓ v18+ or v20+
npm --version               # ✓ 8+
eas --version               # ✓ eas@x.x.x
git --version               # ✓ git version 2.x+
npx expo --version          # ✓ expo@x.x.x
npm list expo-location      # ✓ installed
npm list zustand            # ✓ installed
npm list @supabase/supabase-js # ✓ installed
```

### Step 6.2: Verify Environment File

```powershell
Get-Content .env.local

# Should show:
# SUPABASE_URL=https://...
# SUPABASE_ANON_KEY=eyJ...
# MAPBOX_TOKEN=pk.eyJ...
# REDIS_URL=rediss://...
```

### Step 6.3: Test EAS Login

```powershell
eas whoami
# Expected: your_expo_username
```

### Step 6.4: Start Dev Server & Test Mobile App

```powershell
npx expo start

# In another terminal, run test script:
# (Create this file: src/test-connections.ts)
```

---

## Post-Setup: Next Steps

✅ **Once all phases complete**, you have:
- Expo project ready for development
- PostgreSQL (Supabase) for persistent storage
- Redis (Upstash) for high-speed GPS pings
- EAS configured for Android-first cloud builds
- Mapbox token for maps & routing
- All environment variables configured

### Immediate Next Tasks:

1. **Implement Background GPS Tracking**
   - Use `expo-task-manager` + `expo-location`
   - Store pings in Redis (real-time)
   - Archive to PostgreSQL (batch upload)

2. **Build Auth Flow**
   - Supabase Auth UI components
   - Email/password signup
   - Token refresh logic

3. **Create First Screen**
   - Map view with current location
   - Start/end journey buttons
   - Real-time location marker

4. **Deploy First Preview Build**
   - `eas build --platform android --preview`
   - Test on device or emulator

---

## Troubleshooting

### Issue: `npm install` fails with permission errors
**Solution**: Run PowerShell as Administrator

### Issue: EAS login doesn't work
**Solution**: 
```powershell
eas logout
eas login  # Re-authenticate
```

### Issue: Supabase credentials invalid
**Solution**: 
- Verify credentials in .env.local match Supabase dashboard
- Check URL format: `https://xxxxx.supabase.co` (no trailing slash)
- Regenerate anon key if needed

### Issue: Redis connection refused
**Solution**:
- Verify Upstash Redis database is in "running" state
- Check Redis URL format: `rediss://default:password@host:port`
- Test connection: `redis-cli -u rediss://...` (requires redis-cli installed)

---

## Timeline Summary

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Local tools | 15 min | ⬜ |
| 2 | Cloud DBs | 30 min | ⬜ |
| 3 | API keys | 20 min | ⬜ |
| 4 | Project config | 25 min | ⬜ |
| 5 | DB schema | 15 min | ⬜ |
| 6 | Verification | 10 min | ⬜ |
| **Total** | **Full setup** | **~115 min** | ⬜ |

---

**Ready to build! 🚀**
