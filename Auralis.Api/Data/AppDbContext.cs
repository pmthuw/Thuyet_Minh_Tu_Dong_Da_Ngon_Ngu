using Auralis.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Auralis.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Poi> Pois => Set<Poi>();
    public DbSet<PoiTranslation> PoiTranslations => Set<PoiTranslation>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Poi>(e =>
        {
            e.Property(p => p.Name).IsRequired().HasMaxLength(200);
            e.Property(p => p.Category).IsRequired().HasMaxLength(20);
            e.HasIndex(p => p.Category);
            e.HasMany(p => p.Translations)
             .WithOne(t => t.Poi)
             .HasForeignKey(t => t.PoiId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<PoiTranslation>(e =>
        {
            e.Property(t => t.Language).IsRequired().HasMaxLength(10);
            e.Property(t => t.Text).IsRequired();
            e.HasIndex(t => new { t.PoiId, t.Language }).IsUnique();
        });
    }
}
