# Tìm lỗi theo triệu chứng

Chẩn đoán theo thứ tự **trình duyệt → FE → API → SQL/dịch vụ ngoài**. Đừng sửa dữ liệu hoặc reset môi trường để “thử lại” khi chưa biết tầng lỗi.

## 1. Bảng chẩn đoán nhanh

| Triệu chứng | Kiểm tra đầu tiên | Hướng xử lý |
|---|---|---|
| Trang trắng, báo thiếu cấu hình | `NEXT_PUBLIC_API_BASE_URL` có `/api/v1`? Build lại sau đổi env? | Sửa `.env`, build lại, restart đúng process |
| Sửa code nhưng UI không đổi | Đang chạy `next dev` hay `next start`? | Dev tự reload; `start` cần build + restart |
| API 401 liên tục | Access token hết hạn? Refresh cookie? Origin/CORS? | Kiểm Network, cookie, đồng hồ máy; không retry vô hạn |
| Đăng nhập xong quay lại login | Cookie `SameSite`/`Secure`, domain/port, CORS | Cấu hình đúng origin; không đổi role để lách |
| 403 trên một bản ghi | Scope/ownership/permission | Đọc `code`, kiểm tài khoản và phiên; không nâng quyền |
| 409 khi lưu/chuyển task | `expectedVersion`, phụ thuộc, trạng thái | Reload, so sánh, xử lý xung đột đúng |
| 429 khi reload nhiều | Rate limit auth/API | Dùng client navigation; chờ; không spam refresh |
| Mọi trang chậm/timeout | API health, SQL session/wait, pool | Tách lỗi dữ liệu khỏi CSS; đọc log BE |
| Sinh viên thấy chờ, GV thấy kế hoạch | Assignment/lifecycle, draft/publish, Sprint | Sửa đúng bước chuẩn bị; không mount task khi chưa active |
| Kanban không cập nhật | Revision, reload collection, filter | Kiểm payload và state; không chỉ reload bảng |
| Tràn ngang mobile | Container, grid `min-width`, nội dung dài | Sửa đúng tầng; không `overflow: hidden` toàn trang |
| Chỉ một vai trò sai style | Scope class, thứ tự import CSS | Kiểm computed style; không đổi token toàn cục |
| GitHub báo chưa cấu hình | Kết nối Admin, scope, callback | Đọc trạng thái configured/connected/ready |
| AI lỗi/không trả kết quả | Provider, timeout, schema output | Hiển thị lỗi/retry; không bịa điểm |
| Build lỗi font/URL | Mạng build, `next/font` | Kiểm cache/CI; không retry mù |

## 2. Kiểm tra theo tầng

### 2.1 Trình duyệt

1. Mở DevTools → Console: có lỗi runtime/hydration không?
2. Network: request đi đúng host/port? Status? Response có đúng schema?
3. Application → Cookies: refresh cookie có tồn tại, đúng domain/`SameSite`?
4. Thử hard reload một lần; nếu 429, chuyển sang client navigation.
5. Kiểm tra tài khoản đang đăng nhập có đúng vai trò không.

### 2.2 Frontend

```powershell
& .\scripts\Use-ProjectStorage.ps1
npm run typecheck
npm run lint
npm test
npm run build
```

- Lỗi type thường lộ adapter/parse sai.
- Lỗi build thường do env, server/client boundary hoặc font.
- Nếu chỉ một route lỗi, kiểm tra params/guard/layout của nhánh đó.

### 2.3 API

```powershell
Invoke-RestMethod http://localhost:8080/api/v1/health
```

- `database: ok` phải đến từ SQL thật.
- Mở `/api/docs` xem route/DTO của đúng process.
- Gọi lại endpoint bằng Swagger/token để tách lỗi FE khỏi lỗi BE.
- Nếu API ổn nhưng FE lỗi, quay lại Network/parser.

### 2.4 SQL và dịch vụ ngoài

- Kiểm tra đúng DB theo launcher (8080 và 8081 có thể dùng DB khác).
- Không suy ra DB từ `.env` nếu đang chạy bằng launcher.
- AI/GitHub/runner có cấu hình **không** chứng minh đã gọi thành công.
- Không reset DB chính hoặc sửa tay để ép trạng thái.

## 3. Lỗi thường gặp khi phát triển

| Tình huống | Nguyên nhân thường gặp | Cách sửa |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` undefined | Chưa có `.env` hoặc build trước khi set | Tạo `.env`, build lại |
| CORS error | Origin FE không nằm trong allowlist | Cập nhật `CORS_ORIGINS`, restart API |
| Cookie không gửi | Thiếu `credentials: include`, sai domain/port | Sửa transport/cấu hình |
| Refresh loop | Nhiều request 401 cùng lúc | Đảm bảo single-flight |
| Modal không đóng bằng Escape | Thiếu handler/focus trap | Bổ sung, test keyboard |
| Test JSDOM báo navigation | JSDOM không điều hướng thật | Mock/assert đúng phạm vi, không coi là lỗi app |
| Build treo ở Google Fonts | Mạng build | Kiểm cache/CI; không đổi font tùy tiện |

## 4. Khi nào cần leo thang

Leo thang khi:

- 401/403 lặp lại sau khi đã kiểm token/scope.
- 409/500 lặp lại với cùng payload.
- Dữ liệu hiển thị khác giữa hai vai trò nhưng không giải thích được bằng lifecycle/scope.
- Nghi ngờ lộ secret/PII.
- Gate CI đỏ nhưng local xanh.

Khi báo lỗi, gửi: route, vai trò, thời điểm, commit, request/response đã lọc PII, log liên quan và bước tái hiện. **Không gửi token, cookie, mật khẩu hoặc dữ liệu cá nhân.**
