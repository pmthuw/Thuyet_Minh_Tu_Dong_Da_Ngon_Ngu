using Auralis.Api.Data;
using Auralis.Api.Models;
using Microsoft.EntityFrameworkCore;
namespace Auralis.Api.Admin;
public interface IAdminRepository {
 IQueryable<User> Users {get;}
 IQueryable<PointOfInterest> Pois {get;}
 IQueryable<AudioGuide> Guides {get;}
 IQueryable<Language> Languages {get;}
 IQueryable<DeviceSession> Sessions {get;}
 IQueryable<NarrationEvent> Events {get;}
 void Add<T>(T item) where T:class;
 void Remove<T>(T item) where T:class;
 void ExpectedVersion(PointOfInterest poi, byte[] version);
 Task Save(CancellationToken ct);
}
public class AdminRepository(AppDbContext db) : IAdminRepository {
 public IQueryable<User> Users => db.Users;
 public IQueryable<PointOfInterest> Pois => db.PointsOfInterest;
 public IQueryable<AudioGuide> Guides => db.AudioGuides;
 public IQueryable<Language> Languages => db.Languages;
 public IQueryable<DeviceSession> Sessions => db.Set<DeviceSession>();
 public IQueryable<NarrationEvent> Events => db.Set<NarrationEvent>();
 public void Add<T>(T item) where T:class => db.Add(item);
 public void Remove<T>(T item) where T:class => db.Remove(item);
 public void ExpectedVersion(PointOfInterest poi,byte[] version) => db.Entry(poi).Property(p=>p.RowVersion).OriginalValue=version;
 public async Task Save(CancellationToken ct) {
  try {await db.SaveChangesAsync(ct);}
  catch(DbUpdateConcurrencyException) {throw new AdminProblem(409,"Dữ liệu đã được thay đổi. Hãy tải lại trước khi lưu.");}
  catch(DbUpdateException) {throw new AdminProblem(409,"Không thể lưu: dữ liệu trùng hoặc đang được sử dụng. Hãy tải lại và kiểm tra.");}
 }
}
