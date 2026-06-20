namespace VehicleService.Models;

/// <summary>
/// Entité Vehicle = une ligne dans la table "vehicles" de PostgreSQL.
/// Entity Framework Core va mapper cette classe vers la base de données.
/// C'est l'équivalent de @Entity en Java/Spring Boot.
/// </summary>
public class Vehicle
{
    public long Id { get; set; }

    public string Brand { get; set; } = string.Empty;       // Marque : BMW, Toyota...

    public string Model { get; set; } = string.Empty;       // Modèle : Série 3, Corolla...

    public string Category { get; set; } = string.Empty;    // Catégorie : SUV, Sedan, Sport...

    public string Color { get; set; } = string.Empty;

    public int Year { get; set; }                           // Année de fabrication

    public string LicensePlate { get; set; } = string.Empty; // Immatriculation

    public decimal PricePerDay { get; set; }                 // Prix par jour en DZD/EUR

    public bool Available { get; set; } = true;             // Disponible à la location ?

    public string ImageUrl { get; set; } = string.Empty;   // URL de la photo

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
