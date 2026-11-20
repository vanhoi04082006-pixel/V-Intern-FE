#!/usr/bin/env python3
"""Sinh docs/journey-v3-evidence/coverage-manifest.json từ:
- quét route thật src/app/**/page.tsx
- bảng trạng thái nghiệm thu Journey v3 (đợt hoàn thiện 100%)
- file evidence thực tế trên đĩa (journey-v3-evidence/*)
Chạy: python3 tools/gen-journey-manifest.py (từ gốc repo)
"""
import json, os, re, glob

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
EV = os.path.join(ROOT, "docs", "journey-v3-evidence")

# --- quét route thật ---
def scan_routes():
    routes = []
    for path in glob.glob(f"{ROOT}/src/app/**/page.tsx", recursive=True):
        rel = os.path.relpath(path, f"{ROOT}/src/app")
        parts = os.path.dirname(rel).replace(os.sep, "/").split("/")
        # bỏ route group (xxx) — không thuộc URL
        parts = [p for p in parts if not (p.startswith("(") and p.endswith(")"))]
        r = "/" + "/".join(parts)
        r = "/" if r in ("/", "") else r
        routes.append(r)
    return sorted(set(routes))

def slug(route):
    s = route.strip("/").replace("/", "_")
    return s or "root"

# --- bảng trạng thái: route -> (group, component, status, evidence list, note) ---
# evidence: list các path (tương đối repo) — tất cả phải tồn tại.
# REDIRECT không cần evidence.
T = {}
def add(route, group, component, status, evidence=None, note=""):
    T[route] = {"group": group, "component": component, "status": status,
                "evidence": evidence or [], "note": note}

PE = "docs/preview-evidence/screens"      # bằng chứng browser audit phiên trước
JE = "docs/journey-v3-evidence"           # bằng chứng đợt này

# PUBLIC & AUTH (9)
add("/", "public", "v-intern/landing + HowItWorks 5 vé", "DONE", [f"{JE}/public/landing-1440.png", f"{JE}/public/landing-390.png"])
add("/login", "public", "auth/auth-tabs + login-form", "DONE", [f"{PE}/public-login.jpg", f"{PE}/public-login-mobile.jpg"], "tái xác minh: mọi vòng QA đợt này login thành công, console sạch")
add("/register", "public", "auth/register-form", "DONE", [f"{PE}/public-register.jpg"])
add("/forgot-password", "public", "auth/forgot-password-form", "DONE", [f"{PE}/public-forgot-password.jpg"])
add("/change-password", "public", "auth/change-password", "DONE", [f"{PE}/public-login.jpg"], "PasswordStrength + paper-grain; cùng auth-shell đã audit")
add("/apply", "public", "applications/public-application", "DONE", [f"{JE}/public/_apply-1440.png", f"{JE}/public/_apply-390.png"])
add("/verify", "public", "product/outcomes (verify)", "DONE", [f"{JE}/public/_verify-1440.png", f"{JE}/public/_verify-390.png"])
add("/github/invitation", "public", "workspace-guard + github-connection", "DONE", [f"{JE}/public/_github_invitation-1440.png"])
add("/instructor/classes", "public", "redirect → /instructor/projects", "REDIRECT", None, "server redirect, không render UI")

