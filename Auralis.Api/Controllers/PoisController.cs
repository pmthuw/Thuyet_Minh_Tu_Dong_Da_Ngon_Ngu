using Auralis.Api.Data;
using Auralis.Api.Dtos;
using Auralis.Api.Models;
using Auralis.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Auralis.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PoisController(AppDbContext db) : ControllerBase
{
    private static readonly string[] SortModes = ["distance", "rating", "name"];
    private static readonly StringComparer ViComparer =
        StringComparer.Create(new System.Globalization.CultureInfo("vi-VN"), true);

    /// <summary>
    /// Danh sách địa điểm.
    /// Query: q (tìm không dấu), cat (heritage|arch|shop|food), sort (distance|rating|name),
    /// lat + lng (vị trí người dùng, để tính dist và sắp theo khoảng cách).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PoiDto>>> GetAll(
        [FromQuery] string? q, [FromQuery] string? cat, [FromQuery] string? sort,
        [FromQuery] double? lat, [FromQuery] double? lng, CancellationToken ct)
    {
        if (cat is not null && !Categories.All.ContainsKey(cat))
            return Problem(statusCode: 400, title: "cat không hợp lệ",
                detail: $"Giá trị hợp lệ: {string.Join(", ", Categories.All.Keys)}.");
        if (sort is not null && !SortModes.Contains(sort))
            return Problem(statusCode: 400, title: "sort không hợp lệ",
                detail: $"Giá trị hợp lệ: {string.Join(", ", SortModes)}.");
        if (lat.HasValue != lng.HasValue)
            return Problem(statusCode: 400, title: "Cần truyền cả lat và lng.");
        if (lat is < -90 or > 90 || lng is < -180 or > 180)
            return Problem(statusCode: 400, title: "Toạ độ nằm ngoài phạm vi hợp lệ.");

        var query = db.Pois.AsNoTracking().Include(p => p.Translations).AsQueryable();
        if (cat is not null) query = query.Where(p => p.Category == cat);

        // Dữ liệu nhỏ nên lọc/sắp xếp trong bộ nhớ: tìm không dấu tiếng Việt SQLite không làm được.
        var pois = await query.ToListAsync(ct);

        var needle = string.IsNullOrWhiteSpace(q) ? null : TextUtils.Normalize(q.Trim());
        if (needle is not null)
        {
            pois = pois.Where(p =>
            {
                var (vi, en) = Categories.All.TryGetValue(p.Category, out var c) ? c : ("", "");
                return TextUtils.Normalize($"{p.Name} {vi} {en}").Contains(needle);
            }).ToList();
        }

        var hasPos = lat.HasValue && lng.HasValue;
        var items = pois.Select(p => ToDto(p, hasPos
            ? GeoUtils.Haversine(lat!.Value, lng!.Value, p.Lat, p.Lng) : null));

        var mode = sort ?? (hasPos ? "distance" : "name");
        items = mode switch
        {
            "rating" => items.OrderByDescending(p => p.Rating).ThenBy(p => p.Name, ViComparer),
            "distance" when hasPos => items.OrderBy(p => p.Dist),
            _ => items.OrderBy(p => p.Name, ViComparer),
        };

        return Ok(items.ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PoiDto>> GetById(int id, [FromQuery] double? lat, [FromQuery] double? lng, CancellationToken ct)
    {
        var poi = await db.Pois.AsNoTracking().Include(p => p.Translations)
            .FirstOrDefaultAsync(p => p.Id == id, ct);
        if (poi is null)
            return Problem(statusCode: 404, title: "Không tìm thấy địa điểm", detail: $"Không có địa điểm với id = {id}.");

        double? dist = lat.HasValue && lng.HasValue
            ? GeoUtils.Haversine(lat.Value, lng.Value, poi.Lat, poi.Lng) : null;
        return ToDto(poi, dist);
    }

    private static PoiDto ToDto(Poi p, double? dist) =>
        new(p.Id, p.Name, p.Category, p.Lat, p.Lng, p.Rating,
            p.Translations.ToDictionary(t => t.Language, t => t.Text))
        { Dist = dist };
}
