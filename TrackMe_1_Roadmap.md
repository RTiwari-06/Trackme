# TrackMe — Document 1: Project Roadmap & Development Cycle

## Methodology
A lightweight **iterative/agile** model suited to a solo or small build: weekly cycles, a thin always-shippable core, validation gates between phases. The rule: nothing moves to the next phase until its **exit gate** is met — this is what stops the "endless building, never shipping" trap.

### The per-iteration loop (1 week)
1. **Plan** — pick the smallest slice that advances the core loop; write its acceptance criteria.
2. **Design** — sketch the screen/flow + the API contract before coding.
3. **Build** — implement behind a feature flag where risky.
4. **Test** — unit + manual on a real device (location features *must* be tested on hardware, not simulator).
5. **Review & demo** — dogfood it yourself end-to-end; log what broke.
6. **Retro** — one note: what to fix next iteration.

---

## Phased Roadmap

### Phase 0 — Validation (1 week) · *no code*
**Goal:** confirm the pain and the distribution mechanic before building.
- Interview 10 students + 5 parents: "How often does 'text me when you reach' fail?" and "Would you (parent) accept an automatic WhatsApp instead of a text?"
- Paper-prototype the watcher message.

**Exit gate:** pain confirmed as several-times-a-month **and** parents say they'd open a WhatsApp link. If not → stop or re-scope.

### Phase 1 — MVP core loop (4–6 weeks)
**Goal:** the end-to-end happy path works on real phones.
- Traveler app: set destination → start journey → live background location + ETA.
- Backend: ingest live location, expose a tokenized live link.
- Watcher web page: live map + ETA, zero install.
- Geofence arrival → auto "reached safely" message → link expires.

**Exit gate:** you + 3 friends complete real journeys; parents receive the link and the arrival message reliably.

### Phase 2 — Hardening & closed beta (2–3 weeks)
**Goal:** make it survive the real world.
- Battery/background reliability tuning; offline queue + reconnect; edge cases (phone dies, GPS drift, false arrival).
- Crash reporting + basic analytics on the core loop.
- Security pass on the live link (expiry, unguessable tokens, abuse guards).

**Exit gate:** 10–15 users run it for a week with <1 critical failure per user; you can see in analytics whether parents actually open links.

### Phase 3 — v1.5 polish (2 weeks)
**Goal:** the features that make it feel finished.
- Overdue nudge ("hasn't arrived yet" — reminder, **not** an emergency promise).
- Hindi/regional localization; onboarding polish; consent & privacy screens.

**Exit gate:** usability test passes with non-technical parents unaided.

### Phase 4 — Launch (1–2 weeks + store review)
**Goal:** publicly available.
- App store submission (budget extra time for location-permission review — see Doc 3), landing page, privacy policy/terms, support channel.

**Exit gate:** approved on at least one store; live demo link on your resume/portfolio.

---

## Milestones

| # | Milestone | Phase | Signal it's done |
|---|-----------|-------|------------------|
| M0 | Validation done | 0 | Pain + channel confirmed |
| M1 | First live journey watched end-to-end | 1 | Arrival message auto-sent |
| M2 | Zero-install watcher link working | 1 | Parent sees live map, no app |
| M3 | Reliable on real devices | 2 | Background tracking survives a week |
| M4 | Closed beta | 2 | 10+ real users |
| M5 | Localized + consent flows | 3 | Hindi UI, privacy screens |
| M6 | Public launch | 4 | Store-approved, live link |

## Risk register (top 5)

| Risk | Impact | Mitigation |
|------|--------|------------|
| Background location unreliable | Kills core value | Use a battle-tested bg-location lib; test on many devices early (Phase 1, not late) |
| App-store rejection (background location) | Blocks launch | Justify permission clearly; have a foreground-use fallback |
| Parents won't open the link | Kills the wedge | Validated in Phase 0; measure open-rate in Phase 2 |
| Scope creep (SOS, circles) | Never ships | v1 = arrival confirmation only; everything else is a later doc |
| API/SMS cost blowup | Unsustainable | Prefer WhatsApp link + map free tiers; monitor usage (Doc 3) |
