import { describe, expect, it, vi } from "vitest";
import { listCodeReviews, listSubmissions } from "@/lib/api/submissions";
import { getTask, getComments, getHistory, listTasks, getOwnSprints, getOwnSprintBoard } from "@/lib/api/work";
import { getWorkspace } from "@/lib/api/workspace";
import { getEvaluations, getPerformance, getSalary, getCertificates, getRecommendations, getNotifications, getKpis } from "@/lib/api/outcomes";
import { ownParticipation } from "@/lib/api/participation";
import { ownReplacements } from "@/lib/api/replacements";
import { githubStatus, repositoryAccountStatus, sessionRepository, githubRepositoryActivity } from "@/lib/api/github";
import { listConversations, getConversation } from "@/lib/api/mentor";
import { getTaskSpec, getTaskSpecSource } from "@/lib/api/templates";
import { listRecruitmentRounds, roundDetail, roundApplications, staffApplication } from "@/lib/api/applications";
import { listRecruitingCareers } from "@/lib/api/career-roles";
import { sessionParticipation } from "@/lib/api/participation";
import {
  listCycles,
  getCriteria,
  listManagedEvaluations,
  getManagedEvaluation,
  listEvaluationSuggestions,
  getEvaluationSuggestion,
  listPerformance,
  getMemberPerformance,
  getMemberRecommendations,
} from "@/lib/api/management";
import { listImportedReviews } from "@/lib/api/imported-reviews";
import { listReports, getSavedReport } from "@/lib/api/reports";
import { sessionRepositoryAccess } from "@/lib/api/repository-access";

/**
 * Lock the local visual-QA fixtures (tools/qa/fixtures.mjs) to the REAL
 * request parsers. When a parser contract changes, this test fails instead of
 * letting the Playwright harness silently render error states — a fixture
 * drift that wastes a whole QA cycle before someone notices.
 */
const mod = await import("../../../../tools/qa/fixtures.mjs");
const instructorMod = await import("../../../../tools/qa/fixtures-instructor.mjs");

