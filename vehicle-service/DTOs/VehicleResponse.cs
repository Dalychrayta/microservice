namespace VehicleService.DTOs;

/// <summary>
/// DTO retourné au client (et à rental-service via Feign).
/// C'est exactement ce que VehicleResponse.java dans rental-service attend.
/// Les noms des champs doivent correspondre pour que Feign désérialise correctement.
/// </summary>
public class VehicleResponse
{
    public long Id { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int Year { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public decimal PricePerDay { get; set; }
    public bool Available { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
