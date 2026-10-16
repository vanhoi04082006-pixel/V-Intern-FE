/** Test-only payload for the existing AI_PROVIDER_TOKEN harness override. */
import assert from "node:assert/strict";

export function buildTestInterviewPayload({ task, input }) {
  if (task === 'interview_next_question') {
    assert.equal(typeof input.plannedQuestion, 'string');
    return { message: `${input.position === 1 ? 'Chào bạn! ' : ''}${input.plannedQuestion}` };
  }
  if (task === 'clarify_interview_question') {
    assert.equal(typeof input.question, 'string');
    return { message: `Bạn hãy nêu một ví dụ cụ thể liên quan đến: ${input.question}` };
  }
  if (task === 'interview_follow_up') return { needsFollowUp: false, message: '' };
  assert.equal(task, 'recruitment-evaluation', `Unsupported test provider feature: ${task}`);
  const failed = input.role === 'qa';
  return {
    technicalScore: failed ? 58 : 85, softSkillScore: 72,
    criteria: ['knowledge','communication','problem_solving','english','confidence','reasoning'].map(code => ({ code, score: failed ? 58 : 82, feedback: 'Development test evidence from the saved answers.' })),
    strengths: failed ? [] : ['Concrete reasoning'], weaknesses: failed ? ['Needs technical practice'] : [],
    feedback: `${failed ? 'Development interview needs improvement.' : 'Development interview passed.'} Role: ${input.role}.`, recommendedRole: input.role,
    overallScore: 0, decision: 'failed', passed: false,
  };
}

/** Current-question API protocol; never reads future questions or writes SQL answers. */
export async function answerTestInterview(call, interview, answerText, mainLimit = interview.session.questionCount) {
  const { id, questionCount } = interview.session;
  assert(Number.isInteger(mainLimit) && mainLimit > 0 && mainLimit <= questionCount);
  const path = `/recruitment/me/interviews/${id}`;
  let mainAnswers = 0, followUpAnswers = 0;
  for (let turn = 0; turn <= questionCount + 2; turn++) {
    const chat = await call(`${path}/conversation/next`, 'POST', {}), current = chat.currentQuestion;
    if (!current) {
      assert.equal(mainAnswers, mainLimit, 'Server must deliver all main questions');
      return { mainAnswers, followUpAnswers };
    }
    assert.equal(current.status, 'ready', 'Current question must be ready before answering');
    assert(['main', 'follow_up'].includes(current.kind));
    const followUp = current.kind === 'follow_up';
    await call(`${path}/${followUp ? 'follow-ups' : 'answers'}/${current.id}`, 'PUT', { answerText });
    if (followUp) followUpAnswers++; else mainAnswers++;
    if (mainLimit < questionCount && mainAnswers === mainLimit) return { mainAnswers, followUpAnswers };
  }
  throw new Error('Interview exceeded its bounded question/follow-up contract');
}

export function buildTestSprintPlan(input) {
  const start = Date.parse(input.session?.startDate), end = Date.parse(input.session?.endDate);
  assert.ok(Number.isFinite(start) && Number.isFinite(end) && end - start >= 4 * 86400000, "Valid session window required");
  assert.ok(input.members?.length > 0, "Actual session roster required");
  const middle = start + Math.floor((end - start) / 86400000 / 2) * 86400000;
  return { sprints: [[start, middle], [middle, end]].map(([from, to], index) => ({
    name: `Contract Sprint ${index + 1}`, goal: "Implement and verify the pinned project requirements",
    startDate: new Date(from).toISOString(), endDate: new Date(to).toISOString(),
    tasks: [...input.members].sort((a, b) => b.roleInProject.localeCompare(a.roleInProject) || a.userId.localeCompare(b.userId)).map(member => ({
      title: `${member.roleInProject} delivery ${index + 1}`,
      description: `Implement the ${member.roleInProject} requirements and document the verified result.`,
      acceptanceCriteria: ["Requirements are demonstrated", "Regression checks pass"],
      suggestedRole: member.roleInProject, assigneeId: member.userId,
      priority: "high", storyPoints: 3, dueDate: new Date(to).toISOString(),
    })),
  })) };
}
