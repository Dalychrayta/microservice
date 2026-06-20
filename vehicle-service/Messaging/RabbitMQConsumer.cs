using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using VehicleService.Services;

namespace VehicleService.Messaging;

/// <summary>
/// CONSUMER RabbitMQ = celui qui REÇOIT et traite les messages.
/// C'est la partie ASYNCHRONE de notre architecture.
///
/// Quand rental-service confirme une location :
/// 1. rental-service publie un message dans la queue "rental-confirmed-queue"
/// 2. Ce consumer reçoit le message
/// 3. Il met à jour la disponibilité du véhicule (available = false)
///
/// Quand rental-service annule une location :
/// 1. rental-service publie dans "rental-cancelled-queue"
/// 2. Ce consumer reçoit le message
/// 3. Il remet le véhicule disponible (available = true)
///
/// IHostedService : s'exécute en arrière-plan dès le démarrage de l'application.
/// C'est comme un thread daemon qui écoute en permanence.
/// </summary>
public class RabbitMQConsumer : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RabbitMQConsumer> _logger;
    private readonly IConfiguration _configuration;
    private IConnection? _connection;
    private IModel? _channel;

    public RabbitMQConsumer(
        IServiceScopeFactory scopeFactory,
        ILogger<RabbitMQConsumer> logger,
        IConfiguration configuration)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Démarre le consumer au lancement de l'application.
    /// Se connecte à RabbitMQ et commence à écouter les queues.
    /// </summary>
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            // Connexion à RabbitMQ
            var factory = new ConnectionFactory
            {
                HostName = _configuration["RabbitMQ:Host"] ?? "rabbitmq",
                Port = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672"),
                UserName = _configuration["RabbitMQ:Username"] ?? "guest",
                Password = _configuration["RabbitMQ:Password"] ?? "guest",

                // Reconnexion automatique si RabbitMQ redémarre
                AutomaticRecoveryEnabled = true
            };

            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();

            _logger.LogInformation("Connected to RabbitMQ successfully");

            // Écoute la queue "rental-confirmed-queue"
            ConsumeQueue("rental-confirmed-queue", HandleRentalConfirmed, stoppingToken);

            // Écoute la queue "rental-cancelled-queue"
            ConsumeQueue("rental-cancelled-queue", HandleRentalCancelled, stoppingToken);

            // Écoute la queue "rental-completed-queue"
            ConsumeQueue("rental-completed-queue", HandleRentalCompleted, stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to RabbitMQ");
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Configure l'écoute d'une queue spécifique.
    /// </summary>
    private void ConsumeQueue(
        string queueName,
        Func<RentalEvent, Task> handler,
        CancellationToken stoppingToken)
    {
        // Déclare la queue (la crée si elle n'existe pas)
        _channel!.QueueDeclare(
            queue: queueName,
            durable: true,      // Survit au redémarrage de RabbitMQ
            exclusive: false,
            autoDelete: false);

        var consumer = new EventingBasicConsumer(_channel);

        consumer.Received += async (model, eventArgs) =>
        {
            try
            {
                // Désérialise le message JSON reçu
                var body = eventArgs.Body.ToArray();
                var message = Encoding.UTF8.GetString(body);

                _logger.LogInformation(
                    "Received message from {Queue}: {Message}", queueName, message);

                var rentalEvent = JsonSerializer.Deserialize<RentalEvent>(message,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (rentalEvent != null)
                    await handler(rentalEvent);

                // Confirme la réception du message (ACK)
                // Sans ACK, RabbitMQ remet le message dans la queue
                _channel.BasicAck(eventArgs.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message from {Queue}", queueName);
                // NACK : message non traité, le remet dans la queue
                _channel.BasicNack(eventArgs.DeliveryTag, multiple: false, requeue: true);
            }
        };

        _channel.BasicConsume(queue: queueName, autoAck: false, consumer: consumer);
    }

    /// <summary>
    /// Traite l'event "location confirmée" :
    /// met le véhicule comme non disponible.
    /// </summary>
    private async Task HandleRentalConfirmed(RentalEvent rentalEvent)
    {
        _logger.LogInformation(
            "Processing rental confirmed: RentalId={RentalId}, VehicleId={VehicleId}",
            rentalEvent.RentalId, rentalEvent.VehicleId);

        using var scope = _scopeFactory.CreateScope();
        var vehicleService = scope.ServiceProvider.GetRequiredService<VehicleManagementService>();

        await vehicleService.UpdateAvailabilityAsync(rentalEvent.VehicleId, available: false);

        _logger.LogInformation("Vehicle {VehicleId} marked as unavailable", rentalEvent.VehicleId);
    }

    private async Task HandleRentalCancelled(RentalEvent rentalEvent)
    {
        _logger.LogInformation(
            "Processing rental cancelled: RentalId={RentalId}, VehicleId={VehicleId}",
            rentalEvent.RentalId, rentalEvent.VehicleId);

        using var scope = _scopeFactory.CreateScope();
        var vehicleService = scope.ServiceProvider.GetRequiredService<VehicleManagementService>();

        await vehicleService.UpdateAvailabilityAsync(rentalEvent.VehicleId, available: true);

        _logger.LogInformation("Vehicle {VehicleId} marked as available again", rentalEvent.VehicleId);
    }

    private async Task HandleRentalCompleted(RentalEvent rentalEvent)
    {
        _logger.LogInformation(
            "Processing rental completed: RentalId={RentalId}, VehicleId={VehicleId}",
            rentalEvent.RentalId, rentalEvent.VehicleId);

        using var scope = _scopeFactory.CreateScope();
        var vehicleService = scope.ServiceProvider.GetRequiredService<VehicleManagementService>();

        await vehicleService.UpdateAvailabilityAsync(rentalEvent.VehicleId, available: true);

        _logger.LogInformation("Vehicle {VehicleId} marked as available after completion", rentalEvent.VehicleId);
    }

    /// <summary>
    /// Nettoyage des ressources quand l'application s'arrête.
    /// </summary>
    public override void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
        base.Dispose();
    }
}