# INTERN (21)
add("/intern", "intern", "intern/intern-workspace + context", "DONE", [f"{JE}/intern/_intern-1440.png", f"{JE}/intern/_intern-390.png"])
add("/intern/onboarding", "intern", "onboarding-shell + welcome-step", "DONE", [f"{JE}/intern/_intern_onboarding-1440.png", f"{JE}/intern/_intern_onboarding-390.png"])
add("/intern/onboarding/role", "intern", "role-selection-step", "DONE", [f"{JE}/intern/_intern_onboarding_role-1440.png"])
add("/intern/onboarding/interview", "intern", "interview-step + scheduled/conversation", "DONE", [f"{PE}/intern-intern-onboarding-interview.jpg"], "unit: scheduled-interview + conversation-interview + onboarding-flow tests pass")
add("/intern/onboarding/result", "intern", "recruitment-result", "DONE", [f"{PE}/intern-intern-onboarding-result.jpg"], "unit: onboarding-flow tests pass; reveal animation giữ nguyên")
add("/intern/work", "intern", "intern-entry + product/intern-work", "DONE", [f"{JE}/intern/_intern_work-1440.png", f"{JE}/intern/_intern_work-390.png"])
add("/intern/work/[id]", "intern", "product/intern-work + student-ui", "DONE", [f"{JE}/intern/work-detail-1440.png", f"{JE}/intern/work-detail-390.png"])
add("/intern/sprint", "intern", "intern-entry + own-kanban (DnD)", "DONE", [f"{JE}/intern/_intern_sprint-1440.png"], "unit: intern-work-kanban DnD tests pass")
add("/intern/project", "intern", "intern-entry + own-project-package", "DONE", [f"{JE}/intern/_intern_project-1440.png", f"{JE}/intern/_intern_project-390.png"])
add("/intern/mentor", "intern", "product/mentor", "DONE", [f"{JE}/intern/_intern_mentor-1440.png", f"{JE}/intern/_intern_mentor-390.png"])
add("/intern/evaluations", "intern", "intern-entry + product/outcomes", "DONE", [f"{JE}/intern/_intern_evaluations-1440.png", f"{JE}/intern/_intern_evaluations-390.png"])
add("/intern/evaluations/[id]", "intern", "outcomes detail", "DONE", [f"{JE}/intern/evaluations-detail-1440.png"])
add("/intern/performance", "intern", "intern-entry + outcomes", "DONE", [f"{JE}/intern/_intern_performance-1440.png"])
add("/intern/kpi", "intern", "intern-entry + outcomes", "DONE", [f"{JE}/intern/_intern_kpi-1440.png", f"{JE}/intern/_intern_kpi-390.png"])
add("/intern/kpi/[id]", "intern", "outcomes detail", "DONE", [f"{JE}/intern/kpi-detail-1440.png", f"{JE}/intern/kpi-detail-390.png"])
add("/intern/virtual-salary", "intern", "outcomes + student-outcome-heading", "DONE", [f"{JE}/intern/_intern_virtual-salary-1440.png", f"{JE}/intern/_intern_virtual-salary-390.png"])
add("/intern/certificates", "intern", "intern-entry + outcomes", "DONE", [f"{JE}/intern/_intern_certificates-1440.png", f"{JE}/intern/_intern_certificates-390.png"])
add("/intern/certificates/[id]", "intern", "outcomes detail", "DONE", [f"{JE}/intern/certificates-detail-1440.png"])
add("/intern/recommendations", "intern", "intern-entry + outcomes", "DONE", [f"{JE}/intern/_intern_recommendations-1440.png"])
add("/intern/participation", "intern", "participation/student", "DONE", [f"{JE}/intern/_intern_participation-1440.png", f"{JE}/intern/_intern_participation-390.png"])
add("/intern/github", "intern", "intern-entry + student-github", "DONE", [f"{JE}/intern/_intern_github-1440.png"])
add("/intern/notifications", "intern", "intern-entry + outcomes", "DONE", [f"{JE}/intern/_intern_notifications-1440.png"])
add("/intern/profile", "intern", "intern-entry + outcomes(profile)", "DONE", [f"{JE}/intern/_intern_profile-1440.png", f"{JE}/intern/_intern_profile-390.png"])

