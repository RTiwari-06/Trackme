#!/usr/bin/env node
// TrackMe web driver.
//
// TrackMe is an Expo Router app. react-native-maps / background location are
// native-only, but the whole app (auth, web home, the zero-install watcher)
// runs on web — so the harness drives the *web export* with headless Chrome
// over the DevTools Protocol. No Playwright/puppeteer needed: it serves ./dist
// with a tiny static server and talks CDP over Node 22's global WebSocket.
//
// Usage (run from the repo root, after `npx expo export --platform web`):
//   node .claude/skills/run-trackme/driver.mjs shots            # screenshot every route
//   node .claude/skills/run-trackme/driver.mjs flow             # drive the auth form (validation)
//   node .claude/skills/run-trackme/driver.mjs shots /auth /    # screenshot specific routes
//
// Screenshots land in .claude/skills/run-trackme/screenshots/*.png
// Exit code is non-zero if a route 404s or a driven assertion fails.

import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { readFile, mkdir, writeFile, access } from 'node:fs/promises'
import { accessSync } from 'node:fs'
import { extname, join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(__dirname, '../../..')
const DIST = join(REPO, 'dist')
const SHOTS = join(__dirname, 'screenshots')

const CHROME =
  process.env.CHROME_PATH ||
  ['C:/Program Files/Google/Chrome/Application/chrome.exe',
   'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
   'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
   'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync)

function existsSync(p) {
  try { accessSync(p); return true } catch { return false }
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.map': 'application/json',
}

// --- static server for the Expo web export --------------------------------
// Expo writes each route as `<route>.html`; map clean URLs onto those files.
async function serveDist() {
  await access(join(DIST, 'index.html')).catch(() => {
    throw new Error('dist/ not found. Run: npx expo export --platform web')
  })
  const server = createServer(async (req, res) => {
    try {
      let urlPath = decodeURIComponent(req.url.split('?')[0])
      if (urlPath === '/') urlPath = '/index.html'
      let file = join(DIST, urlPath)
      // clean URL (/auth -> /auth.html), then SPA-ish fallbacks. Expo emits
      // dynamic routes as bracket files, e.g. /watch/<token> -> watch/[token].html.
      const candidates = [file, file + '.html', join(file, 'index.html')]
      const dynMatch = urlPath.match(/^\/watch\/[^/]+$/)
      if (dynMatch) candidates.push(join(DIST, 'watch', '[token].html'))
      let body = null
      let hit = null
      for (const c of candidates) {
        try { body = await readFile(c); hit = c; break } catch {}
      }
      if (!body) { res.statusCode = 404; res.end('not found'); return }
      res.setHeader('Content-Type', MIME[extname(hit)] || 'application/octet-stream')
      res.end(body)
    } catch (e) {
      res.statusCode = 500; res.end(String(e))
    }
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const port = server.address().port
  return { server, base: `http://127.0.0.1:${port}` }
}

// --- headless Chrome over CDP --------------------------------------------
async function launchChrome() {
  if (!CHROME) throw new Error('No Chrome/Edge found. Set CHROME_PATH to chrome.exe')
  const userDir = join(process.env.TEMP || '/tmp', `trackme-cdp-${Date.now()}`)
  const args = [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', `--user-data-dir=${userDir}`,
    '--window-size=1280,900', '--hide-scrollbars', 'about:blank',
  ]
  const proc = spawn(CHROME, args, { stdio: ['ignore', 'ignore', 'pipe'] })
  // Chrome prints "DevTools listening on ws://..." to stderr; grab the port.
  const port = await new Promise((res, rej) => {
    let buf = ''
    const t = setTimeout(() => rej(new Error('Chrome did not start in 20s')), 20000)
    proc.stderr.on('data', (d) => {
      buf += d
      const m = buf.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/)
      if (m) { clearTimeout(t); res(Number(m[1])) }
    })
  })
  return { proc, port }
}

let cdpId = 0
function cdp(ws, method, params = {}, sessionId) {
  return new Promise((res, rej) => {
    const id = ++cdpId
    const onMsg = (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id === id) {
        ws.removeEventListener('message', onMsg)
        msg.error ? rej(new Error(`${method}: ${msg.error.message}`)) : res(msg.result)
      }
    }
    ws.addEventListener('message', onMsg)
    ws.send(JSON.stringify({ id, method, params, sessionId }))
  })
}

async function connect(port) {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
  let page = targets.find((t) => t.type === 'page')
  const wsUrl = page.webSocketDebuggerUrl
  const ws = new WebSocket(wsUrl)
  await new Promise((r) => (ws.onopen = r))
  await cdp(ws, 'Page.enable')
  await cdp(ws, 'Runtime.enable')
  return ws
}

async function goto(ws, url) {
  const loaded = new Promise((res) => {
    const onMsg = (ev) => {
      const m = JSON.parse(ev.data)
      if (m.method === 'Page.loadEventFired') { ws.removeEventListener('message', onMsg); res() }
    }
    ws.addEventListener('message', onMsg)
  })
  await cdp(ws, 'Page.navigate', { url })
  await loaded
  await sleep(1200) // let react-native-web hydrate
}

async function evaluate(ws, expression) {
  const r = await cdp(ws, 'Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  return r.result?.value
}

async function screenshot(ws, name) {
  const { data } = await cdp(ws, 'Page.captureScreenshot', { format: 'png' })
  const out = join(SHOTS, `${name}.png`)
  await writeFile(out, Buffer.from(data, 'base64'))
  return out
}

// --- commands -------------------------------------------------------------
async function main() {
  const [cmd = 'shots', ...rest] = process.argv.slice(2)
  await mkdir(SHOTS, { recursive: true })
  const { server, base } = await serveDist()
  const { proc, port } = await launchChrome()
  const ws = await connect(port)
  let failed = false

  try {
    if (cmd === 'shots') {
      // Accept routes with or without a leading slash — Git Bash mangles a
      // leading-slash arg into a Windows path, so `shots auth explore` is safest.
      const norm = (r) => (r === '/' || r.startsWith('/') ? r : '/' + r)
      const routes = rest.length
        ? rest.map(norm)
        : ['/', '/auth', '/map', '/explore', '/watch/demo-token']
      for (const route of routes) {
        await goto(ws, base + route)
        const bodyLen = await evaluate(ws, 'document.body.innerText.trim().length')
        const name = route === '/' ? 'index' : route.replace(/^\//, '').replace(/\//g, '_')
        const out = await screenshot(ws, name)
        const ok = bodyLen > 0
        console.log(`${ok ? '✓' : '✗'} ${route.padEnd(18)} text=${bodyLen}  → ${out}`)
        if (!ok) failed = true
      }
    } else if (cmd === 'flow') {
      // Drive the auth form: submitting empty triggers client-side validation.
      await goto(ws, base + '/auth')
      await screenshot(ws, 'flow-1-auth')
      const hasForm = await evaluate(ws, '!!document.querySelector(\'[data-testid="auth-submit"]\')')
      if (!hasForm) throw new Error('auth-submit not found — is dist rebuilt with testIDs?')
      await evaluate(ws, 'document.querySelector(\'[data-testid="auth-submit"]\').click()')
      await sleep(600)
      const text = await evaluate(ws, 'document.body.innerText')
      const out = await screenshot(ws, 'flow-2-validation')
      const showsError = /Enter your email\.|Enter your password\./.test(text)
      console.log(`${showsError ? '✓' : '✗'} empty submit shows inline validation  → ${out}`)
      if (!showsError) failed = true
    } else {
      throw new Error(`unknown command: ${cmd} (use "shots" or "flow")`)
    }
  } finally {
    ws.close()
    proc.kill()
    server.close()
  }
  process.exit(failed ? 1 : 0)
}

main().catch((e) => { console.error('✗', e.message); process.exit(1) })
