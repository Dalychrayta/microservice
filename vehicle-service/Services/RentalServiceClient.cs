using VehicleService.DTOs;

namespace VehicleService.Services;

/// <summary>
/// Service pour communiquer avec rental-service.
/// Récupère les dates réservées des véhicules.
/// </summary>
public interface IRentalServiceClient
{
    /// <summary>
    /// Récupère les plages de dates réservées pour un véhicule.
    /// GET /api/rentals/vehicle/{vehicleId}/reserved-dates
    /// </summary>
    Task<List<ReservedDateRangeDto>> GetReservedDatesAsync(long vehicleId);
}

/// <summary>
/// Implémentation directe (pas de HttpClient factory car c'est un appel simple).
/// </summary>
public class RentalServiceClient : IRentalServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<RentalServiceClient> _logger;

    public RentalServiceClient(HttpClient httpClient, ILogger<RentalServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<List<ReservedDateRangeDto>> GetReservedDatesAsync(long vehicleId)
    {
        try
        {
            // Va appeler rental-service:8081/api/rentals/vehicle/{vehicleId}/reserved-dates
            var response = await _httpClient.GetAsync($"http://rental-service:8081/api/rentals/vehicle/{vehicleId}/reserved-dates");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var result = System.Text.Json.JsonSerializer.Deserialize<List<ReservedDateRangeDto>>(
                json,
                new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            return result ?? new List<ReservedDateRangeDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching reserved dates for vehicle {VehicleId}", vehicleId);
            return new List<ReservedDateRangeDto>();
        }
    }
}
