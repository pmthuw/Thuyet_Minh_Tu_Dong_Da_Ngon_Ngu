using System.Globalization;
using Auralis.Api.Dtos;

namespace Auralis.Api.Services;

/// <summary>Maps URLs: Google tự tính tuyến đường đúng loại phương tiện.
/// Xe máy bắt buộc dùng "two-wheeler", không gộp vào "driving" (ô tô).</summary>
public static class GoogleDirectionsLinks
{
    private static readonly string[] ValidModes = ["walking", "motorcycle", "driving"];

    public static bool IsModeSupported(string? mode) => mode is not null && ValidModes.Contains(mode);

    public static string Create(LatLng? origin, LatLng destination, string mode, string language)
    {
        if (!IsModeSupported(mode)) throw new ArgumentException("Phương tiện không hợp lệ.", nameof(mode));
        static string Coords(LatLng p) =>
            p.Lat.ToString("G17", CultureInfo.InvariantCulture) + "," +
            p.Lng.ToString("G17", CultureInfo.InvariantCulture);

        var query = new Dictionary<string, string>
        {
            ["api"] = "1",
            ["destination"] = Coords(destination),
            ["travelmode"] = mode == "motorcycle" ? "two-wheeler" : mode,
            ["hl"] = Languages.Supported.Contains(language) ? language : "vi",
        };
        if (origin is not null) query["origin"] = Coords(origin);
        return "https://www.google.com/maps/dir/?" + string.Join("&", query.Select(pair =>
            Uri.EscapeDataString(pair.Key) + "=" + Uri.EscapeDataString(pair.Value)));
    }
}
