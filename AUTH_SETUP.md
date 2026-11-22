# Thiết lập xác thực và phân quyền

## 1. Cấu hình môi trường

Sao chép `.env.example` thành `.env.local`, sau đó điền thông tin MySQL của bạn. `JWT_SECRET` phải là chuỗi ngẫu nhiên riêng, tối thiểu 32 ký tự. Không commit `.env.local` lên GitHub.

Có thể tạo secret bằng PowerShell:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

## 2. Database

Bảng `users` hiện tại đã có đủ các cột `id`, `name`, `email`, `password`, `avatar`, `role`, `created_at`, `updated_at`. Không cần chạy ALTER TABLE.

Mật khẩu đăng ký mới được lưu bằng bcrypt. Nếu các tài khoản cũ đang lưu mật khẩu dạng chữ thường (ví dụ `123456`), đăng nhập bằng code mới sẽ không hoạt động với những tài khoản đó. Hãy tạo tài khoản mới qua trang đăng ký hoặc đặt lại mật khẩu cũ theo dạng bcrypt; không được đổi code để chấp nhận mật khẩu chữ thường.

## 3. Chạy dự án

```bash
npm install
npm run dev
```

Mở `http://localhost:3000/register` để tạo tài khoản USER.

## 4. Cấp quyền ADMIN

Đăng ký tài khoản bình thường, sau đó dùng MySQL Workbench chạy câu lệnh với đúng email vừa đăng ký:

```sql
UPDATE users
SET role = 'ADMIN'
WHERE email = 'email-cua-ban@example.com';
```

Đăng xuất rồi đăng nhập lại. Tài khoản ADMIN sẽ thấy liên kết Quản trị và truy cập `/admin`. API `/api/admin/users` cũng kiểm tra quyền ở phía server.

Không có chức năng tự chọn ADMIN trong form đăng ký. Chỉ người có quyền truy cập MySQL hoặc một quy trình quản trị đã được bảo vệ mới được cấp quyền.

## 5. Các URL

- `POST /api/auth/register`: đăng ký USER.
- `POST /api/auth/login`: đăng nhập, đặt cookie HttpOnly.
- `POST /api/auth/logout`: xóa cookie.
- `GET /api/auth/me`: trả về người dùng hiện tại (không trả mật khẩu).
- `GET /api/admin/users`: chỉ ADMIN được gọi.
- `/admin`: trang quản trị chỉ ADMIN được xem.

Cookie xác thực dùng HttpOnly, SameSite=Strict, Secure khi chạy production và hết hạn sau 7 ngày. Role được đọc lại từ MySQL ở mỗi lần xác thực để thay đổi quyền có hiệu lực ngay.
