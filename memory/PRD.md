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

## Backlog / Remaining
- P2: More sample shipments / richer per-shipment event data
- P2: Animated shipment markers moving along routes over time
- P2: Blog / resources / pricing pages

## Notes
- All shipment data is demo/mock (no real customer data).
- No auth in this app.
