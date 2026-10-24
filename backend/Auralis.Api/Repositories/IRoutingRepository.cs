using Auralis.Api.Models;
namespace Auralis.Api.Repositories;
// Nguồn dữ liệu tuyến đường là OSRM, không có bảng SQL tương ứng.
public interface IRoutingRepository
{
    Task<RoutingResult> GetWalkingRouteAsync(RoutePoint origin, RoutePoint destination, CancellationToken ct);
}
