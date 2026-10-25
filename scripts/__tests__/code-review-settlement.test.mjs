import test from 'node:test';
import assert from 'node:assert/strict';
import { waitForSettledCodeReview } from '../code-review-settlement.mjs';

const sha = 'a'.repeat(40), pause = async () => {};
test('waits for the automatic review using reads without replacing its terminal result', async () => {
  const states = [[], [{ status: 'running', headSha: sha }], [{ status: 'inconclusive', headSha: sha }]];
  const result = await waitForSettledCodeReview(async () => states.shift(), sha, { attempts: 3, pause });
  assert.equal(result.status, 'inconclusive'); assert.equal(states.length, 0);
});
test('keeps failed and needs-changes results visible to the caller assertion', async () => {
  for (const status of ['failed', 'needs_changes']) {
    assert.equal((await waitForSettledCodeReview(async () => [{ status, headSha: sha }], sha, { pause })).status, status);
  }
});
test('fails rather than claiming success when the review never finishes or its SHA changes', async () => {
  await assert.rejects(waitForSettledCodeReview(async () => [{ status: 'running', headSha: sha }], sha, { attempts: 2, pause }), /did not finish/);
  await assert.rejects(waitForSettledCodeReview(async () => [{ status: 'inconclusive', headSha: 'b'.repeat(40) }], sha, { pause }), /SHA changed/);
});
