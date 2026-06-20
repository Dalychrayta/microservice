using Microsoft.EntityFrameworkCore;
using VehicleService.Models;

namespace VehicleService.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Vehicle> Vehicles { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.ToTable("vehicles");
            entity.HasKey(v => v.Id);
            entity.Property(v => v.Id).UseIdentityColumn();
            entity.Property(v => v.Brand).IsRequired().HasMaxLength(100);
            entity.Property(v => v.Model).IsRequired().HasMaxLength(100);
            entity.Property(v => v.Category).IsRequired().HasMaxLength(50);
            entity.Property(v => v.LicensePlate).IsRequired().HasMaxLength(20);
            entity.HasIndex(v => v.LicensePlate).IsUnique();
            entity.Property(v => v.PricePerDay).HasPrecision(10, 2);
        });
    }
}
