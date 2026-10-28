---
name: V-Intern Workspace
description: Không gian thực tập chuyên nghiệp, xanh dương, ưu tiên công việc và bằng chứng.
colors:
  primary: "#0c67ed"
  primary-deep: "#0a57cb"
  canvas: "#f8fafd"
  surface: "#ffffff"
  ink: "#16243e"
  secondary-text: "#4b5e78"
  separator: "#dce4f0"
  input-stroke: "#8091aa"
  success: "#276e53"
  warning: "#8b6019"
  destructive: "#ac3654"
typography:
  display:
    fontFamily: Geist
    fontSize: 2.25rem
    fontWeight: 650
  page:
    fontFamily: Geist
    fontSize: 1.75rem
    fontWeight: 650
  section:
    fontFamily: Geist
    fontSize: 1.25rem
    fontWeight: 650
  body:
    fontFamily: Geist
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.6
  small:
    fontFamily: Geist
    fontSize: 0.8125rem
  caption:
    fontFamily: Geist
    fontSize: 0.75rem
rounded:
  tight: 4px
  small: 6px
  control: 8px
  panel: 12px
  dialog: 12px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  section: 40px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
---

# Design System: V-Intern

## Overview

**Creative North Star: "Không gian thực tập có bằng chứng"**

Ba vai dùng một ngôn ngữ hình ảnh: nền sáng hơi xanh, chữ navy, xanh dương cho hành động và điều hướng. Mục tiêu là nhìn ra công việc cần làm, hiểu trạng thái, rồi đi đến bằng chứng hoặc thao tác tiếp theo. Đây là hướng thiết kế theo brief người dùng, không phải theme demo của toolkit.

Phạm vi gồm ứng dụng Admin, giảng viên, sinh viên, xác thực, CV, phỏng vấn và xác minh. **Trang chủ `/` giữ nguyên**. Nguồn token chạy thật là [`src/styles/tokens.css`](src/styles/tokens.css); bảng trong tài liệu là bản chụp để đọc, không phải bộ cấu hình thứ hai. Xem [nghiệm thu](docs/design/REDESIGN-20261026.md) để phân biệt triển khai với bằng chứng kiểm thử.

## Colors

Primary là xanh dương rõ, không ngả tím. Neutral tạo độ sâu qua nền, chữ và đường chia; không tô mọi badge bằng primary. `success`, `warning`, `destructive`, `info` luôn đi cùng nhãn chữ hoặc thông báo có nghĩa.

Token có ba tầng: `--app-primary-*`/`--app-neutral-*` → `--primary`/`--background`/`--foreground` → alias thành phần như `--ws-primary`, `--ins-blue`. Tailwind 4 ánh xạ bằng `@theme inline`. Component dùng `bg-primary`, `text-foreground`, `border-input` hoặc `var(--...)`; không thêm HEX/RGB cục bộ.

Theme ứng dụng đặt ở `.workspace-ui` và `.app-surface`. `.dark` có ánh xạ semantic riêng. Khai báo theme gốc cho trang công khai được giữ nguyên; không đổi palette trang chủ bằng cách sửa token dùng chung một cách vô tình. Màu logo Google là token thương hiệu bên ngoài, không dùng làm palette trang chức năng.

## Typography

`font-heading` và `font-body` đều ánh xạ tới Geist đã tự host, có tiếng Việt. Giữ font hiện có để không tải thêm family tương đương; hierarchy đến từ kích thước, trọng lượng và khoảng cách. Geist Mono dành cho mã nguồn/định danh kỹ thuật. Không dùng chữ viết tay để trình bày dữ liệu nghiệp vụ.

| Vai trò | Utility/token | Kích thước |
|---|---|---|
| Display hiếm dùng | `text-display` | 36px |
| Tiêu đề trang / chỉ số chính | `text-page` / `text-metric` | 28px |
| Tiêu đề section | `text-section` | 20px |
| Tiêu đề nhóm | `text-subsection` | 16px |
| Nội dung giao diện | `text-body` | 14px |
| Thông tin phụ | `text-small` | 13px |
| Metadata, label | `text-caption`, `text-label` | 12px |

Body có line-height 1.6; đoạn cần đọc sâu dùng 1.75 và tối đa 72ch. Không dùng caption cho đoạn hướng dẫn dài. Heading được wrap tự nhiên, balance khi phù hợp; không ép nhãn thành một dòng nếu làm mất nội dung trên điện thoại.

## Layout

