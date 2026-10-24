using Auralis.Api.Dtos;
using Auralis.Api.Exceptions;
using Auralis.Api.Models;
using Auralis.Api.Repositories;
namespace Auralis.Api.Services;
public class RoutingService(IRoutingRepository repository) : IRoutingService
{
    public GoogleLinkResponse CreateGoogleLink(GoogleLinkRequest request)
    {
        if (!GoogleDirectionsLinks.IsModeSupported(request.Mode))
            throw new BusinessValidationException("Phương tiện không hợp lệ.",
                "Chỉ hỗ trợ walking, motorcycle, driving.");
        var destination = new LatLng(request.Destination!.Lat!.Value, request.Destination.Lng!.Value);
        LatLng? origin = request.Origin is null ? null
            : new(request.Origin.Lat!.Value, request.Origin.Lng!.Value);
        var language = request.Language?.Trim().ToLowerInvariant() ?? "vi";
        return new GoogleLinkResponse(
            GoogleDirectionsLinks.Create(origin, destination, request.Mode!, language), request.Mode!);
    }

    private const double WalkSpeedMps = 80.0 / 60.0;
    public async Task<RouteResponse> GetWalkingRouteAsync(RouteRequest request, CancellationToken ct)
    {
        var origin = new RoutePoint(request.Origin!.Lat!.Value, request.Origin.Lng!.Value);
        var destination = new RoutePoint(request.Destination!.Lat!.Value, request.Destination.Lng!.Value);
        try
        {
            var result = await repository.GetWalkingRouteAsync(origin, destination, ct);
            return new RouteResponse(result.DistanceMeters, result.DurationSeconds, "walking", "osrm",
                result.Path.Select(p => new LatLng(p.Lat, p.Lng)).ToList());
        }
        catch (RoutingUnavailableException) when (!ct.IsCancellationRequested)
        {
            // Quyết định dùng đường chim bay là nghiệp vụ của Service.
            var distance = GeoUtils.Haversine(origin.Lat, origin.Lng, destination.Lat, destination.Lng);
            return new RouteResponse(distance, distance / WalkSpeedMps, "walking", "straight-line",
                [new LatLng(origin.Lat, origin.Lng), new LatLng(destination.Lat, destination.Lng)]);
        }
    }
}
