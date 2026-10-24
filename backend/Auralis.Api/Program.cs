using Auralis.Api.Data;
using Auralis.Api.Dtos;
using Auralis.Api.Configuration;
using Auralis.Api.Repositories;
using Auralis.Api.Filters;
using Auralis.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers(options => options.Filters.Add<BusinessValidationFilter>());
builder.Services.AddScoped<IPoiRepository, PoiRepository>();
builder.Services.AddScoped<ITranslationRepository, TranslationRepository>();
builder.Services.AddScoped<IPoiService, PoiService>();
builder.Services.AddScoped<IRoutingService, RoutingService>();
builder.Services.AddScoped<ITranslationService, TranslationService>();
builder.Services.AddProblemDetails();

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

app.Run();
