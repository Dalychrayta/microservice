using System.ComponentModel.DataAnnotations;

namespace VehicleService.DTOs;

/// <summary>
/// DTO reçu lors de la création ou mise à jour d'un véhicule.
/// Les attributs de validation ([Required], [Range]) renvoient
/// automatiquement une erreur 400 si les données sont invalides.
/// </summary>
public class VehicleRequest
{
    [Required(ErrorMessage = "Brand is required")]
    public string Brand { get; set; } = string.Empty;

    [Required(ErrorMessage = "Model is required")]
    public string Model { get; set; } = string.Empty;

    [Required(ErrorMessage = "Category is required")]
    public string Category { get; set; } = string.Empty;

    public string Color { get; set; } = string.Empty;

    [Range(1990, 2030, ErrorMessage = "Year must be between 1990 and 2030")]
    public int Year { get; set; }

    [Required(ErrorMessage = "License plate is required")]
    public string LicensePlate { get; set; } = string.Empty;

    [Range(1, double.MaxValue, ErrorMessage = "Price per day must be positive")]
    public decimal PricePerDay { get; set; }

    public string ImageUrl { get; set; } = string.Empty;
}
