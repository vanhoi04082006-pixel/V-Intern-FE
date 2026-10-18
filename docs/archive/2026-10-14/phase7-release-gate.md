> Tài liệu lịch sử, lưu để truy vết. Không dùng làm hướng dẫn hoặc bằng chứng cho bản hiện hành. Xem README của repository và docs hiện tại.

# Phase 7 — kiểm chứng full-stack

Browser gọi trực tiếp `http://localhost:8080/api/v1` từ Next.js `http://localhost:3001`. Không có interception, MSW hoặc business backend trong Next. Access token ở memory; refresh qua cookie HttpOnly. Nest/TypeORM/SQL quyết định quyền, trạng thái, điểm chính thức, KPI, sổ lương ảo và chứng nhận.

## Gate có thể chạy lại

Workflow `.github/workflows/phase7-fullstack.yml` chạy trên feature branch, ghim Backend `31381044d9d3b1b9eeab6baae435fc6a06e6bb3e`. Workflow dựng engine SQL Server 2019 thực, kiểm tra version major 15, áp dụng migrations 1–6, boot Nest và production Next rồi chạy browser Chrome thật. Credentials ngẫu nhiên được mask; AI override chỉ trong harness `NODE_ENV=test` với disposable DB `VIntern_Phase715_*`.

Các script theo thứ tự:

1. `phase715-dev-fixtures.mjs`, `phase715-live-browser.mjs`: 10 nhóm auth/recruitment/5 lifecycle/Waiting/assignment/Active; CORS, refresh rotation, logout/replay, SQL trace.
2. `phase7-work-live.mjs`: 2 nhóm own-task/comments/history/concurrent 409/refetch/retry và Sprint/Project/mobile.
3. `phase7-outcomes-fixture.mjs`, `phase7-outcomes-live.mjs`: 4 nhóm Mentor/privacy/503, AI 95–điểm chính thức 80–KPI–ledger, PDF/public verify/revoke, recommendations/profile/notification preferences.
4. `phase7-academic-live.mjs`: 3 nhóm class/session/project/member/milestone/assignment/mobile.
5. `phase7-instructor-live.mjs`: 3 nhóm đánh giá advisory/manual/finalized, Sprint/Task/review, scoped performance/reports/export.
6. `phase7-admin-live.mjs`: 5 nhóm users/effective role filter, groups/members/actual grants, catalogs/settings, tasks/soft delete, audit/activity/health/navigation.
7. `phase7-navigation-live.mjs`: 5 nhóm gồm 37 role routes desktop 1440/mobile 390×844, role redirect, foreign-resource safe 404, mobile navigation và 5 public/auth routes.

32 nhóm hành trình tổng cộng. JSON lưu URL/method/status, kết quả và giá trị SQL đã kiểm tra; không lưu token/cookie/password. Screenshot trong `phase7-evidence/final/`, evidence Waiting/Auth ở `phase7-evidence/phase7.1-live-*.png`. Artifact Actions gắn exact FE SHA là nguồn evidence engine 2019; screenshot local dùng SQL Server 2025 không được gọi là bằng chứng engine 2019.

`phase7-runtime-audit.mjs` transpile TypeScript để loại import type-only, duyệt dependency graph từ production App Router entrypoints. Các fixture/preview cũ giữ phục vụ baseline tests, không xuất hiện trong graph runtime. Marketing không dùng tên người/task/điểm/commit giả làm dữ liệu sản phẩm.

## Contract gaps được thể hiện trung thực

- Register/forgot password/OAuth/reset password và cập nhật profile cá nhân chưa có contract Nest tương ứng; không gọi endpoint giả. Profile đọc identity từ `/auth/me`.
- Trend lịch sử, attendance, burndown/velocity và telemetry dịch vụ AI chưa có source đủ; UI ghi chưa có dữ liệu. Collection distribution chỉ tính trang hiện tại và ghi rõ phạm vi.
- Roles/permissions tra cứu chính sách Backend; thao tác group role/member theo API thật. Không tạo UI mutation policy nếu controller không hỗ trợ.
- Revision evaluation chỉ được Backend cho Admin; Instructor không có action vượt quyền. AI không tự ghi điểm/chốt đánh giá, KPI, salary hoặc certificate.
- Không dùng Gemini trả phí trong CI. Production Gemini theo environment Backend; khi provider unavailable UI hiển thị lỗi, không fake assistant/recommendation.

## Visual QA

R01 Waiting giữ bố cục đã kiểm chứng, 6 hàng có nguồn workspace thật. R02–R14 giữ sidebar/light SaaS/white cards/blue actions; bổ sung KPI rows, status distribution, Catalog 3 panels, scoped Top 5 và kanban 4 cột từ data thật. Những panel reference thiếu nguồn giữ empty/unsupported; không tuyên bố pixel-perfect. Matrix và khác biệt cuối cùng nằm trong báo cáo Phase 7.

Không merge main, force push hoặc tạo PR. Các changes Backend về scope, public user mapping, typed queries, concurrency và effective role filtering được test riêng; không thay đổi frozen migrations 1–6.
