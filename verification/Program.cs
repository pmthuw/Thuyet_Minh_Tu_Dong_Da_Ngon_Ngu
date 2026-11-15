using System.Text.Json;
using Auralis.Api.Data;
using Auralis.Api.Models;
using Microsoft.EntityFrameworkCore;

// Chỉ xây dựng EF model, không mở kết nối hoặc sửa database.
using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
    .UseSqlServer("Server=localhost;Database=AuralisDB;Integrated Security=True;Encrypt=True").Options);
var expected = JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "schema-expected.json")));
var entities = db.Model.GetEntityTypes().ToDictionary(e => e.GetTableName()!);
Check(entities.Count == 4, "Expected exactly 4 tables");
foreach (var table in expected.RootElement.EnumerateObject())
{
    var entity = entities[table.Name];
    Check(entity.GetSchema() == "dbo", table.Name + " schema");
    var columns = entity.GetProperties().ToDictionary(p => p.Name);
    Check(columns.Count == table.Value.EnumerateObject().Count(), table.Name + " column count");
    foreach (var column in table.Value.EnumerateObject())
    {
        var prop = columns[column.Name];
        Check(string.Equals(prop.GetColumnType(), column.Value.GetProperty("Type").GetString(), StringComparison.OrdinalIgnoreCase), table.Name + "." + prop.Name + " SQL type");
        Check(prop.IsNullable == column.Value.GetProperty("Nullable").GetBoolean(), table.Name + "." + prop.Name + " nullability");
    }
}
var audio = db.Model.FindEntityType(typeof(AudioGuide))!;
Check(audio.GetKeys().Any(k => k.Properties.Select(p => p.Name).SequenceEqual(new[] { "POIID", "LanguageCode" })), "AudioGuide unique key");
Check(audio.GetForeignKeys().Single(k => k.PrincipalEntityType.ClrType == typeof(PointOfInterest)).DeleteBehavior == DeleteBehavior.Cascade, "POI cascade delete");
Check(audio.GetForeignKeys().Single(k => k.PrincipalEntityType.ClrType == typeof(Language)).DeleteBehavior == DeleteBehavior.NoAction, "Language no-action delete");
Console.WriteLine("PASS: SQL Server EF model types, nullability, keys and delete behavior. No database connection was opened.");
static void Check(bool ok, string message) { if (!ok) throw new InvalidOperationException(message); }
