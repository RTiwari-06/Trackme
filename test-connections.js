const fs = require('fs');
const path = require('path');
const { createClient } = require('redis');

function loadEnv() {
  const envPath = path.resolve(__dirname, '.env.local')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    const k = m[1]
    let v = m[2]
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1,-1)
    process.env[k] = v
  }
  if (process.env.SUPABASE_URL && !process.env.EXPO_PUBLIC_SUPABASE_URL) process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL
  if (process.env.SUPABASE_ANON_KEY && !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
}

async function testSupabase() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error('Supabase env missing')
    return false
  }
  const endpoint = `${url.replace(/\/$/, '')}/rest/v1/users?select=id&limit=1`
  try {
    const res = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (!res.ok) {
      console.error('Supabase HTTP error', res.status, await res.text())
      return false
    }
    console.log('Supabase HTTP OK', res.status)
    return true
  } catch (err) {
    console.error('Supabase fetch failed', err)
    return false
  }
}

async function testRedis() {
  const url = process.env.REDIS_URL
  if (!url) { console.error('REDIS_URL missing'); return false }
  try {
    const client = createClient({ url })
    client.on('error', (e) => console.error('Redis client error', e))
    await client.connect()
    await client.ping()
    await client.disconnect()
    console.log('Redis OK')
    return true
  } catch (err) {
    console.error('Redis failed', err)
    return false
  }
}

async function main(){
  loadEnv()
  console.log('Running Supabase test...')
  const s = await testSupabase()
  console.log('\nRunning Redis test...')
  const r = await testRedis()
  console.log('\nSummary:', { supabase: s, redis: r })
}

main().catch(e=>{console.error(e); process.exit(1)})
