# AURALIS — Google Maps + 6 ngôn ngữ (Frontend / Backend / Database)

Đây là dự án CNPM của bạn được giữ nguyên cấu trúc tách ba phần, có thêm chỉ đường Google Maps, bản đồ Google nhúng, 6 ngôn ngữ giao diện + thuyết minh.

## Cách mở trong VS Code trên Windows
1. Giải nén toàn bộ ZIP, **File > Open Folder** và chọn thư mục chứa `frontend`, `backend`, `database`, `.vscode`.
2. Cài Node.js (chạy `node -v`) và .NET SDK 10 (`dotnet --version`).
3. Mở **Terminal > New Terminal** (PowerShell) và chạy:

```powershell
cd frontend
npm install
npm run dev
```

4. Bấm dấu `+` trên Terminal để mở PowerShell thứ hai, từ thư mục gốc:

```powershell
cd backend\Auralis.Api
dotnet restore
dotnet run --launch-profile http
```

5. Vào **http://localhost:5173** để mở website; **http://localhost:5000/api/health** để kiểm tra Backend. Nếu dùng VS Code Tasks: chọn **Terminal > Run Task > AURALIS: Chạy cả Frontend + Backend** (sau khi `npm install`).

## Google Maps và chỉ đường
- Chọn địa điểm từ danh sách bên trái. Khung lớn hiển thị bản đồ Google Maps nhúng tại tọa độ của địa điểm. Bấm `Bản đồ AURALIS` để xem lại bản đồ mô phỏng có thể chọn pin.
- Chọn **Đi bộ / Ô tô**, sau đó nhấn **Chỉ đường Google Maps**. Một tab Google Maps mở tuyến đường thật tới tọa độ địa điểm, dựa trên điều kiện giao thông/dữ liệu của Google Maps.
- Nhấn **Vị trí của tôi** để xin quyền GPS. Nếu cấp phép, tọa độ hiện tại sẽ được truyền làm điểm xuất phát. Nếu không, Google Maps tự hỏi/đề xuất điểm xuất phát. Không dùng vị trí mẫu để dẫn đường.
- **Không cần API key** cho bản đồ xem trước công khai (Google Maps iframe) và đường dẫn chỉ đường qua Maps URLs. Đây không phải tích hợp Directions API trong ứng dụng: tuyến đường chi tiết nằm trên Google Maps, không phải bản đồ trong app. Nếu muốn vẽ tuyến nội bộ ngay trên bản đồ Google và nhiều marker tương tác cần thiết lập Google Maps JavaScript API, key, billing/quota.
- Tính năng Google Maps phụ thuộc truy cập Internet và khả năng hiển thị Google Maps ở mạng của người dùng.

## Sáu ngôn ngữ
- Tiếng Việt, English, 中文, 한국어, 日本語, Français.
- Chọn từ menu quả địa cầu phía trên. Giao diện, nhóm địa điểm, phần thuyết minh của 6 điểm mẫu, hướng dẫn đường đi đều được bản địa hóa. Trình đọc giọng nói Web Speech API tùy các giọng được cài đặt trên trình duyệt/máy.
- Backend hỗ trợ 6 mã ngôn ngữ (`vi`, `en`, `zh`, `ko`, `ja`, `fr`) và tự thêm những bản dịch còn thiếu của dữ liệu mẫu vào **SQLite cũ** mà không ghi đè bản dịch đã có.
- Endpoint `POST /api/translate` dành cho văn bản *chưa có bản dịch lưu trong database* vẫn cần cấu hình `Translation:Provider` + API key nếu chọn Google Translate, hoặc LibreTranslate; mặc định `None`.

## Frontend ↔ Backend ↔ Database
- Frontend gọi `/api/pois` tới Backend qua proxy Vite cài sẵn ở `frontend/vite.config.js`, đích **http://localhost:5000**. Nếu Backend tắt, Frontend dùng danh sách mẫu và hiện cảnh báo.
- Backend hiện dùng **SQLite** qua `backend/Auralis.Api/appsettings.json`, tự tạo và seed `auralis.db`.
- `database/1_Create.sql`, `database/2_Mock.sql` trong ZIP **là SQL Server** của DB.zip người dùng gửi; phải chạy bằng SSMS, **chưa được nối trực tiếp vào Backend SQLite**. `database/schema.sql` là schema SQLite tham khảo.
- Không đưa API key hoặc mật khẩu vào GitHub.

## Chạy kiểm tra
```powershell
cd frontend
npm run build
```

Lưu ý: Không phải trang Dashboard Admin — chỉ mở rộng chức năng Google Maps + đa ngôn ngữ theo yêu cầu mới nhất.