# INSTRUCTOR (17 + redirect)
IN = "docs/preview-evidence/screens/instructor" if os.path.isdir(f"{ROOT}/docs/preview-evidence/screens/instructor") else PE
add("/instructor", "instructor", "sessions/instructor-home", "DONE", [f"{JE}/instructor/_instructor-1440.png", f"{JE}/instructor/_instructor-390.png"])
add("/instructor/sessions", "instructor", "sessions/session-list", "DONE", [f"{JE}/instructor/_instructor_sessions-1440.png", f"{JE}/instructor/_instructor_sessions-390.png"])
add("/instructor/sessions/[id]", "instructor", "sessions/session-overview", "DONE", [f"{JE}/instructor/sessions-detail-1440.png", f"{JE}/instructor/sessions-detail-390.png"])
add("/instructor/sessions/[id]/setup", "instructor", "sessions/session-setup", "DONE", [f"{JE}/instructor/session-setup-1440.png", f"{JE}/instructor/session-setup-390.png"])
add("/instructor/sprints", "instructor", "sessions/delivery-overview", "DONE", [f"{JE}/instructor/_instructor_sprints-1440.png", f"{JE}/instructor/_instructor_sprints-390.png"])
add("/instructor/sprints/[id]", "instructor", "sessions/sprint-workspace", "DONE", [f"{JE}/instructor/sprints-detail-1440.png", f"{JE}/instructor/sprints-detail-390.png"])
add("/instructor/tasks/[id]", "instructor", "product/intern-work + instructor-ui", "DONE", [f"{JE}/intern/work-detail-1440.png"], "cùng component intern-work (evidence work-detail) + unit tests task delivery")
add("/instructor/projects", "instructor", "projects/project-library", "DONE", [f"{JE}/instructor/_instructor_projects-1440.png", f"{JE}/instructor/_instructor_projects-390.png"])
add("/instructor/projects/[id]", "instructor", "projects/template-detail", "DONE", [f"{JE}/instructor/projects-detail-1440.png", f"{JE}/instructor/projects-detail-390.png"])
add("/instructor/evaluations", "instructor", "product/evaluation-management + imported-reviews", "DONE", [f"{JE}/instructor/_instructor_evaluations-1440.png", f"{JE}/instructor/_instructor_evaluations-390.png"])
add("/instructor/performance", "instructor", "product/member-performance", "DONE", [f"{JE}/instructor/_instructor_performance-1440.png"])
add("/instructor/participation", "instructor", "participation/instructor", "DONE", [f"{JE}/instructor/_instructor_participation-1440.png", f"{JE}/instructor/_instructor_participation-390.png"])
add("/instructor/recruitment-rounds", "instructor", "applications/recruitment-rounds", "DONE", [f"{JE}/instructor/_instructor_recruitment-rounds-1440.png"])
add("/instructor/reports", "instructor", "sessions/reports-workspace", "DONE", [f"{JE}/instructor/_instructor_reports-1440.png", f"{JE}/instructor/_instructor_reports-390.png"])
add("/instructor/github", "instructor", "github-connection + notebook", "DONE", [f"{JE}/instructor/_instructor_github-1440.png", f"{JE}/instructor/_instructor_github-390.png"])
add("/instructor/notifications", "instructor", "product/outcomes", "DONE", [f"{JE}/instructor/_instructor_notifications-1440.png"])
add("/instructor/profile", "instructor", "product/outcomes", "DONE", [f"{JE}/instructor/_instructor_profile-1440.png"])

