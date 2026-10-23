# Tiếp nhận nhánh Git — 22/10/2026

Nhánh đang làm việc: `feat/ui-ux-overhaul`; HEAD trước bàn giao: `3addc97`. Đã fetch remote trước khi đối chiếu. Working tree có công việc chưa commit từ nhiều lượt; không reset, stash hoặc merge đè.

## Quan hệ với nhánh hiện tại

| Nhánh | Commit | Đã nằm trong HEAD? | Commit riêng | Xử lý |
|---|---|---|---:|---|
| `archive/pre-cleanup-local-work-20261014` | `0c9691d` | Chưa | 1 | Giữ làm mốc phục hồi; không đưa bản cũ vào luồng hiện tại |
| `feat/intern-onboarding-recruitment-ui` | `252b403` | Chưa | 3 | Patch đã tương đương; không cần merge lại |
| `feat/ui-ux-overhaul` | `3addc97` | Có | 0 | Tiếp tục tích hợp tại đây |
| `main` | `b803854` | Có | 0 | Chức năng đã có; không cần merge lại |

## Vì sao không merge mọi nhánh?

Nhánh archive là ảnh chụp công việc cũ, có thể chứa cấu hình hoặc luồng đã được thay thế. “Còn commit riêng” không đồng nghĩa còn thiếu tính năng. `git cherry` giúp tìm patch tương đương nhưng cũng không chứng minh tương đương nghiệp vụ; cần đối chiếu code và test.

### archive/pre-cleanup-local-work-20261014

Patch tương đương: 0; patch khác: 1. Các commit riêng gần nhất:

```text
0c9691d archive: preserve original local work before verified cleanup
```

### feat/intern-onboarding-recruitment-ui

Patch tương đương: 3; patch khác: 0. Các commit riêng gần nhất:

```text
252b403 fix(intern): compact onboarding desktop layouts
a2c16f7 fix(intern): refine onboarding preview experience
fa89202 feat(intern): add onboarding and AI recruitment flow
```

## Quy trình tích hợp tiếp

1. Xem `git status --short` và diff theo từng nhóm UI, nghiệp vụ, tài liệu.
2. Chạy quality gate trong README; không coi log cũ là kết quả của commit mới.
3. Commit theo nhóm đã review, không đưa .env, private, cache hoặc output build vào Git.
4. So sánh nhánh đích với nhánh nguồn và kiểm xung đột trước merge.
5. Chỉ xóa nhánh khi đã xác nhận không còn nội dung cần giữ; giữ nguyên nhánh archive trong lần bàn giao này.

Đợt audit ban đầu không push hoặc thay nhánh remote; lần công bố ngày 23/10 được ghi ở cuối trang. File bằng chứng chi tiết nằm ở `manual-runtime/aurora-handoff-20261022/branch-inventory.json` của workspace local.

## Nhánh local đã dọn trong lần bàn giao

Các nhánh sau được xóa bằng `git branch -d` sau khi kiểm chứng đã là ancestor của HEAD. Không có commit riêng bị mất; không xóa nhánh remote.

| Tên nhánh đã dọn | Commit còn trong lịch sử |
|---|---|
| `chore/local-verification-cleanup` | `681b54c` |
| `feat/admin-repository-account` | `ec46006` |
| `fix/sprint-detail-activation` | `9cb9157` |
| `fix/student-kanban-drag-drop` | `623023b` |

Nếu cần khôi phục **tên nhánh**, chạy trong đúng repository:

```powershell
git branch chore/local-verification-cleanup 681b54c
git branch feat/admin-repository-account ec46006
git branch fix/sprint-detail-activation 9cb9157
git branch fix/student-kanban-drag-drop 623023b
```

Bản đối chiếu trước khi dọn: `manual-runtime/aurora-handoff-20261022/branch-inventory-before-cleanup.json`. Nhánh onboarding FE còn ba commit riêng theo đồ thị nhưng cả ba patch đã tương đương với HEAD; giữ tên nhánh, không merge lại. Nhánh archive tiếp tục được giữ nguyên.


## Công bố code và tài liệu — 23/10/2026

Bản source đã kiểm chứng được commit trên nhánh `feat/ui-ux-overhaul`; commit source mới nhất trước tài liệu là `62131f4`. Hướng dẫn [demo ngắn](DEMO-CHECKLIST.md), [demo chi tiết](DEMO-GUIDE.md) và [nghiệm thu nhập vai](ROLEPLAY-ACCEPTANCE.md) được lưu ngay trong repository để đọc trên GitHub. Các câu mô tả working tree/chưa push ở mốc nghiệm thu bên trên là lịch sử trước lần công bố này. Không force-push, không merge vào main trong lần công bố; tài khoản/mật khẩu, .env và dữ liệu SQL không nằm trong commit.
