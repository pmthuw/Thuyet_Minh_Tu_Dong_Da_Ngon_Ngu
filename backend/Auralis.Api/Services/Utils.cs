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

public static class Languages
{
    public static string NormalizeCode(string code) => code.Trim().ToLowerInvariant();
    public static string ProviderCode(string code) => NormalizeCode(code).Split('-')[0];
    public static bool IsSupported(string code) => Supported.Contains(ProviderCode(code));
    public static readonly string[] Supported = ["vi", "en", "zh", "ko", "ja", "fr"];
}
