// Development-only, idempotent sample inventory. Never reads a configured database URI.
const mongoose = require('mongoose');
const Organisation = require('../src/v2/models/organisation.model');
const Vessel = require('../src/v2/models/vessel.model');
const CabinType = require('../src/v2/models/cabinType.model');
const Itinerary = require('../src/v2/models/itinerary.model');
const Departure = require('../src/v2/models/departure.model');
const Resort = require('../src/v2/models/resort.model');
const RoomType = require('../src/v2/models/roomType.model');
const Package = require('../src/v2/models/resortPackage.model');
const Availability = require('../src/v2/models/resortAvailability.model');
const Definition = require('../src/v2/models/attributeDefinition.model');
const Attribute = require('../src/v2/models/productAttribute.model');
const { materializeDeparturePricing } = require('../src/v2/services/pricing.service');
const URI = 'mongodb://127.0.0.1:27028/deeparture_search_development';
const destinations = ['raja-ampat', 'maldives', 'komodo', 'red-sea', 'galapagos', 'philippines'];
const definitions = [['wifi','Wi-Fi','facility'],['camera_room','Photography facilities','facility'],['nitrox','Nitrox','diving'],['rebreather_support','Rebreather support','diving'],['wheelchair_access','Wheelchair access','accessibility'],['vegan_meals','Vegan meals','dietary']];
const upsert = (Model, filter, data) => Model.findOneAndUpdate(filter, { $set: data }, { upsert: true, new: true, runValidators: true });
async function seed() {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seed is development-only.');
  await mongoose.connect(URI, { serverSelectionTimeoutMS: 5000 });
  const organisation = await upsert(Organisation, { slug: 'search-demo-development' }, { name: 'Sample inventory — development only', slug: 'search-demo-development', type: 'operator', status: 'unclaimed', primaryEmail: 'search-demo@example.test', source: 'admin' });
  const defs = [];
  for (const [key,label,group] of definitions) defs.push(await upsert(Definition, { key }, { key,label,group,applicableTo:['both'],dataType:'boolean',filterable:true,visibleOnPage:true,active:true }));
  const now = new Date();
  let vessels = 0, resorts = 0, departures = 0;
  for (const destination of destinations) for (let index = 1; index <= 20; index++) {
    const label = destination.split('-').map(word => word[0].toUpperCase()+word.slice(1)).join(' ');
    const suffix = `${destination}-${String(index).padStart(2,'0')}`;
    const common = { organisation:organisation._id, listingStatus:'published', verificationStatus:'unverified', source:'admin', summary:'Fictional sample inventory for development and search testing. Not a real travel offer.', description:'Development sample only. Prices, features and availability are synthetic and cannot be booked.', destinationSlugs:[destination], facilities:['wifi','camera_room'], dietary:['vegan_meals'], accessibility:['wheelchair_access'], divingFeatures:['nitrox','rebreather_support'], veganRating:5, metadata:{ seed:'search-demo-development', synthetic:true } };
    const vessel = await upsert(Vessel, { slug:`sample-liveaboard-${suffix}` }, { ...common,name:`Sample ${label} Explorer ${index}`,slug:`sample-liveaboard-${suffix}`,featuredImage:'/phase4/vessel.jpg',gallery:['/phase4/vessel.jpg','/phase4/boat.jpg'],maxGuests:20,cabinCount:10 });
    const cabin = await upsert(CabinType,{vessel:vessel._id,name:'Sample twin cabin'},{organisation:organisation._id,vessel:vessel._id,name:'Sample twin cabin',berthsPerCabin:2,maxOccupancy:2,totalCabins:10});
    const amount = 800 + index * 100;
    const itinerary = await upsert(Itinerary,{vessel:vessel._id,slug:'sample-7-nights'},{organisation:organisation._id,vessel:vessel._id,name:`Sample ${label} 7 nights`,slug:'sample-7-nights',status:'active',destinationSlugs:[destination],embarkation:{name:label,slug:destination},disembarkation:{name:label,slug:destination},numberOfNights:7,numberOfDays:8,basePrices:[{cabinType:cabin._id,amount,amountUsd:amount,currency:'USD',pricingBasis:'per_person'}]});
    for(let month=0;month<13;month++) {
      const startDate = new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+month+1,10));
      const externalCode = `SAMPLE-${startDate.toISOString().slice(0,7)}`;
      let departure = await Departure.findOne({itinerary:itinerary._id,externalCode}) || new Departure({organisation:organisation._id,vessel:vessel._id,itinerary:itinerary._id,externalCode});
      departure.startDate=startDate;departure.endDate=new Date(startDate.getTime()+7*86400000);departure.status='scheduled';departure.source='development_seed';
      departure.availability=[{cabinType:cabin._id,totalSpaces:20,spacesAvailable:6,status:'available',freshnessState:'fresh',sourceType:'development_seed'}];
      departure.offers = [1,10,11].includes(index) && month < 3 ? [{ name: `Sample ${[1,10,11].indexOf(index)*5+10}% early booking offer`, type:'percent', percent:[1,10,11].indexOf(index)*5+10, cabinType:cabin._id, active:true, validFrom:now, validUntil:new Date(now.getTime()+60*86400000), description:'Fictional development offer; not bookable.' }] : [];
      await materializeDeparturePricing(departure);await departure.save();departures++;
    }
    const resort = await upsert(Resort,{slug:`sample-resort-${suffix}`},{...common,name:`Sample ${label} Dive Resort ${index}`,slug:`sample-resort-${suffix}`,region:label,featuredImage:'/phase4/hero-island.jpg',gallery:['/phase4/hero-island.jpg']});
    const room = await upsert(RoomType,{resort:resort._id,name:'Sample ocean room'},{organisation:organisation._id,resort:resort._id,name:'Sample ocean room',maxOccupancy:2,totalRooms:20,ensuite:true,airConditioned:true});
    await upsert(Package,{resort:resort._id,name:'Sample 7 night package'},{organisation:organisation._id,resort:resort._id,roomType:room._id,name:'Sample 7 night package',numberOfNights:7,numberOfDays:8,numberOfDives:12,mealPlan:'full_board',basePrice:{amount,amountUsd:amount,currency:'USD',pricingBasis:'per_person'},active:true});
    await upsert(Availability,{roomType:room._id,date:new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,10))},{organisation:organisation._id,resort:resort._id,roomType:room._id,date:new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,10)),roomsAvailable:6,status:'available',source:'development_seed',freshnessState:'fresh'});
    for(const [productModel,product] of [['VesselV2',vessel._id],['ResortV2',resort._id]]) for(const def of defs) await upsert(Attribute,{product,definition:def._id},{productModel,product,definition:def._id,value:true,source:'admin',verificationStatus:'unverified'});
    vessels++;resorts++;
  }
  console.log(JSON.stringify({database:'deeparture_search_development',vessels,resorts,departures,destinations,synthetic:true}));
}
seed().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());
