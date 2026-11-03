# Getting started

Hướng dẫn này đưa một checkout mới từ “chưa có gì” đến giao diện chạy được với API thật. Nếu máy đã có môi trường V-INTERN, bỏ qua phần cài đặt và đọc mục [Giữ tài nguyên trong workspace](#2-giữ-tài-nguyên-trong-workspace).

## 1. Yêu cầu

| Thành phần | Phiên bản / ghi chú |
|---|---|
| Node.js | **22 trở lên** (theo `engines` trong `package.json`) |
| npm | Đi kèm Node; dùng đúng `package-lock.json` |
| NestJS API | Chạy tại `http://localhost:8080/api/v1` hoặc URL bạn cấu hình |
| SQL Server | 2019; API phải kết nối và trả `database: ok` |
| Trình duyệt | Chrome/Edge mới nhất để kiểm tra giao diện |

Frontend **không** tự dựng database, không seed dữ liệu và không có mock server mặc định. Nếu API chưa sẵn sàng, giao diện sẽ báo lỗi cấu hình/kết nối thay vì hiển thị dữ liệu giả.

## 2. Giữ tài nguyên trong workspace

Repository này được thiết kế để dependency, cache, log và bằng chứng nằm dưới ổ dự án, không rải ra ổ C. Trong **mỗi cửa sổ PowerShell** trước khi chạy npm/build/test:

```powershell
& .\scripts\Use-ProjectStorage.ps1
```

Script đặt `TEMP`, `TMP`, cache npm/Node/Playwright và thư mục runtime vào `E:\Projects\V-INTERN\.runtime`. Không cài dependency bằng lệnh global thay cho lockfile.

## 3. Cấu hình môi trường

```powershell
# Chỉ chạy khi CHƯA có .env
Copy-Item .env.example .env
```

| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Có | Base URL đầy đủ của Nest API, gồm `/api/v1` |

Ví dụ:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

Lưu ý:

- `NEXT_PUBLIC_*` được nhúng vào bundle lúc **build**. Đổi `.env` rồi chỉ restart `next start` sẽ **không** cập nhật bundle cũ.
- Không đặt token, mật khẩu hay secret vào biến `NEXT_PUBLIC_*`.
- Không ghi đè `.env` đang dùng của máy bàn giao. Đối chiếu tên biến với `.env.example` trước khi sửa.
- API phải cho phép đúng origin của FE (ví dụ `http://localhost:3001`) và bật credentials.

## 4. Cài dependency

```powershell
& .\scripts\Use-ProjectStorage.ps1
npm ci
```

Dùng `npm ci` khi tiếp nhận hoặc trong CI. Dùng `npm install` chỉ khi bạn chủ động thay đổi dependency và sẽ commit cả `package-lock.json`.

## 5. Chạy development

```powershell
& .\scripts\Use-ProjectStorage.ps1
npm run dev
```

Mở **http://localhost:3001**. Dev server cập nhật khi sửa source.

## 6. Chạy bản production

```powershell
& .\scripts\Use-ProjectStorage.ps1
npm run build
npm start
```

Bản `next start` dùng output đã build; sửa source **không** tự cập nhật. Sau khi build thành công, restart đúng process FE.

Trên máy bàn giao, dùng launcher của workspace thay vì mở thêm process:

```powershell
& ..\manual-runtime\restart-owned-apps.ps1 -Frontend
```

Không chạy hai process dev dùng chung thư mục `.next`. Nếu cổng 3001 bận, kiểm tra PID/command line trước; không dừng toàn bộ Node trên máy.

## 7. Cổng và địa chỉ tham chiếu

| Thành phần | Địa chỉ thường dùng | Ghi chú |
|---|---|---|
| FE chính | `http://localhost:3001` | Dev hoặc `next start` |
| API chính | `http://localhost:8080/api/v1` | Swagger tại `/api/docs` |
| API QA | `http://localhost:8081/api/v1` | Database và tài khoản riêng |
| FE QA | `http://localhost:3004` | Dùng khi chạy harness full-stack |

Các giá trị trên là **môi trường local tham chiếu**, không phải hằng số trong code. Luôn kiểm tra `.env` và process đang chạy.

## 8. Xác nhận đúng bản

Kiểm tra theo thứ tự, từ tầng thấp đến tầng cao:

1. **API sống:** `GET /api/v1/health` trả `database: ok` từ truy vấn SQL thật.
2. **Swagger đúng bản:** mở `/api/docs`, xem route/DTO hiện có.
3. **FE trỏ đúng API:** mở DevTools → Network, kiểm request đi tới đúng host/port.
4. **Đăng nhập:** dùng tài khoản local được bàn giao; kiểm tra đúng tên và vai trò.
5. **Dữ liệu thật:** mở một phiên/task đã tồn tại; so sánh góc nhìn sinh viên và giảng viên.

> `ai: configured` chỉ nghĩa là có cấu hình, không chứng minh provider nhận request. Tương tự, FE mở được không chứng minh API hoặc quyền đã đúng.

## 9. Kiểm tra trước khi commit

```powershell
& .\scripts\Use-ProjectStorage.ps1
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Xem [TESTING](TESTING.md) để biết khi nào cần thêm browser test hoặc live harness.

## 10. Khi gặp lỗi

| Triệu chứng | Kiểm tra trước |
|---|---|
| Trang trắng / báo thiếu cấu hình | `NEXT_PUBLIC_API_BASE_URL` có đủ `/api/v1`? Đã build lại sau khi đổi env? |
| API 401 liên tục | Access token, refresh cookie, origin/CORS, đồng hồ máy |
| Đăng nhập xong quay lại login | Cookie `SameSite`/`Secure`, domain, API URL |
| Sửa code nhưng UI không đổi | Đang chạy `next dev` hay `next start`? |
| 429 khi reload nhiều | Rate limit auth; dùng client navigation thay vì hard reload liên tục |
| Dữ liệu của vai khác hiện sai | Kiểm tra tài khoản đang đăng nhập và scope API, không sửa UI để che lỗi |

Đọc thêm [TROUBLESHOOTING](TROUBLESHOOTING.md).
