# Deeparture V2 - Phase 2B Rev 1.3 Patch Application

Baseline required:

- branch: `phase2a-integration`
- commit: `68e30d61f969aa59d450b8b7038ca39475b624b1`

The raw patch is an alternative to using the full implementation ZIP. Apply it from the root of an exact copy of the Phase 2A baseline:

```bash
patch -p1 < PHASE2B_REV1.3_IMPLEMENTATION.patch
```

A packaging-time dry run of this command passed against the exact Phase 2A baseline.

The patch contains source code and text documentation. Binary reference PDFs are intentionally excluded from the raw patch and are supplied separately in the handover/full implementation package.

After applying:

```bash
cd backend
npm ci
npm run check
npm run verify:phase2b:static
npm test
npm run verify:phase2a

cd ../frontend
npm ci
npm run build
```

Then deploy to staging and run the Phase 2B Rev 1.3 acceptance checklist against the deployed build.
