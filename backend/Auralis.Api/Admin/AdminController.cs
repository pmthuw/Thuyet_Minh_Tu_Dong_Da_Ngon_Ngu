using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
namespace Auralis.Api.Admin;
[ApiController,Route("api/admin"),Authorize(Roles="Admin")]
public class AdminController(AdminService service) : ControllerBase {
 Guid Sid=>Guid.Parse(User.FindFirst("sid")!.Value);
 [HttpPost("login"),AllowAnonymous,EnableRateLimiting("login")]
 public async Task<IActionResult> Login(LoginInput input,CancellationToken ct)=>Ok(await service.Login(input,ct));
 [HttpPost("heartbeat")] public async Task<IActionResult> Heartbeat(CancellationToken ct){await service.Heartbeat(Sid,ct);return NoContent();}
 [HttpPost("logout")] public async Task<IActionResult> Logout(CancellationToken ct){await service.Logout(Sid,ct);return NoContent();}
 [HttpGet("overview")] public async Task<IActionResult> Overview([FromQuery]int days=30,CancellationToken ct=default)=>Ok(await service.Overview(days,ct));
 [HttpGet("devices")] public async Task<IActionResult> Devices(CancellationToken ct)=>Ok(await service.Devices(ct));
 [HttpDelete("devices/{id:guid}")] public async Task<IActionResult> Revoke(Guid id,CancellationToken ct){await service.Revoke(id,ct);return NoContent();}
 [HttpGet("pois")] public async Task<IActionResult> Pois(CancellationToken ct)=>Ok(await service.Pois(ct));
 [HttpPost("pois")] public async Task<IActionResult> AddPoi(PoiInput input,CancellationToken ct)=>Ok(await service.SavePoi(null,input,ct));
 [HttpPut("pois/{id:int}")] public async Task<IActionResult> UpdatePoi(int id,PoiInput input,CancellationToken ct)=>Ok(await service.SavePoi(id,input,ct));
 [HttpDelete("pois/{id:int}")] public async Task<IActionResult> DeletePoi(int id,[FromQuery]string rowVersion,CancellationToken ct){await service.DeletePoi(id,rowVersion,ct);return NoContent();}
 [HttpGet("guides")] public async Task<IActionResult> Guides(CancellationToken ct)=>Ok(await service.Guides(ct));
 [HttpPost("guides")] public async Task<IActionResult> AddGuide(GuideInput input,CancellationToken ct){await service.SaveGuide(null,input,ct);return NoContent();}
 [HttpPut("guides/{id:int}")] public async Task<IActionResult> UpdateGuide(int id,GuideInput input,CancellationToken ct){await service.SaveGuide(id,input,ct);return NoContent();}
 [HttpDelete("guides/{id:int}")] public async Task<IActionResult> DeleteGuide(int id,CancellationToken ct){await service.DeleteGuide(id,ct);return NoContent();}
 [HttpGet("languages")] public async Task<IActionResult> Languages(CancellationToken ct)=>Ok(await service.Languages(ct));
 [HttpPost("languages")] public async Task<IActionResult> AddLanguage(LanguageInput input,CancellationToken ct){await service.SaveLanguage(null,input,ct);return NoContent();}
 [HttpPut("languages/{code}")] public async Task<IActionResult> UpdateLanguage(string code,LanguageInput input,CancellationToken ct){await service.SaveLanguage(code,input,ct);return NoContent();}
 [HttpDelete("languages/{code}")] public async Task<IActionResult> DeleteLanguage(string code,CancellationToken ct){await service.DeleteLanguage(code,ct);return NoContent();}
 [HttpPost("upload"),RequestSizeLimit(21*1024*1024)] public async Task<IActionResult> Upload(IFormFile file,CancellationToken ct)=>Ok(await service.Upload(file,ct));
 [HttpPost("tts")] public async Task<IActionResult> Tts(TtsInput input,CancellationToken ct)=>Ok(await service.Tts(input,ct));
}
[ApiController,Route("api/telemetry"),EnableRateLimiting("telemetry")]
public class TelemetryController(AdminService service) : ControllerBase {
 [HttpPost("heartbeat")] public async Task<IActionResult> Heartbeat(CancellationToken ct){var h=Request.Headers.Authorization.ToString();await service.VisitorHeartbeat(h.StartsWith("Bearer ",StringComparison.OrdinalIgnoreCase)?h[7..]:"",ct);return NoContent();}
 [HttpPost("session")] public async Task<IActionResult> Session(VisitorInput input,CancellationToken ct)=>Ok(await service.Visitor(input,ct));
 [HttpPost("playback")] public async Task<IActionResult> Playback(PlaybackInput input,CancellationToken ct){var h=Request.Headers.Authorization.ToString();await service.Playback(input,h.StartsWith("Bearer ")?h[7..]:"",ct);return NoContent();}
}

[ApiController,Route("api/languages")]
public class PublicLanguagesController(AdminService service):ControllerBase {
 [HttpGet]public async Task<IActionResult> Get(CancellationToken ct)=>Ok(await service.PublicLanguages(ct));
}
