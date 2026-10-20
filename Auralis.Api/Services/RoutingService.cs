using System.Globalization;
using System.Text.Json;
using Auralis.Api.Dtos;
using Microsoft.Extensions.Options;

namespace Auralis.Api.Services;

public class RoutingOptions
{
    /// <summary>Máy chủ OSRM có profile đi bộ (mặc định: dịch vụ công cộng của FOSSGIS).</summary>
    public string BaseUrl { get; set; } = "https://routing.openstreetmap.de/routed-foot";
}

public interface IRoutingService
{
    Task<RouteResponse> GetWalkingRouteAsync(LatLng origin, LatLng destination, CancellationToken ct);
}

public class RoutingService(HttpClient http, IOptions<RoutingOptions> options, ILogger<RoutingService> log)
    : IRoutingService
{
    // ~4.8 km/h, khớp walkMin() ở frontend (80 m/phút).
    private const double WalkSpeedMps = 80.0 / 60.0;

    public async Task<RouteResponse> GetWalkingRouteAsync(LatLng o, LatLng d, CancellationToken ct)
    {
        try
        {
            var inv = CultureInfo.InvariantCulture;
            var url = $"{options.Value.BaseUrl.TrimEnd('/')}/route/v1/foot/" +
                      $"{o.Lng.ToString("F6", inv)},{o.Lat.ToString("F6", inv)};" +
                      $"{d.Lng.ToString("F6", inv)},{d.Lat.ToString("F6", inv)}" +
                      "?overview=full&geometries=geojson";

            using var res = await http.GetAsync(url, ct);
            res.EnsureSuccessStatusCode();

            using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync(ct));
            var root = doc.RootElement;
            if (root.GetProperty("code").GetString() != "Ok")
                throw new InvalidOperationException("OSRM không tìm được tuyến đường.");

            var route = root.GetProperty("routes")[0];
            var path = route.GetProperty("geometry").GetProperty("coordinates")
                .EnumerateArray()
                .Select(c => new LatLng(c[1].GetDouble(), c[0].GetDouble())) // GeoJSON là [lng, lat]
                .ToList();

            return new RouteResponse(
                route.GetProperty("distance").GetDouble(),
                route.GetProperty("duration").GetDouble(),
                "walking", "osrm", path);
        }
        catch (Exception ex) when (!ct.IsCancellationRequested &&
            ex is HttpRequestException or TaskCanceledException or JsonException
               or KeyNotFoundException or InvalidOperationException or IndexOutOfRangeException)
        {
            // Dịch vụ ngoài lỗi/timeout → vẫn trả lời được bằng đường chim bay.
            log.LogWarning(ex, "Định tuyến OSRM thất bại, dùng đường chim bay.");
            var dist = GeoUtils.Haversine(o.Lat, o.Lng, d.Lat, d.Lng);
            return new RouteResponse(dist, dist / WalkSpeedMps, "walking", "straight-line", [o, d]);
        }
    }
}
