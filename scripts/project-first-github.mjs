/** AUTOMATED TEST ONLY: deterministic GitHub HTTP boundary, never a production provider. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
export const testHead = 'a'.repeat(40), testBase = 'b'.repeat(40), testBlob = 'c'.repeat(40);
const source = 'export const ciFixture = true;\n';
function safeEnvironment(db) {
  assert.equal(process.env.NODE_ENV, 'test');
  assert.match(String(db.options.database), /^VIntern_Phase715_[A-Za-z0-9_]+$/);
}
export function testIdentity(userId) {
  assert.match(userId, /^[a-f0-9-]{36}$/i);
  const compact = userId.replaceAll('-', '').toLowerCase();
  return { id: parseInt(compact.slice(0, 7), 16) + 1, login: 'ci-' + compact.slice(0, 16) };
}
export function testGithubResponse(repo, suffix, prAuthor) {
  if (!suffix) return { id: Number(repo.repoId), owner: { id: Number(repo.githubOwnerId), login: repo.ownerLogin }, name: repo.repoName, private: false, default_branch: 'main', html_url: repo.htmlUrl };
  if (/^\/pulls\/\d+$/.test(suffix)) {
    assert.equal(Number(suffix.split('/').at(-1)), prAuthor);
    return { state: 'open', merged: false, changed_files: 1, user: { id: prAuthor }, base: { sha: testBase, repo: { id: Number(repo.repoId) } }, head: { sha: testHead, repo: { full_name: repo.ownerLogin + '/' + repo.repoName } } };
  }
  if (suffix === `/compare/${testBase}...${testHead}`) return { files: [{ filename: 'index.js', sha: testBlob, status: 'modified', patch: '@@ -0,0 +1 @@\n+export const ciFixture = true;' }] };
  if (suffix === `/git/blobs/${testBlob}`) return { encoding: 'base64', size: Buffer.byteLength(source), content: Buffer.from(source).toString('base64') };
  if (suffix === `/commits/${testHead}/check-runs?per_page=100`) return { check_runs: [] };
  throw new Error('Unsupported CI GitHub request: ' + suffix);
}
export function createTestGithubClient(db) {
  safeEnvironment(db);
  return { async call(route, token, method = 'GET') {
    assert.equal(method, 'GET', 'CI GitHub transport is read-only');
    assert.match(token, /^ci-user:[a-f0-9-]{36}$/i, 'Real credentials must never enter the test transport');
    const match = route.match(/^\/repos\/([a-z0-9-]+)\/([a-z0-9-]+)(.*)$/i);
    assert(match, 'Only the registered CI repository is supported');
    const [repo] = await db.query('SELECT * FROM session_repositories WHERE ownerLogin=@0 AND repoName=@1', [match[1], match[2]]);
    assert(repo && repo.status === 'ready');
    assert.equal(repo.ownerUserId.toLowerCase(), token.slice('ci-user:'.length).toLowerCase());
    const author = /^\/pulls\/(\d+)$/.exec(match[3]);
    if (author) {
      const [linked] = await db.query('SELECT userId FROM github_connections WHERE githubUserId=@0', [Number(author[1])]);
      assert(linked, 'PR author must be a seeded CI identity');
    }
    return testGithubResponse(repo, match[3], author ? Number(author[1]) : null);
  } };
}
export async function prepareTestRepository(db, sealToken, sessionId, ownerId, internId, key) {
  safeEnvironment(db); assert(key && key.length >= 32);
  for (const userId of [ownerId, internId]) {
    const identity = testIdentity(userId);
    const existing = await db.query('SELECT userId FROM github_connections WHERE userId=@0', [userId]);
    if (!existing.length) await db.query('INSERT INTO github_connections(userId,githubUserId,login,tokenCiphertext,scopes) VALUES(@0,@1,@2,@3,@4)', [userId, identity.id, identity.login, sealToken('ci-user:' + userId.toLowerCase(), key, userId.toLowerCase()), userId.toLowerCase() === ownerId.toLowerCase() ? 'read:user public_repo' : 'read:user']);
  }
  const owner = testIdentity(ownerId), student = testIdentity(internId), repoName = 'ci-submission-' + sessionId.slice(0, 8).toLowerCase(), repoId = 1000000000 + owner.id, url = `https://github.com/${owner.login}/${repoName}`;
  const prior = await db.query('SELECT sessionId FROM session_repositories WHERE sessionId=@0', [sessionId]);
  assert.equal(prior.length, 0, 'This fixture must not replace an existing repository');
  await db.query("INSERT INTO session_repositories(sessionId,ownerUserId,githubOwnerId,ownerLogin,repoName,repoId,htmlUrl,defaultBranch,status,leaseId) VALUES(@0,@1,@2,@3,@4,@5,@6,'main','ready',@7)", [sessionId, ownerId, owner.id, owner.login, repoName, repoId, url, randomUUID()]);
  return { prUrl: url + '/pull/' + student.id, headSha: testHead, transport: 'test-only GitHub HTTP boundary; no live GitHub or execution claim' };
}
