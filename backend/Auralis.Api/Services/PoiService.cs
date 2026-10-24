using Auralis.Api.Dtos;
using Auralis.Api.Models;
using Auralis.Api.Repositories;
namespace Auralis.Api.Services;
public class PoiService(IPoiRepository repository) : IPoiService
{
    private static readonly StringComparer ViComparer =
        StringComparer.Create(new System.Globalization.CultureInfo("vi-VN"), true);
    public async Task<List<PoiDto>> GetAllAsync(PoiQueryRequest request, CancellationToken ct)
    {
        var (q, cat, sort, lat, lng) = (request.Q, request.Cat, request.Sort, request.Lat, request.Lng);
        // SQL Server schema gốc không có Category/Rating; không bịa dữ liệu thay thế.
        if (cat is not null)
            throw new BusinessValidationException("Chưa hỗ trợ lọc danh mục", "PointsOfInterest không có cột Category.");
        if (sort is not null && sort is not ("distance" or "name"))
            throw new BusinessValidationException("sort không được hỗ trợ", "Schema hiện tại hỗ trợ name và distance, không có Rating.");
        var pois = await repository.GetAllAsync(ct);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var needle = TextUtils.Normalize(q.Trim());
            pois = pois.Where(p => TextUtils.Normalize($"{p.Name} {p.Description} {p.Address}")
                .Contains(needle)).ToList();
        }
        var hasPos = lat.HasValue && lng.HasValue;
        var items = pois.Select(p => ToDto(p, hasPos
            ? GeoUtils.Haversine(lat!.Value, lng!.Value, (double)p.Latitude, (double)p.Longitude) : null));
        var mode = sort ?? (hasPos ? "distance" : "name");
        return (mode == "distance" && hasPos
            ? items.OrderBy(p => p.Dist).ThenBy(p => p.Name, ViComparer)
            : items.OrderBy(p => p.Name, ViComparer)).ToList();
    }
    public async Task<PoiDto?> GetByIdAsync(int id, PoiPositionQuery request, CancellationToken ct)
    {
        var (lat, lng) = (request.Lat, request.Lng);
        var poi = await repository.GetByIdAsync(id, ct);
        if (poi is null) return null;
        return ToDto(poi, lat.HasValue && lng.HasValue
            ? GeoUtils.Haversine(lat.Value, lng.Value, (double)poi.Latitude, (double)poi.Longitude) : null);
    }
    private static PoiDto ToDto(PointOfInterest p, double? dist)
    {
        var guides = p.AudioGuides.Where(g => g.TextContent is not null)
            .OrderByDescending(g => g.Language.IsDefault).ThenBy(g => g.LanguageCode).ToList();
        var translations = guides.ToDictionary(g => g.LanguageCode, g => g.TextContent!, StringComparer.OrdinalIgnoreCase);
        // Giữ mã gốc vi-VN/en-US và thêm alias vi/en để frontend cũ đọc được.
        foreach (var guide in guides)
            translations.TryAdd(guide.LanguageCode.Split('-')[0].ToLowerInvariant(), guide.TextContent!);
        return new PoiDto(p.POIID, p.Name, null, (double)p.Latitude, (double)p.Longitude, null, translations)
        {
            Dist = dist, Description = p.Description, Address = p.Address, ImageUrl = p.ImageUrl
        };
    }
}
