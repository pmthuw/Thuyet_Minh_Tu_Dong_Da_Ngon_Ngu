using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Auralis.Api.Dtos;

/// <summary>Khớp đúng shape POIS ở frontend/src/data.js: { id, name, cat, lat, lng, rating, tr }.</summary>
public record PoiDto(
    int Id,
    string Name,
    string Cat,
    double Lat,
    double Lng,
    double Rating,
    Dictionary<string, string> Tr)
{
    /// <summary>Khoảng cách (mét) từ vị trí người dùng; chỉ có khi request truyền lat &amp; lng.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Dist { get; init; }
}

public class CoordinateInput
{
    [Required, Range(-90, 90)]
    public double? Lat { get; set; }

    [Required, Range(-180, 180)]
    public double? Lng { get; set; }
}

public class RouteRequest
{
    [Required] public CoordinateInput? Origin { get; set; }
    [Required] public CoordinateInput? Destination { get; set; }
}

public record LatLng(double Lat, double Lng);

public record RouteResponse(
    double DistanceMeters,
    double DurationSeconds,
    string Mode,
    string Source,
    List<LatLng> Path);

public class TranslateRequest
{
    [Required, StringLength(5000, MinimumLength = 1)]
    public string? Text { get; set; }

    [Required]
    public string? TargetLanguage { get; set; }

    /// <summary>Tuỳ chọn. Bỏ trống = tự nhận diện.</summary>
    public string? SourceLanguage { get; set; }
}

public record TranslateResponse(string TranslatedText, string TargetLanguage, string Provider);

/// <summary>Đường dẫn chỉ đường Google Maps, không thay thế bản đồ POI trên trang.</summary>
public class GoogleLinkRequest
{
    public CoordinateInput? Origin { get; set; }
    [Required] public CoordinateInput? Destination { get; set; }
    [Required] public string? Mode { get; set; }
    public string? Language { get; set; }
}

public record GoogleLinkResponse(string Url, string Mode);