function stubFixtureFetch() {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://qa-be.internal/api/v1";
  vi.stubGlobal("fetch", (url: string) => {
    const parsed = new URL(url);
    const appPath = parsed.pathname.replace(/^\/api\/v1(?=\/|$)/, "") || "/";
    const body = (mod as { resolveApi: (m: string, p: string, s: URLSearchParams) => unknown }).resolveApi(
      "GET",
      appPath,
      parsed.searchParams,
    );
    if (body === null) throw new Error(`No QA fixture for GET ${appPath}`);
    return Promise.resolve(
      new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
  });
  return () => vi.unstubAllGlobals();
}

async function withFixtures<T>(run: () => Promise<T>): Promise<T> {
  const restore = stubFixtureFetch();
  try {
    return await run();
  } finally {
    restore();
  }
}

describe("QA fixtures match real request parsers (intern surfaces)", () => {
  it("workspace + own sprints + board parse", async () => {
    await withFixtures(async () => {
      expect((await getWorkspace()).status).toBe("active");
      const sprints = await getOwnSprints(1);
      expect(sprints.items[0]?.code).toBe("SPR-03");
      const board = await getOwnSprintBoard(sprints.items[0]!.id);
      expect(board.columns).toHaveLength(4);
      expect(board.total).toBeGreaterThan(0);
    });
  });

  it("task list, detail, comments, history parse", async () => {
    await withFixtures(async () => {
      const tasks = await listTasks(new URLSearchParams({ mine: "true", page: "1", pageSize: "10" }));
      expect(tasks.items.length).toBeGreaterThan(0);
      const task = await getTask(tasks.items[0]!.id);
      expect(task.code).toMatch(/^TASK-/);
      expect((await getComments(task.id)).items.length).toBeGreaterThan(0);
      expect((await getHistory(task.id)).items.length).toBeGreaterThan(0);
    });
  });

  it("spec, submissions and code reviews parse (evidence at item level)", async () => {
    await withFixtures(async () => {
      const spec = await getTaskSpec("tsk-0000-4000-8000-000000000002");
      expect(spec).not.toBeNull();
      expect(spec?.dod.length).toBeGreaterThan(0);
      expect(await getTaskSpecSource("tsk-0000-4000-8000-000000000002")).not.toBeNull();
      const submissions = await listSubmissions("tsk-0000-4000-8000-000000000002");
      expect(submissions.length).toBeGreaterThan(0);
      const reviews = await listCodeReviews(submissions[0]!.id);
      expect(reviews[0]!.evidence?.tests?.passed).toBe(24);
    });
  });

  it("mentor, github, participation and replacements parse", async () => {
    await withFixtures(async () => {
      const conversations = await listConversations(1, "active");
      expect(conversations.items.length).toBeGreaterThan(0);
      expect((await getConversation(conversations.items[0]!.id)).messages.length).toBeGreaterThan(0);
      expect((await githubStatus()).login).toBe("minh-nguyen");
      expect((await repositoryAccountStatus()).ready).toBe(true);
      expect((await sessionRepository("ses-0000-4000-8000-000000000001")).repository?.status).toBe("ready");
      expect((await githubRepositoryActivity("ses-0000-4000-8000-000000000001", 1)).items.length).toBeGreaterThan(0);
      const participation = await ownParticipation(1);
      expect(participation.items.length).toBeGreaterThan(0);
      expect((await ownReplacements()).items.length).toBeGreaterThan(0);
    });
  });

  it("outcome surfaces parse (evaluations, performance, kpi, salary, certificates, recommendations, notifications)", async () => {
    await withFixtures(async () => {
      expect((await getEvaluations())[0]?.overallScore).toBeGreaterThan(0);
      expect((await getPerformance()).totalTaskCount).toBeGreaterThan(0);
      expect((await getKpis())[0]?.status).toBe("calculated");
      expect((await getSalary()).balance).toBeGreaterThan(0);
      expect((await getCertificates())[0]?.certificateNumber).toMatch(/^VINT-/);
      expect((await getRecommendations()).recommendations.length).toBeGreaterThan(0);
      expect((await getNotifications(1, false)).items.length).toBeGreaterThan(0);
    });
  });
});

async function withInstructorFixtures<T>(run: () => Promise<T>): Promise<T> {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://qa-be.internal/api/v1";
  vi.stubGlobal("fetch", (url: string) => {
    const parsed = new URL(url);
    const appPath = parsed.pathname.replace(/^\/api\/v1(?=\/|$)/, "") || "/";
    const body = (instructorMod as { resolveInstructorApi: (m: string, p: string, s: URLSearchParams) => unknown }).resolveInstructorApi(
      "GET",
      appPath,
      parsed.searchParams,
    );
    if (body === null) throw new Error(`No QA fixture for GET ${appPath}`);
    return Promise.resolve(
      new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
  });
  try {
    return await run();
  } finally {
    vi.unstubAllGlobals();
  }
}

describe("QA fixtures match real request parsers (instructor monitoring surfaces)", () => {
  it("recruitment rounds, slots, applications and career roles parse", async () => {
    await withInstructorFixtures(async () => {
      const rounds = await listRecruitmentRounds();
      expect(rounds.length).toBeGreaterThan(0);
      const detail = await roundDetail(rounds[0]!.id);
      expect(detail.slots.length).toBeGreaterThan(0);
      expect(detail.slots[0]!.capacity).toBeGreaterThan(0);
      const careers = await listRecruitingCareers();
      expect(careers[0]!.requiredSkills.length).toBeGreaterThan(0);
      const apps = await roundApplications(rounds[0]!.id, 1);
      expect(apps.items.length).toBeGreaterThan(0);
      const staff = await staffApplication(rounds[0]!.id, apps.items[0]!.id);
      expect(staff.analysis.match?.confidence).toBeGreaterThan(0);
      expect(staff.interviewPolicy?.canRebook).toBe(true);
      expect(staff.timeline.length).toBeGreaterThan(0);
    });
  });

  it("session participation report and repository access jobs parse", async () => {
    await withInstructorFixtures(async () => {
      const report = await sessionParticipation("ses-0000-4000-8000-000000000050", 1);
      expect(report.items.length).toBeGreaterThan(0);
      expect(report.summary.active).toBeGreaterThan(0);
      expect(report.policy.version).toBeGreaterThan(0);
      const jobs = await sessionRepositoryAccess("ses-0000-4000-8000-000000000050");
      expect(jobs.items.length).toBeGreaterThan(0);
      expect(jobs.limit).toBeGreaterThan(0);
    });
  });

  it("evaluation cycles, criteria, managed evaluations and AI suggestions parse", async () => {
    await withInstructorFixtures(async () => {
      const cycles = await listCycles(1);
      expect(cycles.items.length).toBeGreaterThan(0);
      const criteria = await getCriteria(cycles.items[0]!.id);
      expect(criteria.length).toBeGreaterThan(0);
      const evaluations = await listManagedEvaluations(1, cycles.items[0]!.id, "");
      expect(evaluations.items.length).toBeGreaterThan(0);
      const draft = evaluations.items.find((e) => e.status === "draft");
      expect(draft?.overallScore).toBeNull();
      const detail = await getManagedEvaluation(evaluations.items[0]!.id);
      expect(detail.scores.length).toBeGreaterThan(0);
      const suggestions = await listEvaluationSuggestions(evaluations.items[0]!.id);
      expect(suggestions.length).toBeGreaterThan(0);
      const suggestion = await getEvaluationSuggestion(evaluations.items[0]!.id, suggestions[0]!.id);
      expect(suggestion.suggestion.criteria.length).toBeGreaterThan(0);
      expect(suggestion.promptVersion).toBeTruthy();
    });
  });

  it("imported reviews, member performance and recommendations parse", async () => {
    await withInstructorFixtures(async () => {
      const reviews = await listImportedReviews();
      expect(reviews.length).toBeGreaterThan(0);
      const members = await listPerformance(new URLSearchParams({ page: "1", pageSize: "10" }));
      expect(members.items.length).toBeGreaterThan(0);
      expect(members.items[0]!.rank).toBe(1);
      const metrics = await getMemberPerformance(members.items[0]!.userId);
      expect(metrics.committedStoryPoints).toBeGreaterThan(0);
      const recs = await getMemberRecommendations(members.items[0]!.userId);
      expect(recs.recommendations.length).toBeGreaterThan(0);
    });
  });

  it("saved reports list and snapshot details parse", async () => {
    await withInstructorFixtures(async () => {
      const reports = await listReports(1, "", undefined, {});
      expect(reports.items.length).toBeGreaterThan(0);
      expect(reports.counts.length).toBeGreaterThan(0);
      const detail = await getSavedReport(reports.items[0]!.id);
      expect(detail.snapshot.members.length).toBeGreaterThan(0);
      expect(detail.snapshot.details!.summary.total).toBeGreaterThan(0);
      expect(detail.snapshot.details!.tasks[0]!.code).toMatch(/^TASK-/);
    });
  });
});
