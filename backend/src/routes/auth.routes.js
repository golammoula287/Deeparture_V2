const express = require('express');
const { login, me } = require('../controllers/auth.controller');
const v2Auth = require('../v2/middleware/v2Auth');
const router = express.Router();
router.post('/login', login);
router.get('/me', v2Auth(), me);
module.exports = router;
