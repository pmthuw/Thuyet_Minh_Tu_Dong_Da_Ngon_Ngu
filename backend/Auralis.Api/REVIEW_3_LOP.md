# Kết quả kiểm tra và refactor 3 lớp

## Kết luận

Bản trước đã không có DbContext ở Controller hoặc Service, đã có interface và DI cho toàn bộ Service/Repository đang tồn tại. PoiService đã mapping Entity → DTO đúng vị trí. Không coi các phần này là lỗi.

Những chỗ đã điều chỉnh để tuân thủ chặt yêu cầu Service chỉ phụ thuộc Repository:

| Trước | Sau |
|---|---|
| RoutingService tự gọi HttpClient, parse OSRM JSON | RoutingRepository thực hiện IO, trả RoutingResult; Service chọn fallback và map RouteResponse |
| TranslationService tự gọi Google/LibreTranslate | TranslationProviderRepository gọi nhà cung cấp, trả ExternalTranslation |
| TranslationRepository trả string | Trả AudioGuide entity; TranslationService tạo TranslateResponse |
| Controller tách request thành nhiều tham số | Service nhận TranslateRequest/RouteRequest/PoiQueryRequest, Controller chuyển tiếp DTO |
| Validation tọa độ nằm trong PoisController | DTO PoiPositionQuery có IValidatableObject; ApiController tự trả 400 khi không hợp lệ |
| Interface routing/translation đặt chung implementation | Tách ra IRoutingService.cs và ITranslationService.cs |
| Có model SQLite Poi.cs, file User không có đuôi .cs | Loại model cũ; model SQL Server còn nguyên |

## Luồng phụ thuộc

Presentation (Controllers, Filters, endpoint health) → Service interfaces → Repository interfaces.

Repository có 2 nguồn dữ liệu: SQL Server và API bên ngoài. Theo yêu cầu giữ đúng 3 lớp, HTTP adapters được đặt tại Repository. Chúng không cần DbContext hoặc bảng SQL. RoutingResult/ExternalTranslation là mô hình kết quả từ API ngoài, không phải EF Entity, không được đăng ký trong DbContext.

Repository SQL dùng Entity PointOfInterest/AudioGuide. Không có using Auralis.Api.Dtos trong bất kỳ Repository nào. Service map các Entity/kết quả ngoài thành DTO, không trả Entity ra Controller. Query nhận DTO vẫn giữ tên tham số HTTP q/cat/sort/lat/lng. ID trên route vẫn là int.

Các helper tĩnh GeoUtils/TextUtils/Languages/GoogleDirectionsLinks chỉ xử lý dữ liệu trong bộ nhớ; không phải Service được inject nên không cần interface/DI. Exception, options và DTO cũng không cần interface. Options cho HTTP đã tách sang Configuration; lỗi HTTP nguồn ngoài nằm trong Exceptions.

## Interface và DI

| Interface | Implementation | Đăng ký |
|---|---|---|
| IPoiService | PoiService | AddScoped |
| ITranslationService | TranslationService | AddScoped |
| IRoutingService | RoutingService | AddScoped |
| IPoiRepository | PoiRepository | AddScoped |
| ITranslationRepository | TranslationRepository | AddScoped |
| IRoutingRepository | RoutingRepository | AddHttpClient |
| ITranslationProviderRepository | TranslationProviderRepository | AddHttpClient |

Typed HttpClient registration đã đăng ký Repository tương ứng; không thêm đăng ký scoped trùng lên typed client. Service scoped nhận Repository qua interface; các Repository database dùng cùng vòng đời scoped với DbContext.

## Hành vi

- Endpoint và request/response HTTP giữ hình dạng hiện có. DTO query thay đổi chữ ký nội bộ C#, không thay tên query URL.
- Chi tiết POI không có: 404. Query tọa độ lỗi: 400 ValidationProblemDetails do ApiController xử lý; hình dạng lỗi validation này khác lỗi ProblemDetails tùy chỉnh ở controller cũ.
- Dịch vẫn ưu tiên thuyết minh lưu SQL Server; nếu không có thì gọi provider. Lỗi provider trả 503.
- Khi gọi dịch vụ ngoài với en-US, response TargetLanguage giờ nhất quán dùng mã request đã chuẩn hóa en-us; trước đó nhánh ngoài trả en trong khi nhánh local trả en-us.
- OSRM lỗi thì Service quyết định trả đường chim bay; hủy request từ client vẫn được truyền đi, không tự đổi thành fallback.
- SQL Server schema không có Category/Rating nên vẫn trả null và từ chối lọc danh mục hoặc sort=rating như bản đầu vào.

## File cũ và dữ liệu

Không sửa schema hoặc chuỗi kết nối SQL Server bạn gửi. Dữ liệu SQLite auralis.db và JSON seed cũ chuyển vào Legacy để bảo toàn; không được sử dụng trong SQL Server backend. Không đưa bin/obj vào ZIP.

Khi thay code trên máy, hãy sao lưu thư mục Auralis.Api cũ ra ngoài repository, rồi thay bằng nguyên thư mục Auralis.Api trong ZIP. Chép đè từng file có thể để sót model/interface cũ và gây trùng class hoặc lỗi build.

## Kiểm chứng

Đã chạy Checks/check_architecture.py: 49/49 kiểm tra nguồn đạt. Kiểm tra phụ thuộc Controller/Service, vắng DTO ở Repository, interface/DI của 7 implementation, vị trí mapping và provider SQL Server. Đây là kiểm tra văn bản nguồn có giới hạn, không phải C# semantic analyzer; không thay thế compiler hoặc kiểm thử chạy API. Đã kiểm tra các call site và chữ ký interface sau thay đổi.

Chưa chạy dotnet build/test hoặc kết nối SQL Server vì môi trường thực hiện không có .NET SDK và không có server của bạn.

Từ thư mục Auralis.Api trên máy:

```powershell
python .\Checks\check_architecture.py
dotnet restore
dotnet build
dotnet run
```

Python cần thiết chỉ cho script kiểm tra tĩnh; backend không phụ thuộc Python.

Sau khi chạy và cấu hình SQL Server, thử:

| Request | Kết quả cần kiểm tra |
|---|---|
| GET /api/pois | 200, POI DTO; không lộ navigation Entity |
| GET /api/pois?lat=10 | 400 |
| GET /api/pois?lat=10.77&lng=106.70 | Có dist, xếp gần trước |
| GET /api/pois/-999 | 404 nếu không có ID |
| POST /api/translate với text có sẵn và ngôn ngữ đích có sẵn | provider=local |
| POST /api/translate với targetLanguage=xx | 400 |
| POST /api/route/google-link với mode=motorcycle | URL chứa travelmode=two-wheeler |
| POST /api/route với tọa độ hợp lệ | source=osrm hoặc straight-line khi upstream lỗi |

