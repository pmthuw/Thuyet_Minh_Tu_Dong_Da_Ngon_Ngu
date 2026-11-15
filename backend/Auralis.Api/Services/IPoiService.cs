using Auralis.Api.Dtos;
namespace Auralis.Api.Services;
public interface IPoiService
{
    Task<List<PoiDto>> GetAllAsync(PoiQueryRequest request, CancellationToken ct);
    Task<PoiDto?> GetByIdAsync(int id, PoiPositionQuery request, CancellationToken ct);
}
