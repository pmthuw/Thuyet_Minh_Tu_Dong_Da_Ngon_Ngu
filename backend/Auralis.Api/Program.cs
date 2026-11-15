using Auralis.Api.Admin;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Auralis.Api.Data;
using Auralis.Api.Dtos;
using Auralis.Api.Configuration;
using Auralis.Api.Repositories;
using Auralis.Api.Filters;
using Auralis.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers(options => { options.Filters.Add<BusinessValidationFilter>(); options.Filters.Add<AdminExceptionFilter>(); });
builder.Services.AddScoped<IPoiRepository, PoiRepository>();
builder.Services.AddScoped<ITranslationRepository, TranslationRepository>();
builder.Services.AddScoped<IPoiService, PoiService>();
builder.Services.AddScoped<IRoutingService, RoutingService>();
builder.Services.AddScoped<ITranslationService, TranslationService>();
builder.Services.AddProblemDetails();
builder.Services.AddScoped<IAdminRepository, AdminRepository>();
builder.Services.AddScoped<AdminService>();
builder.Services.AddHostedService<UploadCleanup>();
builder.Services.AddAuthentication("Session").AddScheme<AuthenticationSchemeOptions, SessionAuth>("Session", _ => {});
builder.Services.AddAuthorization();
builder.Services.AddHttpClient("Tts", c => c.Timeout = TimeSpan.FromSeconds(30));
builder.Services.AddRateLimiter(o => {
 o.RejectionStatusCode = 429;
 o.AddPolicy("login", ctx => RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit=10, Window=TimeSpan.FromMinutes(1), QueueLimit=0 }));
 o.AddPolicy("telemetry", ctx => RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit=120, Window=TimeSpan.FromMinutes(1), QueueLimit=0 }));
});

// Không fallback SQLite: thiếu cấu hình thì báo lỗi ngay.
var connectionString = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("Thiếu ConnectionStrings:Default cho SQL Server.");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure()));

builder.Services.Configure<RoutingOptions>(builder.Configuration.GetSection("Routing"));
builder.Services.Configure<TranslationOptions>(builder.Configuration.GetSection("Translation"));

// Gọi dịch vụ ngoài tối đa 6s — frontend tự huỷ request sau 8s (xem services/api.js).
void ConfigureClient(HttpClient c)
{
    c.Timeout = TimeSpan.FromSeconds(6);
    c.DefaultRequestHeaders.UserAgent.ParseAdd("AuralisApi/1.0");
}
builder.Services.AddHttpClient<IRoutingRepository, RoutingRepository>(ConfigureClient);
builder.Services.AddHttpClient<ITranslationProviderRepository, TranslationProviderRepository>(ConfigureClient);

var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
              ?? ["http://localhost:5173"];
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// Database được tạo bằng database/1_Create.sql và 2_Mock.sql.
// Không EnsureCreated/Migrate/seed tự động lên database đã có schema.
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads"));
app.UseStaticFiles(new StaticFileOptions { FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(Path.Combine(app.Environment.ContentRootPath, "wwwroot")) });
app.MapControllers();
app.MapGet("/api/health", () => Results.Ok(new HealthResponse("ok")));

// Readiness: actually query the mapped SQL tables, not only the HTTP server.
app.MapGet("/api/health/db", async (AppDbContext db, ILoggerFactory logs, CancellationToken ct) =>
{
    try
    {
        await db.PointsOfInterest.AsNoTracking()
            .Include(p => p.AudioGuides).ThenInclude(g => g.Language)
            .Take(1).ToListAsync(ct);
        return Results.Ok(new { status = "ok", database = "AuralisDB" });
    }
    catch (Exception ex) when (ex is not OperationCanceledException)
    {
        logs.CreateLogger("DatabaseReadiness").LogError(ex, "Database readiness check failed.");
        return Results.Problem(title: "Database is unavailable or its schema is incompatible.", statusCode: 503);
    }
});

// Explicit one-time bootstrap; reads credentials from stdin, never command-line arguments.
if (args.Contains("--create-admin")) {
 using var scope = app.Services.CreateScope();
 var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
 Console.WriteLine("Username:"); var username = Console.ReadLine()?.Trim();
 Console.WriteLine("Full name:"); var fullName = Console.ReadLine()?.Trim();
 Console.WriteLine("Password (minimum 12 characters; input is visible in this terminal):");
 var password = Console.ReadLine();
 if (string.IsNullOrWhiteSpace(username) || username.Length>50 || string.IsNullOrWhiteSpace(password) || password.Length<12)
  throw new InvalidOperationException("Username required; password must contain at least 12 characters.");
 if (await db.Users.AnyAsync(u=>u.Username==username)) throw new InvalidOperationException("Username exists; no password was changed.");
 var user = new Auralis.Api.Models.User { Username=username, FullName=fullName, IsActive=true, CreatedAt=DateTime.UtcNow };
 user.PasswordHash = new PasswordHasher<Auralis.Api.Models.User>().HashPassword(user,password);
 db.Users.Add(user); await db.SaveChangesAsync(); Console.WriteLine("Admin created.");
 return;
}
app.Run();
