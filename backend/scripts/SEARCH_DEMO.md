# Local search sample inventory

The seed is restricted to `mongodb://127.0.0.1:27028/deeparture_search_development` and refuses production mode. It does not read the configured database URI, create login credentials, send email or delete other records. Stable sample slugs make reruns update the same records.

Start MongoDB bound to loopback on port 27028 with a separate data directory. During the 14 November session the downloaded binary is `/tmp/mongodb-macos-aarch64-8.0.4/bin/mongod` and the persistent data directory is `.local/search-demo-db` from the repository root:

```sh
/tmp/mongodb-macos-aarch64-8.0.4/bin/mongod --dbpath "$PWD/.local/search-demo-db" --port 27028 --bind_ip 127.0.0.1 --logpath /tmp/deeparture-search-mongo.log
```

From `backend/`, run:

```sh
npm run seed:search-demo
npm run dev:search-demo
```

The API listens only at `http://127.0.0.1:5028` with test email delivery. Local frontend `.env.local` uses `API_INTERNAL_URL=http://127.0.0.1:5028/api` and `NEXT_PUBLIC_API_URL=http://127.0.0.1:5028/api`. Restart the frontend after changing these variables; rebuild production previews because public variables are compiled into the bundle.

Inventory: 20 liveaboards and 20 resorts per destination (Raja Ampat, Maldives, Komodo, Red Sea, Galápagos and Philippines), 240 listings total, with 13 monthly seven-night departures per vessel beginning next month. Rerunning advances/refreshes the future departure window; historical months are retained. Records explicitly identify themselves as fictional samples and use local inspiration images. Prices range from USD 900 to 2,800, Vegan Rating is 5, six sample structured preferences are true, and availability is synthetic. Resort sample availability represents a single date, not an entire stay guarantee.

Searches return genuine matching records with normal pagination. Restrictive prices, unsupported dates or conflicting filters may correctly return fewer results or none. No fallback injects unrelated listings. A temporary MongoDB binary must be downloaded again if `/tmp` is cleared; data stays in the ignored `.local/` directory.

Sample liveaboards1,10,11 per destination receive10%,15%,20% early-booking offers respectively on their first three monthly departures, valid60 days from seeding. Effective departure prices are recalculated by the existing pricing service. These are fictional discounts for local preview only.

## Hosted staging API seed

`npm run seed:search-staging` uses ignored root `.env` staging admin credentials in memory and the fixed Render staging API. It verifies the configured database name is exactly `deeparture-v2-staging` and hosted email is in test mode. It creates a dedicated Sample Search Preview organisation, 120 liveaboards and 120 resorts across six destinations, 720 future departures and sample discounts. Existing records outside this organisation and existing attribute definitions are preserved. Inventory uses validated API preview/commit imports; no direct Atlas access or email delivery. Listings and descriptions identify fictional samples. Re-running updates inventory using stable names and only creates missing listings; import/audit history records each execution.

Read-only verification after seeding: `node backend/scripts/verify-search-staging-samples.js` from the repository root. It uses the saved sample-organisation ID and tests the public API without credentials or writes. The hosted seed was completed and all18 search groups passed; deployed desktop/mobile searches and three homepage offer cards were also verified.
