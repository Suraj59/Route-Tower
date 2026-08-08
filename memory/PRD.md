# Control Tower Shipment — PRD

## Original Problem Statement
Modern, enterprise-grade startup marketing website for "Control Tower Shipment" — a global shipment visibility & orchestration platform. Tagline: "One Control Tower. Every Shipment. Every Mile. Every Event." Positions the product as intelligent visibility + orchestration (Tracking → Visibility → Intelligence → Orchestration), not just tracking software.

## User Choices
- Frontend-heavy marketing site + working "Request a Demo" lead emails
- Real interactive world map (react-simple-maps)
- Clean light enterprise SaaS theme (Safety Orange #FF4500 accent, Cabinet Grotesk / Satoshi / JetBrains Mono)
- Landing page + dedicated interactive Dashboard + Shipment Detail demo pages
- Demo leads emailed to goursuraj79@gmail.com (Emergent-managed Resend)

## Architecture
- Frontend: React 19, Tailwind, framer-motion (scroll reveals, kinetic hero), lenis (smooth scroll), react-simple-maps + world-atlas topojson, recharts (dashboard charts).
- Backend: FastAPI + MongoDB. `POST /api/leads` stores lead in `demo_leads` and emails notification via Emergent Resend proxy.
- Routes: `/` (landing), `/dashboard` (control tower dashboard), `/shipment/:id` (shipment detail).

## Implemented (2026-08-08)
- Kinetic hero with masked line-by-line reveal + parallax + interactive live map panel (5 status states, clickable shipment list).
- Full manifesto landing: Problem, Solution, End-to-End Journey, Multi-Modal, Event Normalization, Exception Intelligence, Orchestration rule builder, Customer Experience, Multi-Carrier Architecture + Multi-Leg model, Business Impact, Who We Serve, Final CTA, editorial marquee, footer.
- Interactive Dashboard: KPI strip, status donut, ETA area chart, mode bar chart, country bars, active-routes map, filterable/searchable shipment table.
- Shipment Detail: header meta, vertical journey timeline, current-location map, active exception panel, event history, POD note.
- Request-a-Demo modal → lead saved + email sent (verified emailed:true).

## Implemented (2026-08-08, round 3 — Route Tower rebrand + AI)
- Rebranded "Control Tower" → "Route Tower" everywhere (UI + lead emails).
- Create Shipment (AI + manual) — browser-only via localStorage (rt_shipments_v1), useSyncExternalStore store; created shipments appear on hero map/list, dashboard table & maps, and have working detail pages.
- AI (Gemini 3 Flash / gemini-3-flash-preview via Emergent LLM key): POST /api/ai/create-shipment (NL → structured shipment w/ real lat/lng stops) and POST /api/ai/insight (tracking co-pilot recommendation). 25s timeout guard.
- Live ETA Countdown (ticks every second) on hero list, dashboard ETA column, and shipment detail header.
- Route Playback (play/pause/scrub/reset) moving a marker along the route on shipment detail map.
- Dark "Control Room" theme toggle on dashboard (CSS-variable based, .dash-root.dark).
- ROI Estimator on pricing page (live savings calculator with sliders).
- Manual create has an AI-independent fallback (geocodes from CITIES table).
- Verified 100% by testing agent (iteration_3).

## Backlog / Remaining
- P2: Animated shipment markers moving along routes over time
- P2: Blog / resources / pricing pages

## Notes
- All shipment data is demo/mock (no real customer data).
- No auth in this app.
