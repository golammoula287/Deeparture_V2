// Local sample catalogue only. Does not use configured database/email credentials.
process.env.NODE_ENV = 'development';
process.env.DATABASE_URL = 'mongodb://127.0.0.1:27028/deeparture_search_development';
process.env.EMAIL_DELIVERY_MODE = 'test';
process.env.JWT_SECRET_KEY = require('node:crypto').randomBytes(32).toString('hex');
process.env.PORT = '5028';
const mongoose = require('mongoose');
const app = require('../src/app');
mongoose.connect(process.env.DATABASE_URL).then(() => app.listen(5028, '127.0.0.1', () => console.log('Development sample API: http://127.0.0.1:5028'))).catch(error => { console.error(error.message); process.exitCode = 1; });
