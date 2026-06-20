namespace VehicleService.Messaging;

using System.Text.Json;

/// <summary>
/// Représentation de l'event reçu depuis rental-service via RabbitMQ.
/// Les noms des propriétés doivent correspondre exactement à RentalEvent.java
/// pour que la désérialisation JSON fonctionne correctement.
/// </summary>
public class RentalEvent
{
    public long RentalId { get; set; }
    public long VehicleId { get; set; }
    public string CustomerId { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public JsonElement StartDate { get; set; }
    public JsonElement EndDate { get; set; }
    public string EventType { get; set; } = string.Empty; // "CONFIRMED" ou "CANCELLED"
}
