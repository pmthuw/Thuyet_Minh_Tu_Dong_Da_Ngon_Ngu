using Auralis.Api.Data;
using Auralis.Api.Models;
using Microsoft.EntityFrameworkCore;
namespace Auralis.Api.Repositories;
public class PoiRepository(AppDbContext db) : IPoiRepository
{
    private IQueryable<PointOfInterest> ReadablePois() => db.PointsOfInterest
        .AsNoTracking().Where(p => !p.IsDeleted && p.Status == "Active")
        .Include(p => p.AudioGuides.Where(g => !g.IsDeleted && g.Language.IsActive))
        .ThenInclude(g => g.Language);

    public Task<List<PointOfInterest>> GetAllAsync(CancellationToken ct) =>
        ReadablePois().ToListAsync(ct);

    public Task<PointOfInterest?> GetByIdAsync(int id, CancellationToken ct) =>
        ReadablePois().FirstOrDefaultAsync(p => p.POIID == id, ct);
}
