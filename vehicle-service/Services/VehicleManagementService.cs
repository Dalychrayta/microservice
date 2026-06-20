using Microsoft.EntityFrameworkCore;
using VehicleService.Data;
using VehicleService.DTOs;
using VehicleService.Models;

namespace VehicleService.Services;

/// <summary>
/// Service = la couche logique métier.
/// Contient toutes les opérations sur les véhicules.
/// Le Controller appelle le Service, le Service appelle le DbContext.
///
/// Nommé VehicleManagementService pour éviter le conflit avec
/// le namespace "VehicleService".
/// </summary>
public class VehicleManagementService
{
    private readonly AppDbContext _context;
    private readonly ILogger<VehicleManagementService> _logger;

    public VehicleManagementService(AppDbContext context, ILogger<VehicleManagementService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Récupère tous les véhicules avec filtres optionnels.
    /// </summary>
    public async Task<List<VehicleResponse>> GetAllVehiclesAsync(
        string? category = null,
        bool? available = null)
    {
        var query = _context.Vehicles.AsQueryable();

        if (!string.IsNullOrEmpty(category))
            query = query.Where(v => v.Category == category);

        if (available.HasValue)
            query = query.Where(v => v.Available == available.Value);

        var vehicles = await query.ToListAsync();
        return vehicles.Select(MapToResponse).ToList();
    }

    /// <summary>
    /// Récupère un véhicule par son ID.
    /// Appelé par rental-service via Feign (communication synchrone).
    /// </summary>
    public async Task<VehicleResponse?> GetVehicleByIdAsync(long id)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);
        return vehicle == null ? null : MapToResponse(vehicle);
    }

    /// <summary>
    /// Crée un nouveau véhicule (admin seulement).
    /// </summary>
    public async Task<VehicleResponse> CreateVehicleAsync(VehicleRequest request)
    {
        var vehicle = new Vehicle
        {
            Brand = request.Brand,
            Model = request.Model,
            Category = request.Category,
            Color = request.Color,
            Year = request.Year,
            LicensePlate = request.LicensePlate,
            PricePerDay = request.PricePerDay,
            ImageUrl = request.ImageUrl,
            Available = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Vehicle created: {Brand} {Model}", vehicle.Brand, vehicle.Model);
        return MapToResponse(vehicle);
    }

    /// <summary>
    /// Met à jour la disponibilité d'un véhicule.
    /// Appelé via Feign (sync) ou via RabbitMQ consumer (async).
    /// </summary>
    public async Task<bool> UpdateAvailabilityAsync(long id, bool available)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);
        if (vehicle == null) return false;

        vehicle.Available = available;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Vehicle {Id} availability updated to {Available}", id, available);
        return true;
    }

    /// <summary>
    /// Met à jour un véhicule existant.
    /// </summary>
    public async Task<VehicleResponse?> UpdateVehicleAsync(long id, VehicleRequest request)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);
        if (vehicle == null) return null;

        vehicle.Brand = request.Brand;
        vehicle.Model = request.Model;
        vehicle.Category = request.Category;
        vehicle.Color = request.Color;
        vehicle.Year = request.Year;
        vehicle.LicensePlate = request.LicensePlate;
        vehicle.PricePerDay = request.PricePerDay;
        vehicle.ImageUrl = request.ImageUrl;

        await _context.SaveChangesAsync();
        return MapToResponse(vehicle);
    }

    /// <summary>
    /// Supprime un véhicule.
    /// </summary>
    public async Task<bool> DeleteVehicleAsync(long id)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);
        if (vehicle == null) return false;

        _context.Vehicles.Remove(vehicle);
        await _context.SaveChangesAsync();
        return true;
    }

    private static VehicleResponse MapToResponse(Vehicle vehicle) => new()
    {
        Id = vehicle.Id,
        Brand = vehicle.Brand,
        Model = vehicle.Model,
        Category = vehicle.Category,
        Color = vehicle.Color,
        Year = vehicle.Year,
        LicensePlate = vehicle.LicensePlate,
        PricePerDay = vehicle.PricePerDay,
        Available = vehicle.Available,
        ImageUrl = vehicle.ImageUrl,
        CreatedAt = vehicle.CreatedAt
    };
}