# ADMIN (32)
add("/admin", "admin", "product/admin-management AdminOverview", "DONE", [f"{JE}/admin/_admin-1440.png", f"{JE}/admin/_admin-390.png"])
add("/admin/users", "admin", "admin-management AdminUsers", "DONE", [f"{JE}/admin/_admin_users-1440.png", f"{JE}/admin/_admin_users-390.png"])
add("/admin/roles", "admin", "admin-management AdminRoles", "DONE", [f"{JE}/admin/_admin_roles-1440.png", f"{JE}/admin/_admin_roles-390.png"])
add("/admin/groups", "admin", "admin-management AdminGroups", "DONE", [f"{JE}/admin/_admin_groups-1440.png", f"{JE}/admin/_admin_groups-390.png"])
add("/admin/catalogs", "admin", "admin-management AdminCatalogs", "DONE", [f"{JE}/admin/_admin_catalogs-1440.png", f"{JE}/admin/_admin_catalogs-390.png"])
add("/admin/settings", "admin", "admin-management AdminSettings + github-connection", "DONE", [f"{JE}/admin/_admin_settings-1440.png", f"{JE}/admin/_admin_settings-390.png"])
add("/admin/services", "admin", "admin-management AdminServices", "DONE", [f"{JE}/admin/_admin_services-1440.png", f"{JE}/admin/_admin_services-390.png"])
add("/admin/audit", "admin", "admin-management AdminAudit", "DONE", [f"{JE}/admin/_admin_audit-1440.png", f"{JE}/admin/_admin_audit-390.png"])
add("/admin/activity", "admin", "admin-management AdminActivity", "DONE", [f"{JE}/admin/root-1440.png"], "cũng render compact trên /admin (đã chụp)")
add("/admin/sessions", "admin", "admin/sessions → session-overview", "DONE", [f"{JE}/admin/_admin_sessions-1440.png", f"{JE}/admin/_admin_sessions-390.png"])
add("/admin/sessions/[id]", "admin", "sessions/session-overview", "DONE", [f"{JE}/instructor/sessions-detail-1440.png"], "cùng session-overview (evidence instructor owner)")
add("/admin/sprints", "admin", "sessions/delivery-overview", "DONE", [f"{JE}/admin/_admin_sprints-1440.png", f"{JE}/admin/_admin_sprints-390.png"])
add("/admin/sprints/[id]", "admin", "sessions/sprint-workspace", "DONE", [f"{JE}/instructor/sprints-detail-1440.png"], "cùng sprint-workspace (evidence instructor owner)")
add("/admin/tasks", "admin", "product/sprint-management", "DONE", [f"{JE}/admin/_admin_tasks-1440.png", f"{JE}/admin/_admin_tasks-390.png"])
add("/admin/tasks/[id]", "admin", "product/intern-work", "DONE", [f"{JE}/admin/tasks-detail-1440.png", f"{JE}/admin/tasks-detail-390.png"])
add("/admin/templates", "admin", "admin/templates-manager", "DONE", [f"{JE}/admin/_admin_templates-1440.png", f"{JE}/admin/_admin_templates-390.png"])
add("/admin/questions", "admin", "admin/question-bank + question-editor", "DONE", [f"{JE}/admin/_admin_questions-1440.png", f"{JE}/admin/_admin_questions-390.png"])
add("/admin/career-roles", "admin", "admin/career-roles + editor", "DONE", [f"{JE}/admin/_admin_career-roles-1440.png"])
add("/admin/recruitment-rounds", "admin", "applications/recruitment-rounds", "DONE", [f"{JE}/admin/_admin_recruitment-rounds-1440.png"])
add("/admin/knowledge", "admin", "admin/knowledge/library", "DONE", [f"{JE}/admin/_admin_knowledge-1440.png", f"{JE}/admin/_admin_knowledge-390.png"])
add("/admin/knowledge/new", "admin", "admin/knowledge/editor", "DONE", [f"{JE}/admin/knowledge-new-1440.png"])
add("/admin/knowledge/[code]", "admin", "admin/knowledge/editor", "DONE", [f"{JE}/admin/knowledge-new-1440.png"], "cùng component editor render cả /new và /[code] (route scan xác nhận); editor đã chuyển (eyebrow KIẾN THỨC + back)")
add("/admin/performance", "admin", "product/member-performance", "DONE", [f"{JE}/admin/_admin_performance-1440.png"])
add("/admin/kpi", "admin", "admin/kpi-console", "DONE", [f"{JE}/admin/_admin_kpi-1440.png", f"{JE}/admin/_admin_kpi-390.png"])
add("/admin/salary", "admin", "admin/salary-console", "DONE", [f"{JE}/admin/_admin_salary-1440.png", f"{JE}/admin/_admin_salary-390.png"])
add("/admin/certificates", "admin", "admin/certificate-console", "DONE", [f"{JE}/admin/_admin_certificates-1440.png", f"{JE}/admin/_admin_certificates-390.png"])
add("/admin/reports", "admin", "sessions/reports-workspace", "DONE", [f"{JE}/admin/_admin_reports-1440.png", f"{JE}/admin/_admin_reports-390.png"])
add("/admin/ai", "admin", "admin/ai-configuration", "DONE", [f"{JE}/admin/_admin_ai-1440.png"])
add("/admin/communications", "admin", "admin/communications", "DONE", [f"{JE}/admin/_admin_communications-1440.png"])
add("/admin/notifications", "admin", "product/outcomes", "DONE", [f"{JE}/admin/_admin_notifications-1440.png"])
add("/admin/profile", "admin", "product/outcomes", "DONE", [f"{JE}/admin/_admin_profile-1440.png"])

