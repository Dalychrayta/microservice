using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleService.DTOs;
using VehicleService.Services;

namespace VehicleService.Controllers;

/// <summary>
/// Controller REST pour les véhicules.
///
/// [ApiController]  : active la validation automatique des DTOs
/// [Route(...)]     : définit le préfixe de toutes les routes
///
/// Sécurité :
/// [Authorize]                     : requiert un token JWT valide
/// [Authorize(Roles = "ADMIN")]    : requiert le rôle ADMIN
/// [AllowAnonymous]                : pas d'authentification requise
/// </summary>
[ApiController]
[Route("api/vehicles")]
public class VehiclesController : ControllerBase
{
    private readonly VehicleManagementService _vehicleService;
    private readonly ILogger<VehiclesController> _logger;

    public VehiclesController(
        VehicleManagementService vehicleService,
        ILogger<VehiclesController> logger)
    {
        _vehicleService = vehicleService;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/vehicles
    /// Récupère tous les véhicules avec filtres optionnels.
    /// Accessible par tous (même sans connexion) pour le catalogue public.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<VehicleResponse>>> GetAll(
        [FromQuery] string? category,
        [FromQuery] bool? available)
    {
        var vehicles = await _vehicleService.GetAllVehiclesAsync(category, available);
        return Ok(vehicles);
    }

    /// <summary>
    /// GET /api/vehicles/{id}
    /// Récupère un véhicule par son ID.
    /// Appelé par rental-service via Feign (communication synchrone).
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<VehicleResponse>> GetById(long id)
    {
        var vehicle = await _vehicleService.GetVehicleByIdAsync(id);
        if (vehicle == null)
            return NotFound(new { message = $"Vehicle {id} not found" });

        return Ok(vehicle);
    }

    /// <summary>
    /// POST /api/vehicles
    /// Crée un nouveau véhicule (ADMIN seulement).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<VehicleResponse>> Create([FromBody] VehicleRequest request)
    {
        var vehicle = await _vehicleService.CreateVehicleAsync(request);
        // 201 Created avec l'URL de la ressource créée
        return CreatedAtAction(nameof(GetById), new { id = vehicle.Id }, vehicle);
    }

    /// <summary>
    /// PUT /api/vehicles/{id}
    /// Met à jour un véhicule (ADMIN seulement).
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<VehicleResponse>> Update(long id, [FromBody] VehicleRequest request)
    {
        var vehicle = await _vehicleService.UpdateVehicleAsync(id, request);
        if (vehicle == null)
            return NotFound(new { message = $"Vehicle {id} not found" });

        return Ok(vehicle);
    }

    /// <summary>
    /// PUT /api/vehicles/{id}/availability
    /// Met à jour la disponibilité d'un véhicule.
    /// Appelé par rental-service via Feign après vérification synchrone.
    /// </summary>
    [HttpPut("{id}/availability")]
    [Authorize] // Token JWT requis, tous rôles acceptés
    public async Task<IActionResult> UpdateAvailability(long id, [FromQuery] bool available)
    {
        var result = await _vehicleService.UpdateAvailabilityAsync(id, available);
        if (!result)
            return NotFound(new { message = $"Vehicle {id} not found" });

        return NoContent(); // 204 No Content = succès sans corps de réponse
    }

    /// <summary>
    /// DELETE /api/vehicles/{id}
    /// Supprime un véhicule (ADMIN seulement).
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await _vehicleService.DeleteVehicleAsync(id);
        if (!result)
            return NotFound(new { message = $"Vehicle {id} not found" });

        return NoContent();
    }
}
