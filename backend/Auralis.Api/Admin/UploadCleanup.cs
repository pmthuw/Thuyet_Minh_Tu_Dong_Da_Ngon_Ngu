using Auralis.Api.Data;
using Microsoft.EntityFrameworkCore;
namespace Auralis.Api.Admin;
// Uploads not attached to a saved guide are temporary for up to 24 hours.
public class UploadCleanup(IServiceScopeFactory scopes,IWebHostEnvironment env,ILogger<UploadCleanup> log):BackgroundService {
 protected override async Task ExecuteAsync(CancellationToken stoppingToken){
  while(!stoppingToken.IsCancellationRequested){
   try{
    await Task.Delay(TimeSpan.FromHours(1),stoppingToken);
    using var scope=scopes.CreateScope();var db=scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var linked=(await db.AudioGuides.Where(g=>g.AudioUrl!=null).Select(g=>g.AudioUrl!).ToListAsync(stoppingToken)).ToHashSet(StringComparer.OrdinalIgnoreCase);
    var folder=Path.Combine(env.ContentRootPath,"wwwroot","uploads");
    foreach(var file in Directory.EnumerateFiles(folder))
     if(File.GetLastWriteTimeUtc(file)<DateTime.UtcNow.AddHours(-24)&&!linked.Contains("/uploads/"+Path.GetFileName(file)))File.Delete(file);
   }catch(OperationCanceledException) when(stoppingToken.IsCancellationRequested){return;}
   catch(Exception e){log.LogWarning(e,"Could not clean temporary audio uploads; retrying next hour.");}
  }
 }
}
