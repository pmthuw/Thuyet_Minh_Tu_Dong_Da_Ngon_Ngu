using Auralis.Api.Models;
using Microsoft.EntityFrameworkCore;
namespace Auralis.Api.Data;
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<PointOfInterest> PointsOfInterest => Set<PointOfInterest>();
    public DbSet<Language> Languages => Set<Language>();
    public DbSet<AudioGuide> AudioGuides => Set<AudioGuide>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.ToTable("Users", "dbo");
            e.HasKey(x => x.UserID);
            e.Property(x => x.UserID).UseIdentityColumn(1, 1);
            e.Property(x => x.Username).HasColumnType("varchar(50)").IsRequired();
            e.HasAlternateKey(x => x.Username);
            e.Property(x => x.PasswordHash).HasColumnType("varchar(255)").IsRequired();
            e.Property(x => x.FullName).HasColumnType("nvarchar(100)");
            e.Property(x => x.IsActive).HasColumnType("bit").HasDefaultValue(true);
            e.Property(x => x.CreatedAt).HasColumnType("datetime").HasDefaultValueSql("getdate()");
        });
        b.Entity<PointOfInterest>(e =>
        {
            e.ToTable("PointsOfInterest", "dbo", table =>
            {
                table.HasCheckConstraint("CK_POI_Latitude", "[Latitude] between -90 and 90");
                table.HasCheckConstraint("CK_POI_Longitude", "[Longitude] between -180 and 180");
                table.HasCheckConstraint("CK_POI_Status", "[Status] in ('Active', 'Inactive')");
            });
            e.HasKey(x => x.POIID);
            e.Property(x => x.POIID).UseIdentityColumn(1, 1);
            e.Property(x => x.Name).HasColumnType("nvarchar(200)").IsRequired();
            e.Property(x => x.Description).HasColumnType("nvarchar(max)");
            e.Property(x => x.Address).HasColumnType("nvarchar(500)");
            e.Property(x => x.Latitude).HasColumnType("decimal(9,6)");
            e.Property(x => x.Longitude).HasColumnType("decimal(9,6)");
            e.Property(x => x.ImageUrl).HasColumnType("varchar(500)");
            e.Property(x => x.Status).HasColumnType("nvarchar(20)").IsRequired().HasDefaultValue("Active");
            e.Property(x => x.IsDeleted).HasColumnType("bit").HasDefaultValue(false);
            e.Property(x => x.CreatedAt).HasColumnType("datetime").HasDefaultValueSql("getdate()");
            e.Property(x => x.UpdatedAt).HasColumnType("datetime");
        });
        b.Entity<Language>(e =>
        {
            e.ToTable("Languages", "dbo");
            e.HasKey(x => x.LanguageCode);
            e.Property(x => x.LanguageCode).HasColumnType("varchar(10)").ValueGeneratedNever();
            e.Property(x => x.LanguageName).HasColumnType("nvarchar(50)").IsRequired();
            e.Property(x => x.IsDefault).HasColumnType("bit").HasDefaultValue(false);
            e.Property(x => x.IsActive).HasColumnType("bit").HasDefaultValue(true);
        });
        b.Entity<AudioGuide>(e =>
        {
            e.ToTable("AudioGuides", "dbo");
            e.HasKey(x => x.AudioGuideID);
            e.Property(x => x.AudioGuideID).UseIdentityColumn(1, 1);
            e.Property(x => x.LanguageCode).HasColumnType("varchar(10)").IsRequired();
            e.Property(x => x.Title).HasColumnType("nvarchar(200)");
            e.Property(x => x.TextContent).HasColumnType("nvarchar(max)");
            e.Property(x => x.AudioUrl).HasColumnType("varchar(500)");
            e.Property(x => x.DurationSeconds).HasColumnType("int").HasDefaultValue(0).ValueGeneratedNever();
            e.Property(x => x.IsDeleted).HasColumnType("bit").HasDefaultValue(false);
            e.Property(x => x.CreatedAt).HasColumnType("datetime").HasDefaultValueSql("getdate()");
            e.Property(x => x.UpdatedAt).HasColumnType("datetime");
            e.HasAlternateKey(x => new { x.POIID, x.LanguageCode }).HasName("UQ_POI_Language");
            e.HasOne(x => x.PointOfInterest).WithMany(x => x.AudioGuides)
                .HasForeignKey(x => x.POIID).OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_AudioGuides_POI");
            e.HasOne(x => x.Language).WithMany(x => x.AudioGuides)
                .HasForeignKey(x => x.LanguageCode).OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_AudioGuides_Language");
        });
    }
}
