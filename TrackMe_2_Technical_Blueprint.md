# TrackMe — Document 2: Technical Blueprint

## Architecture at a glance
```
[Traveler mobile app] --(live location pings)--> [Backend API]
        |                                              |
   background GPS                          [Realtime store + TTL]
   geofence arrival                                    |
        |                                  (live stream via WS/SSE)
        v                                              v
   [Messaging service] --WhatsApp/SMS link--> [Watcher web page (no install)]
```
Four moving parts: the **traveler app** (captures location, detects arrival), the **backend** (ingests pings, issues the live link, sends messages), a **realtime store** (holds current position with auto-expiry), and the **watcher web page** (renders the live map from a tokenized link).

---

## 1. Native vs Cross-Platform / Hybrid — the decision

The single hardest technical requirement is **reliable background location** (tracking continues when the app is backgrounded/screen off). That requirement drives the whole choice.

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Native (Swift + Kotlin)** | Best-in-class background location & battery control | Two codebases, slowest, off your stack | Overkill for an MVP |
| **React Native + Expo** | Single codebase, **in your JS/React stack**, mature maps + a strong background-geolocation library, OTA updates | Background location needs a robust 3rd-party lib; some native config | ✅ **Chosen** |
| **Flutter** | Great performance, single codebase | Dart is off your stack; background-geo via plugins | Good, but no stack advantage |
| **PWA only** | No install, simplest | **Background geolocation is unreliable/blocked on mobile web** → fails the core requirement | ❌ For the traveler app |

**Decision:** **Hybrid via React Native (Expo) for the traveler app**, dropping to **native modules only for the background-location piece** if a library proves insufficient. The **watcher** is intentionally a **web page** (no install) — the one place "web, not app" is the *right* call.

---

## 2. Frameworks & libraries

**Mobile (traveler app)**
| Concern | Choice | Note |
|---|---|---|
| Framework | React Native + Expo | Your stack; EAS for builds/OTA |
| Navigation | expo-router / React Navigation | |
| State | Zustand | Your preferred lib |
| Background location | `react-native-background-geolocation` (transistorsoft) or `expo-location` + TaskManager | The transistorsoft lib is the gold standard for reliability/battery |
| Maps | `@rnmapbox/maps` (Mapbox) or `react-native-maps` | Mapbox lets you reuse skills + one provider across app + web |
| Geofencing | bg-geolocation built-in geofence, or compute on arrival | Auto arrival detection |

**Backend**
| Concern | Choice | Note |
|---|---|---|
| Runtime/API | Node + Fastify/Express | Your stack |
| Realtime | Socket.IO (+ Redis adapter) **or** managed (Supabase Realtime / Firebase RTDB / Ably) | Managed = faster to validate; self-host = more "yours" + DevOps learning |
| Live-state store | Redis (key per journey, TTL = auto-expiry) | Ephemeral current position |
| Persistent DB | PostgreSQL (Neon) | Your existing experience; journeys, users, links |
| Auth | JWT / Supabase Auth | Traveler only — watcher needs none |

**Watcher web**
| Concern | Choice |
|---|---|
| Framework | Next.js (React) |
| Live map | Mapbox GL JS (or Google Maps JS) |
| Live updates | WebSocket / Server-Sent Events from the realtime store |
| Hosting | Vercel/Netlify |

---

## 3. APIs & third-party services

| Service | Role | Cost note / alternative |
|---|---|---|
| **Mapbox** (Maps, Directions, Map Matching) | Map rendering, ETA, snapping GPS to roads | Generous free tier; alt: Google Maps Platform (Directions + Distance Matrix for ETA) |
| **Geocoding / Reverse geocoding** | Turn "Home" into coordinates & vice-versa | Mapbox or Google |
| **WhatsApp delivery** | Send the live link + arrival message | v1: native share-sheet to WhatsApp (free). Scale: WhatsApp Cloud API / Twilio |
| **SMS (fallback)** | Reach watchers without WhatsApp | Twilio or MSG91 (India); **costs money** — keep optional |
| **Push notifications** | Notify traveler (e.g., "tracking paused") | Expo Push → FCM/APNs |
| **Crash + monitoring** | Stability | Sentry (see Doc 3) |

---

## 4. Data model (core entities)

- **User** (traveler): id, name, auth, saved places (Home, College).
- **Journey**: id, traveler_id, origin, destination, started_at, eta, status (active/arrived/expired), arrival_at.
- **LocationPing**: journey_id, lat, lng, speed, heading, timestamp (kept ephemeral in Redis; sampled to Postgres if you want history).
- **ShareLink**: token (unguessable), journey_id, expires_at, watcher_channel.
- **Contact**: traveler_id, name, channel (WhatsApp/SMS), handle.

**Live-link design:** the watcher URL carries only an **opaque random token** (no user IDs, no PII), maps server-side to a journey, and **auto-expires** on arrival / after N hours. This is both a security and a privacy control.

---

## 5. Web design plot (information architecture + wireframes)

**Design system:** clean, reassurance-first (calm blues/greens, not alarm-red), large legible type, dark-mode aware, mobile-first (the watcher is almost always on a phone). Accessibility: high contrast, large tap targets.

**Traveler app screens**
1. **Onboarding/consent** — what's shared, with whom, that it's per-journey and expires.
2. **Home** — saved destinations (Home/College), big "Start Journey" button.
3. **Pick watcher** — choose a contact + channel (WhatsApp default).
4. **Active journey** — live map, ETA, speed, a prominent **Stop sharing** control, "shared with Mom" indicator.
5. **Arrived** — confirmation that the safe-arrival message was sent; sharing ended.

**Watcher web page (zero install) — the most important screen**
- Top: "Raj is heading home" + live ETA, prominent.
- Center: live map with moving dot + route.
- Secondary: speed, last-updated timestamp (trust signal).
- On arrival: state flips to "✅ Raj reached safely at 11:38 PM," map freezes, link shows "this journey has ended."
- No login, no menus, no app prompt — one glanceable screen.

**Landing page** — one-screen explainer + store links + privacy policy/terms.

*(Want this as a visual wireframe/mockup? I can render the watcher page and the active-journey screen.)*
