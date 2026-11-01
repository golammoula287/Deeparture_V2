const test = require('node:test');
const assert = require('node:assert/strict');
const { dashboardSummary } = require('../src/v2/services/operatorPortal.service');
const models = Object.fromEntries(['organisation','vessel','resort','departure','enquiry','notification','availabilityEffective','importBatch'].map(name => [name, require(`../src/v2/models/${name}.model`)]));

function query(items) {
  let result = items;
  return { sort() { return this; }, populate() { return this; }, limit(limit) { result = result.slice(0, limit); return this; }, lean() { return Promise.resolve(result); } };
}

test('dashboard reports all active enquiries while keeping the recent preview bounded', async t => {
  const enquiries = Array.from({ length: 11 }, (_, index) => ({ _id: String(index), status: 'sent_to_operator' }));
  t.mock.method(models.organisation, 'findById', () => query({ _id: 'organisation' }));
  for (const name of ['vessel','resort','departure','importBatch']) t.mock.method(models[name], 'find', () => query([]));
  t.mock.method(models.enquiry, 'find', () => query(enquiries));
  const count = t.mock.method(models.enquiry, 'countDocuments', async filter => {
    assert.equal(filter.organisation, 'organisation');
    assert.deepEqual(filter.status.$in, ['sent_to_operator','operator_accepted','operator_replied','quoted']);
    return enquiries.length;
  });
  for (const name of ['availabilityEffective','notification','departure']) t.mock.method(models[name], 'countDocuments', async () => 0);
  const dashboard = await dashboardSummary({ organisationId: 'organisation', userId: 'user' });
  assert.equal(dashboard.counts.pendingEnquiries, 11);
  assert.equal(dashboard.enquiries.length, 8);
  assert.equal(count.mock.callCount(), 1);
});
