> Tài liệu lịch sử, lưu để truy vết. Không dùng làm hướng dẫn hoặc bằng chứng cho bản hiện hành. Xem README của repository và docs hiện tại.

# Phase 7.1.5 — xác minh live

## Môi trường và giới hạn release

FE baseline 042fec041c90512e8662263f3b517352297e373d.
BE baseline/final 102b9afa0998bcb0237a8fed25c5908f4436c6f2, branch feat/full-product-sqlserver-core. Không sửa backend source hoặc frozen migration.

Máy có SQL Server instance VANHOI12, TCP localhost:1435, engine 17.0.1000.7 (SQL Server 2025). Database development riêng VIntern_Phase715_20261008 dùng compatibility level 150. Đã chạy đủ sáu TypeORM migrations, synchronize=false. Compatibility 150 KHÔNG biến engine thành SQL Server 2019.

Docker không khả dụng; không tìm thấy SQL Server 2019 instance/runtime sẵn. Gate chính xác SQL Server 2019 vẫn NO. Không tự cài SQL Server hay Docker và không thay đổi instance/dữ liệu VInternDb hiện có.

Nest nguyên bản dist/main.js đã boot ở localhost:8080 bằng local environment: health 200/database ok; OpenAPI 200 với 114 paths. Sau đó test harness dùng real AppModule, global guards/filter, validation, CORS, cookie middleware và cùng SQL database, chỉ override AI_PROVIDER_TOKEN theo mẫu E2E backend có sẵn.

FE production chạy localhost:3001, NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1. Browser live KHÔNG interception, mocked fetch, MSW hoặc mock server. Mỗi response browser được ghi endpoint/method/status/CORS; không log Authorization, cookie value, request password, JWT_SECRET hay DB_PASSWORD.

## Local configuration

BE .env.local ignored được tạo với credentials development ngẫu nhiên: SQL login chỉ có db_owner trong disposable database, JWT secret ngẫu nhiên, access TTL 20s để quan sát 401/refresh/retry, CORS origin localhost:3001. Không ghi secret vào .env.example và không commit local config.

Database/test login được tạo qua Windows authentication sysadmin local đã có. Không sửa mật khẩu hay dữ liệu instance hiện hữu. Setup credentials chỉ nằm local, không yêu cầu người dùng gửi secret.

## Cách chạy lại trên database development đã cấu hình

Từ FE repo, sau khi build backend:

1. Chạy scripts/phase715-nest-harness.mjs bằng Node; harness chỉ chấp nhận NODE*ENV=test và DB_NAME bắt đầu VIntern_Phase715*.
2. Chạy scripts/phase715-dev-fixtures.mjs. Helper chạy migrations thật, ensure RBAC/question bank, tạo tài khoản development, lưu/nộp câu trả lời qua API. Khi chạy lại, hoàn tất assignment của fixture waiting qua Instructor API để quay về Waiting; không reset hay truncate dữ liệu.
3. Chạy FE production build trên :3001.
4. Chạy scripts/phase715-live-browser.mjs. Playwright có thể resolve từ project hoặc đường dẫn PLAYWRIGHT_MODULE tới bundled dependency. Chrome system được dùng.
5. Xem phase7-evidence/phase715-live-results.json và phase715-live-network.json.

Fixture required giữ not_started; progress có interview thật và một câu đã lưu; failed chọn QA để TestAIProvider trả component scores 58/72; waiting chọn Backend với 85/72. Provider đi qua request.validate. Nest tự tính overall/decision: FAIL 62.2 và PASS 81.1. Provider cố ý gửi decision/overall mâu thuẫn để kiểm tra Nest không tin chúng. Không có fake production fallback.

Suite tạo candidate development riêng cho luồng UI lưu đủ tám câu và submit. API Instructor tạo project/session/assignment/sprint/task để chứng minh chuyển Waiting → Active; không triển khai màn hình Phase 7.2.

## Defect và fix

AUTH/FE_MAPPING: clearSession ngay khi logout khiến WorkspaceGuard điều hướng trước response 204 clearCookie. Live test Instructor phát hiện cookie chưa được xóa tại thời điểm FE tới login. Regression test tái hiện FAIL trước fix.

Fix nhỏ nhất: logoutPending trong session; memory bị xóa và private UI bị ẩn ngay, guard chờ request logout settle rồi điều hướng. Không đổi contract backend. Test /me response đang chạy không thể phục hồi session sau logout vẫn được giữ.

VISUAL: giữ EmptyInternWorkspace composition; crop mascot thành torso lớn hơn; thay illustration browser/hộp mở/máy bay; Waiting topbar search trái, Active giữ breadcrumb; nhóm ba bước theo nhịp R01 thay vì giãn kín card. Mobile không đổi thành layout desktop.

Verdict R01: ACCEPTABLE, không pixel MATCH. Giữ mascot asset hiện hữu khác pose; logo/sidebar theo design system repo; initials từ principal thay vì avatar giả; activity chỉ một event recruitedAt thật; copy/null states theo contract thay vì dữ liệu demo trong ảnh R01. Những khác biệt này không tạo business data giả.

## Evidence

Các ảnh phase7.1-live-\*.png đều chụp từ FE production gọi Nest :8080 thật trên SQL thật. Contract QA của Phase 7.1 được giữ riêng, không dùng thay live gate.

Cookie verified: HttpOnly, sameSite=Lax, path /api/v1/auth, document.cookie không đọc được, cookie cleared sau logout, replay refresh token trả 401 và SQL revokedAt được ghi. Cookie rotation/expiry: request workspace 401 → một refresh → đúng một retry 200, principal giữ nguyên. Access JWT vẫn theo contract stateless có TTL; không thêm access-token blacklist.

Waiting sáu hàng đúng DB profile passed/backend và assignment null. Business navigation disabled, không overflow ngang tại 1440x900/390x844, mobile focus/Escape hoạt động.

Assignment: Instructor POST /assignments, cùng browser từ unassigned thành active qua reload state. Ban đầu sprint/task null hiển thị empty trung thực. Sau tạo sprint/task thật: task total=1, doing=1, focused task progress=37. SQL trace project/session/task/progress và count trong đúng project = Nest workspace = FE.

## Gate

Không mở Phase 7.2 vì engine SQL Server 2019 chưa được xác minh. Các kết quả live trên SQL Server 2025 không được đổi nhãn thành SQL Server 2019. Không PR/merge/main/force.

## Kết quả cuối

FE: lint 0 errors / 0 warnings; typecheck PASS; 23 suites / 214 tests PASS; build PASS; diff-check PASS. Giữ đủ 213 tests cũ. Live browser: 10 PASS / 0 FAIL; không pageerror.

Backend source không đổi, không cần commit backend hoặc thay migration. Không thay dependencies FE/BE, không thêm Prisma/SQLite/Next business backend, không port feature Phase 7.2.

Findings: BLOCKER/BACKEND_CONFIG — SQL Server 2019 runtime chưa có; máy chỉ có 2025 và không Docker/distribution WSL sẵn. HIGH — không còn product defect chưa xử lý trong các kịch bản đã chạy. MEDIUM — chỉ deterministic AI test provider được xác minh, không Gemini/network AI thật (đúng phạm vi); access JWT stateless vẫn theo TTL, logout revoke refresh token theo contract. LOW — pose mascot/logo/initials khác artwork R01, verdict ACCEPTABLE.
