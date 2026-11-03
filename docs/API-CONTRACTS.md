# API và lifecycle Frontend

Tài liệu này mô tả **hợp đồng mà frontend phụ thuộc**. Nguồn sự thật cuối cùng vẫn là controller/DTO/service của Backend; khi hai bên lệch, sửa cùng lúc và thêm test.

## 1. Kết nối

| Thành phần | Giá trị |
|---|---|
| Base URL | `NEXT_PUBLIC_API_BASE_URL`, ví dụ `http://localhost:8080/api/v1` |
| Định dạng | JSON |
| Credentials | `credentials: "include"` cho mọi request cần cookie |
| Access token | Header `Authorization: Bearer <token>` khi đã đăng nhập |
| Refresh | Cookie HttpOnly do BE quản lý; client không đọc token này |
| Swagger | `GET /api/docs` trên đúng process API đang chạy |

Base URL **phải** chứa tiền tố `/api/v1`. Adapter không tự ghép thêm version.

## 2. Quy tắc parse response

1. Transport trả `unknown`.
2. Adapter kiểm cấu trúc, kiểu, nullable và enum.
3. Chỉ dữ liệu hợp lệ mới được trả về component.
4. Field mới optional được giữ tương thích; field bắt buộc thiếu → lỗi contract.
5. Không dùng `as any`, không biến lỗi thành mảng rỗng, không điền số đo giả.

Các nhóm adapter chính:

| Nhóm | File tiêu biểu | Hành vi |
|---|---|---|
| Workspace/recruitment | `workspace.ts`, `recruitment.ts` | Lifecycle, profile, own session, conversation, answer, submit/retry |
| Sessions/templates | `sessions.ts`, `templates.ts`, `planning.ts` | Library/detail, tạo run, eligible members, Start, plan draft/publish |
| Work/submissions | `work.ts`, `submissions.ts` | Task/spec/comment/history, nộp/rút bài, rubric, AI review |
| GitHub | `github.ts`, `repository-access.ts` | Kết nối, authorize, repo/provision/invitation, webhook, activity |
| Evaluation/AI | `outcomes.ts`, `business-agents.ts` | Gợi ý chấm, sinh nội dung, trạng thái job |
| Finance | `finance.ts` | KPI lifecycle, lương ảo, ledger, chứng nhận, PDF |
| Reports/performance | `reports.ts`, `student-detail.ts` | Scope quản lý, phân trang, PDF/XLSX |
| Mentor | `mentor.ts` | Conversation/history, task được chọn |
| Notifications | `management.ts` | Danh sách/đọc/tùy chọn, unread count (poll 60s, fails soft) |
| Projects/knowledge | `projects.ts`, `knowledge*.ts` | Phiên theo dự án, knowledge run, tài liệu chấm |

## 3. Lỗi và trạng thái

```json
{
  "statusCode": 409,
  "code": "TASK_DEPENDENCIES_PENDING",
  "message": "Thông điệp mô tả điều kiện chưa đạt",
  "traceId": "tham-chiếu-tra-log",
  "details": { "blockedBy": [] }
}
```

| HTTP | UI xử lý |
|---|---|
| `400` / `422` | Hiển thị lỗi validation theo field; chỉ show `details` DTO đã giới hạn |
| `401` | Xóa phiên, về login; không retry vô hạn |
| `403` | Từ chối quyền; giữ ngữ cảnh, không tự nâng quyền |
| `404` | Không tìm thấy trong scope; không kết luận dữ liệu toàn hệ thống không tồn tại |
| `409` | Reload dữ liệu, hiển thị xung đột/điều kiện chưa đạt |
| `429` | Thông báo chờ; không retry dồn dập |
| `5xx` | Lỗi tạm thời; cho retry có kiểm soát |

`ErrorState` không hiển thị chi tiết lỗi server ngoài DTO đã giới hạn. Không gom mọi lỗi thành “thao tác thất bại”.