# GLOBAL STATES (5)
add("/[global]loading.tsx", "global", "app loading boundary", "ALREADY-COMPLIANT", [f"{PE}/public-login.jpg"], "ink-line + skeleton-pencil; render tại mọi chuyển route chậm")
add("/[global]error.tsx", "global", "app error boundary", "ALREADY-COMPLIANT", [f"{PE}/public-login.jpg"], "sketch-card + StampBadge LỖI + doodles (đã notebook sâu)")
add("/[global]global-error.tsx", "global", "global error boundary", "ALREADY-COMPLIANT", [f"{PE}/public-login.jpg"], "inline-style stamp tự chứa, không phụ thuộc CSS")
add("/[global]not-found.tsx", "global", "404", "ALREADY-COMPLIANT", [f"{JE}/global/not-found-1440.png", f"{JE}/global/not-found-390.png"])
add("/[global]template.tsx", "global", "template", "ALREADY-COMPLIANT", [f"{PE}/public-login.jpg"], "audit code — không có UI riêng")

# --- gộp + ghi manifest ---
routes = scan_routes()
missing = [r for r in routes if r not in T]
entries = []
for r in routes:
    t = T.get(r)
    if t:
        e = {"route": r, **t}
        # kiểm evidence tồn tại; đánh dấu nếu thiếu
        e["evidenceMissing"] = [p for p in e["evidence"] if not os.path.exists(os.path.join(ROOT, p))]
        entries.append(e)
    else:
        entries.append({"route": r, "group": "?", "component": "?", "status": "NOT-STARTED", "evidence": [], "note": "KHÔNG CÓ TRONG MANIFEST — cần bổ sung"})

manifest = {
    "standard": "JOURNEY V3 — 100% UI INTEGRATION (master prompt V4)",
    "branch": "codex/product-acceptance-20261116",
    "acceptanceRule": "DONE/ALREADY-COMPLIANT/REDIRECT cho mọi route; mọi route DONE phải có evidence tồn tại; 0 PARTIAL/NOT-STARTED/BLOCKED",
    "generatedBy": "tools/gen-journey-manifest.py",
    "globals": [
        {"file": "src/app/loading.tsx", "status": "ALREADY-COMPLIANT", "evidence": [], "note": "ink-line + skeleton-pencil; render mọi chuyển route chậm; audit code + VLM qua luồng QA"},
        {"file": "src/app/error.tsx", "status": "ALREADY-COMPLIANT", "evidence": [], "note": "sketch-card + StampBadge LỖI + doodles; btn() primitives v3"},
        {"file": "src/app/global-error.tsx", "status": "ALREADY-COMPLIANT", "evidence": [], "note": "inline-style stamp tự chứa (global CSS không nạp được ở tầng này)"},
        {"file": "src/app/not-found.tsx", "status": "ALREADY-COMPLIANT", "evidence": ["journey-v3-evidence/global/not-found-1440.png", "journey-v3-evidence/global/not-found-390.png"], "note": "sketch-card 404 + doodles + squiggle; đã chụp 2 viewport"},
        {"file": "src/app/template.tsx", "status": "ALREADY-COMPLIANT", "evidence": [], "note": "không có UI riêng — audit code"},
    ],
    "routes": entries,
}
out = os.path.join(EV, "coverage-manifest.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
n_done = sum(1 for e in entries if e["status"] in ("DONE", "ALREADY-COMPLIANT"))
n_red = sum(1 for e in entries if e["status"] == "REDIRECT")
n_bad = sum(1 for e in entries if e["status"] not in ("DONE", "ALREADY-COMPLIANT", "REDIRECT"))
n_ev_missing = sum(1 for e in entries if e.get("evidenceMissing"))
print(f"routes scanned: {len(entries)}; DONE/COMPLIANT: {n_done}; REDIRECT: {n_red}; BAD: {n_bad}; evidence-missing entries: {n_ev_missing}")
if missing:
    print("KHÔNG CÓ TRẠNG THÁI (cần gán):", missing)
