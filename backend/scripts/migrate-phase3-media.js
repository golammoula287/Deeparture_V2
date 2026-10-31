const mongoose = require('mongoose');
const config = require('../src/config');
const Vessel = require('../src/v2/models/vessel.model');
const Resort = require('../src/v2/models/resort.model');
const MediaAsset = require('../src/v2/models/mediaAsset.model');

const apply = process.argv.includes('--apply');
const unique = values => [...new Set((values || []).filter(Boolean).map(String))];

const backfill = async (Model, entityType) => {
  const items = await Model.find({ $or: [{ featuredImage: { $type: 'string', $ne: '' } }, { 'gallery.0': { $exists: true } }] }).lean();
  let planned = 0, created = 0;
  for (const item of items) {
    const urls = unique([item.featuredImage, ...(item.gallery || [])]);
    for (let index = 0; index < urls.length; index += 1) {
      const url = urls[index];
      const exists = await MediaAsset.exists({ organisation: item.organisation, entityType, entityId: item._id, url });
      if (exists) continue;
      planned += 1;
      if (apply) {
        await MediaAsset.create({
          organisation: item.organisation,
          entityType,
          entityId: item._id,
          url,
          type: 'image',
          source: 'deeparture',
          sortOrder: index,
          featured: item.featuredImage === url,
          usageApproved: true,
          approvedAt: new Date(),
        });
        created += 1;
      }
    }
  }
  return { entityType, products: items.length, planned, created };
};

(async () => {
  await mongoose.connect(config.database_url);
  try {
    const results = [await backfill(Vessel, 'vessel'), await backfill(Resort, 'resort')];
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', results }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
})().catch(error => { console.error(error); process.exit(1); });
