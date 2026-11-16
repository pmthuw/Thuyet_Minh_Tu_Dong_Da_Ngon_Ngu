using Auralis.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Net.Http.Json;
using System.Text.Json;
namespace Auralis.Api.Admin;
public class AdminService(IAdminRepository r,IWebHostEnvironment env,IConfiguration config,IHttpClientFactory clients) {
 static void Require(bool valid,string msg,int status=400){if(!valid)throw new AdminProblem(status,msg);}
 public async Task<object> Login(LoginInput x,CancellationToken ct){
  var u=await r.Users.SingleOrDefaultAsync(u=>u.Username==x.Username,ct);
  var dummy=new User();
  // Always run a password check, including for an unknown account.
  var hasher=new PasswordHasher<User>();
  var hash=u?.PasswordHash??hasher.HashPassword(dummy,"unusable-random-fallback");
  PasswordVerificationResult result;
  try {result=hasher.VerifyHashedPassword(u??dummy,hash,x.Password);}catch(FormatException){result=PasswordVerificationResult.Failed;}
  Require(u is not null&&result!=PasswordVerificationResult.Failed,"Tên đăng nhập hoặc mật khẩu không đúng.",401);
  Require(u!.IsActive,"Tài khoản đã bị khóa, vui lòng liên hệ quản trị hệ thống.",403);
  if(result==PasswordVerificationResult.SuccessRehashNeeded)u.PasswordHash=hasher.HashPassword(u,x.Password);
  return await CreateSession(x.DeviceId,x.DeviceName,u.UserID,u.FullName??u.Username,ct);
 }
 public Task<object> Visitor(VisitorInput x,CancellationToken ct)=>CreateSession(x.DeviceId,x.DeviceName,null,"Khách",ct);
 async Task<object> CreateSession(Guid device,string name,int? user,string fullName,CancellationToken ct){
  Require(device!=Guid.Empty,"Thiếu mã thiết bị.");
  var now=DateTime.UtcNow;var token=Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
  var s=new DeviceSession{Id=Guid.NewGuid(),DeviceId=device,DeviceName=name.Trim(),UserID=user,TokenHash=SessionAuth.Hash(token),CreatedAt=now,LastSeenAt=now,ExpiresAt=now.AddHours(user.HasValue?8:24)};
  r.Add(s);await r.Save(ct);return new {token,expiresAt=s.ExpiresAt,fullName};
 }
 public async Task Heartbeat(Guid sid,CancellationToken ct){var s=await r.Sessions.SingleAsync(x=>x.Id==sid,ct);s.LastSeenAt=DateTime.UtcNow;await r.Save(ct);}
 public async Task VisitorHeartbeat(string token,CancellationToken ct){
  var now=DateTime.UtcNow;var hash=SessionAuth.Hash(token);
  var session=await r.Sessions.SingleOrDefaultAsync(s=>s.TokenHash==hash&&s.UserID==null&&s.RevokedAt==null&&s.ExpiresAt>now,ct);
  Require(session is not null,"Phiên truy cập đã hết hạn.",401);
  session!.LastSeenAt=now;await r.Save(ct);
 }
 public async Task Logout(Guid sid,CancellationToken ct){var s=await r.Sessions.SingleAsync(x=>x.Id==sid,ct);s.RevokedAt=DateTime.UtcNow;await r.Save(ct);}
 public async Task Playback(PlaybackInput x,string token,CancellationToken ct){
  Require(x.EventId!=Guid.Empty,"Thiếu mã lượt phát.");var hash=SessionAuth.Hash(token);var now=DateTime.UtcNow;
  var s=await r.Sessions.SingleOrDefaultAsync(s=>s.TokenHash==hash&&s.ExpiresAt>now&&s.RevokedAt==null,ct);
  Require(s is not null,"Phiên nghe đã hết hạn.",401);
  var lang=x.LanguageCode;
  var sourceLang=x.SourceLanguageCode??lang;
  if(!await r.Languages.AnyAsync(l=>l.LanguageCode==lang&&l.IsActive,ct)
    ||!await r.Guides.AnyAsync(g=>g.POIID==x.PoiId&&g.LanguageCode==sourceLang&&!g.IsDeleted&&g.Language.IsActive&&!g.PointOfInterest.IsDeleted&&g.PointOfInterest.Status=="Active",ct))
   throw new AdminProblem(404,"Không tìm thấy ngôn ngữ hoặc thuyết minh nguồn đang hoạt động.");
  if(await r.Events.AnyAsync(e=>e.Id==x.EventId,ct))return;
  r.Add(new NarrationEvent{Id=x.EventId,SessionId=s!.Id,POIID=x.PoiId,LanguageCode=lang,StartedAt=now});s.LastSeenAt=now;await r.Save(ct);
 }
 public async Task<object> Overview(int days,CancellationToken ct){
  Require(days is 7 or 30 or 90,"Khoảng thời gian phải là 7, 30 hoặc 90 ngày.");
  var now=DateTime.UtcNow; // Reporting days use Vietnam UTC+7, including today.
  var localToday=now.AddHours(7).Date;var from=localToday.AddDays(1-days).AddHours(-7);
  var events=r.Events.Where(e=>e.StartedAt>=from&&e.StartedAt<=now);
  var sessions=r.Sessions.Where(s=>s.UserID!=null&&s.RevokedAt==null&&s.ExpiresAt>now&&r.Users.Any(u=>u.UserID==s.UserID&&u.IsActive));
  var onlineFrom=now.AddMinutes(-5);
  var activeDevices=await r.Sessions.Where(s=>s.RevokedAt==null&&s.ExpiresAt>now&&s.LastSeenAt>=onlineFrom&&(s.UserID==null||r.Users.Any(u=>u.UserID==s.UserID&&u.IsActive))).Select(s=>s.DeviceId).Distinct().CountAsync(ct);
  var top=await (from e in events join p in r.Pois on e.POIID equals p.POIID where !p.IsDeleted group e by new{p.POIID,p.Name,p.IsDeleted} into g orderby g.Count() descending,g.Key.POIID select new{poiId=g.Key.POIID,name=g.Key.Name,isDeleted=g.Key.IsDeleted,plays=g.Count()}).Take(5).ToListAsync(ct);  
  var dailyRaw=await events.GroupBy(e=>e.StartedAt.AddHours(7).Date).Select(g=>new{date=g.Key,plays=g.Count()}).ToListAsync(ct);
  var daily=Enumerable.Range(0,days).Select(i=>new{date=localToday.AddDays(i+1-days).ToString("yyyy-MM-dd"),plays=dailyRaw.Where(x=>x.date==localToday.AddDays(i+1-days)).Select(x=>x.plays).FirstOrDefault()});
  return new{generatedAt=now,days,activeDevices,totalPois=await r.Pois.CountAsync(p=>!p.IsDeleted,ct),activePois=await r.Pois.CountAsync(p=>!p.IsDeleted&&p.Status=="Active",ct),totalGuides=await r.Guides.CountAsync(g=>!g.IsDeleted&&!g.PointOfInterest.IsDeleted,ct),activeLanguages=await r.Languages.CountAsync(l=>l.IsActive,ct),loggedInDevices=await sessions.Select(s=>s.DeviceId).Distinct().CountAsync(ct),onlineDevices=await sessions.Where(s=>s.LastSeenAt>=onlineFrom).Select(s=>s.DeviceId).Distinct().CountAsync(ct),totalPlays=await events.CountAsync(ct),topPois=top,daily};
 }
 public async Task<object> Devices(CancellationToken ct){var now=DateTime.UtcNow;return await (from s in r.Sessions join u in r.Users on s.UserID equals (int?)u.UserID where s.RevokedAt==null&&s.ExpiresAt>now&&u.IsActive orderby s.LastSeenAt descending select new{id=s.Id,deviceId=s.DeviceId,deviceName=s.DeviceName,username=u.Username,fullName=u.FullName,createdAt=s.CreatedAt,lastSeenAt=s.LastSeenAt,expiresAt=s.ExpiresAt}).ToListAsync(ct);}
 public async Task Revoke(Guid id,CancellationToken ct){var s=await r.Sessions.SingleOrDefaultAsync(s=>s.Id==id,ct);Require(s is not null,"Không tìm thấy phiên.",404);s!.RevokedAt=DateTime.UtcNow;await r.Save(ct);}
 public async Task<object> Pois(CancellationToken ct)=>await r.Pois.Where(p=>!p.IsDeleted).OrderBy(p=>p.POIID).Select(p=>new{id=p.POIID,p.Name,p.Description,p.Address,p.Latitude,p.Longitude,p.ImageUrl,p.Status,p.RowVersion,p.UpdatedAt,guideCount=p.AudioGuides.Count(g=>!g.IsDeleted),audioCount=p.AudioGuides.Count(g=>!g.IsDeleted&&g.AudioUrl!=null&&g.AudioUrl!="")}).ToListAsync(ct);
 public async Task<object> SavePoi(int? id,PoiInput x,CancellationToken ct){
  Require(!string.IsNullOrWhiteSpace(x.Name)&&!string.IsNullOrWhiteSpace(x.Address)&&!string.IsNullOrWhiteSpace(x.Description),"Tên, địa chỉ và mô tả không được để trống.");ValidateUrl(x.ImageUrl);
  Require(!await r.Pois.AnyAsync(p=>!p.IsDeleted&&p.POIID!=id&&p.Name==x.Name.Trim()&&p.Address==x.Address.Trim(),ct),"Tên và địa chỉ POI đã tồn tại.",409);
  var p=id.HasValue?await r.Pois.SingleOrDefaultAsync(p=>p.POIID==id&&!p.IsDeleted,ct):new PointOfInterest();Require(p is not null,"POI không còn tồn tại.",404);
  if(id.HasValue){Require(!string.IsNullOrWhiteSpace(x.RowVersion),"Thiếu phiên bản dữ liệu.");byte[] version;try{version=Convert.FromBase64String(x.RowVersion!);}catch{throw new AdminProblem(400,"Phiên bản dữ liệu không hợp lệ.");}r.ExpectedVersion(p!,version);}else r.Add(p!);
  p!.Name=x.Name.Trim();p.Address=x.Address.Trim();p.Description=x.Description.Trim();p.Latitude=x.Latitude;p.Longitude=x.Longitude;p.ImageUrl=x.ImageUrl;p.Status=x.Status;p.UpdatedAt=DateTime.UtcNow;await r.Save(ct);return new{id=p.POIID};
 }
 public async Task DeletePoi(int id,string? version,CancellationToken ct){var p=await r.Pois.Include(p=>p.AudioGuides).SingleOrDefaultAsync(p=>p.POIID==id&&!p.IsDeleted,ct);Require(p is not null,"POI không còn tồn tại.",404);Require(!string.IsNullOrWhiteSpace(version),"Thiếu phiên bản dữ liệu.");try{r.ExpectedVersion(p!,Convert.FromBase64String(version!));}catch(FormatException){throw new AdminProblem(400,"Phiên bản dữ liệu không hợp lệ.");}p!.IsDeleted=true;p.UpdatedAt=DateTime.UtcNow;foreach(var g in p.AudioGuides)g.IsDeleted=true;await r.Save(ct);}
 public async Task<object> Guides(CancellationToken ct)=>await r.Guides.Where(g=>!g.IsDeleted&&!g.PointOfInterest.IsDeleted).OrderBy(g=>g.POIID).Select(g=>new{id=g.AudioGuideID,poiId=g.POIID,poiName=g.PointOfInterest.Name,g.LanguageCode,g.Title,g.TextContent,g.AudioUrl,g.DurationSeconds}).ToListAsync(ct);
 public async Task SaveGuide(int? id,GuideInput x,CancellationToken ct){
  Require(!string.IsNullOrWhiteSpace(x.Title)&&!string.IsNullOrWhiteSpace(x.TextContent),"Cần tiêu đề và nội dung thuyết minh.");ValidateUrl(x.AudioUrl);
  Require(await r.Pois.AnyAsync(p=>p.POIID==x.PoiId&&!p.IsDeleted,ct),"POI không còn tồn tại.",404);
  var existing=id.HasValue?await r.Guides.SingleOrDefaultAsync(g=>g.AudioGuideID==id&&!g.IsDeleted,ct):null;
  if(id.HasValue){Require(existing is not null,"Thuyết minh không tồn tại.",404);Require(existing!.LanguageCode==x.LanguageCode&&existing.POIID==x.PoiId,"Không được đổi ngôn ngữ hoặc POI khi sửa.");}
  else Require(await r.Languages.AnyAsync(l=>l.LanguageCode==x.LanguageCode&&l.IsActive,ct),"Ngôn ngữ không hoạt động.");
  var duplicate=await r.Guides.SingleOrDefaultAsync(g=>g.POIID==x.PoiId&&g.LanguageCode==x.LanguageCode,ct);
  Require(duplicate is null||duplicate.IsDeleted||duplicate.AudioGuideID==id,"POI đã có thuyết minh bằng ngôn ngữ này. Hãy chọn Sửa.",409);
  var g=existing??duplicate??new AudioGuide{POIID=x.PoiId,LanguageCode=x.LanguageCode};if(existing is null&&duplicate is null)r.Add(g);
  var previousUrl=g.AudioUrl;
  g.Title=x.Title.Trim();g.TextContent=x.TextContent.Trim();g.AudioUrl=x.AudioUrl;g.DurationSeconds=x.DurationSeconds;g.IsDeleted=false;g.UpdatedAt=DateTime.UtcNow;
  try {await r.Save(ct);} catch {if(x.AudioUrl!=previousUrl)await DeleteUnreferencedFile(x.AudioUrl,CancellationToken.None);throw;}
  if(previousUrl!=x.AudioUrl)await DeleteUnreferencedFile(previousUrl,ct);
 }
 public async Task DeleteGuide(int id,CancellationToken ct){var g=await r.Guides.SingleOrDefaultAsync(g=>g.AudioGuideID==id&&!g.IsDeleted,ct);Require(g is not null,"Thuyết minh không tồn tại.",404);var old=g!.AudioUrl;g.IsDeleted=true;g.AudioUrl=null;await r.Save(ct);await DeleteUnreferencedFile(old,ct);}
 public async Task<object> PublicLanguages(CancellationToken ct)=>await r.Languages.Where(l=>l.IsActive).OrderByDescending(l=>l.IsDefault).ThenBy(l=>l.LanguageCode).Select(l=>new{code=l.LanguageCode,label=l.LanguageName,locale=l.LanguageCode}).ToListAsync(ct);
 public async Task<object> Languages(CancellationToken ct)=>await r.Languages.OrderByDescending(l=>l.IsDefault).ThenBy(l=>l.LanguageCode).Select(l=>new{l.LanguageCode,l.LanguageName,l.IsActive,l.IsDefault,guideCount=l.AudioGuides.Count(g=>!g.IsDeleted&&!g.PointOfInterest.IsDeleted)}).ToListAsync(ct);
 public async Task SaveLanguage(string? code,LanguageInput x,CancellationToken ct){var l=code is null?new Language{LanguageCode=x.LanguageCode}:await r.Languages.SingleOrDefaultAsync(l=>l.LanguageCode==code,ct);Require(l is not null,"Ngôn ngữ không tồn tại.",404);Require(!string.IsNullOrWhiteSpace(x.LanguageName),"Cần tên ngôn ngữ.");Require(code is null||code==x.LanguageCode,"Không thể đổi mã ngôn ngữ.");Require(!l!.IsDefault||x.IsActive,"Không được vô hiệu hóa ngôn ngữ mặc định.");if(code is null){Require(!await r.Languages.AnyAsync(l=>l.LanguageCode==x.LanguageCode,ct),"Mã ngôn ngữ đã tồn tại.",409);r.Add(l);}l.LanguageName=x.LanguageName.Trim();l.IsActive=x.IsActive;await r.Save(ct);}
 public async Task DeleteLanguage(string code,CancellationToken ct){var l=await r.Languages.SingleOrDefaultAsync(l=>l.LanguageCode==code,ct);Require(l is not null,"Ngôn ngữ không tồn tại.",404);Require(!l!.IsDefault,"Không thể xóa ngôn ngữ mặc định.");Require(!await r.Guides.AnyAsync(g=>g.LanguageCode==code,ct)&&!await r.Events.AnyAsync(e=>e.LanguageCode==code,ct),"Ngôn ngữ đang được sử dụng, hãy vô hiệu hóa thay vì xóa.",409);r.Remove(l);await r.Save(ct);}
 async Task DeleteUnreferencedFile(string? url,CancellationToken ct){
  if(string.IsNullOrEmpty(url)||!url.StartsWith("/uploads/"))return;
  var file=Path.GetFileName(url);
  if(url!="/uploads/"+file||await r.Guides.AnyAsync(g=>g.AudioUrl==url,ct))return;
  try{File.Delete(Path.Combine(env.ContentRootPath,"wwwroot","uploads",file));}catch(IOException){/* Kept for background cleanup. */}
 }
 static void ValidateUrl(string? url){if(string.IsNullOrEmpty(url))return;Require(url.StartsWith("/uploads/")||(Uri.TryCreate(url,UriKind.Absolute,out var u)&&u.Scheme=="https"),"Đường dẫn phải dùng HTTPS hoặc tệp đã tải lên.");}
 public async Task<object> Upload(IFormFile file,CancellationToken ct){
  var ext=Path.GetExtension(file.FileName).ToLowerInvariant();Require(new[]{".mp3",".wav",".ogg",".m4a"}.Contains(ext),"Chỉ chấp nhận MP3, WAV, OGG, M4A.");Require(file.Length>0&&file.Length<=20*1024*1024,"Tệp phải nhỏ hơn 20 MB.");
  // Check a small header to reject renamed non-audio files.
  using var stream=file.OpenReadStream();var head=new byte[12];var count=await stream.ReadAsync(head,ct);
  var valid=count>=4&&((ext==".mp3"&&(System.Text.Encoding.ASCII.GetString(head,0,3)=="ID3"||(head[0]==255&&(head[1]&224)==224)))||(ext==".wav"&&count>=12&&System.Text.Encoding.ASCII.GetString(head,0,4)=="RIFF"&&System.Text.Encoding.ASCII.GetString(head,8,4)=="WAVE")||(ext==".ogg"&&System.Text.Encoding.ASCII.GetString(head,0,4)=="OggS")||(ext==".m4a"&&count>=8&&System.Text.Encoding.ASCII.GetString(head,4,4)=="ftyp"));
  Require(valid,"Tệp không có định dạng âm thanh hợp lệ.");
  var path=Path.Combine(env.ContentRootPath,"wwwroot","uploads");Directory.CreateDirectory(path);var name=Guid.NewGuid().ToString("N")+ext;await using(var output=File.Create(Path.Combine(path,name))){await output.WriteAsync(head.AsMemory(0,count),ct);await stream.CopyToAsync(output,ct);}return new{url="/uploads/"+name};
 }
 public async Task<object> Tts(TtsInput x,CancellationToken ct){
  var key=config["Tts:GoogleApiKey"];Require(!string.IsNullOrWhiteSpace(key),"Chưa cấu hình dịch vụ tạo âm thanh. Bạn có thể tải lên tệp âm thanh.",503);
  Require(await r.Languages.AnyAsync(l=>l.LanguageCode==x.LanguageCode&&l.IsActive,ct),"Ngôn ngữ không hoạt động.");
  var locale=x.LanguageCode.Contains('-')?x.LanguageCode:x.LanguageCode switch{"vi"=>"vi-VN","en"=>"en-US","zh"=>"cmn-CN","ja"=>"ja-JP","ko"=>"ko-KR","fr"=>"fr-FR",_=>x.LanguageCode};
  using var request=new HttpRequestMessage(HttpMethod.Post,"https://texttospeech.googleapis.com/v1/text:synthesize");request.Headers.Add("X-Goog-Api-Key",key);request.Content=JsonContent.Create(new{input=new{text=x.Text},voice=new{languageCode=locale},audioConfig=new{audioEncoding="MP3"}});
  using var response=await clients.CreateClient("Tts").SendAsync(request,ct);Require(response.IsSuccessStatusCode,"Dịch vụ TTS không khả dụng hoặc không hỗ trợ ngôn ngữ này. Hãy tải tệp thủ công.",502);using var json=JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));var bytes=Convert.FromBase64String(json.RootElement.GetProperty("audioContent").GetString()!);var path=Path.Combine(env.ContentRootPath,"wwwroot","uploads");Directory.CreateDirectory(path);var name=Guid.NewGuid().ToString("N")+".mp3";await File.WriteAllBytesAsync(Path.Combine(path,name),bytes,ct);return new{url="/uploads/"+name};
 }
}
