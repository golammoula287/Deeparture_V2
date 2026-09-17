/* Re-materializes departure pricing so date-limited offers start/expire correctly. Run hourly or daily. */
const mongoose = require("mongoose");
const config = require("../src/config");
const Departure = require("../src/v2/models/departure.model");
const { materializeDeparturePricing } = require("../src/v2/services/pricing.service");

(async () => {
  await mongoose.connect(config.database_url);
  const departures = await Departure.find({ status: { $nin: ["cancelled"] }, endDate: { $gte: new Date() } });
  let updated = 0;
  for (const departure of departures) {
    await materializeDeparturePricing(departure, new Date());
    await departure.save();
    updated += 1;
  }
  console.log(`Refreshed V2 pricing for ${updated} departures.`);
  await mongoose.disconnect();
})().catch(async (error) => { console.error(error); try { await mongoose.disconnect(); } catch (_) {} process.exit(1); });
