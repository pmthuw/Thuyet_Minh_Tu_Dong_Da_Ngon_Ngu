using Auralis.Api.Models;
namespace Auralis.Api.Repositories;
public interface IPoiRepository
{
    Task<List<PointOfInterest>> GetAllAsync(CancellationToken ct);
    Task<PointOfInterest?> GetByIdAsync(int id, CancellationToken ct);
}
