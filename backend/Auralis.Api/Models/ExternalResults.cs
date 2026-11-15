namespace Auralis.Api.Models;
// Mô hình dữ liệu từ API ngoài, không phải EF entity và không ánh xạ vào bảng SQL.
public record RoutePoint(double Lat, double Lng);
public record RoutingResult(double DistanceMeters, double DurationSeconds, List<RoutePoint> Path);
public record ExternalTranslation(string TranslatedText, string TargetLanguage, string Provider);
