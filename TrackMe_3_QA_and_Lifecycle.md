# TrackMe — Document 3: QA Strategy & Lifecycle Essentials

## Part A — Testing strategy (all tests required)

Test pyramid for TrackMe: many fast unit tests, fewer integration tests, a thin layer of end-to-end — **plus** the location/device/field testing that this category lives or dies on.

| Test type | What it covers in TrackMe | Tooling |
|---|---|---|
| **Unit** | ETA calc, geofence/arrival logic, distance math, token generation, time/timezone helpers | Jest |
| **Component/UI** | Screens render correct states (active, arrived, expired); watcher page states | React Native Testing Library; React Testing Library (web) |
| **Integration** | App ↔ backend ↔ realtime store; "ping in → watcher sees update" | Jest + test server |
| **API/contract** | Endpoint shapes, link issuance/expiry, auth boundaries | Supertest / Pact |
| **End-to-end (E2E)** | Full loop: start journey → live link → arrival message | Detox or Maestro (mobile); Playwright (watcher web) |
| **Location & geofence** | Replaying **simulated GPS routes (GPX)** to verify tracking + arrival detection without leaving your desk | Xcode/Android location simulation; mock-location injection |
| **Background-execution** | Tracking survives backgrounding, screen-off, app-killed, Doze mode | Real-device manual + automated where possible |
| **Real-device matrix** | A spread of Android OEMs (Xiaomi/Samsung/Oppo are aggressive battery killers) + a couple of iPhones | Physical devices / device cloud (BrowserStack) |
| **Network / offline** | Poor signal, tunnels, airplane mode → queue + reconnect, last-known position | Network-throttling tools |
| **Battery / performance** | Drain over a 45-min journey; memory; UI at 60fps | Android Battery Historian; Xcode Instruments |
| **Security / pen test** | Live-link can't be guessed/enumerated; no PII in URL; TLS; rate limiting | OWASP ZAP; manual |
| **Load / stress** | Many concurrent journeys + watchers on the realtime layer | k6 / Artillery |
| **Usability** | A non-technical parent uses the watcher link unaided | Moderated sessions |
| **Accessibility** | Contrast, screen-reader labels, tap-target size | axe; manual |
| **Localization** | Hindi/regional strings, RTL-safety, number/time formats | Manual + pseudo-localization |
| **UAT / closed beta** | Real students + parents over a week | TestFlight / Play internal testing |
| **Regression** | Core loop never breaks on a release | CI suite gating merges |
| **Pre-submission** | Store checklist (permissions, privacy labels, crash-free) | Manual checklist |

**CI gate:** unit + component + integration + a smoke E2E run on every PR; the heavy device/field tests run before each beta.

---

## Part B — The unsaid-but-critical lifecycle items

These rarely appear on a feature list, but each can sink the app. This is the part most student projects skip — and exactly what makes yours look senior.

### 1. Privacy & consent (this is a location app)
Location is sensitive personal data. Build: explicit per-journey consent, **data minimization** (don't store full history unless needed), clear retention + a one-tap delete, and a visible "you are sharing with X / stop now" control at all times. The traveler always initiates and controls sharing.

### 2. Legal & compliance (India-specific)
- **DPDP Act 2023** (India's Digital Personal Data Protection Act) governs consent, purpose limitation, and user rights — design consent and deletion to satisfy it.
- A real **Privacy Policy + Terms** (required by app stores anyway).
- **Minors:** many students are 17–18; have a position on under-18 consent.
- App-store **privacy nutrition labels** declaring location use.

### 3. Security specifics
- TLS everywhere; encrypt sensitive data at rest.
- Live link = **unguessable token, server-mapped, auto-expiring**, no PII in the URL.
- Rate limiting + abuse guards on link creation and message sending.
- Don't log raw coordinates longer than needed.

### 4. Safety & anti-abuse (ethical non-negotiable)
A location-sharing app **can be misused for stalking**. Safeguards by design: only the person being tracked starts/stops sharing, sharing is time-boxed and self-expiring, the tracked person always sees who can see them, and there is no covert/always-on mode. Decide this explicitly — it's both an ethics and a trust feature, and a great interview talking point.

### 5. Permissions & app-store reality
- iOS "**Always** location" + background modes, and Android `ACCESS_BACKGROUND_LOCATION` + a **foreground service with a persistent notification** (Android 10+).
- Apple and Google **scrutinize background location** in review — you must justify it clearly with screenshots, or expect rejection. Budget review time (Doc 1, Phase 4).

### 6. Battery & OS background limits
Android **Doze**/battery-optimization and iOS background suspension actively fight you. Plan for a foreground-service notification, sensible GPS sampling (distance-filter, not max frequency), and graceful behavior when the OS throttles you.

### 7. Offline & poor-connectivity
Tunnels, dead zones, low signal: queue pings locally, show **last-known position + timestamp** to the watcher (never a frozen lie), and reconcile on reconnect.

### 8. Cost model
Map tiles/Directions calls, SMS (real money), push, hosting, realtime connections. Stay in free tiers: prefer the **WhatsApp share-sheet (free)** over paid SMS, cap GPS sampling, and **monitor usage** so a runaway loop doesn't bill you.

### 9. Observability & analytics
- **Crash reporting** (Sentry) and structured logs.
- **Privacy-respecting product analytics** measuring the *core loop*: did the parent open the link? did arrival messages send? — this is how you validate the wedge, not vanity metrics.
- Alerting on failure spikes.

### 10. CI/CD & release management
EAS Build/Submit for Expo, **OTA updates** for JS-only fixes (skip store review), semantic versioning, staged rollout, and a rollback plan. Tie this to your DevOps coursework — it's a real strength here.

### 11. Edge cases to design for
Phone dies mid-journey (what does the watcher see?), GPS drift/false arrival, wrong destination set, multiple journeys, timezone/DST, never-arrives, duplicate messages, app updated mid-journey.

### 12. Internationalization & accessibility
Hindi + regional languages for your beachhead; screen-reader labels; large tap targets; high-contrast — the watcher is often a stressed parent glancing at a phone.

### 13. Data lifecycle & support
Account + data deletion flow; a feedback/support channel; a plan for what happens to journey data after expiry (delete by default).

### 14. Scalability (only if it grows)
Move realtime to managed pub/sub, watch WebSocket connection limits, shard by journey. Don't pre-build this — just don't architect yourself into a corner (the token/journey model above keeps it open).
