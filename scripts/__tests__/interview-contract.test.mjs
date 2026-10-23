import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildTestInterviewPayload, answerTestInterview } from '../project-first-provider.mjs';

test('failed interview fixture is below 50, separate from alternative-role guidance', () => {
  const result = buildTestInterviewPayload({ task: 'recruitment-evaluation', input: { role: 'qa' } });
  const overall = Math.round((result.technicalScore * 0.7 + result.softSkillScore * 0.3) * 10) / 10;
  assert.ok(overall < 50, `Failed fixture must be below 50, received ${overall}`);
});

test('pass/fail fixtures do not recommend the applied career outside the 50–70 band', () => {
  for (const role of ['qa', 'frontend', 'new_catalog_career']) {
    assert.equal(buildTestInterviewPayload({ task: 'recruitment-evaluation', input: { role } }).recommendedRole, null);
  }
});

test('test interview provider keeps each conversation feature separate from scoring', () => {
  assert.deepEqual(buildTestInterviewPayload({ task: 'interview_next_question', input: { position: 1, plannedQuestion: 'Describe an API you built.' } }), { message: 'Chào bạn! Describe an API you built.' });
  assert.deepEqual(buildTestInterviewPayload({ task: 'clarify_interview_question', input: { question: 'Describe an API.' } }), { message: 'Bạn hãy nêu một ví dụ cụ thể liên quan đến: Describe an API.' });
  assert.deepEqual(buildTestInterviewPayload({ task: 'interview_follow_up', input: { answer: 'I do not know.' } }), { needsFollowUp: false, message: '' });
  assert.throws(() => buildTestInterviewPayload({ task: 'unknown-feature', input: {} }), /Unsupported/);
});
test('v3 scoring includes all six dimensions without taking authority over the decision', () => {
  for (const role of ['backend', 'qa']) {
    const result = buildTestInterviewPayload({ task: 'recruitment-evaluation', input: { role } });
    assert.deepEqual(result.criteria.map(item => item.code), ['knowledge','communication','problem_solving','english','confidence','reasoning']);
    assert.equal(result.technicalScore, role === 'qa' ? 30 : 85);
    assert.equal(result.softSkillScore, role === 'qa' ? 40 : 72);
    assert.equal(result.passed, false); // deliberately contradictory, backend computes final PASS
    assert.equal(result.overallScore, 0);
  }
});
test('fixture answers only the current server question, including an adaptive follow-up', async () => {
  const questions = [{ id: 'q1', kind: 'main', status: 'ready' }, { id: 'q1', kind: 'follow_up', status: 'ready' }, { id: 'q2', kind: 'main', status: 'ready' }], writes = [];
  const result = await answerTestInterview(async (url, method) => {
    if (url.endsWith('/conversation/next')) return { currentQuestion: questions.shift() ?? null };
    writes.push({ url, method }); return {};
  }, { session: { id: 'session', questionCount: 2 } }, 'Controlled reasoning.');
  assert.deepEqual(result, { mainAnswers: 2, followUpAnswers: 1 });
  assert.deepEqual(writes.map(item => item.url), ['/recruitment/me/interviews/session/answers/q1','/recruitment/me/interviews/session/follow-ups/q1','/recruitment/me/interviews/session/answers/q2']);
  assert(writes.every(item => item.method === 'PUT'));
});
test('fixture rejects unavailable conversation rather than inventing progress', async () => {
  await assert.rejects(answerTestInterview(async () => ({ currentQuestion: { id: 'q', kind: 'main', status: 'failed' } }), { session: { id: 's', questionCount: 10 } }, 'Answer'), /ready/);
  await assert.rejects(answerTestInterview(async () => ({ currentQuestion: null }), { session: { id: 's', questionCount: 10 } }, 'Answer'), /all main/);
});
