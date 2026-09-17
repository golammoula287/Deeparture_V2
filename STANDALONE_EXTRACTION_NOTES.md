# Standalone extraction notes

## What changed from the earlier Phase 1 package

The earlier Phase 1 implementation was intentionally mounted alongside the legacy Deeparture API. This repository removes that runtime dependency so V2 can be tested as an independent application.

The standalone extraction now has its own:

- Express application and server bootstrap
- MongoDB database connection
- User model
- JWT login endpoint
- admin creation script
- safe local email transport
- frontend login page
- frontend/home shell
- Docker Compose environment with a dedicated MongoDB database
- demo seed data
- CI workflow

The V1 routes, V1 Boat/Resort/Itinerary/Booking models and V1 frontend components are not included.

## Deliberately not included

- V1 → V2 production migration logic. Keep migration as a separate controlled staging operation against backups.
- Full Admin V2 (Phase 2)
- Full Operator Portal V2 (Phase 3)
- Final mobile-first customer frontend/PWA (Phase 4)
- automated website ingestion/API feeds (Phase 5)
- Agent portal (Phase 6)

## Database

Use a fresh MongoDB database for this repository. It can therefore be cloned to GitHub and run locally without production Deeparture database credentials.

## Original source protection

This repository is a V2 working repository. The archived V1 source and its SHA-256 manifests should remain separate and unchanged.




