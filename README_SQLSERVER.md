# AURALIS — chuyển backend sang SQL Server

## Những gì đã đổi

.NET 10, EF Core SqlServer 10.0.\*, kiến trúc Controller → Service → Repository → AppDbContext → SQL Server.

| Bảng SQL Server      | Entity          | Khóa                                                     |
| -------------------- | --------------- | -------------------------------------------------------- |
| dbo.Users            | User            | UserID identity(1,1); Username unique                    |
| dbo.PointsOfInterest | PointOfInterest | POIID identity(1,1)                                      |
| dbo.Languages        | Language        | LanguageCode varchar(10)                                 |
| dbo.AudioGuides      | AudioGuide      | AudioGuideID identity(1,1); unique (POIID, LanguageCode) |

Entity/model ánh xạ đủ 31 cột trong 1_Create.sql. Không giữ Category, Rating hay Role trong entity vì script không có chúng. User trước đây ở file không có đuôi .cs đã được thay bằng Models/User.cs để compiler nhận diện.

- Latitude/Longitude: decimal(9,6) → decimal; DTO dùng double để giữ tên lat/lng ở API.
- varchar và nvarchar được cấu hình riêng bằng HasColumnType.
- datetime → DateTime; các cột nullable → kiểu nullable tương ứng.
- DurationSeconds là int? vì SQL cho phép NULL dù có DEFAULT 0. Property khởi tạo 0, cấu hình ValueGeneratedNever để có thể ghi NULL rõ ràng khi cần; default trong schema vẫn là 0.
- Khóa ngoại AudioGuides → PointsOfInterest cascade delete; → Languages no action.
- Đã mapping các CHECK latitude/longitude/status, default GETDATE(), Active, các bit mặc định, và unique constraints.
- Không áp dụng global query filter vào model. Repository đọc POI chỉ lấy Active và chưa xóa; thuyết minh chưa xóa và ngôn ngữ đang hoạt động.

Đã thay package Sqlite bằng SqlServer, UseSqlite bằng UseSqlServer. Repositories và services vẫn được đăng ký scoped/HttpClient như trước. Không dùng EnsureCreated/Migrate hoặc seed SQLite khi khởi động. Script SQL Server là nguồn tạo schema hiện tại; không chạy dotnet ef database update trên database đã tạo bằng script nếu chưa có kế hoạch baseline migration.

## Chuẩn bị database

1. Cần .NET 10 SDK và SQL Server đang chạy (Database Engine; cài SSMS riêng chưa đủ).
2. Kết nối SSMS đến instance cần dùng.
3. Trên database MỚI, chạy database/1_Create.sql, rồi database/2_Mock.sql. Script giữ nguyên từ file bạn gửi; không chạy lại trên database đã có dữ liệu vì CREATE/INSERT không idempotent.
4. Nếu AuralisDB đã được tạo bằng các script này, bỏ qua bước tạo/chèn mẫu.

Không có kết nối đến máy SQL Server của bạn trong môi trường thực hiện. Các script chưa được chạy trên server của bạn. Dữ liệu SQLite cũ không tự nhập vào AuralisDB; backend dùng dữ liệu trong SQL Server. Không xóa bản SQLite cũ nếu còn dữ liệu cần giữ.

## Cấu hình kết nối

appsettings.json mặc định Windows Authentication, localhost, AuralisDB, Encrypt=True và xác minh chứng chỉ. Trong appsettings.Development.json, TrustServerCertificate=True chỉ cho môi trường phát triển với chứng chỉ tự ký.

Chọn Server theo đúng tên trong cửa sổ Connect của SSMS, ví dụ:

| Instance            | Giá trị trong JSON             |
| ------------------- | ------------------------------ |
| SQL Server mặc định | Server=localhost               |
| SQL Express         | Server=.\\SQLEXPRESS           |
| LocalDB nếu đã cài  | Server=(localdb)\\MSSQLLocalDB |
| SQL Server qua TCP  | Server=localhost,1433          |

Cấu hình mẫu Development:

```json
{
  "ConnectionStrings": {
    "Default": "Server=.\\SQLEXPRESS;Database=AuralisDB;Integrated Security=True;Encrypt=True;TrustServerCertificate=True"
  }
}
```

Đổi instance đúng với máy. `appsettings.Development.json` ghi đè `appsettings.json` khi chạy Development. Có thể dùng biến môi trường ConnectionStrings\_\_Default để ghi đè cả hai. Windows Authentication dùng tài khoản Windows đang chạy backend; tài khoản đó phải có quyền với AuralisDB.

Nếu dùng SQL Authentication, đặt chuỗi qua user-secrets thay vì lưu mật khẩu trong JSON/git:

```powershell
cd .\backend\Auralis.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:Default" "Server=localhost,1433;Database=AuralisDB;User Id=YOUR_USER;Password=YOUR_PASSWORD;Encrypt=True;TrustServerCertificate=True"
```

TrustServerCertificate=True trong ví dụ trên dành cho phát triển. Production dùng chứng chỉ hợp lệ và để False.

## Chạy và kiểm tra

Từ thư mục giải nén:

```powershell
cd .\backend\Auralis.Api
dotnet restore
dotnet build
dotnet run
```

Launch profile có sẵn chạy Development tại http://localhost:5000. Nếu dùng --no-launch-profile thì cần tự đặt ASPNETCORE_ENVIRONMENT=Development khi muốn nạp cấu hình Development.

Terminal khác:

