using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Auralis.Api.Dtos;

/// <summary>DTO giữ tên trường API cũ; Cat/Rating null vì SQL Server không có hai cột đó.</summary>
public record PoiDto(
    int Id,
    string Name,
    string? Cat,
    double Lat,
    double Lng,
    double? Rating,
    Dictionary<string, string> Tr)
{
    /// <summary>Khoảng cách (mét) từ vị trí người dùng; chỉ có khi request truyền lat &amp; lng.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Dist { get; init; }
    public string? Description { get; init; }
    public string? Address { get; init; }
    public string? ImageUrl { get; init; }
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

public class PoiPositionQuery : IValidatableObject
{
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public IEnumerable<ValidationResult> Validate(ValidationContext context)
    {
        if (Lat.HasValue != Lng.HasValue)
        {
            yield return new ValidationResult("Cần truyền cả lat và lng.", [nameof(Lat), nameof(Lng)]);
            yield break;
        }
        if (Lat.HasValue && (!double.IsFinite(Lat.Value) || !double.IsFinite(Lng!.Value)
            || Lat.Value < -90 || Lat.Value > 90 || Lng.Value < -180 || Lng.Value > 180))
            yield return new ValidationResult("Toạ độ nằm ngoài phạm vi hợp lệ.", [nameof(Lat), nameof(Lng)]);
    }
}
public class PoiQueryRequest : PoiPositionQuery
{
    public string? Q { get; set; }
    public string? Cat { get; set; }
    public string? Sort { get; set; }
}
public record HealthResponse(string Status);
