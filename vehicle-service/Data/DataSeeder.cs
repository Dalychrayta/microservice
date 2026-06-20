using VehicleService.Models;

namespace VehicleService.Data;

/// <summary>
/// Insère les données initiales si la table est vide.
/// Contrairement au HasData() d'Entity Framework, cette approche
/// ne nécessite pas d'IDs fixes — PostgreSQL génère les IDs automatiquement.
/// </summary>
public static class DataSeeder
{
    public static void SeedVehicles(AppDbContext context)
    {
        // Vérifie si la table existe avant de faire quoi que ce soit
        try
        {
            if (context.Vehicles.Any()) return;
        }
        catch
        {
            // La table n'existe pas encore — EnsureCreated va la créer
            context.Database.EnsureCreated();
        }

        var vehicles = new List<Vehicle>
        {
            new() { Brand = "BMW", Model = "Série 3", Category = "Sedan",
                Color = "Noir", Year = 2022, LicensePlate = "ABC-123",
                PricePerDay = 8000, Available = true, ImageUrl = "/images/bmw-s3.jpg",
                CreatedAt = DateTime.UtcNow },
            new() { Brand = "Toyota", Model = "Corolla", Category = "Sedan",
                Color = "Blanc", Year = 2021, LicensePlate = "DEF-456",
                PricePerDay = 4000, Available = true, ImageUrl = "/images/toyota-corolla.jpg",
                CreatedAt = DateTime.UtcNow },
            new() { Brand = "Range Rover", Model = "Sport", Category = "SUV",
                Color = "Gris", Year = 2023, LicensePlate = "GHI-789",
                PricePerDay = 15000, Available = true, ImageUrl = "/images/rr-sport.jpg",
                CreatedAt = DateTime.UtcNow },
            new() { Brand = "Mercedes", Model = "Classe A", Category = "Compact",
                Color = "Blanc", Year = 2022, LicensePlate = "JKL-012",
                PricePerDay = 7000, Available = true, ImageUrl = "/images/mercedes-a.jpg",
                CreatedAt = DateTime.UtcNow },
            new() { Brand = "Volkswagen", Model = "Golf", Category = "Compact",
                Color = "Rouge", Year = 2021, LicensePlate = "MNO-345",
                PricePerDay = 3500, Available = true, ImageUrl = "/images/vw-golf.jpg",
                CreatedAt = DateTime.UtcNow }
        };

        context.Vehicles.AddRange(vehicles);
        context.SaveChanges();
    }
}
