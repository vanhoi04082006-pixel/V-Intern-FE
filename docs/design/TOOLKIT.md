# Công cụ thiết kế và cách tái lập kiểm tra

Hallmark và Impeccable phục vụ quy trình audit/refinement; ứng dụng không import chúng ở runtime. Phần cài đặt nằm trong repository frontend. Không cài global, không commit binary, profile trình duyệt, dữ liệu QA hoặc secret.

## Chuẩn bị

Tại workspace V-INTERN, trước mọi package manager/build/test, chạy script storage trong **cùng process PowerShell**:

```powershell
& ..\manual-runtime\Use-ProjectStorage.ps1
# cwd: repository frontend
npm ci
npm ci --prefix tools/design
```

Máy clone riêng repository có thể dùng `scripts/Use-ProjectStorage.ps1` theo hướng dẫn bàn giao, cấu hình thư mục lưu dữ liệu đúng máy trước khi chạy. Không commit `.npmrc` chứa đường dẫn riêng hoặc credential.

## Khôi phục skill

```powershell
npx impeccable@4.7.0 install
npx skills add nutlope/hallmark
```

Chọn phạm vi **project**, không chọn global. `impeccable@4.7.0` đã được đối chiếu với package thực tế trong cache project; engine Windows của lần nghiệm thu là 0.1.16. Hallmark báo version 2.0.0, nguồn và hash được lưu ở `skills-lock.json`. CLI `skills` không được pin trong lần cài gốc: lần khôi phục phải đối chiếu hash thay vì giả định latest giống bản nghiệm thu.

Trong assistant có hỗ trợ slash command, `/impeccable init` đọc/tạo bối cảnh. Repository đã có `PRODUCT.md` và `DESIGN.md`: đọc và tiếp tục, không khởi tạo lại bối cảnh hay tự đổi hướng thiết kế. Launcher `impeccable context` chỉ chạy một lần mỗi session theo SKILL.md.

## Inventory và audit

```powershell
node tools/design/inventory.mjs .hallmark/source-inventory.json
node tools/design/audit.mjs
```

Inventory ghi routes, import, số handler và hash source. Đây là ledger hỗ trợ review, không chứng minh behavior tương đương chỉ bằng số đếm. `audit.mjs` bỏ test fixture và trang chủ/brand components vì `/` nằm ngoài phạm vi; toàn bộ source ứng dụng còn lại vẫn được quét. Script giữ exit code lỗi của Hallmark, không lọc bỏ finding để tạo pass.

Để render, dùng Chrome có sẵn trên máy. Không cần tải browser khác. Đặt đường dẫn phù hợp máy trong process:

```powershell
$env:HALLMARK_PUPPETEER = Join-Path (Get-Location) 'tools/design'
$env:CHROME_PATH = '<đường dẫn Chrome đã cài>'
node tools/design/audit.mjs --render --url http://localhost:3004/login
```

`.hallmark/scoped-audit.json` chứa kết quả thật; `.hallmark/shots` chứa ảnh. Có thể cần quyền chạy Chrome ngoài sandbox. Không được coi `render: skipped` là nghiệm thu trình duyệt.

Trên Windows, detector Impeccable đã cài có thể chạy:

```powershell
& '.agents/skills/impeccable/scripts/bin/windows-x64/impeccable.exe' detect --json src/components
```

Detector không thay thế đánh giá visual, kiểm thử tương tác hoặc kiểm chứng WCAG đầy đủ. Nếu reviewer độc lập không chạy được, ghi rõ chế độ fallback, không tạo điểm đánh giá giả.

## Gate kỹ thuật

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Ngày 27/10, Turbopack từng lỗi khi khởi tạo subprocess PostCSS trên Windows. Build mặc định đã chạy thành công với `$env:NODE_DISABLE_COMPILE_CACHE='1'` trong process đó. Đây là xử lý cache local, không sửa CI sang webpack hoặc bỏ build. Nếu gặp lại lỗi, kiểm tra log trước; không coi mọi build lỗi là cùng nguyên nhân.

## Cách đọc bằng chứng

1. Xem [plan/receipt](REDESIGN-20261026.md) và báo cáo JSON liên kết ở đó.
2. Phân biệt source coverage, browser viewport checks và business mutation checks.
3. Xem finding thô trước khi đọc disposition. Finding stylistic không tự là bug nghiệp vụ, nhưng vẫn phải có giải thích.
4. Không đưa raw screenshot có email QA, token hoặc dữ liệu riêng lên repository public.
