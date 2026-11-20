import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * GAP-2 COVERAGE: các endpoint mở rộng (applications/github/RBAC/catalogs/
 * system/AI config/career-roles/certificates/communications/knowledge/KPI/
 * performance/question-bank/recruitment-rounds/reports/virtual-salary/
 * sessions/projects/sprints/tasks/AI plans/templates/evaluations/imported
 * reviews/participation ops/recruitment me/candidates/assignments/settings)
 * phải đi qua request() THẬT và parser fail-closed của từng module api —
 * đúng đường trang dùng trong Preview.
 */
beforeEach(() => {
  window.sessionStorage.clear();
});

async function withPreview<T>(fn: () => Promise<T>): Promise<T> {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_PREVIEW", "1");
  vi.stubEnv("NODE_ENV", "test");
  try {
    return await fn();
  } finally {
    vi.unstubAllEnvs();
    vi.resetModules();
  }
}

async function expectOk(label: string, run: () => Promise<unknown>) {
  const error = await run().then(
    () => null,
    (e) => e as unknown,
  );
  expect(error, `${label} phải parse được shape mock`).toBeNull();
}

describe("Preview GAP-2: endpoint bổ sung qua parser thật", () => {
  it("A) applications public + auth phụ + RBAC mutation", async () => {
    await withPreview(async () => {
      const applications = await import("@/lib/api/applications");
      const admin = await import("@/lib/api/admin");
      await expectOk("publicRounds", () => applications.publicRounds());
      await expectOk("myApplication", () => applications.myApplication());
      await expectOk("verifyApplication", () => applications.verifyApplication("token-x"));
      await expectOk("leaveCandidateSession", () => applications.leaveCandidateSession());
      await expectOk("supplementCv", () => applications.supplementCv(new File(["cv"], "cv.pdf")));
      const requestAccess = await applications.requestApplicationAccess("rr-01", "a@b.vn");
      expect(requestAccess).toMatchObject({ queued: true });
      await expectOk("saveUser (create)", () =>
        admin.saveUser(undefined, { displayName: "Người mới", username: "moi.ntn" }));
      await expectOk("saveUser (update)", () =>
        admin.saveUser("pv-intern-2", { displayName: "Đỗ Thuần Minh", username: "minh.do" }));
      await expectOk("setUserStatus", () => admin.setUserStatus("pv-intern-3", "active"));
      await expectOk("listPermissions (role)", () => admin.listPermissions(1, "r-admin"));
      await expectOk("saveGroup (create)", () =>
        admin.saveGroup(undefined, { code: "k27", name: "K27", description: "Khóa 27" }));
      await expectOk("saveGroup (update)", () =>
        admin.saveGroup("g-1", { name: "CNTT K26", description: "Sinh viên khoá 26" }));
      await expectOk("getGroupMembers", () => admin.getGroupMembers("g-1"));
      await expectOk("addGroupMember", () => admin.addGroupMember("g-1", "u-intern-6"));
      await expectOk("removeGroupMember", () => admin.removeGroupMember("g-1", "u-intern-6"));
      await expectOk("getGroupRoles", () => admin.getGroupRoles("g-1"));
      await expectOk("setGroupRoles", () => admin.setGroupRoles("g-1", ["intern"]));
      await expectOk("getHealth", () => admin.getHealth());
      await expectOk("saveSetting", () =>
        admin.saveSetting({ key: "virtual_salary.base_amount", value: "520000", description: "Lương cơ sở" }));
    });
  });

  it("B) github identity + repository phiên", async () => {
    await withPreview(async () => {
      const github = await import("@/lib/api/github");
      await expectOk("githubStatus", () => github.githubStatus());
      const authorizeUrl = await github.connectGithub();
      expect(new URL(authorizeUrl).origin).toBe("https://github.com");
      await expectOk("repositoryAccountStatus", () => github.repositoryAccountStatus());
      await expectOk("selectRepositoryAccount", () => github.selectRepositoryAccount());
      await expectOk("disconnectGithub", () => github.disconnectGithub());
      await expectOk("sessionRepository", () => github.sessionRepository("ss-f26"));
      await expectOk("provisionRepository", () => github.provisionRepository("ss-f26"));
      const invited = await github.inviteRepositoryMembers("ss-f26");
      expect(invited.processed).toBeGreaterThan(0);
      await expectOk("inviteRepositoryMember", () =>
        github.inviteRepositoryMember("ss-f26", "pv-intern-2"));
      await expectOk("configureGithubWebhook", () => github.configureGithubWebhook("ss-f26"));
      await expectOk("reconcileRepositoryAccess", () => github.reconcileRepositoryAccess("ss-f26"));
      const activity = await github.githubRepositoryActivity("ss-f26", 1);
      expect(activity.total).toBeGreaterThan(0);
    });
  });

  it("D+E+F+I) catalogs, hệ thống, AI config, thư đi", async () => {
    await withPreview(async () => {
      const admin = await import("@/lib/api/admin");
      const system = await import("@/lib/api/system-admin");
      const business = await import("@/lib/api/business-agents");
      const knowledgeRuns = await import("@/lib/api/knowledge-runs");
      const communications = await import("@/lib/api/communications");
      await expectOk("listCatalogTypes", () => admin.listCatalogTypes(1));
      await expectOk("listCatalogItems", () => admin.listCatalogItems(1, "technology"));
      await expectOk("createCatalogType", () =>
        admin.createCatalogType({ code: "campus", name: "Cơ sở", description: "Cơ sở đào tạo" }));
      await expectOk("saveCatalogItem (create)", () =>
        admin.saveCatalogItem(undefined, {
          typeCode: "technology", code: "redis", name: "Redis", value: "redis", sortOrder: 4,
        }));
      await expectOk("saveCatalogItem (update)", () =>
        admin.saveCatalogItem("ci-9", { name: "PostgreSQL 16", value: "pg16", sortOrder: 3 }));
      await expectOk("getSystemStatus", () => system.getSystemStatus());
      await expectOk("getSystemContracts", () => system.getSystemContracts());
      await expectOk("validateSystemContractsDraft", () =>
        system.validateSystemContractsDraft("{ \"contracts\": [] }"));
      await expectOk("listSystemRepositories", () =>
        system.listSystemRepositories(new URLSearchParams("page=1&pageSize=20")));
      await expectOk("getAiConfiguration", () => system.getAiConfiguration());
      await expectOk("saveAiConfiguration", () =>
        system.saveAiConfiguration({ model: "gemini-2.5-flash", timeoutMs: 60000, maxRetries: 3, version: 8 }));
      await expectOk("getBusinessRuns", () => business.getBusinessRuns(1, "", ""));
      const run = await knowledgeRuns.createKnowledgeRun("Hạn mức mượn tối đa?", "frontend");
      expect(run.status).toBe("running");
      await expectOk("getKnowledgeRun", () => knowledgeRuns.getKnowledgeRun(run.id));
      await expectOk("cancelKnowledgeRun", () => knowledgeRuns.cancelKnowledgeRun(run.id));
      const resumed = await knowledgeRuns.resumeKnowledgeRun(run.id);
      expect(resumed).toMatchObject({ accepted: true });
      await expectOk("listMail", () => communications.listMail(1));
      const preview = await communications.previewMail("ml-4");
      expect(preview.redacted).toBe(true);
      await expectOk("previewMail (redacted)", () => communications.previewMail("ml-1"));
      const resent = await communications.resendMail("ml-3", true);
      expect(resent).toBe(true);
    });
  });

  it("G) career roles (admin + public)", async () => {
    await withPreview(async () => {
      const careers = await import("@/lib/api/career-roles");
      const list = await careers.listCareerRoles(new URLSearchParams("page=1&pageSize=100"));
      expect(list.items.length).toBeGreaterThanOrEqual(5);
      const content = {
        name: "Data Intern", description: "Phân tích dữ liệu", level: "intern" as const,
        language: "vi" as const, requiredSkills: ["SQL"], optionalSkills: ["Python"],
        competencyWeights: { delivery: 0.5, quality: 0.5 },
      };
      await expectOk("createCareerRole", () =>
        careers.createCareerRole({ ...content, code: "data" }));
      await expectOk("updateCareerRole", () =>
        careers.updateCareerRole("frontend", { ...content, version: 3, status: "published", acceptingApplications: true }));
      await expectOk("archiveCareerRole", () => careers.archiveCareerRole("qa", 1));
      await expectOk("listCareerRoleRevisions", () => careers.listCareerRoleRevisions("frontend"));
      const recruiting = await careers.listRecruitingCareers();
      expect(recruiting.length).toBeGreaterThan(0);
      expect(recruiting.every((r) => typeof r.label === "string")).toBe(true);
      const references = await careers.listCareerReferences();
      expect(references.length).toBeGreaterThan(0);
      const all = await careers.allCareerRoles();
      expect(all.length).toBeGreaterThanOrEqual(5);
    });
  });

  it("H+K+P) certificates, KPI periods/results, lương ảo (admin)", async () => {
    await withPreview(async () => {
      const finance = await import("@/lib/api/finance");
      const certs = await finance.listCertificates({ page: 1 });
      expect(certs.items.length).toBeGreaterThanOrEqual(5);
      expect(certs.items.some((c) => c.id === "cert-01")).toBe(true);
      expect(certs.items.some((c) => c.id === "cert-02")).toBe(true);
      await expectOk("issueCertificate", () => finance.issueCertificate("u-intern-5"));
      const revoked = await finance.revokeCertificate("cert-06", "Sao chép bài nộp");
      expect(revoked.status).toBe("revoked");
      const pdf = await finance.downloadCertificatePdf("cert-01");
      expect(pdf).toBeInstanceOf(Blob);
      const periods = await finance.listKpiPeriods("", 1);
      expect(periods.items.some((p) => p.id === "kpi-2026-10" && p.status === "open")).toBe(true);
      expect(periods.items.some((p) => p.id === "kpi-2026-09" && p.status === "finalized")).toBe(true);
      await expectOk("createKpiPeriod", () =>
        finance.createKpiPeriod({ code: "KPI-2026-12", name: "Kỳ 12/2026", startDate: "2026-12-01", endDate: "2026-12-31" }));
      await expectOk("updateKpiPeriod", () =>
        finance.updateKpiPeriod("kpi-2026-10", { name: "KPI tháng 10/2026 (sửa)" }));
      await expectOk("transitionKpiPeriod", () => finance.transitionKpiPeriod("kpi-2026-10", "calculating"));
      const calculated = await finance.calculateKpiPeriod("kpi-2026-10");
      expect(calculated.calculated).toBeGreaterThan(0);
      await expectOk("finalizeKpiPeriod", () => finance.finalizeKpiPeriod("kpi-2026-10"));
      const results = await finance.listKpiResults("kpi-2026-10", 1);
      expect(results.items.some((r) => r.userId === "pv-intern-1")).toBe(true);
      const detail = await finance.getKpiResult("kpi-res-101");
      expect(detail.metrics.length).toBeGreaterThan(0);
      await expectOk("listSalaryLedger", () => finance.listSalaryLedger({ page: 1 }));
      const generated = await finance.generateSalaryForPeriod("kpi-2026-10");
      expect(generated).toMatchObject({ kpiPeriodId: "kpi-2026-10", unit: "VND" });
      await expectOk("createSalaryAdjustment", () =>
        finance.createSalaryAdjustment({
          userId: "pv-intern-1", type: "bonus", amount: 80000,
          reason: "Thưởng demo", requestId: "req-adjust-1",
        }));
      const balance = await finance.getUserSalaryBalance("pv-intern-1");
      expect(balance.virtual).toBe(true);
      expect(balance.balance).toBeGreaterThan(0);
    });
  });

  it("J) kho tri thức — quyền admin + CRUD + import dry-run", async () => {
    await withPreview(async () => {
      const { PREVIEW_ACCOUNTS_BY_ID } = await import("../accounts");
      const permissions = PREVIEW_ACCOUNTS_BY_ID["pv-admin-1"].user.permissions;
      for (const code of ["knowledge.read", "knowledge.manage", "knowledge.publish"]) {
        expect(permissions, `adminPermissions phải chứa ${code}`).toContain(code);
      }
      const knowledge = await import("@/lib/api/knowledge");
      const list = await knowledge.listKnowledge(new URLSearchParams("page=1&pageSize=20"));
      expect(list.items.length).toBeGreaterThanOrEqual(6);
      expect(new Set(list.items.map((d) => d.status))).toEqual(new Set(["draft", "published", "archived"]));
      const kinds = new Set(list.items.map((d) => d.kind));
      for (const kind of ["qa", "guide", "exercise", "solution", "rubric", "plan_template", "communication"]) {
        expect(kinds, `thiếu loại ${kind}`).toContain(kind);
      }
      const doc = await knowledge.getKnowledge("KL-GUIDE-02");
      expect(doc.snapshot.code).toBe("KL-GUIDE-02");
      await expectOk("checkKnowledgePublication", () => knowledge.checkKnowledgePublication("KL-EX-03"));
      const draft = {
        kind: "qa" as const, title: "Q&A test", summary: "Tóm tắt", language: "vi" as const,
        difficulty: "easy" as const, audience: "student_safe" as const,
        purposes: ["interview" as const], roleCodes: ["intern"], tags: ["test"],
        sources: [{ title: "Wiki", url: "https://wiki.vintern.example/kl", reference: "KL/TEST" }],
        body: { questions: [{ q: "Hi?", a: "Ok" }] },
      };
      await expectOk("createKnowledge", () => knowledge.createKnowledge("KL-TEST-99", draft));
      await expectOk("updateKnowledge", () => knowledge.updateKnowledge("KL-QA-01", 2, draft));
      const published = await knowledge.publishKnowledge("KL-EX-03", 1);
      expect(published.status).toBe("published");
      const archived = await knowledge.archiveKnowledge("KL-PLAN-06", 1);
      expect(archived.status).toBe("archived");
      await expectOk("restoreKnowledge", () => knowledge.restoreKnowledge("KL-QA-08", 1, 1));
      const revisions = await knowledge.listKnowledgeHistory("KL-GUIDE-02", 1);
      expect(revisions.items.length).toBeGreaterThan(0);
      const dryRun = await knowledge.knowledgeDryRun([
        { code: "KL-QA-01", draft },
        { code: "KL-BRAND-NEW", draft },
      ]);
      expect(dryRun.mutationsPerformed).toBe(0);
      expect(dryRun.items.some((i) => i.exists)).toBe(true);
    });
  });

  it("L+M) hiệu suất + ngân hàng câu hỏi", async () => {
    await withPreview(async () => {
      const management = await import("@/lib/api/management");
      const studentDetail = await import("@/lib/api/student-detail");
      const questionBank = await import("@/lib/api/question-bank");
      const members = await management.listPerformance(new URLSearchParams("page=1&pageSize=10"));
      expect(members.items.some((m) => m.userId === "pv-intern-1")).toBe(true);
      await expectOk("getMemberPerformance", () => management.getMemberPerformance("pv-intern-1"));
      await expectOk("getMemberRecommendations", () => management.getMemberRecommendations("pv-intern-1"));
      await expectOk("getStudentDetail", () =>
        studentDetail.getStudentDetail("pv-intern-1", 1, ""));
      const questions = await questionBank.listQuestionBank(
        new URLSearchParams("page=1&pageSize=10&search=useMemo"),
      );
      expect(questions.items.length).toBeGreaterThan(0);
      expect(questions.coverage.length).toBeGreaterThan(0);
      const content = {
        roleCode: "frontend", phase: "technical" as const, difficulty: "medium" as const,
        language: "vi" as const, prompt: " SSR vs CSR?",
        expectedConcepts: ["render"], exampleAnswer: "SSR server, CSR client.",
        scoringRubric: "Đúng khái niệm 100.", followUpHints: [], tags: ["next"],
        isActive: true,
      };
      const created = await questionBank.saveQuestion(content);
      expect(created.isActive).toBe(true);
      const updated = await questionBank.saveQuestion(content, { id: "qb-1", version: 3 });
      expect(updated.version).toBeGreaterThan(3);
      const retired = await questionBank.retireQuestion({ id: "qb-2", version: 1 });
      expect(retired.isActive).toBe(false);
    });
  });

  it("N+O) đợt tuyển, hồ sơ ứng viên, báo cáo", async () => {
    await withPreview(async () => {
      const applications = await import("@/lib/api/applications");
      const recovery = await import("@/lib/api/credential-recovery");
      const reports = await import("@/lib/api/reports");
      const rounds = await applications.listRecruitmentRounds();
      expect(rounds.some((r) => r.status === "open")).toBe(true);
      const detail = await applications.roundDetail(rounds[0].id);
      expect(detail.slots.length).toBeGreaterThan(0);
      expect(detail.slots.some((s) => s.capacity > s.booked)).toBe(true);
      await expectOk("createRound", () =>
        applications.createRound({ name: "Đợt 01/2027", opensAt: "2027-01-02", closesAt: "2027-01-20" }));
      await expectOk("roundStatus", () => applications.roundStatus(rounds[0].id, "closed"));
      await expectOk("createInterviewSlot", () =>
        applications.createInterviewSlot(rounds[0].id, {
          roleCode: "backend", startsAt: "2026-12-02T09:00:00Z", endsAt: "2026-12-02T11:00:00Z",
          timezone: "Asia/Ho_Chi_Minh", capacity: 3, minimumPreparationMinutes: 30, credentialsLeadMinutes: 60,
        }));
      const closed = await applications.closeInterviewSlot(rounds[0].id, "slot-13");
      expect(closed).toBe(true);
      const applicationsPage = await applications.roundApplications(rounds[0].id, 1);
      expect(applicationsPage.total).toBeGreaterThanOrEqual(6);
      const statuses = new Set(applicationsPage.items.map((a) => a.status));
      expect(statuses).toContain("new");
      expect(statuses).toContain("passed");
      expect(statuses).toContain("failed");
      await expectOk("staffApplication", () =>
        applications.staffApplication(rounds[0].id, "app-2026-331"));
      const rebooked = await applications.rebookApplication(rounds[0].id, "app-2026-336", "slot-11", "retake");
      expect(rebooked).toBe(true);
      await expectOk("applicationAction", () =>
        applications.applicationAction(rounds[0].id, "app-2026-338", "cancel"));
      const cv = await applications.downloadStaffCv(rounds[0].id, "app-2026-331");
      expect(cv).toBeInstanceOf(Blob);
      const resent = await applications.resendApplicationCredentials(rounds[0].id, "app-2026-334", false);
      expect(resent).toBe(true);
      await expectOk("previewCredentialRecovery", () =>
        recovery.previewCredentialRecovery(rounds[0].id, "app-2026-337", "slot-11"));
      const recovered = await recovery.recoverApplicationCredentials(rounds[0].id, "app-2026-337", {
        slotId: "slot-11", expectedRevision: "rev-1", reason: "mất email",
      });
      expect(recovered.recovered).toBe(true);
      const list = await reports.listReports(1, "");
      expect(list.items.length).toBeGreaterThanOrEqual(5);
      expect(list.counts.length).toBe(5);
      const saved = await reports.getSavedReport("rp-1");
      expect(saved.snapshot.members.length).toBeGreaterThan(0);
      await expectOk("createReport", () =>
        reports.createReport({
          projectId: "prj-lib", title: "Báo cáo test", kind: "review", requestId: "req-report-1",
        }));
      const pdf = await reports.getReportPdf("rp-1");
      expect(pdf).toBeInstanceOf(Blob);
      const xlsx = await reports.getReportExcel("rp-1");
      expect(xlsx).toBeInstanceOf(Blob);
    });
  });

  it("Q+R+S+T) phiên, dự án, burndown, sprint", async () => {
    await withPreview(async () => {
      const academic = await import("@/lib/api/academic");
      const sessionsApi = await import("@/lib/api/sessions");
      const projectSessions = await import("@/lib/api/project-sessions");
      const delivery = await import("@/lib/api/delivery");
      const sessionWork = await import("@/lib/api/session-work");
      const sessionRows = await academic.listAcademic("sessions", 1);
      expect(sessionRows.items.map((s) => s.id)).toEqual(
        expect.arrayContaining(["ss-f26", "ss-s26", "ss-w27"]),
      );
      const projectRows = await academic.listAcademic("projects", 1);
      expect(projectRows.items.map((p) => p.id)).toContain("prj-lib");
      await expectOk("getAcademic session", () => academic.getAcademic("sessions", "ss-f26"));
      await expectOk("getAcademic project", () => academic.getAcademic("projects", "prj-lib"));
      await expectOk("saveAcademic session (create)", () =>
        academic.saveAcademic("sessions", undefined, {
          code: "SS-T27", name: "Kỳ test", description: "Mô tả", startDate: "2027-02-01", endDate: "2027-05-01",
        }));
      await expectOk("saveAcademic project (update)", () =>
        academic.saveAcademic("projects", "prj-edu", { name: "App học tiếng Việt", description: "Sửa mô tả" }));
      await expectOk("transitionSession", () => academic.transitionSession("ss-f26", "ending"));
      await expectOk("getMembers (sessions)", () => academic.getMembers("sessions", "ss-f26"));
      await expectOk("getMembers (projects)", () => academic.getMembers("projects", "prj-lib"));
      await expectOk("getInstructors", () => academic.getInstructors("ss-f26"));
      await expectOk("instructorOptions", () => academic.instructorOptions(1, ""));
      await expectOk("getMilestones", () => academic.getMilestones("ss-f26"));
      await expectOk("saveMilestone (create)", () =>
        academic.saveMilestone("ss-f26", undefined, { title: "Cột mốc mới", dueDate: "2026-12-20" }));
      await expectOk("saveMilestone (update)", () =>
        academic.saveMilestone("ss-f26", "ms-1", { status: "completed" }));
      await expectOk("deleteMilestone", () => academic.deleteMilestone("ss-f26", "ms-4"));
      await expectOk("getProjectSlots", () => academic.getProjectSlots("prj-lib"));
      await expectOk("getProjectFilterOptions", () => academic.getProjectFilterOptions());
      const projectSessionList = await projectSessions.getProjectSessions("prj-lib");
      expect(projectSessionList.some((s) => s.id === "ss-f26")).toBe(true);
      const claimed = await projectSessions.claimProject("prj-blog");
      expect(claimed).toBe("prj-blog");
      const detail = await sessionsApi.getSessionDetail("ss-f26");
      expect(detail.overview.id).toBe("ss-f26");
      expect(detail.members.length).toBeGreaterThan(0);
      expect(detail.milestones.length).toBeGreaterThan(0);
      const burndown = await delivery.fetchSprintBurndown("sp-03");
      expect(burndown.length).toBeGreaterThan(10);
      expect(burndown[0].ideal).toBeGreaterThan(0);
      const sprints = await delivery.listSprints({ page: 1, pageSize: 10 });
      const statuses = sprints.items.map((s) => s.status);
      expect(statuses).toEqual(expect.arrayContaining(["active", "completed", "planned"]));
      await expectOk("getSprint", () => delivery.getSprint("sp-03"));
      await expectOk("listSessionWork", () =>
        sessionWork.listSessionWork({ sessionId: "ss-f26", page: 1, pageSize: 20 }));
      await expectOk("listSessionTimeline", () => sessionWork.listSessionTimeline("ss-f26", 1));
    });
  });

  it("U) mutation nhiệm vụ + bài nộp", async () => {
    await withPreview(async () => {
      const management = await import("@/lib/api/management");
      const work = await import("@/lib/api/work");
      const submissions = await import("@/lib/api/submissions");
      const created = await management.saveManagedTask(undefined, {
        title: "Task test preview", priority: "high", storyPoints: 3,
      });
      expect(created.status).toBe("todo");
      const patched = await management.saveManagedTask("ts-20", { status: "review" });
      expect(patched.version).toBeGreaterThan(2);
      await expectOk("deleteTask", () => management.deleteTask("ts-24"));
      const mine = await work.updateOwnTask("ts-21", { status: "review", progress: 60, expectedVersion: 1 });
      expect(mine.status).toBe("review");
      await expectOk("getBoard", () => work.getBoard("sp-03"));
      const submitted = await submissions.submitCode("ts-20", {
        prUrl: "https://github.com/vintern-2026/library-system/pull/49",
        summary: "Preview submit", version: 2,
      });
      expect(submitted.status).toBe("submitted");
      const withdrawn = await submissions.withdrawCode(submitted.id);
      expect(withdrawn.status).toBe("withdrawn");
      const reviewed = await submissions.confirmCodeReview("sub-1", {
        rubric: { functional: 85, quality: 80, testing: 78, errors: 82, security: 84, dod: 80 },
        feedback: "Đạt", taskVersion: 2,
      });
      expect(reviewed.status).toBe("approved");
      const reviews = await submissions.runCodeReview("sub-1");
      expect(reviews.length).toBeGreaterThan(0);
    });
  });

  it("V+W) kế hoạch AI + bản dựng dự án", async () => {
    await withPreview(async () => {
      const planning = await import("@/lib/api/planning");
      const templates = await import("@/lib/api/templates");
      const materials = await import("@/lib/api/template-materials");
      const plans = await planning.listPlans("ss-f26");
      expect(plans.length).toBeGreaterThan(0);
      expect(plans.some((p) => p.projectId === "prj-lib")).toBe(true);
      const plan = await planning.getPlan("plan-772");
      expect(plan.draft?.sprints.length).toBeGreaterThan(0);
      const generated = await planning.generatePlan({ projectId: "prj-lib", sessionId: "ss-f26" });
      expect(generated.planId).toBeTruthy();
      const confirmed = await planning.confirmPlan({
        projectId: "prj-lib", sessionId: "ss-f26", draft: {}, requestId: "req-plan-1",
      });
      expect(confirmed.taskIds.length).toBeGreaterThan(0);
      const draft = await planning.draftSprintPlan({ projectId: "prj-lib", sessionId: "ss-f26" });
      expect(draft.draft.sprints.length).toBeGreaterThan(0);
      const list = await templates.listTemplates({ page: 1, pageSize: 10 });
      expect(list.items.length).toBeGreaterThanOrEqual(4);
      const detail = await templates.getTemplate("tpl-lib");
      expect(detail.runs.some((r) => r.sessionId === "ss-f26")).toBe(true);
      const activated = await templates.setTemplateStatus({ id: "tpl-edu", version: 1 }, "active");
      expect(activated.status).toBe("active");
      const started = await templates.startTemplateSession("tpl-lib", {
        name: "Kỳ từ bản dựng", startDate: "2027-01-04", endDate: "2027-04-04",
      });
      expect(started.sessionId).toBeTruthy();
      const revisions = await materials.listTemplateRevisions("tpl-lib");
      expect(revisions.items.length).toBeGreaterThan(0);
      await expectOk("getTemplateRevision", () => materials.getTemplateRevision("tpl-lib", 2));
      await expectOk("getTemplateContext", () => templates.getTemplateContext("prj-lib"));
      const assessment = await materials.getPinnedProjectAssessment("prj-lib");
      expect(assessment.assessment?.rubric.length).toBeGreaterThan(0);
      const packagePayload = await materials.getOwnProjectPackage("prj-lib");
      expect(packagePayload.learningPackage?.starterFiles.length).toBeGreaterThan(0);
    });
  });

  it("X+Y) kỳ đánh giá + phiếu đánh giá + review nhập", async () => {
    await withPreview(async () => {
      const management = await import("@/lib/api/management");
      const imported = await import("@/lib/api/imported-reviews");
      const cycles = await management.listCycles(1);
      expect(cycles.items.some((c) => c.status === "open")).toBe(true);
      await expectOk("createCycle", () =>
        management.createCycle({
          code: "EV-2027-MID", name: "Giữa kỳ 2027", type: "midterm",
          projectId: "prj-edu", sessionId: "ss-w27", startDate: "2027-03-01", endDate: "2027-03-15",
        }));
      await expectOk("updateCycle", () =>
        management.updateCycle("cycle-2026-final", { name: "Cuối kỳ Thu 2026", startDate: "2026-11-20", endDate: "2026-12-05" }));
      await expectOk("transitionCycle", () => management.transitionCycle("cycle-2026-final", "closed"));
      const criteria = await management.getCriteria("cycle-2026-final");
      expect(criteria.length).toBeGreaterThan(0);
      await expectOk("createCriterion", () =>
        management.createCriterion("cycle-2026-final", { code: "CR-TEST", name: "Kiểm thử", weight: 20, maxScore: 100 }));
      await expectOk("updateCriterion", () =>
        management.updateCriterion("cycle-2026-final", "cr-quality", { name: "Chất lượng mã nguồn", weight: 40, maxScore: 100 }));
      await expectOk("deleteCriterion", () => management.deleteCriterion("cycle-2026-final", "cr-collab"));
      const evaluations = await management.listManagedEvaluations(1, "", "");
      const statuses = [...new Set(evaluations.items.map((e) => e.status))];
      expect(statuses).toEqual(expect.arrayContaining(["draft", "submitted", "finalized"]));
      expect(evaluations.items.some((e) => e.internId === "pv-intern-1")).toBe(true);
      await expectOk("createEvaluation", () => management.createEvaluation("cycle-2026-final", "pv-intern-4"));
      const detail = await management.getManagedEvaluation("ev-2026-mid");
      expect(detail.scores.length).toBeGreaterThan(0);
      await expectOk("saveEvaluation", () =>
        management.saveEvaluation("ev-2026-final-draft", {
          scores: [{ criterionId: "cr-quality", score: 87, comment: "Ổn" }],
          summary: "Tiến bộ rõ rệt.",
        }));
      const submittedEval = await management.advanceEvaluation("ev-2026-final-draft", "submit");
      expect(submittedEval.status).toBe("submitted");
      const finalizedEval = await management.advanceEvaluation("ev-2026-final-draft", "finalize");
      expect(finalizedEval.status).toBe("finalized");
      const suggestion = await management.suggestEvaluation("ev-2026-final-draft");
      expect(suggestion.criteria.length).toBeGreaterThan(0);
      const suggestions = await management.listEvaluationSuggestions("ev-2026-mid");
      expect(suggestions.length).toBeGreaterThan(0);
      const one = await management.getEvaluationSuggestion("ev-2026-mid", "ais-1");
      expect(one.suggestion).toBeTruthy();
      const reviews = await imported.listImportedReviews();
      expect(reviews.length).toBeGreaterThanOrEqual(5);
      const updated = await imported.updateImportedReview(reviews[0], {
        score: 90, status: "passed", feedback: "Đã soát lại",
      });
      expect(updated).toBeGreaterThan(reviews[0].version);
    });
  });

  it("Z) participation ops + thay người + repo access jobs", async () => {
    await withPreview(async () => {
      const participation = await import("@/lib/api/participation");
      const replacements = await import("@/lib/api/replacements");
      const repositoryAccess = await import("@/lib/api/repository-access");
      const refreshed = await participation.refreshParticipation("ss-f26");
      expect(refreshed).toBeTruthy();
      const policy = await participation.saveParticipationPolicy("ss-f26", {
        warningFrom: 2, penaltyFrom: 4, replacementFrom: 6,
        penaltyPoints: -2, penaltyCap: -10, expectedVersion: 3, reason: "Siết chính sách",
      });
      expect(policy.version).toBeGreaterThan(3);
      await expectOk("resolveParticipation", () =>
        participation.resolveParticipation("ss-f26", "inc-1", {
          action: "excused", expectedDeadlineVersion: 2, reason: "Nghỉ ốm",
        }));
      await expectOk("extendParticipationDeadline", () =>
        participation.extendParticipationDeadline("ss-f26", "ts-21", {
          expectedVersion: 1, until: "2026-11-30T17:00:00Z", reason: "Động lực chính đáng",
        }));
      const advice = await replacements.replacementAdvice("ss-f26", "inc-1");
      expect(advice.candidates.length).toBeGreaterThan(0);
      const preview = await replacements.prepareReplacement("ss-f26", "inc-1", {
        adviceId: advice.id, candidateId: advice.candidates[0].userId, handoverHours: 4,
      });
      expect(preview.document.taskPlan.transfers.length).toBeGreaterThan(0);
      const approved = await replacements.approveReplacement("ss-f26", "cmd-991", {
        expectedPreviewHash: preview.previewHash, reason: "Duyệt thay người",
      });
      expect(approved.transferredTaskIds.length).toBeGreaterThan(0);
      const command = await replacements.getReplacementCommand("ss-f26", "cmd-991");
      expect(command.result?.commandId).toBe("cmd-991");
      const jobs = await repositoryAccess.sessionRepositoryAccess("ss-f26");
      expect(jobs.items.length).toBeGreaterThan(0);
      await expectOk("retryRepositoryAccess", () =>
        repositoryAccess.retryRepositoryAccess("ss-f26", "raj-2", {
          expectedRevision: "ra-rev-2", reason: "Thử lại sau lỗi GitHub",
        }));
    });
  });

  it("AA) recruitment me — pv-intern-3 đứng ở bước welcome", async () => {
    await withPreview(async () => {
      const { setPreviewAccount } = await import("../store");
      setPreviewAccount("pv-intern-3");
      const careers = await import("@/lib/api/career-roles");
      const recruiting = await careers.listRecruitingCareers();
      expect(recruiting.length).toBeGreaterThan(0);
      const recruitment = await import("@/lib/api/recruitment").then((m) => m.recruitmentApi);
      const profile = await recruitment.me();
      expect(profile.status).toBe("not_started");
      expect(profile.selectedRole).toBeNull();
      expect(profile.attemptNumber).toBe(0);
      const selected = await recruitment.selectRole("frontend");
      expect(selected.status).toBe("role_selected");
      expect(selected.selectedRole).toBe("frontend");
      const history = await recruitment.history(1);
      expect(history.total).toBeGreaterThan(0);
      const interview = await recruitment.start();
      expect(interview.session.status).toBe("in_progress");
      expect(interview.questions.length).toBeGreaterThan(0);
      await expectOk("sessionStatus", () => recruitment.sessionStatus(interview.session.id));
      const questions = await recruitment.questions(interview.session.id);
      expect(questions.questions[0].answered).toBe(false);
      const saved = await recruitment.saveAnswer(interview.session.id, questions.questions[0].id, "Trả lời mẫu");
      expect(saved.answeredAt).toBeTruthy();
      const followUp = await recruitment.saveFollowUp(interview.session.id, questions.questions[0].id, "Làm rõ thêm");
      expect(followUp.saved).toBe(true);
      const conversation = await import("@/lib/api/recruitment").then((m) => m.conversationView(interview.session.id));
      expect(conversation.messages.length).toBeGreaterThan(0);
      const next = await import("@/lib/api/recruitment").then((m) => m.conversationNext(interview.session.id));
      expect(next.currentQuestion).toBeTruthy();
      const clarify = await import("@/lib/api/recruitment").then((m) => m.conversationClarify(interview.session.id));
      expect(clarify.currentQuestion?.kind).toBe("main");
      const evaluation = await recruitment.submit(interview.session.id);
      expect(evaluation.result?.decision).toBe("passed");
      const retried = await recruitment.retryEvaluation(interview.session.id);
      expect(retried.result).toBeTruthy();
      const result = await recruitment.result();
      expect(result.overallScore).toBeGreaterThan(0);
    });
  });

  it("AB+AC+AD) ứng viên, phân công, tiện ích intern", async () => {
    await withPreview(async () => {
      const academic = await import("@/lib/api/academic");
      const candidates = await academic.searchCandidates({ page: 1, pageSize: 20 });
      expect(candidates.items.length).toBeGreaterThanOrEqual(5);
      expect(candidates.items.some((c) => c.userId === "pv-intern-1")).toBe(true);
      await expectOk("listCandidates", () => academic.listCandidates(1));
      await expectOk("getCandidateDetail", () => academic.getCandidateDetail("pv-intern-1"));
      const assignments = await academic.listSessionAssignments("ss-f26");
      expect(assignments.some((a) => a.internId === "pv-intern-1" && a.status === "active")).toBe(true);
      const created = await academic.assignIntern({
        internId: "pv-intern-3", projectId: "prj-lib", sessionId: "ss-f26", role: "frontend",
      });
      expect(created).toBeTruthy();
      const cancelled = await academic.cancelAssignment("asg-5");
      expect(cancelled).toBe("asg-5");
      const completed = await academic.completeAssignment("asg-5");
      expect(completed).toBe("asg-5");
      const outcomes = await import("@/lib/api/outcomes");
      const pdf = await outcomes.getCertificatePdf("cert-01");
      expect(pdf).toBeInstanceOf(Blob);
    });
  });

  it("AE) auth phụ + CV ứng viên + member-options + member/instructor mutations", async () => {
    await withPreview(async () => {
      const { previewFetch } = await import("../transport");
      const forgot = (await previewFetch("/auth/forgot-password", {
        method: "POST",
        body: { email: "sinhvien_tan@vintern.preview" },
      })) as { queued: boolean };
      expect(forgot.queued).toBe(true);
      const changed = (await previewFetch("/auth/change-password", {
        method: "POST",
        body: { currentPassword: "Preview@12345", newPassword: "Preview@54321" },
      })) as { changed: boolean };
      expect(changed.changed).toBe(true);
      const applications = await import("@/lib/api/applications");
      const submitted = await applications.submitApplication(new FormData());
      expect(submitted).toMatchObject({ received: true });
      const myCv = await applications.downloadMyCv();
      expect(myCv).toBeInstanceOf(Blob);
      const delivery = await import("@/lib/api/delivery");
      const memberOptions = await delivery.listMemberOptions({ page: 1 });
      expect(memberOptions.items.length).toBeGreaterThan(0);
      expect(memberOptions.items.every((m) => typeof m.email === "string")).toBe(true);
      const academic = await import("@/lib/api/academic");
      await expectOk("addMember", () => academic.addMember("sessions", "ss-f26", "pv-intern-3"));
      await expectOk("removeMember", () => academic.removeMember("sessions", "ss-f26", "pv-intern-3"));
      await expectOk("addInstructor", () => academic.addInstructor("ss-f26", "pv-inst-2"));
      await expectOk("removeInstructor", () => academic.removeInstructor("ss-f26", "pv-inst-2"));
      const admin = await import("@/lib/api/admin");
      const user = await admin.getUser("pv-intern-1");
      expect(user.id).toBe("pv-intern-1");
      expect(user.status).toBe("active");
      await expectOk("getUser (unknown id fallback)", () => admin.getUser("id-khong-ton-tai"));
    });
  });

  it("endpoint vẫn chưa mock → 501 trung thực (cơ chế giữ nguyên)", async () => {
    await withPreview(async () => {
      const { previewFetch } = await import("../transport");
      await expect(
        previewFetch("/admin/unknown-endpoint-gap2", { token: null }),
      ).rejects.toMatchObject({ code: "PREVIEW_ENDPOINT_NOT_MOCKED" });
    });
  });
});
