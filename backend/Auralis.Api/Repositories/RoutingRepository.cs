using System.Globalization;
using System.Text.Json;
using Auralis.Api.Configuration;
using Auralis.Api.Exceptions;
using Auralis.Api.Models;
using Microsoft.Extensions.Options;
namespace Auralis.Api.Repositories;
public class RoutingRepository(HttpClient http, IOptions<RoutingOptions> options, ILogger<RoutingRepository> log) : IRoutingRepository
{
    public async Task<RoutingResult> GetWalkingRouteAsync(RoutePoint o, RoutePoint d, CancellationToken ct)
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
                .Select(c => new RoutePoint(c[1].GetDouble(), c[0].GetDouble())) // GeoJSON là [lng, lat]
                .ToList();

            return new RoutingResult(
                route.GetProperty("distance").GetDouble(),
                route.GetProperty("duration").GetDouble(),
                path);
        }
        catch (Exception ex) when (!ct.IsCancellationRequested &&
            ex is HttpRequestException or TaskCanceledException or JsonException
               or KeyNotFoundException or InvalidOperationException or IndexOutOfRangeException)
        {
            log.LogWarning(ex, "Không lấy được tuyến đường từ OSRM.");
            throw new RoutingUnavailableException("Không lấy được tuyến đường từ OSRM.", ex);
        }
    }
}