Sidebar rộng 15rem, topbar 4rem, container tối đa 96rem. Spacing theo đơn vị 4px: 0/4/8/12/16/20/24/28/32/40/48/64. Tailwind dùng scale chuẩn; CSS dùng `--space-*`. Giá trị chiều rộng theo dữ liệu biểu đồ hoặc kích thước vùng cuộn là ràng buộc kỹ thuật, không phải spacing tùy hứng.

Trang làm việc dùng heading, divider, list/table và vùng thao tác. Card dành cho object độc lập như mẫu dự án. Dashboard dẫn bằng công việc và vấn đề cần xử lý; số liệu phải nói rõ phạm vi dữ liệu. Thống kê mở rộng và bằng chứng dài có disclosure, vẫn truy cập được bằng bàn phím và liên kết trong trang.

Desktop giữ navigation cạnh trái. Mobile dùng drawer quản lý focus; các mục điều hướng cục bộ có vùng cuộn ngang riêng. Bảng rộng cuộn bên trong container, không kéo cả trang. Form và action xếp lại theo chiều dọc. Ma trận kiểm thử: 375/480/768/1024/1280/1440px.

## Elevation & Depth

Ưu tiên nền và đường chia nhẹ. Shadow diễn đạt độ nổi của control/popover, không làm trang trí quanh mọi section. Các token `--elevation-xs/sm/md/popover` lần lượt có độ lệch và blur 0 1px 2px / 0 2px 6px / 0 4px 12px / 0 8px 24px; màu navy pha 5/7/9/12%.

## Shapes

Control 8px; panel và dialog 12px; badge nhỏ 4–6px. Không dùng pill mặc định cho button hoặc navigation. Trạng thái active trong sidebar dùng chữ, màu nền nhẹ và chỉ báo cạnh trái. Dữ liệu hồ sơ là dòng thông tin, không phải một card cho từng field.

## Components

| Nhu cầu | Thành phần cần tái dùng | Quy tắc |
|---|---|---|
| Header | `WorkspacePageHeader`, `StudentPageHeader`, Instructor UI | Một H1; mô tả ngắn; action gắn với trang |
| Button/form | `product/primitives.tsx`: `btn`, `inputClass`, `Field` | Giữ label, validation, disabled và trạng thái pending |
| Feedback | `InlineAlert`, `DataState`, empty/loading/error primitives | Thành công chỉ sau acknowledgement; lỗi xóa thành công cũ |
| Dialog | Modal hiện có + `trapDialogFocus` | Escape, focus trap, trả focus; không thêm library chỉ cho một chi tiết |
| Bảng/danh sách | Table/Pager, collection components | Header dễ scan, status có chữ, action truy cập được |
| Biểu đồ | `workspace-charts.tsx` | Dữ liệu thật, legend bằng bàn phím, số liệu đọc được ngoài hình |
| Hồ sơ | `product/profile.tsx` | Nhóm thông tin bằng heading và divider; refresh có feedback |
| Dự án | `projects/*` | Tên, phạm vi, tech stack, metadata và action rõ |
| Phiên | `session-section.tsx`, `instructor-ui.tsx` | Anchor mở disclosure đích; không giấu nội dung khỏi chức năng |

Motion: 160/200/240ms; stagger 40ms; chỉ transform/opacity cho chuyển động. Chart legend hover nhẹ với spring bounce 0, visualDuration 0.16s. Không chạy animation nền liên tục. Reduced motion đặt duration/stagger về 0 và bỏ transform trang trí; feedback trạng thái vẫn còn.

Visible focus dùng `--ring`, có offset. Input stroke dùng `--input`; placeholder dùng `--muted-foreground`. Checkbox ẩn native input phải giữ focus trên nhãn/control hiển thị. Không chỉ dựa vào opacity để giải thích trạng thái disabled.

## Do's and Don'ts

- Dùng token semantic và component đang có trước khi tạo abstraction mới.
- Giữ nguyên route, API, quyền, form, điều kiện nghiệp vụ và nội dung bằng chứng.
- Phân biệt đề xuất Agent, kết quả runner và điểm quyết định của giảng viên.
- Dùng dữ liệu trống/lỗi đúng nghĩa, không tạo metric hoặc thành tích giả.
- Không thêm gradient, glass, shadow lớn, hero khổng lồ để thay cho hierarchy.
- Không bỏ assertion hoặc làm nhẹ CI để đạt yêu cầu thị giác.
- Kiểm tra trang mới ở sáu kích thước, bàn phím và reduced motion; chạy gate được mô tả trong [toolkit](docs/design/TOOLKIT.md).
