> Tài liệu lịch sử, lưu để truy vết. Không dùng làm hướng dẫn hoặc bằng chứng cho bản hiện hành. Xem README của repository và docs hiện tại.

# FE ↔ NestJS Backend Integration Strategy (Phase 1)

> Cập nhật Phase 7.1: FE đã nối auth, recruitment và workspace theo source Nest. Live end-to-end còn BLOCKED bởi cấu hình backend local; xem [contract Phase 7.1](phase7.1-contracts.md).
> Tài liệu này cố định topology dev/production, CORS/cookie và các contract mà
> NestJS backend (V-Intern-BE) phải đáp ứng để FE hoạt động không cần sửa code.

## 1. Kiến trúc đích

```
Next.js FE (repo này)                NestJS BE (V-Intern-BE)          SQL Server 2019
─────────────────────                ───────────────────────          ───────────────
src/lib/auth/api-client.ts  ─HTTPS→  /api/v1/auth/*                   Users, Roles,
credentials:"include"                /api/v1/users|roles|...          Permissions,
refresh cookie HttpOnly              Swagger: /api/docs               RefreshTokens...
```

- **KHÔNG** có Route Handler nghiệp vụ trong FE (`src/app/api/**` không tồn tại trên
  `feat/full-product-fe-nest-integration` và không được tái tạo — xem
  `docs/migration/raw-snapshot-inventory.md` mục DO NOT PORT).
- BE là **security boundary duy nhất**: guard, permission, phân trang, validation,
  audit đều thuộc về BE. FE không bao giờ tin role từ client.

## 2. API base URL (spec 36)

| Nguồn cấu hình | Giá trị                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Env var        | `NEXT_PUBLIC_API_BASE_URL` (xem `.env.example`)                                                                                     |
| Đọc tại        | `src/lib/auth/api-client.ts` → `getApiBaseUrl()` (lazy, trim, bỏ slash cuối)                                                        |
| Ghép URL       | `${NEXT_PUBLIC_API_BASE_URL}${path}` — base phải chứa `/api/v1`; FE không thêm lần nữa                                              |
| Bỏ trống       | Chế độ _not-connected_ trung thực: mọi auth đều báo chưa kết nối, **không có fetch nào** (được test bảo vệ: `auth-service.test.ts`) |

Quy tắc:

- KHÔNG hardcode `localhost` trong source — chỉ trong env (`.env` local, không commit).
- KHÔNG đặt secret (DB/JWT/AI key) vào biến `NEXT_PUBLIC_*`.
- Production: URL tuyệt đối HTTPS của BE, hoặc URL tương đối khi FE+BE phục vụ qua
  cùng domain/gateway (khuyến nghị — xem §5).

## 3. Dev topology (spec 37)

| Service      | URL mặc định            | Ghi chú                                                                                      |
| ------------ | ----------------------- | -------------------------------------------------------------------------------------------- |
| FE (Next.js) | `http://localhost:3001` | `npm run dev` (sandbox có thể dùng 3000 — chỉ ảnh hưởng value env, không ảnh hưởng contract) |
| BE (NestJS)  | `http://localhost:8080` | global prefix `/api/v1`, Swagger `/api/docs`                                                 |
| SQL Server   | `localhost:1433`        | DB `VIntern` — chỉ BE kết nối, FE không bao giờ đụng DB                                      |

`localhost:3001` → `localhost:8080` là **same-site** (cùng registrable domain
`localhost`, khác port) nên cookie `SameSite=Lax` vẫn được gửi kèm
`credentials:"include"` — không cần `SameSite=None` trong dev.

## 4. CORS / Cookie yêu cầu với BE

BE (Nest `enableCors`/`app.enableCors`) **phải**:

```ts
app.enableCors({
  origin: ["http://localhost:3001"], // allowlist tường minh — KHÔNG wildcard
  credentials: true, // bắt buộc cho refresh cookie
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
```

Refresh cookie do BE set (FE không đọc bằng JS — đã cam kết trong `api-client.ts`):

| Thuộc tính | Dev                   | Production                                                        |
| ---------- | --------------------- | ----------------------------------------------------------------- |
| Name       | `vintern_refresh`     | giữ nguyên                                                        |
| HttpOnly   | ✓                     | ✓                                                                 |
| Secure     | ✗ (http local)        | ✓ bắt buộc                                                        |
| SameSite   | `Lax`                 | `Lax` nếu FE+BE same-site; `None`+`Secure` nếu thật sự cross-site |
| Path       | `/api/v1/auth`        | giữ nguyên (giới hạn phạm vi gửi cookie)                          |
| Max-Age    | 7d (theo thiết kế BE) | theo thiết kế BE                                                  |

FE mọi request đều `credentials:"include"` (đã cứng trong `api-client.ts`) →
browser chỉ gửi/nhận cookie khi BE CORS khớp origin **và** `credentials:true`.
Wildcard `*` + credentials bị browser chặn — BE không được cấu hình vậy.

## 5. Production topology (khuyến nghị)

Một domain, gateway route theo path → tránh mọi vấn đề third-party cookie:

```
https://vintern.example.com        → Next.js FE
https://vintern.example.com/be     → NestJS BE (strip prefix hoặc BE chấp nhận /be)
```

Khi đó `NEXT_PUBLIC_API_BASE_URL=https://vintern.example.com/be/api/v1`, cookie là
first-party, `SameSite=Lax` + `Secure` là đủ. Nếu bắt buộc cross-site domain riêng
(`fe.example.com` + `api.example.com`) → cookie cần `SameSite=None; Secure` và
CORS allowlist cả hai origin — cân nhắc kỹ trước khi chọn.

## 6. Contract BE phải đáp ứng (đã khóa bởi FE client)

1. **Error contract**: mọi lỗi trả `{statusCode, code, message}` — `api-client.ts`
   parse 3 field này; thiếu `code` → `HTTP_ERROR`, thiếu `message` → statusText.
2. **204 logout**: không body — client không parse JSON cho 204.
3. **DTO nghiêm ngặt**: BE dùng `ValidationPipe({whitelist:true,
forbidNonWhitelisted:true})` — FE chỉ gửi đúng field (đã cam kết, xem header
   `api-client.ts` và pre-validation `@IsEmail()` trong `auth-service.ts`).
4. **Auth endpoints**: `POST /auth/login`, `POST /auth/refresh`,
   `POST /auth/logout` (204), `GET /auth/me` — response shape theo
   `src/lib/auth/auth-service.ts` (login: `{accessToken, user{id,email,
displayName, roles[], permissions[]}}`).
5. **Pagination** (khi BE Phase 1 có users/groups/audit/...): một format duy nhất
   `{data: [], meta: {page, pageSize, total, totalPages}}`, max page size ở BE.

## 7. Trạng thái xác minh Phase 1 (FE side)

- [x] Auth client đọc base URL từ env, không hardcode (kiểm code + test)
- [x] `credentials:"include"` trên mọi request (cứng trong client)
- [x] Error contract `{statusCode, code, message}` parse đúng (unit test)
- [x] Not-connected mode: không fetch khi env trống (unit test)
- [x] Không có `src/app/api/**` nào trong branch này
- [ ] Kết nối thật tới Nest BE: **LIVE VERIFIED trên SQL Server 2025 — gate SQL Server 2019 chưa đạt** (Phase 7.1.5)
