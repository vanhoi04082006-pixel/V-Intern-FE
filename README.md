# V-Intern — Nền tảng thực tập ảo cho sinh viên Việt

> Hành trình thực tập đầu tiên, được thiết kế như một người đồng hành thật sự — không phải một dashboard lạnh lùng.

V-Intern là nền tảng mô phỏng trải nghiệm thực tập chuyên nghiệp: sinh viên nhận nhiệm vụ theo sprint, làm việc trên kanban board, trò chuyện với **AI Mentor** và theo dõi quá trình phát triển của chính mình. Giảng viên và quản trị viên có góc nhìn riêng để dẫn dắt cả nhóm.

## ✨ Tính năng

- **Landing page** — hero, giới thiệu đối tượng, cách hoạt động, quy trình, demo phỏng vấn AI, CTA cuối trang, dark/light mode
- **Đăng nhập / Đăng ký** — 3 vai trò: Intern (sinh viên), Instructor (giảng viên), Admin
- **Dashboard** — tổng quan nhiệm vụ, tiến độ sprint, hoạt động gần đây
- **Sprint Board** — kanban kéo-thả (dnd-kit) với Todo / In Progress / Review / Done
- **Tasks** — quản lý nhiệm vụ theo độ ưu tiên, điểm số, hạn chót
- **Projects** — danh mục dự án với tiến độ từng hạng mục
- **Roster** — danh sách thành viên, lọc theo vai trò
- **AI Mentor** — chat với AI có nhớ ngữ cảnh, hiểu nhiệm vụ đang làm của sinh viên
- **Performance** — biểu đồ hiệu suất (recharts)
- **Settings** — cập nhật hồ sơ cá nhân

## 🎨 Design system

Bộ ba **Xanh dương / Trắng / Đen** làm chủ đạo:

- Xanh dương (blue) — màu thương hiệu, điểm nhấn hành động
- Trắng — không gian thoáng, nội dung là trung tâm
- Đen — chữ, viền, dark mode đầy đủ

Phong cách **thân thiện, có điểm nhấn vẽ tay (doodles)**, micro-interaction nhẹ tay bằng framer-motion, không "máy móc như AI".

## 🛠 Tech stack

| Thành phần | Công nghệ |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons |
| Animation | framer-motion |
| Drag & drop | dnd-kit |
| Charts | recharts |
| State | Zustand |
| Database | Prisma ORM + SQLite |
| AI | z-ai-web-dev-sdk (AI Mentor chat) |

## 🚀 Chạy dự án

```bash
# Cài dependencies
bun install

# Khởi tạo database (SQLite) + dữ liệu mẫu
bun run db:push

# Chạy dev server
bun run dev
```

Mở [http://localhost:3000](http://localhost:3000).

> **Lưu ý:** Tính năng AI Mentor sử dụng `z-ai-web-dev-sdk` và cần cấu hình biến môi trường tương ứng. Các tính năng còn lại hoạt động độc lập.

### Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Sinh viên | `intern@v-intern.vn` | `123456` |
| Giảng viên | `instructor@v-intern.vn` | `123456` |
| Quản trị | `admin@v-intern.vn` | `123456` |

Dữ liệu mẫu tự sinh khi truy cập lần đầu (seed).

## 📁 Cấu trúc thư mục

```
src/
├── app/                  # App Router: layout, landing page, API routes
│   ├── api/              # auth, workspace, tasks, profile, ai/chat
│   ├── layout.tsx        # Root layout + theme provider
│   └── page.tsx          # Entry (landing / auth / workspace)
├── components/
│   ├── landing/          # Các section của landing page
│   ├── workspace/        # Shell + 8 views (dashboard, sprint, tasks, ...)
│   ├── auth/             # Đăng nhập / đăng ký
│   └── ui/               # shadcn/ui components
├── hooks/                # use-toast, use-mobile
└── lib/                  # db, seed, auth (scrypt), types, store, utils
prisma/
└── schema.prisma         # User, Sprint, Task, Project, ChatMessage
```

## 📜 Scripts

```bash
bun run dev         # Dev server (port 3000)
bun run build       # Production build
bun run start       # Chạy production
bun run lint        # ESLint
bun run db:push     # Đẩy schema lên SQLite
bun run db:generate # Sinh Prisma Client
```

---

Made with 💙 — thiết kế lại toàn diện UI/UX trên nhánh `feat/ui-ux-redesign`.
