const test = require('node:test');
const assert = require('node:assert/strict');
const releaseIdentity = require('../src/utilities/releaseIdentity');

test('release identity exposes only a valid configured source SHA and never guesses', () => {
  const oldRender = process.env.RENDER_GIT_COMMIT;
  const oldBuild = process.env.BUILD_COMMIT;
  try {
    delete process.env.RENDER_GIT_COMMIT;
    delete process.env.BUILD_COMMIT;
    assert.deepEqual(releaseIdentity(), { commit: null });
    process.env.BUILD_COMMIT = 'b'.repeat(40);
    assert.deepEqual(releaseIdentity(), { commit: 'b'.repeat(40) });
    process.env.RENDER_GIT_COMMIT = 'a'.repeat(40);
    assert.deepEqual(releaseIdentity(), { commit: 'a'.repeat(40) });
    process.env.RENDER_GIT_COMMIT = 'not-a-commit';
    assert.deepEqual(releaseIdentity(), { commit: null });
  } finally {
    if (oldRender === undefined) delete process.env.RENDER_GIT_COMMIT;
    else process.env.RENDER_GIT_COMMIT = oldRender;
    if (oldBuild === undefined) delete process.env.BUILD_COMMIT;
    else process.env.BUILD_COMMIT = oldBuild;
  }
});
