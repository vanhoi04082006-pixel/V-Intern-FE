import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTestGithubClient, testGithubResponse, testIdentity, testHead, testBase, testBlob } from '../project-first-github.mjs';
const ownerId = '00000001-0000-4000-8000-000000000001', internId = '00000002-0000-4000-8000-000000000002';
const repo = { ownerUserId: ownerId, ownerLogin: 'ci-owner', repoName: 'ci-repo', repoId: 101, githubOwnerId: 1, status: 'ready' };
test('fixture transport preserves PR author/repository and immutable source identities', () => {
  const pr = testGithubResponse(repo, '/pulls/2', 2);
  assert.equal(pr.user.id, 2); assert.equal(pr.base.repo.id, 101); assert.equal(pr.head.sha, testHead); assert.equal(pr.base.sha, testBase);
  const files = testGithubResponse(repo, `/compare/${testBase}...${testHead}`).files;
  assert.equal(files[0].sha, testBlob);
  const blob = testGithubResponse(repo, `/git/blobs/${testBlob}`);
  assert.equal(Buffer.from(blob.content, 'base64').length, blob.size);
  assert.deepEqual(testGithubResponse(repo, `/commits/${testHead}/check-runs?per_page=100`), { check_runs: [] });
  assert.throws(() => testGithubResponse(repo, '/pulls/2', 3));
  assert.throws(() => testGithubResponse(repo, '/unknown'));
});
test('CI transport refuses production databases and non-test environments before any request', () => {
  const prior = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    assert.throws(() => createTestGithubClient({ options: { database: 'VIntern_Phase715_Test' } }));
    process.env.NODE_ENV = 'test';
    assert.throws(() => createTestGithubClient({ options: { database: 'VIntern_Dev' } }));
  } finally { if (prior === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = prior; }
});
test('CI transport rejects real credentials, mutations and foreign repository owners', async () => {
  const prior = process.env.NODE_ENV; process.env.NODE_ENV = 'test';
  let queries = 0;
  try {
    const client = createTestGithubClient({ options: { database: 'VIntern_Phase715_Test' }, query: async () => { queries++; return [repo]; } });
    await assert.rejects(client.call('/repos/ci-owner/ci-repo', 'not-a-ci-credential'), /Real credentials/);
    await assert.rejects(client.call('/repos/ci-owner/ci-repo', 'ci-user:' + ownerId, 'POST'), /read-only/);
    assert.equal(queries, 0);
    await assert.rejects(client.call('/repos/ci-owner/ci-repo', 'ci-user:' + internId));
    assert.equal(queries, 1);
    assert.equal((await client.call('/repos/ci-owner/ci-repo', 'ci-user:' + ownerId)).id, 101);
  } finally { if (prior === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = prior; }
});
test('CI numeric identity stays stable and fits the PR number storage boundary', () => {
  assert.deepEqual(testIdentity(ownerId), testIdentity(ownerId.toUpperCase()));
  const identity = testIdentity('ffffffff-ffff-4fff-8fff-ffffffffffff');
  assert(identity.id > 0 && identity.id < 2147483647);
  assert.match(identity.login, /^[a-z0-9-]{1,39}$/);
  assert.throws(() => testIdentity('invalid'));
});