## 4. Pagination, sort, filter

- Nhiều collection dùng `items`, `total`, `page`, `pageSize` (mặc định 10) hoặc `data/meta` tùy endpoint. **Đọc schema trước khi unwrap.**
- Sort/filter chạy ở server trước pagination cho các read model quan trọng.
- Đổi sort/filter/trạng thái/tìm kiếm → về trang đầu.
- Session list nhận `sortBy=startDate|endDate|name|progress` và `sortDirection=asc|desc`.
- Không lọc một trang đã tải rồi coi là toàn bộ dữ liệu.

## 5. Lifecycle và phân quyền hiển thị

- `WorkspaceGuard` kiểm tra đăng nhập + vai trò của nhánh.
- `InternEntry` kiểm tra lifecycle trước khi mount nội dung học tập.
- `Can`/permission chỉ quyết định **hiển thị**. BE vẫn kiểm tra permission + ownership trên từng bản ghi.
- Sinh viên dùng API `own` theo principal; không gửi `internId` để đọc bài người khác.
- Giảng viên có `tasks.view` vẫn chỉ thấy task trong project/session được giao.

## 6. Hợp đồng theo domain

### 6.1 Tuyển dụng và onboarding

| Luồng | Endpoint / quy tắc |
|---|---|
| Bắt đầu / tiếp tục | `recruitment/me`, session hiện tại, profile |
| Câu hỏi | `currentQuestion.kind = main | follow_up`; chỉ hiển thị đúng một câu hiện tại |
| Trả lời chính | `POST .../answers` |
| Câu phụ | `PUT /recruitment/me/interviews/:id/follow-ups/:questionId` |
| Làm mới hội thoại | Tải lại `conversation/next`; không tự tăng số lượt |
| Lịch sử | `GET /recruitment/me/interviews` (phân trang) |
| Kết quả | Điểm, role đề xuất, lý do; điểm tiếng Anh có thể `null` ở bản cũ |
| Retry | Chỉ khi còn lượt; tổng tối đa 3 lượt, không cộng dồn khi đổi role |

Server giữ thời gian và thứ tự. UI dùng `remainingSeconds` từ server và interval địa phương chỉ để trình bày.

### 6.2 Phiên, dự án, kế hoạch

| Luồng | Hợp đồng |
|---|---|
| Danh sách phiên | `currentSprint`, `alerts`; planned không gọi là “đang chạy” |
| Chi tiết phiên | `/sessions/:id/work`, `/sessions/:id/timeline` theo target |
| Task list | Metadata Sprint + `repository: {status, fullName} | null` của đúng phiên |
| Kanban | Dùng dữ liệu hydrate của trang; không gọi task detail/GitHub cho từng thẻ |
| Trạng thái repo | Chỉ `provisioning/ready/failed`; response cũ thiếu field vẫn đọc được |
| Plan | Draft AI → giảng viên sửa → confirm/publish; key ổn định, `dependsOn`, `parentKey`, milestone |
| Publish | BE ánh xạ key → UUID và xác nhận lại quan hệ/deadline |
| Task spec | `/tasks/:id/spec` cho dependency status; `/tasks/:id/spec/source` là raw snapshot cho runner |

Không tự suy task Done hoặc bỏ chặn khi chỉ đổi UI.

### 6.3 Bài làm, nộp bài, chấm

| Luồng | Hợp đồng |
|---|---|
| Task detail | Giữ tên/code Sprint đã validate; ưu tiên tiếng Việt |
| Nộp bài | Giữ PR URL + commit SHA; UI hiển thị SHA/PR đã lưu |
| Rút/sửa | Theo trạng thái và quyền; không tạo bản ghi mới ngoài ý định |
| AI review | Kết luận gốc + evidence/limitations; UI ghép trạng thái bài nộp |
| Rubric cuối | Chỉ đọc sau khi giảng viên quyết định; AI không phải authority |
| Trusted tests | `executionTimeMs`, `score`, `checks` tên/kết quả/log do runner ký |
| Bản cũ | Thiếu nhóm chi tiết vẫn parse; không tự điền số đo |

