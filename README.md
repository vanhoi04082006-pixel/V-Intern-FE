# V-Intern Frontend

Landing page của **V-Intern** — nền tảng thực tập ảo ứng dụng AI, mô phỏng môi
trường làm việc thực tế giúp sinh viên trải nghiệm quy trình phát triển phần
mềm chuyên nghiệp, kết nối sinh viên - giảng viên - doanh nghiệp.

Đây là **repository frontend standalone** (Next.js App Router). Source nằm ngay
tại root của repo.

## Yêu cầu

- **Node.js 22+**
- **npm** (package manager duy nhất của repo — dùng `package-lock.json`)

## Cài đặt

```bash
npm install   # hoặc: npm ci (khi đã có package-lock.json)
```

## Environment variables

Copy `.env.example` thành `.env` và điền giá trị nếu cần. Hiện tại:

| Biến | Bắt buộc | Mô tả |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Không | Base URL của backend V-Intern. Chưa có contract → để trống; form newsletter sẽ hiển thị trạng thái "chưa kết nối". |

## Chạy dự án

```bash
npm run dev   # dev server ở http://localhost:3001
```

> Frontend chạy ở **port 3001** — port 3000 được dành cho backend V-Intern.

## Kiểm tra chất lượng

```bash
npm run lint        # ESLint (flat config Next.js + TypeScript)
npm run typecheck   # tsc --noEmit (strict)
npm run test        # Vitest + Testing Library (run một lần)
npm run test:watch  # Vitest watch mode
npm run build       # production build
npm run start       # chạy build ở port 3001
```

## Cấu trúc chính

```text
src/
├── app/                 # App Router: layout, page (landing), globals.css
├── components/v-intern/ # Component của landing page
└── lib/                 # Utility (cn, ...)
```

## Git workflow

```text
main                        # stable / release — không commit trực tiếp
└── develop                 # integration branch của team FE — không commit trực tiếp
      └── feat/* fix/* chore/*   # branch cho từng task
```

- Tạo branch từ `develop`: `git switch -c feat/<ten-task> develop`
- Mọi thay đổi vào repo qua **Pull Request → `develop`** (CI phải xanh).
- `develop → main` chỉ qua release PR sau khi QA.
