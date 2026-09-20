const mongoose = require('mongoose');
const config = require('../src/config');
const User = require('../src/models/user.model');
const Organisation = require('../src/v2/models/organisation.model');
const Membership = require('../src/v2/models/organisationMembership.model');
const Vessel = require('../src/v2/models/vessel.model');
const CabinType = require('../src/v2/models/cabinType.model');
const Itinerary = require('../src/v2/models/itinerary.model');
const Departure = require('../src/v2/models/departure.model');
const Resort = require('../src/v2/models/resort.model');
const RoomType = require('../src/v2/models/roomType.model');
const ResortPackage = require('../src/v2/models/resortPackage.model');
const { materializeDeparturePricing } = require('../src/v2/services/pricing.service');

(async () => {
  await mongoose.connect(config.database_url);
  const email = process.env.DEMO_OPERATOR_EMAIL || 'operator@example.test';
  const password = process.env.DEMO_OPERATOR_PASSWORD || 'ChangeMe123!';
  let user = await User.findOne({ email });
  if (!user) user = await User.create({ fullName: 'Demo Operator', email, password, role: 'operator', isValid: true });
  const org = await Organisation.findOneAndUpdate(
    { slug: 'demo-dive-company' },
    { name: 'Demo Dive Company', slug: 'demo-dive-company', type: 'operator', status: 'verified', primaryEmail: email, source: 'admin' },
    { upsert: true, new: true, runValidators: true }
  );
  await Membership.findOneAndUpdate({ user: user._id, organisation: org._id }, { user: user._id, organisation: org._id, role: 'owner', status: 'active' }, { upsert: true, new: true });
  const vessel = await Vessel.findOneAndUpdate(
    { slug: 'demo-explorer' },
    { organisation: org._id, name: 'Demo Explorer', slug: 'demo-explorer', listingStatus: 'published', verificationStatus: 'deeparture_verified', summary: 'A demonstration liveaboard record for local V2 testing.', description: 'This listing is generated entirely from the standalone V2 database.', destinationSlugs: ['raja-ampat'], facilities: ['wifi','camera_room'], dietary: ['vegan_meals','vegetarian_meals'], accessibility: ['mobility_support'], divingFeatures: ['nitrox'], veganRating: 4.7, maxGuests: 16, cabinCount: 8 },
    { upsert: true, new: true, runValidators: true }
  );
  const cabin = await CabinType.findOneAndUpdate({ vessel: vessel._id, name: 'Deluxe' }, { organisation: org._id, vessel: vessel._id, name: 'Deluxe', berthsPerCabin: 2, maxOccupancy: 2, totalCabins: 8 }, { upsert: true, new: true, runValidators: true });
  const itinerary = await Itinerary.findOneAndUpdate(
    { vessel: vessel._id, slug: 'raja-ampat-10-nights' },
    { organisation: org._id, vessel: vessel._id, name: 'Raja Ampat 10 Nights', slug: 'raja-ampat-10-nights', status: 'active', destinationSlugs: ['raja-ampat'], embarkation: { name: 'Sorong', slug: 'sorong' }, disembarkation: { name: 'Sorong', slug: 'sorong' }, numberOfNights: 10, numberOfDays: 11, basePrices: [{ cabinType: cabin._id, amount: 5500, amountUsd: 5500, currency: 'USD', pricingBasis: 'per_person' }] },
    { upsert: true, new: true, runValidators: true }
  );
  let departure = await Departure.findOne({ itinerary: itinerary._id, externalCode: 'DEMO-001' });
  if (!departure) departure = new Departure({ organisation: org._id, vessel: vessel._id, itinerary: itinerary._id, externalCode: 'DEMO-001' });
  departure.startDate = new Date('2027-01-10T00:00:00Z');
  departure.endDate = new Date('2027-01-20T00:00:00Z');
  departure.status = 'scheduled';
  departure.availability = [{ cabinType: cabin._id, totalSpaces: 16, spacesAvailable: 6, status: 'available' }];
  departure.offers = [{ name: 'Demo special', type: 'percent', percent: 10, cabinType: cabin._id, active: true }];
  await materializeDeparturePricing(departure, new Date('2026-08-24T00:00:00Z'));
  await departure.save();

  const resort = await Resort.findOneAndUpdate(
    { slug: 'demo-dive-resort' },
    { organisation: org._id, name: 'Demo Dive Resort', slug: 'demo-dive-resort', listingStatus: 'published', verificationStatus: 'deeparture_verified', summary: 'A demonstration resort record for local V2 testing.', destinationSlugs: ['raja-ampat'], facilities: ['wifi','spa'], dietary: ['vegan_meals'], accessibility: ['accessible_room'], divingFeatures: ['house_reef'], veganRating: 4.5, country: 'Indonesia', region: 'Raja Ampat' },
    { upsert: true, new: true, runValidators: true }
  );
  const room = await RoomType.findOneAndUpdate({ resort: resort._id, name: 'Water Cottage' }, { organisation: org._id, resort: resort._id, name: 'Water Cottage', maxOccupancy: 2, totalRooms: 10, ensuite: true, airConditioned: true }, { upsert: true, new: true });
  await ResortPackage.findOneAndUpdate({ resort: resort._id, name: '7 Night Dive Package' }, { organisation: org._id, resort: resort._id, roomType: room._id, name: '7 Night Dive Package', numberOfNights: 7, numberOfDays: 8, numberOfDives: 12, mealPlan: 'full_board', basePrice: { amount: 1950, amountUsd: 1950, currency: 'USD', pricingBasis: 'per_person' }, active: true }, { upsert: true, new: true, runValidators: true });

  console.log('Demo data ready.');
  console.log('Demo operator ready; credentials are configured in backend/.env.');
  console.log('Liveaboard: /liveaboards/demo-explorer');
  console.log('Resort: /resorts/demo-dive-resort');
  await mongoose.disconnect();
})().catch(async (error) => { console.error(error); try { await mongoose.disconnect(); } catch (_) {} process.exit(1); });