Link source chỉ mở HTTPS GitHub hợp lệ. UI không gọi merge PR hoặc nhận `passed` từ model làm kết quả cuối.

### 6.4 Đánh giá, hiệu suất, KPI, chứng nhận

| Luồng | Hợp đồng |
|---|---|
| Evaluation | Kỳ, tiêu chí, trạng thái draft/submitted/finalized; quyền chốt ở BE |
| Performance | `items,total,page,pageSize`; xếp hạng/tìm kiếm ở server |
| Student detail | `/performance/interns/:id/detail` với scope, task page, trend 6 tháng UTC |
| Report | Schema 2 đọc thêm task/sprint/review/timeline; parser tương thích snapshot cũ |
| KPI | Lifecycle draft/open/calculate/finalize; kết quả + provenance |
| Salary | Sinh từ kỳ đã chốt; điều chỉnh ledger; số dư theo user |
| Certificate | Issue/revoke/PDF; lý do 409 có cấu trúc; verify công khai không trả dữ liệu nội bộ |
| PDF/XLSX | File phản ánh snapshot tại thời điểm tạo, không sửa số liệu hiện tại |

`0` và “chưa đo được” là hai trạng thái khác nhau. Không thêm đường xu hướng khi thiếu mẫu số.

### 6.5 GitHub

| Luồng | Hợp đồng |
|---|---|
| Tài khoản tạo repo | `POST /github/repository-account`; không nhận password/token trong body |
| Đọc trạng thái | `GET /github/repository-account`; trả configured/connected/login/ready |
| Quyền | Yêu cầu `settings.update` + Admin; GET yêu cầu `settings.read` |
| OAuth Admin | `read:user public_repo`; callback về `/admin/settings` |
| OAuth GV/SV | `read:user` để xác minh danh tính và nhận lời mời |
| Tạo repo | Start tự tạo; worker xử lý tối đa 3 phiên và 5 lời mời/phiên mỗi 60 giây |
| Đồng bộ | Chủ trì dùng credential owner đã ghi; không yêu cầu quyền tạo repo từ giảng viên |
| Danh tính | Ghép theo GitHub numeric ID; không đoán username từ email ứng dụng |
| Lỗi | Scope thiếu/đổi danh tính → báo lỗi rõ; không âm thầm đổi owner |

### 6.6 Tài liệu chấm và kho tri thức

- `/project-templates/:id/revisions/:version/assessment` đọc theo revision.
- `/projects/:id/template-assessment` trả `{ version, assessment }` theo version đã ghim; có thể `assessment: null`.
- UI không thay bằng tài liệu của version khác; BE vẫn kiểm tra quyền project.
- Knowledge run dùng `requestId` idempotent; poll/cancel/resume theo trạng thái job.

## 7. Version và idempotency

| Cơ chế | Cách dùng |
|---|---|
| `expectedVersion` | Gửi khi sửa template/plan/task; 409 → tải lại và so sánh |
| `requestId` | Giữ ổn định cho một ý định; bấm lại sau mất mạng không tạo bản ghi mới |
| Revision | Kanban/task list dùng để đồng bộ nhiều cột |
| Polling | Chỉ cho job/trạng thái provisioning; dừng khi terminal state |

## 8. Checklist khi đổi contract

1. Sửa DTO/controller/service ở BE và OpenAPI.
2. Cập nhật adapter/parser FE + kiểu domain.
3. Thêm test cho response hợp lệ, response cũ và response sai schema.
4. Kiểm tra loading/error/empty và quyền hiển thị.
5. Cập nhật tài liệu này và `docs/api/SCHEMAS.md` của BE nếu field đổi.
6. Chạy `npm run lint`, `typecheck`, `test`, `build` và gate full-stack nếu chạm contract.
