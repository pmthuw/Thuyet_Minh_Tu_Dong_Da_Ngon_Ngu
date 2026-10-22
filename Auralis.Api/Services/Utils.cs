using System.Globalization;
using System.Text;

namespace Auralis.Api.Services;

public static class GeoUtils
{
    /// <summary>Khoảng cách đường chim bay (mét) – cùng công thức haversine với frontend.</summary>
    public static double Haversine(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371000, r = Math.PI / 180;
        var dLat = (lat2 - lat1) * r;
        var dLng = (lng2 - lng1) * r;
        var h = Math.Pow(Math.Sin(dLat / 2), 2)
              + Math.Cos(lat1 * r) * Math.Cos(lat2 * r) * Math.Pow(Math.Sin(dLng / 2), 2);
        return 2 * R * Math.Asin(Math.Sqrt(h));
    }
}

public static class TextUtils
{
    /// <summary>Bỏ dấu tiếng Việt + hạ chữ thường (tương đương norm() ở frontend).</summary>
    public static string Normalize(string s)
    {
        var d = s.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(d.Length);
        foreach (var c in d)
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        return sb.ToString().Replace('đ', 'd').Replace('Đ', 'd').ToLowerInvariant();
    }
}

public static class Categories
{
    /// <summary>Nhãn vi/en của từng nhóm – dùng cho tìm kiếm giống frontend (CATS).</summary>
    public static readonly IReadOnlyDictionary<string, (string Vi, string En)> All =
        new Dictionary<string, (string, string)>
        {
            ["heritage"] = ("Di tích", "Heritage"),
            ["arch"] = ("Kiến trúc", "Architecture"),
            ["shop"] = ("Mua sắm", "Shopping"),
            ["food"] = ("Ẩm thực", "Food & drink"),
        };
}

public static class Languages
{
    public static readonly string[] Supported = ["vi", "en", "zh", "ko", "ja", "fr"];
}