```powershell
Invoke-RestMethod 'http://localhost:5000/api/pois'
Invoke-RestMethod 'http://localhost:5000/api/pois/1'
Invoke-RestMethod 'http://localhost:5000/api/pois?lat=10.77&lng=106.70&sort=distance'
Invoke-RestMethod 'http://localhost:5000/api/pois?q=Nha%20tho'
```

/api/health chỉ kiểm tra ứng dụng sống; không xác minh kết nối database. GET /api/pois thực sự truy vấn SQL Server. Dữ liệu mẫu có 6 POI; POI id 1 có thuyết minh vi-VN và en-US nếu chạy 2_Mock.sql trên DB mới.

Kiểm tra dịch local bằng cách lấy text thực tế từ SQL Server:

```powershell
$p = Invoke-RestMethod 'http://localhost:5000/api/pois/1'
$body = @{ text = $p.tr.'vi-VN'; targetLanguage = 'en-US' } | ConvertTo-Json
Invoke-RestMethod 'http://localhost:5000/api/translate' -Method Post -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
```

Kiểm tra EF model mà không cần mở SQL connection, từ thư mục giải nén:

```powershell
dotnet run --project .\verification\ModelChecks.csproj
```

ModelChecks đối chiếu kiểu SQL, số cột, nullable của đủ 4 bảng với schema-expected.json trích từ script gốc, cùng unique key thuyết minh và hành vi xóa khóa ngoại.

Trong môi trường sửa mã đã chạy đối chiếu tĩnh tên/kiểu/nullability của 31 cột với script SQL và kiểm tra không còn tham chiếu provider/model SQLite trong code đang hoạt động. Chưa chạy dotnet build, ModelChecks hoặc truy vấn SQL Server vì môi trường này không có .NET SDK và không có kết nối SQL Server của bạn. ModelChecks được cung cấp để chạy trên máy có SDK.

## Ảnh hưởng API/frontend

- Endpoint giữ /api/pois, /api/pois/{id}, /api/translate và /api/route.
- POI DTO vẫn trả id/name/lat/lng/tr/dist, bổ sung description/address/imageUrl.
- cat và rating trả null vì schema không có dữ liệu tương ứng. Truyền cat hoặc sort=rating nhận 400 kèm giải thích. Không tự gán danh mục hay đánh giá giả.
- Frontend dùng lọc danh mục hoặc hiển thị sao cần bỏ/ẩn hai phần đó, hoặc thiết kế thêm cột với một thay đổi schema riêng sau này.
- tr chứa mã đầy đủ vi-VN/en-US và alias vi/en. Nếu có nhiều biến thể ngôn ngữ, alias ưu tiên ngôn ngữ mặc định rồi mã theo thứ tự; vẫn giữ từng mã đầy đủ.
- Dịch local chấp nhận mã ngắn hoặc mã đầy đủ. Nhà cung cấp dịch ngoài vẫn dùng mã ngắn hỗ trợ như en/vi, giữ cách hoạt động trước đây.
- Chưa thêm API CRUD Users/AudioGuides; các entity và quan hệ đã sẵn sàng cho việc phát triển API sau này.

## Mã nguồn cần xem

Models/_.cs, Data/AppDbContext.cs, Program.cs, appsettings_.json, Repositories/\*.cs và Services/PoiService.cs. Toàn bộ code có trong backend/Auralis.Api.

Tham khảo chính thức: https://learn.microsoft.com/ef/core/providers/sql-server/ và https://learn.microsoft.com/ef/core/modeling/generated-properties

## Chạy demo AURALIS bằng Docker

Mở Docker Desktop, rồi mở PowerShell tại thư mục có `compose.yaml`,
`compose.admin.yaml` và `package.json`.

Nếu chưa có `.env`, sao chép từ `.env.example` và điền `SQL_PASSWORD`.
Nếu dùng lại database Docker đã tạo, giữ đúng mật khẩu SQL cũ.
`SEED_MOCK=true` nạp dữ liệu mẫu khi tạo database mới lần đầu.

Trên máy demo, đặt `API_PORT=8081` trong `.env` và đặt `target` của proxy
`/api` trong `vite.config.js` thành `http://127.0.0.1:8081`.

```powershell
docker compose -f compose.yaml -f compose.admin.yaml up -d --build
Invoke-RestMethod 'http://127.0.0.1:8081/api/health/db'
```

Khi API trả `status: ok` và `database: AuralisDB`, chạy giao diện tại
cùng thư mục. Chạy `npm ci` ở lần cài đầu tiên.

```powershell
npm ci
npm run dev -- --open /admin
```

| Giao diện          | Đường dẫn                   |
| ------------------ | --------------------------- |
| Trang khách        | http://127.0.0.1:5180/      |
| Dashboard quản trị | http://127.0.0.1:5180/admin |

Nếu Vite đã chạy ở cổng `5180`, mở trực tiếp hai đường dẫn trên.

### Quét QR từ điện thoại khác Wi-Fi

Sau khi đã cài ngrok và xác thực tài khoản, giữ Vite chạy và mở terminal khác:

```powershell
ngrok http http://127.0.0.1:5180 --host-header=rewrite
```

Copy URL HTTPS ở dòng `Forwarding` vào ô **Địa chỉ mở ứng dụng** trong
popup **Mã QR**. Nếu ngrok hiện trang trung gian, bấm **Visit Site**.
Giữ Docker, Vite và ngrok chạy trong buổi demo.

## CI/CD

- **AURALIS CI** build backend và giao diện trong thư mục `frontend/`.
  Bản giao diện có dashboard nằm ở thư mục gốc.
- **AURALIS CD** kiểm tra build Docker image của backend trên GitHub Actions.
  Workflow hiện chưa đẩy image lên registry hoặc triển khai lên server.
