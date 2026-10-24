using Auralis.Api.Data;
using Auralis.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddProblemDetails();

builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=auralis.db"));

builder.Services.Configure<RoutingOptions>(builder.Configuration.GetSection("Routing"));
builder.Services.Configure<TranslationOptions>(builder.Configuration.GetSection("Translation"));

// Gọi dịch vụ ngoài tối đa 6s — frontend tự huỷ request sau 8s (xem services/api.js).
void ConfigureClient(HttpClient c)
{
    c.Timeout = TimeSpan.FromSeconds(6);
    c.DefaultRequestHeaders.UserAgent.ParseAdd("AuralisApi/1.0");
}
builder.Services.AddHttpClient<IRoutingService, RoutingService>(ConfigureClient);
builder.Services.AddHttpClient<ITranslationService, TranslationService>(ConfigureClient);

var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
              ?? ["http://localhost:5173"];
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    SeedData.Seed(db, app.Logger);
}

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors();
app.MapControllers();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.Run();
