# Cài đặt chức năng Blog

## 1. Sao lưu database và chạy migration

Chọn database `ttcn` trong MySQL Workbench/phpMyAdmin, mở file `blog_migration.sql` và chạy **một lần**. File này tận dụng ba bảng `blogs`, `blog_images`, `blog_likes` hiện có; chỉ bổ sung `category_id`, `excerpt`, `view_count`, `published_at` và tạo `blog_comments`.

Nếu MySQL báo lỗi `Duplicate column name`, có nghĩa là một phần migration đã được chạy trước đó. Kiểm tra `SHOW COLUMNS FROM blogs;` trước khi chạy lại từng câu lệnh còn thiếu. Không chạy lại toàn bộ migration sau khi đã thành công.

## 2. Chạy dự án

```bash
npm install
npm run dev
```

Mở `http://localhost:3000/blogs`.

## 3. Luồng sử dụng

- Người chưa đăng nhập: xem danh sách và bài viết đã xuất bản.
- USER: đăng bài gắn với một địa điểm có sẵn, tải ảnh JPG/PNG/WEBP/GIF tối đa 5MB/ảnh, lưu nháp hoặc gửi duyệt; quản lý, sửa và xóa bài của mình; thích và bình luận/trả lời.
- Bài gửi duyệt có trạng thái `pending`; chỉ `published` được hiển thị công khai.
- ADMIN: vào `/admin/blogs` để duyệt, từ chối, xem và xóa bài viết; có thể ẩn bình luận trên trang chi tiết.

## 4. Các trang

- `/blogs`: danh sách, tìm kiếm, lọc danh mục, phân trang.
- `/blogs/[id-hoặc-slug]`: nội dung, ảnh, lượt xem, lượt thích, bình luận, trả lời và bài cùng địa điểm.
- `/blogs/create`: tạo bài viết.
- `/blogs/edit/[id]`: sửa bài viết của mình.
- `/my-blogs`: quản lý bài viết cá nhân.
- `/admin/blogs`: quản trị và duyệt bài viết (ADMIN).

## 5. Lưu ý triển khai ảnh

Ảnh hiện được lưu trong `public/uploads/blogs`. Cách này phù hợp để chạy local/Wamp/Node server có ổ đĩa ghi được. Nếu deploy lên nền tảng serverless hoặc nhiều máy chủ, cần chuyển ảnh sang dịch vụ lưu trữ object (ví dụ S3/Cloudinary) vì thư mục local có thể không tồn tại lâu dài hoặc không chia sẻ giữa các instance.

## 6. Bảo mật

API kiểm tra đăng nhập ở server, kiểm tra chủ sở hữu khi sửa/xóa, kiểm tra quyền ADMIN khi duyệt/xóa nội dung. Không dựa vào việc ẩn nút trên giao diện để phân quyền.
