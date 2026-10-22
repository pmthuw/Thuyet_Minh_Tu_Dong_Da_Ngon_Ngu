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
        if (!GoogleDirectionsLinks.IsModeSupported(req.Mode))
            return Problem(statusCode: 400, title: "Phương tiện không hợp lệ.",
                detail: "Chỉ hỗ trợ walking, motorcycle, driving.");

        var d = new LatLng(req.Destination!.Lat!.Value, req.Destination.Lng!.Value);
        LatLng? o = req.Origin is null ? null : new(req.Origin.Lat!.Value, req.Origin.Lng!.Value);
        var lang = req.Language?.Trim().ToLowerInvariant() ?? "vi";
        var mode = req.Mode!;
        return new GoogleLinkResponse(GoogleDirectionsLinks.Create(o, d, mode, lang), mode);
    }

    /// <summary>POST /api/route  { origin: {lat,lng}, destination: {lat,lng} } → tuyến đi bộ.</summary>
    [HttpPost]
    public async Task<ActionResult<RouteResponse>> Post([FromBody] RouteRequest req, CancellationToken ct)
    {
        var o = new LatLng(req.Origin!.Lat!.Value, req.Origin.Lng!.Value);
        var d = new LatLng(req.Destination!.Lat!.Value, req.Destination.Lng!.Value);
        return await routing.GetWalkingRouteAsync(o, d, ct);
    }
}
