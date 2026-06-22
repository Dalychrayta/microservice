namespace VehicleService.DTOs;

/// <summary>
/// DTO pour les dates réservées d'un véhicule.
/// Reçu depuis rental-service via Feign.
/// </summary>
public class ReservedDateRangeDto
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}
