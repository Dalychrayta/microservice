using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Prometheus;
using Steeltoe.Discovery.Client;
using Steeltoe.Discovery.Eureka;
using VehicleService.Data;
using VehicleService.Messaging;
using VehicleService.Services;

/**
 * Program.cs = Point d'entrée de l'application .NET.
 * Equivalent de @SpringBootApplication + toute la configuration en Java.
 *
 * En .NET moderne (minimal API), tout est configuré ici :
 * - Services (injection de dépendances)
 * - Middleware (pipeline HTTP)
 * - Base de données
 * - Sécurité
 */

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// 1. SERVICES (équivalent des @Bean en Spring)
// ============================================================

// Controllers REST
builder.Services.AddControllers();

// Swagger : documentation automatique de l'API
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Vehicle Service API",
        Version = "v1",
        Description = "API de gestion du catalogue de véhicules - Car Rental Platform"
    });

    // Ajoute le bouton "Authorize" dans Swagger pour tester avec JWT
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Entrez votre token JWT Keycloak"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                    { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ============================================================
// 2. BASE DE DONNÉES PostgreSQL avec Entity Framework Core
// ============================================================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());

// ============================================================
// 3. SÉCURITÉ JWT Keycloak
// Equivalent de .oauth2ResourceServer() en Spring Security
// ============================================================
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // URL de Keycloak pour récupérer la configuration OAuth2
        options.Authority = builder.Configuration["Keycloak:Authority"];

        // Ne valide pas le SSL en développement (Docker local)
        options.RequireHttpsMetadata = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            // Valide que le token est bien destiné à notre application
            ValidateAudience = false,
            // Valide que le token vient bien de Keycloak
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Keycloak:ValidIssuer"],
            RoleClaimType = ClaimTypes.Role
        };

        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                if (context.Principal?.Identity is not ClaimsIdentity identity)
                {
                    return Task.CompletedTask;
                }

                var realmAccess = context.Principal.FindFirst("realm_access")?.Value;
                if (string.IsNullOrWhiteSpace(realmAccess))
                {
                    return Task.CompletedTask;
                }

                using var json = JsonDocument.Parse(realmAccess);
                if (!json.RootElement.TryGetProperty("roles", out var roles))
                {
                    return Task.CompletedTask;
                }

                foreach (var role in roles.EnumerateArray())
                {
                    var roleName = role.GetString();
                    if (!string.IsNullOrWhiteSpace(roleName))
                    {
                        identity.AddClaim(new Claim(ClaimTypes.Role, roleName));
                    }
                }

                return Task.CompletedTask;
            }
        };
    });

// Configuration des rôles Keycloak
// Les rôles sont dans realm_access.roles dans le token JWT
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("ADMIN"));
    options.AddPolicy("ClientOrAdmin", policy =>
        policy.RequireRole("CLIENT", "ADMIN"));
});

// ============================================================
// 4. EUREKA - Enregistrement dans le Service Discovery
// Equivalent de @EnableDiscoveryClient en Spring Boot
// ============================================================
builder.Services.AddDiscoveryClient(builder.Configuration);
builder.Services.AddServiceDiscovery(o => o.UseEureka());

// ============================================================
// 5. RABBITMQ CONSUMER - Service d'arrière-plan
// ============================================================
builder.Services.AddHostedService<RabbitMQConsumer>();

// ============================================================
// 6. INJECTION DU SERVICE MÉTIER
// ============================================================
builder.Services.AddScoped<VehicleManagementService>();

// CORS handled by the Gateway — do not add it here

// ============================================================
// BUILD ET PIPELINE HTTP
// ============================================================
var app = builder.Build();

// Applique les migrations automatiquement au démarrage
// Crée les tables PostgreSQL si elles n'existent pas
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // 1. Crée la table d'abord
    db.Database.EnsureCreated();
    // 2. Ensuite seulement on insère les données
    try { DataSeeder.SeedVehicles(db); }
    catch (Exception ex) { Console.WriteLine($"Seed warning: {ex.Message}"); }
}

// Swagger en développement ET en production (pour la démo)
app.UseSwagger(c =>
{
    // Swagger JSON accessible à /swagger/v1/swagger.json
    // C'est l'URL que la Gateway va appeler pour récupérer la doc
    c.RouteTemplate = "swagger/{documentName}/swagger.json";
});
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Vehicle Service API v1");
    c.RoutePrefix = "swagger";
});

app.UseHttpMetrics();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapMetrics();

// Endpoint de santé pour Docker/Eureka
app.MapGet("/actuator/health", () => Results.Ok(new { status = "UP" }));

app.Run();
