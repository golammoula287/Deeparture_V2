const crypto = require('crypto');

const SAFE = /^[A-Za-z0-9._:-]{8,128}$/;
module.exports = (req, res, next) => {
  const supplied = String(req.headers['x-operation-id'] || '').trim();
  req.operationId = SAFE.test(supplied) ? supplied : crypto.randomUUID();
  res.setHeader('X-Operation-Id', req.operationId);
  next();
};
