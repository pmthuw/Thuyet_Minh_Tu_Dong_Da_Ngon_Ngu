using System.ComponentModel.DataAnnotations;
namespace Auralis.Api.Admin;
public record LoginInput([Required]string Username,[Required]string Password,Guid DeviceId,[Required,StringLength(200)]string DeviceName);
public record VisitorInput(Guid DeviceId,[Required,StringLength(200)]string DeviceName);
public record PlaybackInput(Guid EventId,int PoiId,[Required,StringLength(10)]string LanguageCode,[StringLength(10)]string? SourceLanguageCode=null);
public record PoiInput([Required,StringLength(200)]string Name,[Required,StringLength(500)]string Address,
 [Required,StringLength(10000)]string Description,[Range(-90,90)]decimal Latitude,[Range(-180,180)]decimal Longitude,
 [StringLength(500)]string? ImageUrl,[Required,RegularExpression("^(Active|Inactive)$")]string Status,string? RowVersion);
public record GuideInput(int PoiId,[Required,StringLength(10)]string LanguageCode,[Required,StringLength(200)]string Title,
 [Required,StringLength(5000)]string TextContent,[StringLength(500)]string? AudioUrl,[Range(0,86400)]int DurationSeconds);
public record LanguageInput([Required,RegularExpression("^[a-z]{2,3}(-[A-Za-z]{2,4})?$")]string LanguageCode,
 [Required,StringLength(50)]string LanguageName,bool IsActive);
public record TtsInput([Required,StringLength(5000)]string Text,[Required,StringLength(10)]string LanguageCode);
public class AdminProblem(int status,string message) : Exception(message) { public int Status {get;}=status; }
