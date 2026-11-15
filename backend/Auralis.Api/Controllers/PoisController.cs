using Auralis.Api.Dtos;
using Auralis.Api.Services;
using Microsoft.AspNetCore.Mvc;
namespace Auralis.Api.Controllers;
[ApiController]
[Route("api/[controller]")]
public class PoisController(IPoiService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<PoiDto>>> GetAll([FromQuery] PoiQueryRequest request, CancellationToken ct)
    {
        return Ok(await service.GetAllAsync(request, ct));
    }
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PoiDto>> GetById(int id, [FromQuery] PoiPositionQuery request, CancellationToken ct)
    {
        var poi = await service.GetByIdAsync(id, request, ct);
        if (poi is null)
            return Problem(statusCode: 404, title: "Không tìm thấy địa điểm",
                detail: $"Không có địa điểm với id = {id}.");
        return Ok(poi);
    }
}
