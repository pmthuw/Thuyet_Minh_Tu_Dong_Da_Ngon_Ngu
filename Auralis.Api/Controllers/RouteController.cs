using Auralis.Api.Dtos;
using Auralis.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Auralis.Api.Controllers;

[ApiController]
[Route("api/route")]
public class RouteController(IRoutingService routing) : ControllerBase
{
    /// <summary>POST /api/route  { origin: {lat,lng}, destination: {lat,lng} } → tuyến đi bộ.</summary>
    [HttpPost]
    public async Task<ActionResult<RouteResponse>> Post([FromBody] RouteRequest req, CancellationToken ct)
    {
        var o = new LatLng(req.Origin!.Lat!.Value, req.Origin.Lng!.Value);
        var d = new LatLng(req.Destination!.Lat!.Value, req.Destination.Lng!.Value);
        return await routing.GetWalkingRouteAsync(o, d, ct);
    }
}
