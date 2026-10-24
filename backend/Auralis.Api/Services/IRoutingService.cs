using Auralis.Api.Dtos;
namespace Auralis.Api.Services;
public interface IRoutingService
{
    GoogleLinkResponse CreateGoogleLink(GoogleLinkRequest request);
    Task<RouteResponse> GetWalkingRouteAsync(RouteRequest request, CancellationToken ct);
}
