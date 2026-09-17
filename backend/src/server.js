const mongoose = require('mongoose');
const config = require('./config');
const app = require('./app');

async function start() {
  await mongoose.connect(config.database_url);
  console.log(`Connected to MongoDB: ${mongoose.connection.name}`);
  app.listen(config.port, '0.0.0.0', () => console.log(`Deeparture V2 API listening on :${config.port}`));
}

start().catch((error) => {
  console.error('Unable to start Deeparture V2 API:', error);
  process.exit(1);
});
