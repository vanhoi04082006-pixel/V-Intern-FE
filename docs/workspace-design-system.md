# Aurora Glass: token, scope và bảo trì

## Nguồn thiết kế đang áp dụng

`src/components/workspace/aurora.css` được import sau `workspace.css` trong layout của hai vai trò. Class `aurora-workspace` gắn vào wrapper giảng viên, InternShell và OnboardingShell. Component dùng lại vẫn hoạt động khi render trong Admin mà không mang theme mới.

## Ba tầng token

| Tầng | Ví dụ | Trách nhiệm |
|---|---|---|
| Primitive | --aurora-violet, --aurora-lavender, --aurora-mint | Giá trị màu gốc |
| Semantic | --ws-primary, --ws-ink, --ws-line, --ws-success | Ý nghĩa sử dụng |
| Component | --aurora-panel, --aurora-shadow, --aurora-rail-width | Bề mặt và bố cục |

Student/instructor aliases cũ tiếp tục tham chiếu semantic workspace. Không đổi primary global chỉ để sửa một workspace.

## Kích thước và nhịp

- Radius: 8px nhỏ, 10px control, 16px object, 24px shell/hero.
- Spacing dùng nhịp 4/8/12/16/24/32; panel đủ khoảng đọc nhưng không phồng padding vô ích.
- Desktop rail 256px, giảm còn 224px ở 1024–1279; dưới 1024 dùng drawer.
- Header mobile bỏ hình trang trí để dành diện tích cho nội dung và hành động.
- Tab cho phép cuộn trong vùng riêng, không làm tăng chiều rộng document.

## Trạng thái và motion

Focus-visible có outline rõ. Màu trạng thái đi cùng chữ. Hover thay nền/shadow nhẹ, pressed dịch tối đa 1px. Reduced motion tắt transition/animation; reduced transparency bỏ blur navigation; forced colors có outline/border có nghĩa.

Chart dùng dữ liệu hiện tại, không tự sinh chuỗi lịch sử. Tỷ lệ chưa đo được giữ là null. Đường donut có legend để đọc giá trị không cần phân biệt màu.

## Cách sửa tiếp

1. Tìm selector đang tác động trong CSS theo vai trò, workspace.css và aurora.css.
2. Sửa đúng semantic/component token hoặc selector có phạm vi; tránh selector chung cho toàn app.
3. Kiểm cả hai vai trò và onboarding vì component được dùng lại.
4. Kiểm trang chủ/Admin để phát hiện rò rỉ style.
5. Lưu ảnh và kết quả ở bằng chứng của lượt kiểm tra mới.

Aurora là lớp chuyển tiếp trên kiến trúc CSS hiện có. Chưa loại bỏ toàn bộ rule lịch sử; việc hợp nhất CSS sau này cần regression riêng. Xem [HANDOVER](HANDOVER.md) và [VERIFICATION](VERIFICATION.md).
