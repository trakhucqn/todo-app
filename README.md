# Todo List

Ứng dụng web quản lý công việc đơn giản, xây dựng bằng **Node.js** và **Express**, giao diện HTML/CSS/JavaScript thuần (không cần framework).

## Tính năng

- Thêm, sửa, xóa công việc
- Đánh dấu hoàn thành / chưa hoàn thành
- Lọc theo: Tất cả · Đang làm · Đã xong
- Thanh tiến độ hiển thị tỉ lệ công việc đã hoàn thành
- Xóa nhanh toàn bộ công việc đã xong
- Nhấp đúp vào công việc để sửa tiêu đề (Enter để lưu, Esc để hủy)
- Tự động chuyển giao diện sáng/tối theo cài đặt hệ điều hành
- Dữ liệu được lưu vào file `todos.json`, không mất khi khởi động lại server

## Yêu cầu

- [Node.js](https://nodejs.org/) phiên bản 18 trở lên

## Cài đặt và chạy

```bash
git clone https://github.com/trakhucqn/todo-app.git
cd todo-app
npm install
npm start
```

Mở trình duyệt tại **http://localhost:3000**.

Khi phát triển, dùng lệnh sau để server tự khởi động lại mỗi khi sửa code:

```bash
npm run dev
```

Đổi cổng bằng biến môi trường `PORT`, ví dụ trên PowerShell:

```powershell
$env:PORT=8080; npm start
```

## Cấu trúc thư mục

```
todo-app/
├── public/
│   └── index.html    # Giao diện người dùng
├── server.js         # Server Express và các API
├── package.json
└── todos.json        # Dữ liệu (tự tạo khi chạy, không đưa lên Git)
```

## API

Tất cả API nhận và trả về JSON.

| Phương thức | Đường dẫn              | Mô tả                          |
|-------------|------------------------|--------------------------------|
| `GET`       | `/api/todos`           | Lấy danh sách công việc        |
| `POST`      | `/api/todos`           | Thêm công việc mới             |
| `PUT`       | `/api/todos/:id`       | Cập nhật tiêu đề hoặc trạng thái |
| `DELETE`    | `/api/todos/:id`       | Xóa một công việc              |
| `DELETE`    | `/api/todos/completed` | Xóa tất cả công việc đã xong   |

### Ví dụ

Thêm công việc:

```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Mua sữa"}'
```

Kết quả:

```json
{
  "id": 1,
  "title": "Mua sữa",
  "completed": false,
  "createdAt": "2026-10-27T14:26:27.244Z"
}
```

Đánh dấu hoàn thành:

```bash
curl -X PUT http://localhost:3000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### Mã lỗi

| Mã    | Ý nghĩa                                  |
|-------|------------------------------------------|
| `400` | Tiêu đề bị để trống                      |
| `404` | Không tìm thấy công việc với `id` đã cho |
