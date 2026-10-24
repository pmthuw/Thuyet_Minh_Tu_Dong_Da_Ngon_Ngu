using Auralis.Api.Dtos;
using Auralis.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Auralis.Api.Controllers;

[ApiController]
[Route("api/route")]
public class RouteController(IRoutingService routing) : ControllerBase
{
    /// <summary>POST /api/route/google-link: chế độ walking, motorcycle, driving.
    /// Trả URL Google Maps (không thêm iframe hay bản đồ khác vào website).</summary>
    [HttpPost("google-link")]
    public ActionResult<GoogleLinkResponse> GoogleLink([FromBody] GoogleLinkRequest req)
    {
        return routing.CreateGoogleLink(req);
    }

    /// <summary>POST /api/route  { origin: {lat,lng}, destination: {lat,lng} } → tuyến đi bộ.</summary>
    [HttpPost]
    public async Task<ActionResult<RouteResponse>> Post([FromBody] RouteRequest req, CancellationToken ct)
    {
        return await routing.GetWalkingRouteAsync(req, ct);
    }
}
