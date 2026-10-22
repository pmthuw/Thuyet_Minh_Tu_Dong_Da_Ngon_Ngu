Chạy bằng `npm install` và `npm run dev` (được cấu hình proxy `/api` sang ASP.NET Core ở localhost:5000). Mở http://localhost:5173.

# Google Maps: chọn địa điểm, mở Google Maps để chỉ đường. Menu ngôn ngữ hỗ trợ vi/en/zh/ko/ja/fr. Cần chạy Backend để lấy dữ liệu thật, nếu không sẽ chuyển sang dữ liệu mẫu.

Frontend React + Vite cho hệ thống khám phá POI và nghe thuyết minh đa ngôn ngữ.

## Chạy dự án

Yêu cầu: Node.js LTS.

```bash
npm install
npm run dev
```

## Build kiểm tra

```bash
npm run build
```

## Kết nối Backend

Sao chép `.env.example` thành `.env.local`, sau đó đặt `VITE_API_BASE_URL` theo địa chỉ ASP.NET Core API đang chạy, ví dụ `http://localhost:5000/api`. Khởi động lại Vite sau khi sửa biến môi trường.

Hiện giao diện khám phá sử dụng dữ liệu mẫu trong `src/data.js`; việc hiển thị danh sách chưa tự động gọi API. `src/services/api.js` là lớp tiện ích sẵn sàng cho bước tích hợp Backend tiếp theo. Bản đồ hiện tại là bản minh họa, chưa phải bản đồ dịch vụ thực.
