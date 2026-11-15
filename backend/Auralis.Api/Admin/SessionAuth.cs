using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
namespace Auralis.Api.Admin;
public class SessionAuth(IOptionsMonitor<AuthenticationSchemeOptions> options,ILoggerFactory logger,UrlEncoder encoder,
 IAdminRepository repo) : AuthenticationHandler<AuthenticationSchemeOptions>(options,logger,encoder) {
 public static string Hash(string token)=>Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
 protected override async Task<AuthenticateResult> HandleAuthenticateAsync() {
  var header=Request.Headers.Authorization.ToString();
  if(!header.StartsWith("Bearer ",StringComparison.OrdinalIgnoreCase))return AuthenticateResult.NoResult();
  var hash=Hash(header[7..]);var now=DateTime.UtcNow;
  var s=await repo.Sessions.FirstOrDefaultAsync(s=>s.TokenHash==hash&&s.RevokedAt==null&&s.ExpiresAt>now,Context.RequestAborted);
  if(s?.UserID is null)return AuthenticateResult.Fail("Phiên không hợp lệ hoặc đã hết hạn.");
  var user=await repo.Users.FirstOrDefaultAsync(u=>u.UserID==s.UserID&&u.IsActive,Context.RequestAborted);
  if(user is null)return AuthenticateResult.Fail("Tài khoản không hoạt động.");
  var claims=new[]{new Claim(ClaimTypes.NameIdentifier,user.UserID.ToString()),new Claim(ClaimTypes.Name,user.FullName??user.Username),new Claim(ClaimTypes.Role,"Admin"),new Claim("sid",s.Id.ToString())};
  return AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(new ClaimsIdentity(claims,Scheme.Name)),Scheme.Name));
 }
}
