using System.Text.Json;
using Auralis.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Auralis.Api.Data;

public static class SeedData
{
    private sealed record SeedPoi(
        int Id, string Name, string Cat, double Lat, double Lng, double Rating,
        Dictionary<string, string> Tr);

    /// <summary>Nạp dữ liệu mẫu từ Data/pois.seed.json khi bảng Pois còn trống.</summary>
    public static void Seed(AppDbContext db, ILogger logger)
    {
        // Đồng bộ nội dung ngôn ngữ mới khi đã có SQLite từ lần chạy cũ.
        // Không ghi đè bản dịch người dùng chỉnh sửa trong DB.

        var path = Path.Combine(AppContext.BaseDirectory, "Data", "pois.seed.json");
        if (!File.Exists(path))
        {
            logger.LogWarning("Không tìm thấy file seed: {Path}", path);
            return;
        }

        var items = JsonSerializer.Deserialize<List<SeedPoi>>(
            File.ReadAllText(path),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();

        int newPois = 0, newTranslations = 0;
        foreach (var s in items)
        {
            var existing = db.Pois.Include(p => p.Translations).FirstOrDefault(p => p.Id == s.Id);
            if (existing is not null)
            {
                foreach (var kv in s.Tr)
                    if (!existing.Translations.Any(t => t.Language == kv.Key))
                    {
                        existing.Translations.Add(new PoiTranslation { Language = kv.Key, Text = kv.Value });
                        newTranslations++;
                    }
                continue;
            }
            newPois++;
            db.Pois.Add(new Poi
            {
                Id = s.Id,
                Name = s.Name,
                Category = s.Cat,
                Lat = s.Lat,
                Lng = s.Lng,
                Rating = s.Rating,
                Translations = s.Tr
                    .Select(kv => new PoiTranslation { Language = kv.Key, Text = kv.Value })
                    .ToList(),
            });
        }

        db.SaveChanges();
        logger.LogInformation("Đồng bộ dữ liệu mẫu: {Places} địa điểm mới, {Translations} bản dịch bổ sung.", newPois, newTranslations);
    }
}
