const mongoose = require("mongoose");
const config = require("../src/config");
const AttributeDefinition = require("../src/v2/models/attributeDefinition.model");

const definitions = [
  ["wifi", "Wi-Fi", "facility", "both"],
  ["starlink", "Starlink", "facility", "both"],
  ["air_conditioning", "Air Conditioning", "facility", "both"],
  ["ensuite", "Ensuite Bathrooms", "facility", "both"],
  ["camera_room", "Camera Room", "facility", "both"],
  ["charging_station", "Charging Stations", "facility", "both"],
  ["sun_deck", "Sun Deck", "facility", "vessel"],
  ["spa", "Spa / Massage", "facility", "both"],
  ["laundry", "Laundry", "facility", "both"],
  ["nitrox", "Nitrox", "diving", "both"],
  ["free_nitrox", "Free Nitrox", "diving", "both"],
  ["rebreather_support", "Rebreather Support", "diving", "vessel"],
  ["sidemount_support", "Sidemount Support", "diving", "both"],
  ["house_reef", "House Reef", "diving", "resort"],
  ["vegan_meals", "Vegan Meals", "dietary", "both"],
  ["vegetarian_meals", "Vegetarian Meals", "dietary", "both"],
  ["gluten_free", "Gluten-Free Options", "dietary", "both"],
  ["allergy_support", "Food Allergy Support", "dietary", "both"],
  ["mobility_support", "Limited-Mobility Support", "accessibility", "both"],
  ["wheelchair_access", "Wheelchair Access", "accessibility", "both"],
  ["accessible_cabin", "Accessible Cabin", "accessibility", "vessel"],
  ["accessible_room", "Accessible Room", "accessibility", "resort"],
  ["accessible_bathroom", "Accessible Bathroom", "accessibility", "both"],
  ["step_free_access", "Step-Free Access", "accessibility", "both"],
  ["step_free_dive_deck", "Step-Free Dive Deck", "accessibility", "vessel"],
  ["water_entry_assistance", "Water-Entry Assistance", "accessibility", "both"],
  ["water_exit_assistance", "Water-Exit Assistance", "accessibility", "both"],
  ["accessible_tender", "Accessible Tender / RIB", "accessibility", "vessel"],
  ["accessible_transfers", "Accessible Transfers", "accessibility", "both"],
];

(async () => {
  await mongoose.connect(config.database_url);
  for (const [key, label, group, applicable] of definitions) {
    await AttributeDefinition.findOneAndUpdate(
      { key },
      { key, label, group, applicableTo: [applicable], dataType: "boolean", filterable: true, visibleOnPage: true, active: true },
      { upsert: true, new: true, runValidators: true }
    );
  }
  console.log(`Seeded ${definitions.length} V2 attribute definitions.`);
  await mongoose.disconnect();
})().catch(async (error) => { console.error(error); try { await mongoose.disconnect(); } catch (_) {} process.exit(1); });
