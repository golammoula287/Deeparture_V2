# Deeparture V2 — Phase 1 Next Steps

## Current status

The V2 database seed stage (Step 7) has been completed and the starter frontend is visible in Render.

The current white page with filter boxes is expected at this stage. It is a functional Phase 1 interface, not the final design.

---

## 1. Create the staging admin account

Set secure environment variables in the backend:

```env
ADMIN_EMAIL=your-staging-admin-email
ADMIN_PASSWORD=your-secure-staging-password
```

Then run:

```bash
npm run create:admin
```

Do not commit the real email/password values to GitHub.

---

## 2. Verify admin login

Open the V2 login page:

```text
/login
```

Confirm the staging admin account can authenticate successfully.

---

## 3. Verify the seeded demo pages

Confirm these pages load correctly:

```text
/liveaboards/demo-explorer
/resorts/demo-dive-resort
```

The Demo Explorer liveaboard should include:

- Raja Ampat itinerary
- January 2027 departure
- Base pricing
- Availability
- Sample offer

---

## 4. Check the explore/search pages

Open:

```text
/explore/liveaboards
/explore/resorts
```

After the demo seed has run, the starter search interface should return:

- Demo Explorer
- Demo Dive Resort

---

## 5. Verify the backend API directly

Confirm these endpoints return successful responses and do not produce `500` or MongoDB connection errors:

```text
/health
/api/v2/attributes
/api/v2/liveaboards
/api/v2/resorts
```

---

## 6. Check the pricing logic

The seeded demo liveaboard should demonstrate itinerary-level base pricing plus a departure offer.

Expected test values:

```text
Base itinerary price: US$5,500
Demo special: 10% discount
Expected effective price: US$4,950
```

This confirms the intended pricing chain:

```text
Itinerary base price
        ↓
Departure price override (if any)
        ↓
Active departure offer/discount (if any)
        ↓
Effective selling price
```

---

## 7. Test the operator side

Confirm that:

- An operator can authenticate.
- The V2 operator dashboard loads.
- The operator is associated with an Organisation.
- Vessels and resorts are owned by the Organisation rather than directly by an isolated user account.
- One Organisation can eventually manage both liveaboards and resorts.

---

## 8. Run one small import test

Do **not** import a large catalogue yet.

Use a small controlled test containing:

- 2 liveaboards
- 1 resort
- A few itineraries
- Several departures
- Base pricing
- Availability
- One special offer

Then confirm:

1. Records are created correctly in MongoDB Atlas.
2. Operator organisations are created/matched correctly.
3. Vessel and resort records are linked correctly.
4. Public pages are generated automatically.
5. Search endpoints can retrieve the new records.
6. Price and availability data display correctly.

---

## 9. Security check for demo accounts

If the default demo operator account is still present, do not leave a predictable development password active on an internet-accessible staging site.

Either:

- remove the demo account, or
- replace the password with a strong private staging password.

Do not expose production credentials or use the production MongoDB database.

---

## 10. Fix any Phase 1 issues before moving to Phase 2

Any problems found with the following should be corrected in staging before Admin V2 development begins:

- MongoDB connection
- schemas/models
- API responses
- authentication
- organisation ownership
- pricing inheritance
- departure overrides
- discounts/offers
- availability
- imports
- permissions
- automatic page generation

---

# Phase 1 completion criteria

Phase 1 can be considered complete when this end-to-end flow works:

```text
Private GitHub V2 repository
        ↓
Render backend
        ↓
MongoDB Atlas staging database
        ↓
Render frontend
        ↓
Admin + operator authentication
        ↓
Vessel / resort record creation
        ↓
Automatic public page generation
        ↓
Itinerary / departure pricing
        ↓
Availability / offers
        ↓
Basic search / filters
        ↓
Small catalogue import
```

Required checks:

- [ ] Backend deploys successfully on Render
- [ ] MongoDB Atlas connection works
- [ ] `/health` works
- [ ] `/api/v2/attributes` works
- [ ] `/api/v2/liveaboards` works
- [ ] `/api/v2/resorts` works
- [ ] Attribute seed completes
- [ ] Demo seed completes
- [ ] Admin account can be created
- [ ] Admin login works
- [ ] Operator login works
- [ ] Demo liveaboard page works
- [ ] Demo resort page works
- [ ] Search/explore pages return records
- [ ] Effective price calculation is correct
- [ ] Availability is stored/retrieved correctly
- [ ] Small import succeeds
- [ ] Imported records automatically create public pages
- [ ] No production database is used
- [ ] No default/demo passwords remain publicly exposed

---

# Next phase

Once the above checks pass, Phase 1 is complete enough to proceed to:

## Phase 2 — Admin V2 & Catalogue Automation

This will include:

- Catalogue Import
- Website Import
- Draft Listings
- Pending Approval
- Liveaboard and Resort catalogue management
- Operator Organisations
- Unclaimed / Invited / Claimed / Verified operators
- Claim invitations
- Facilities and attribute management
- Dietary and accessibility parameters
- Destinations and ports
- Notifications
- Import history
- Existing enquiry / booking approval workflows

All Phase 2 frontend work should be designed for **desktop, tablet, and mobile**, rather than shrinking the desktop layout onto smaller screens.
