# Kết nối backend và database Auralis

## Đã kiểm tra trong gói bạn gửi
- Backend .NET 10 dùng EF Core SQL Server, kiến trúc Controller → Service → Repository.
- Mapping khớp bốn bảng Users, PointsOfInterest, Languages, AudioGuides trong 1_Create.sql.
- 2_Mock.sql có 6 POI, 2 ngôn ngữ, 10 thuyết minh, 2 user mẫu. URL hình/âm thanh example.com là placeholder, không phải tài nguyên thật. Hash user trong script là mẫu chưa được xác minh; không coi đó là tài khoản đăng nhập dùng được.
- schema.sql là SQLite cũ, không dùng với backend hiện tại; đã chuyển vào Legacy/schema.sqlite.sql.
- Backend cũ không tự tạo database. Đây là lý do SQL Server mới trong Docker không có AuralisDB và trả lỗi 4060/state 38.

## A. Chạy SQL Server trong Docker từ các file bạn gửi
Giải nén vào một thư mục MỚI, ví dụ C:\Users\ASUS\Desktop\AURALIS_DB_FIX. Mở thư mục đó trong VS Code. Thư mục gốc phải có compose.yaml, database, docker, backend. Không ghi đè cấu hình/volume của bộ CNPM đang chạy.

Trong PowerShell tại thư mục mới:

```powershell
Copy-Item .env.example .env
notepad .env
```

Đổi SQL_PASSWORD thành mật khẩu riêng, tối thiểu 12 ký tự có chữ hoa/thường, số và ký hiệu. Tránh dấu chấm phẩy, dấu nháy kép, ký hiệu dollar vì mật khẩu được nhúng vào connection string. Chỉ dùng cấu hình này cho phát triển tại máy cá nhân.

SEED_MOCK=false (mặc định): tạo schema, KHÔNG chèn mẫu; API danh sách trả [] là bình thường khi chưa nhập dữ liệu.
SEED_MOCK=true: nạp chính file 2_Mock.sql của bạn khi tạo database lần đầu. Backend vẫn đọc trực tiếp SQL Server, không trả JSON mock. Chọn giá trị trước lần chạy đầu. Đổi true sau khi DB đã tạo không tự chèn mẫu.

Nếu bộ CNPM cũ chiếm cổng 8080, đặt API_PORT=8081 hoặc dừng riêng backend cũ bằng docker compose stop backend tại CNPM. Không cần xóa volume.

```powershell
docker compose up -d --build
docker compose ps -a
docker compose logs --tail=60 db-init backend
```

Compose chờ SQL Server nhận kết nối, sau đó chạy db-init; backend chỉ khởi động nếu db-init thành công. Database đã tồn tại thì giữ nguyên, không chạy lại create/mock. Nếu thiếu bảng, db-init dừng để bạn sửa, không xóa database.

Mở (đổi cổng nếu đã đổi API_PORT):
- http://localhost:8080/api/health — kiểm tra HTTP.
- http://localhost:8080/api/health/db — truy vấn bảng POI/thuyết minh/ngôn ngữ để kiểm tra DB và mapping.
- http://localhost:8080/api/pois — đọc địa điểm từ SQL Server.

SSMS kết nối database Docker: Server name localhost,14330; SQL Server Authentication; Login sa; Password là SQL_PASSWORD trong .env; bật Trust server certificate cho môi trường local. Để kiểm tra dữ liệu thật:

```sql
USE AuralisDB;
SELECT DB_NAME() AS CurrentDatabase;
SELECT name FROM sys.tables;
SELECT COUNT(*) AS PoiCount FROM dbo.PointsOfInterest;
SELECT * FROM dbo.PointsOfInterest;
```

Muốn nhập dữ liệu của bạn, chạy script INSERT/restore thích hợp vào đúng instance localhost,14330. Chỉ có file tạo bảng không có nghĩa là đã có dữ liệu. Không chạy lại 1_Create.sql vào DB đang có.

Nếu đã tạo DB rỗng và MUỐN nạp mẫu: mở 2_Mock.sql bằng SSMS tại localhost,14330, kiểm tra cả 4 bảng còn trống rồi chạy đúng một lần. Script này không idempotent, không chạy vào database có dữ liệu; các ID POI được viết cố định từ 1 đến 6.

## B. Nếu bạn ĐÃ có database thật trên SQL Server Windows
Không chạy bộ SQL Server Docker mới để thay database đó. Dùng lại database Windows và trỏ backend tới đúng instance. Cách dễ nhất: chạy backend trên Windows với Windows Authentication.

Đổi Server trong backend/Auralis.Api/appsettings.Development.json thành tên server bạn đang dùng ở SSMS (ví dụ .\SQLEXPRESS). Database phải đúng tên; không đổi tên database thật nếu không cần thiết.

```powershell
cd backend\Auralis.Api
dotnet run --launch-profile http
```

Kiểm tra cổng trong terminal/Properties/launchSettings.json. Cần .NET 10 SDK. Nếu chạy backend Docker nối về SQL Server Windows, phải dùng host.docker.internal và cổng TCP thực tế; cần bật TCP/IP, SQL Authentication và tài khoản có quyền trên DB. Không dùng Integrated Security của Windows từ container Linux; không đoán cổng SQLEXPRESS. Chưa cấu hình phương án này vì gói bạn gửi không có thông tin instance/tài khoản Windows.

## Giữ dữ liệu
- Không chạy docker compose down -v nếu cần giữ database.
- SQL_PASSWORD của volume đã khởi tạo phải khớp mật khẩu sa đã lưu; đổi .env không đổi mật khẩu trong database cũ.
- .env không đưa lên Git. Gói chỉ kèm .env.example.
- SEED_MOCK không có tác dụng với database đã tồn tại để tránh ghi thêm vào dữ liệu của bạn.

## Giới hạn kiểm chứng
Đã kiểm tra mapping nguồn, cấu trúc YAML, cú pháp bash và bộ kiểm tra kiến trúc có sẵn. Môi trường sửa gói không có Docker/.NET SDK nên chưa build hoặc chạy kết nối SQL Server thực tế. Các URL media mẫu, xác thực người dùng, Category/Rating không được bổ sung trong bản sửa kết nối này.
