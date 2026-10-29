# V-Intern FE — Giao diện nền tảng thực tập ảo

> Hành trình thực tập đầu tiên, được thiết kế như một người đồng hành thật sự — không phải một dashboard lạnh lùng.

Frontend cho [V-Intern-BE](https://github.com/vanhoi04082006-pixel/V-Intern-BE) (NestJS + SQL Server). Toàn bộ dữ liệu lấy từ **API thật của backend** qua proxy `/api/v1/*` — không còn database nội bộ.

## ✨ Tính năng

### Công khai (không cần đăng nhập)
- **Landing page** — hero, cách hoạt động, demo phỏng vấn AI, dark/light mode
- **`#/apply`** — ứng viên nộp CV vào đợt tuyển (multipart, cookie phiên ứng viên)
- **`#/verify`** — kích hoạt link truy cập hồ sơ từ email
- **`#/github-invite`** — trang kết quả OAuth GitHub / lời mời repository

### Xác thực
- Đăng nhập / đăng ký công khai (tạo tài khoản intern)
- Bearer JWT 15 phút + **refresh token HttpOnly cookie** (tự động xoay khi 401)
- Đổi mật khẩu bắt buộc với tài khoản mật khẩu tạm (`mustChangePassword`)
- Phân quyền theo **permission codes** — nav tự ẩn hiện theo quyền của user

### Sinh viên thực tập (Intern)
| Màn hình | Nội dung |
|---|---|
| Bảng điều khiển | Tổng quan nhiệm vụ, sprint hiện tại, nhiệm vụ tập trung |
| Phỏng vấn đầu vào | Chọn vai trò nghề → phỏng vấn AI 10 câu (lưu nháp, hỏi làm rõ, nộp bài) → kết quả |
| Đồ án của tôi | Thông tin đồ án + gói học tập |
| Sprint | Kanban 4 cột, tự chuyển todo→doing→review |
| Nhiệm vụ | Danh sách + chi tiết: đề bài, bàn giao PR, thảo luận, lịch sử |
| AI Mentor | Chat nhiều hội thoại, có ngữ cảnh nhiệm vụ |
| Hiệu suất / Đánh giá / KPI / Lương ảo / Chứng nhận | Chỉ số cá nhân, điểm rubric, bảng lương ảo, tải PDF chứng nhận |
| Gợi ý AI | Đề xuất tập trung + hành động, làm mới theo yêu cầu |

### Giảng viên (Instructor)
- Tổng quan dashboard + thẻ từng phiên
- **Phiên thực tập**: tạo, thành viên/giảng viên, cột mốc, dòng thời gian, GitHub provisioning, chuyển trạng thái
- **Lớp học**: buổi học, điểm danh
- **Đồ án / Sprint**: quản lý + board + biểu đồ burndown (SVG)
- **Nhiệm vụ**: tạo/giao/chỉnh sửa, **chấm bài nộp rubric 6 tiêu chí**, review AI
- **Đánh giá**: kỳ đánh giá, bảng chấm điểm, Gợi ý AI, chốt điểm
- Ứng viên, hiệu suất sinh viên, báo cáo (PDF/XLSX), chuyên cần, **lập kế hoạch sprint bằng AI**, chia sẻ truy cập

### Quản trị viên (Admin)
Người dùng (kèm mật khẩu tạm), vai trò & quyền, nhóm, phiên/lớp/đồ án/sprint/nhiệm vụ, phân công, **đợt tuyển dụng + hồ sơ ứng viên**, vai trò nghề, ngân hàng câu hỏi, KPI (tính/chốt), lương ảo (sinh + điều chỉnh), chứng nhận (cấp/thu hồi/tra cứu công khai), kho tri thức, danh mục, báo cáo, nhật ký kiểm toán, AI Agents (chạy + poll), hàng đợi email, cấu hình & trạng thái hệ thống.

## 🛠 Tech stack

| Thành phần | Công nghệ |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons |
| State | Zustand (phiên/điều hướng) + TanStack Query (dữ liệu) |
| API | Fetch wrapper tự viết: Bearer + auto-refresh 401, envelope `{data, meta}` |

## 🚀 Chạy dự án

```bash
bun install

# Chạy backend V-Intern-BE trước (port 8080 mặc định)
# https://github.com/vanhoi04082006-pixel/V-Intern-BE

bun run dev   # port 3000
```

Mở [http://localhost:3000](http://localhost:3000).

### Biến môi trường (`.env`)

```bash
# Backend NestJS — mọi request /api/v1/* được proxy sang đây
BACKEND_URL=http://localhost:8080

# (Tuỳ chọn) Browser gọi thẳng BE, bypass proxy.
# Nếu đặt, nhớ thêm origin FE vào CORS_ORIGINS của BE.
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Cách hoạt động: `next.config.ts` rewrite `/api/v1/:path*` → `BACKEND_URL/api/v1/:path*`. Refresh cookie HttpOnly (`Path=/api/v1/auth`) hoạt động ngay trên origin FE.

## 📁 Cấu trúc

```
src/
├── app/                      # Route "/" duy nhất (SPA hash routing)
│   ├── layout.tsx            # Root layout + theme provider
│   └── page.tsx              # → <VInternApp/>
├── components/
│   ├── app-shell.tsx         # Điều phối: landing/auth/app/apply/verify/github-invite
│   ├── landing/              # Landing page sections
│   ├── auth/                 # Đăng nhập / đăng ký / đổi mật khẩu
│   ├── public/               # Apply, Verify, GitHub invite
│   ├── shared/kit.tsx        # UI kit: PageHeader, ListTable, StatusBadge, Pager…
│   └── workspace/
│       ├── workspace.tsx     # Shell: sidebar theo quyền + section router
│       └── views/            # 47 view theo vai trò + dùng chung
├── lib/
│   ├── api/                  # Transport + 8 domain API (contract BE)
│   │   ├── transport.ts      # Fetch + error envelope tiếng Việt
│   │   ├── client.ts         # request() auto-refresh 401 + pagination
│   │   ├── intern.ts tasks.ts academic.ts evaluation.ts
│   │   └── recruitment.ts finance.ts admin.ts insight.ts
│   ├── auth/                 # session (in-memory + BroadcastChannel) + auth-service
│   └── store.ts              # Zustand: view/section/user
└── hooks/                    # use-toast, use-mobile
```

### Định tuyến SPA

```
#/                 → Landing
#/login            → Đăng nhập / Đăng ký
#/app/<section>    → Workspace (section theo vai trò + quyền)
#/apply            → Nộp CV (ứng viên)
#/verify?token=…   → Kích hoạt link ứng viên
#/github-invite    → Kết quả OAuth GitHub
```

## 📜 Scripts

```bash
bun run dev     # Dev server port 3000
bun run build   # Production build
bun run start   # Chạy production
bun run lint    # ESLint
```

---

Made with 💙 — kết nối 100% API [V-Intern-BE](https://github.com/vanhoi04082006-pixel/V-Intern-BE).
