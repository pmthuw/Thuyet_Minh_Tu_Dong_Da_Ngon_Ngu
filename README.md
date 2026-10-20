# AURALIS – Backend (ASP.NET Core Web API, .NET 10)

## Chạy

```bash
cd backend/Auralis.Api
dotnet run          # http://localhost:5000
```

Lần chạy đầu tự tạo `auralis.db` (SQLite) và nạp 6 địa điểm mẫu từ `Data/pois.seed.json`.
Frontend: `frontend/.env.local` → `VITE_API_BASE_URL=http://localhost:5000/api`.
CORS mặc định cho `http://localhost:5173` (sửa ở `Cors:AllowedOrigins`).

## API (khớp `frontend/src/services/api.js`)

| Method | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/api/pois` | Query tuỳ chọn: `q`, `cat`, `sort` (distance/rating/name), `lat`+`lng` |
| GET | `/api/pois/{id}` | Chi tiết, tuỳ chọn `lat`+`lng` |
| POST | `/api/route` | `{ origin:{lat,lng}, destination:{lat,lng} }` → tuyến đi bộ |
| POST | `/api/translate` | `{ text, targetLanguage: vi\|en\|zh\|ko, sourceLanguage? }` |
| GET | `/api/health` | Kiểm tra sống |

**POI** trả về đúng shape `POIS` trong `data.js`:
`{ id, name, cat, lat, lng, rating, tr: { vi, en, ... }, dist? }` (`dist` tính bằng mét, chỉ có khi truyền `lat`+`lng`).

**Route** trả về `{ distanceMeters, durationSeconds, mode, source, path:[{lat,lng}] }`.
`source` = `osrm` (đường thật, dịch vụ OSRM đi bộ) hoặc `straight-line` (dự phòng khi OSRM lỗi/timeout).

**Translate** trả về `{ translatedText, targetLanguage, provider }`. Thứ tự xử lý:
1. Nếu `text` trùng một thuyết minh đã lưu trong DB và có bản dịch sẵn → trả ngay (`provider: "local"`).
2. Ngược lại gọi dịch vụ ngoài theo `Translation:Provider`:
   - `Google` (cần `ApiKey`) hoặc `LibreTranslate` (cần `BaseUrl`, vd. `http://localhost:5001`).
   - `None` (mặc định) → trả 503 nếu không có bản dịch sẵn.

Không đưa API key vào git; dùng user-secrets hoặc biến môi trường:

```bash
dotnet user-secrets init
dotnet user-secrets set "Translation:Provider" "Google"
dotnet user-secrets set "Translation:ApiKey" "<key>"
# hoặc biến môi trường: Translation__Provider, Translation__ApiKey
```

Lỗi trả về dạng ProblemDetails (`400` dữ liệu sai, `404` không có POI, `503` dịch vụ dịch không khả dụng).

## Thêm dữ liệu
Thêm địa điểm / bản dịch `zh`, `ko` vào `Data/pois.seed.json` rồi xoá `auralis.db` để seed lại
(seed chỉ chạy khi bảng `Pois` đang trống). Lược đồ tham khảo: `database/schema.sql`.

## Cấu trúc
```
Controllers/  PoisController, RouteController, TranslateController
Services/     RoutingService (OSRM), TranslationService, Utils (haversine, bỏ dấu)
Data/         AppDbContext, SeedData, pois.seed.json
Models/ Dtos/
```
